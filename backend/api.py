import io, os, json, time, uuid, threading, base64, shutil
from typing import Dict, Any, Optional

import torch
import torchvision
import torchxrayvision as xrv
from fastapi import FastAPI, UploadFile, File, HTTPException, Body, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import skimage.io
from llm import generate_structured_report, chat_followup

PNEUMONIA_THRESHOLD = float(os.getenv("PNEUMONIA_THRESHOLD", "0.70"))
STORAGE_PREFIX = os.getenv("STORAGE_PREFIX", "")  # e.g. gs://bucket-name (if provided skips firebase upload logic)
FIREBASE_BUCKET = os.getenv("FIREBASE_BUCKET")  # bucket-name (without gs://) for firebase-admin
FIREBASE_CRED_JSON = os.getenv("FIREBASE_CREDENTIALS_JSON")  # inline JSON credentials (optional)
RSNA_DATASET_PATH = os.getenv("RSNA_DATASET_PATH")  # optional path to RSNA images

# In-memory prediction store {id: prediction_dict}
_PREDICTION_STORE: Dict[str, Dict[str, Any]] = {}
_STORE_LOCK = threading.Lock()
_MAX_STORE = 500  # simple cap to avoid unbounded memory growth

# Lazy global model to avoid reload on every request
_model = None
_device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# RSNA dataset (optional) lazy load for Lung Opacity masks
_rsna_dataset = None
_rsna_index = {}
_rsna_lock = threading.Lock()

# Firebase admin lazy init
_fb_init = False
_fb_bucket = None
_fb_lock = threading.Lock()

# Preprocessing transforms
_transform = torchvision.transforms.Compose([
    xrv.datasets.XRayCenterCrop(),
    xrv.datasets.XRayResizer(224)
])

app = FastAPI(title="PneumonAI API", version="1.0.0")

# Allow all origins for simplicity (tighten in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_model():
    global _model
    if _model is None:
        _model = xrv.models.DenseNet(weights="densenet121-res224-all").to(_device)
        _model.eval()
    return _model


def _init_firebase():
    global _fb_init, _fb_bucket
    if _fb_init or not FIREBASE_BUCKET or STORAGE_PREFIX:
        return _fb_bucket
    with _fb_lock:
        if _fb_init:
            return _fb_bucket
        try:
            import firebase_admin
            from firebase_admin import credentials, storage
            if FIREBASE_CRED_JSON:
                cred = credentials.Certificate(json.loads(FIREBASE_CRED_JSON))
            else:
                # Fallback to default app credentials (mounted file or env)
                cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {'storageBucket': FIREBASE_BUCKET})
            _fb_bucket = storage.bucket()
            _fb_init = True
        except Exception:
            _fb_init = True  # Avoid retry storm
            _fb_bucket = None
    return _fb_bucket


def _ensure_rsna_dataset():
    """Lazy load RSNA dataset and build index by basename for Lung Opacity masks."""
    global _rsna_dataset, _rsna_index
    if _rsna_dataset is not None or not RSNA_DATASET_PATH or not os.path.isdir(RSNA_DATASET_PATH):
        return _rsna_dataset
    with _rsna_lock:
        if _rsna_dataset is None:
            try:
                ds = xrv.datasets.RSNA_Pneumonia_Dataset(
                    imgpath=RSNA_DATASET_PATH,
                    views=["PA", "AP", "AP Supine", "AP Erect"],
                    pathology_masks=True
                )
                _rsna_dataset = ds
                lung_idx = None
                try:
                    lung_idx = ds.pathologies.index("Lung Opacity")
                except ValueError:
                    lung_idx = None
                if lung_idx is not None:
                    for i in range(len(ds)):
                        try:
                            p = ds.paths[i]
                        except Exception:
                            continue
                        base = os.path.basename(p).lower()
                        _rsna_index.setdefault(base, []).append((i, lung_idx))
            except Exception:
                _rsna_dataset = None
    return _rsna_dataset


def _get_rsna_mask(original_filename: str):
    ds = _ensure_rsna_dataset()
    if ds is None or not original_filename:
        return None
    key = os.path.basename(original_filename).lower()
    entries = _rsna_index.get(key)
    if not entries:
        return None
    (idx, lung_idx) = entries[0]
    try:
        sample = ds[idx]
        masks_dict = sample.get("pathology_masks") if isinstance(sample, dict) else None
        if not masks_dict:
            return None
        raw_mask = masks_dict.get(lung_idx)
        if raw_mask is None:
            return None
        import numpy as np
        if isinstance(raw_mask, list) and len(raw_mask) > 1:
            raw_mask = np.maximum.reduce(raw_mask)
        return raw_mask
    except Exception:
        return None


def _gen_saliency(img_tensor: torch.Tensor, model, pneu_index: int):
    """Fast gradient magnitude saliency (grayscale 224x224)."""
    try:
        x = img_tensor[None, ...].requires_grad_(True)
        model.zero_grad()
        out = model(x)
        if pneu_index >= out.shape[1]:
            return None
        target = out[0, pneu_index]
        target.backward()
        grads = x.grad.detach().cpu()[0, 0]
        sal = grads.abs()
        sal = (sal - sal.min()) / (sal.max() - sal.min() + 1e-8)
        import numpy as np
        sal_np = (sal.numpy() * 255).astype('uint8')
        from PIL import Image
        sal_img = Image.fromarray(sal_np, mode='L')
        return sal_img
    except Exception:
        return None


def _storage_objects(pred_id: str, original_ext: str):
    base_dir = os.path.join("stored_images", "predictions", pred_id)
    os.makedirs(base_dir, exist_ok=True)
    image_filename = f"image{original_ext}" if original_ext else "image"
    saliency_filename = "saliency.png"
    rsna_filename = "rsna_mask.png"
    return base_dir, image_filename, saliency_filename, rsna_filename


def _compose_storage_ref(obj_name: str):
    if STORAGE_PREFIX:
        return f"{STORAGE_PREFIX.rstrip('/')}/{obj_name}", obj_name, 'static'
    # For Firebase uploads we return temporary local path placeholder; URL computed after upload
    return obj_name, obj_name, 'firebase'


def prepare_image(file_bytes: bytes) -> torch.Tensor:
    try:
        # Read image from bytes
        img = skimage.io.imread(io.BytesIO(file_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {e}")

    img = xrv.datasets.normalize(img, 255)
    # Channel handling
    if img.ndim == 3:
        if img.shape[2] > 1:
            img = img.mean(2)
        else:
            img = img[:, :, 0]
    elif img.ndim != 2:
        raise HTTPException(status_code=400, detail=f"Unexpected image shape {img.shape}")

    img = img[None, ...]  # (1, H, W)
    img = _transform(img)
    tensor = torch.from_numpy(img).float()  # (1, H, W)
    return tensor


def run_inference_bytes(file_bytes: bytes, prediction_id: Optional[str] = None, original_filename: Optional[str] = None) -> Dict[str, Any]:
    """Run model inference and return ONLY pneumonia probability info (minimal default)."""
    img_tensor = prepare_image(file_bytes).to(_device)
    model = get_model()
    start = time.time()
    with torch.no_grad():
        outputs = model(img_tensor[None, ...])
    elapsed = time.time() - start
    probs = outputs[0].detach().cpu().numpy().tolist()
    try:
        pneu_index = model.pathologies.index("Pneumonia")
        pneu_prob = float(probs[pneu_index])
    except ValueError:
        pneu_prob = None
    result: Dict[str, Any] = {"inference_time_sec": round(elapsed, 4)}
    if pneu_prob is not None:
        meets = pneu_prob >= PNEUMONIA_THRESHOLD
        result.update({
            "Pneumonia": round(pneu_prob, 4),
            "threshold": PNEUMONIA_THRESHOLD,
            "meets_threshold": meets,
            "assessment": (
                "High likelihood of pneumonia (>= {:.0f}% threshold).".format(PNEUMONIA_THRESHOLD*100)
                if meets else
                "Probability below threshold; consider other causes and consult a physician."
            )
        })
    else:
        result["Pneumonia"] = None

    # Early exit if no ID (used in direct calls) or no pneumonia probability
    if prediction_id is None:
        return result

    # Canonical storage object names (not uploading here; frontend will upload to Firebase Storage)
    ext = ""
    if original_filename and "." in original_filename:
        ext = os.path.splitext(original_filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png"]:
            ext = ".jpg"
    base_dir, image_fn, saliency_fn, rsna_fn = _storage_objects(prediction_id, ext)
    # Persist original image locally (raw bytes) for subsequent upload pipeline
    try:
        with open(os.path.join(base_dir, image_fn), 'wb') as f:
            f.write(file_bytes)
    except Exception:
        pass

    image_object_name = f"predictions/{prediction_id}/{image_fn}"
    image_url, image_object, storage_mode = _compose_storage_ref(image_object_name)

    masks: Dict[str, Any] = {
        "has_any": False,
        "saliency": {"available": False},
        "rsna": {"available": False}
    }

    if result.get("Pneumonia") is not None and result.get("meets_threshold"):
        # Saliency mask
        try:
            if pneu_prob is not None and pneu_prob >= PNEUMONIA_THRESHOLD:
                sal_img = _gen_saliency(img_tensor, model, pneu_index)
                if sal_img is not None:
                    sal_path = os.path.join(base_dir, saliency_fn)
                    sal_img.save(sal_path, format='PNG')
                    sal_object_name = f"predictions/{prediction_id}/{saliency_fn}"
                    sal_url, sal_object, _ = _compose_storage_ref(sal_object_name)
                    masks["saliency"] = {
                        "available": True,
                        "object": sal_object,
                        "url": sal_url
                    }
                    masks["has_any"] = True
        except Exception:
            pass
        # RSNA mask (if dataset configured and filename matches)
        try:
            rsna_raw = _get_rsna_mask(original_filename or "")
            if rsna_raw is not None:
                import numpy as np
                from PIL import Image
                m = rsna_raw.astype('float32')
                if m.max() > 0:
                    m = m / m.max()
                mask_img = Image.fromarray((m * 255).astype('uint8'))
                mask_path = os.path.join(base_dir, rsna_fn)
                mask_img.save(mask_path, format='PNG')
                rsna_object_name = f"predictions/{prediction_id}/{rsna_fn}"
                rsna_url, rsna_object, _ = _compose_storage_ref(rsna_object_name)
                masks["rsna"] = {
                    "available": True,
                    "object": rsna_object,
                    "url": rsna_url
                }
                masks["has_any"] = True
        except Exception:
            pass

    result["image"] = {
        "original_filename": original_filename,
        "object": image_object,
        "url": image_url,
        "storage_mode": storage_mode
    }
    result["masks"] = masks
    result["has_mask"] = masks.get("has_any", False)
    return result


@app.get("/healthz")
async def health() -> Dict[str, str]:
    return {"status": "ok", "device": str(_device)}


@app.post("/predict")
async def predict(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    if file.content_type not in {"image/jpeg", "image/png", "image/jpg", "application/octet-stream"}:
        raise HTTPException(status_code=415, detail="Unsupported file type")

    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    pred_id = uuid.uuid4().hex
    prediction = run_inference_bytes(data, prediction_id=pred_id, original_filename=file.filename)
    # pred_id retained (previously regenerated causing mismatch with stored assets)
    prediction_record = {"id": pred_id, **prediction, "created_at": time.time()}
    with _STORE_LOCK:
        if len(_PREDICTION_STORE) >= _MAX_STORE:
            # Drop oldest (naive strategy)
            oldest = sorted(_PREDICTION_STORE.items(), key=lambda kv: kv[1].get("created_at", 0))[0][0]
            _PREDICTION_STORE.pop(oldest, None)
        _PREDICTION_STORE[pred_id] = prediction_record
    # Schedule firebase upload if needed
    if background_tasks:
        background_tasks.add_task(_upload_and_cleanup, pred_id, prediction_record)
    return JSONResponse(prediction_record)


def _upload_and_cleanup(pred_id: str, prediction: Dict[str, Any]):
    bucket = _init_firebase()
    if not bucket:
        return
    base_dir = os.path.join("stored_images", "predictions", pred_id)
    if not os.path.isdir(base_dir):
        return
    # Upload files present
    try:
        for fname in os.listdir(base_dir):
            fpath = os.path.join(base_dir, fname)
            if not os.path.isfile(fpath):
                continue
            object_name = f"predictions/{pred_id}/{fname}"
            blob = bucket.blob(object_name)
            blob.upload_from_filename(fpath)
            blob.make_public()  # For hackathon simplicity; tighten later
        # Cleanup local directory
        shutil.rmtree(base_dir, ignore_errors=True)
    except Exception:
        pass

@app.get("/prediction/{prediction_id}")
async def get_prediction(prediction_id: str):
    with _STORE_LOCK:
        pred = _PREDICTION_STORE.get(prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction ID not found")
    return pred


@app.post("/report")
async def report(body: Dict[str, Any] = Body(...)):
    """Generate LLM report from an existing prediction id.

    Body JSON: { "prediction_id": "<id>" }
    Optional: allow direct embedding of prediction JSON with key 'prediction'.
    """
    prediction_id = body.get("prediction_id")
    prediction = body.get("prediction")
    if prediction_id:
        with _STORE_LOCK:
            prediction = _PREDICTION_STORE.get(prediction_id)
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction ID not found")
    if not prediction:
        raise HTTPException(status_code=400, detail="Provide 'prediction_id' or 'prediction' JSON")

    # Build pneumonia-only dict for report generation
    pneu_prob = prediction.get("Pneumonia")
    pneu_map = {"Pneumonia": pneu_prob} if pneu_prob is not None else {}
    report_obj = generate_structured_report(pneu_map)
    return JSONResponse({
        "prediction_id": prediction.get("id", prediction_id),
        "prediction": prediction,
        "has_mask": prediction.get("has_mask", False),
        "report": report_obj
    })


@app.post("/chat")
async def chat(query: Dict[str, Any] = Body(...)):
    user_msg = query.get("message")
    report_obj = query.get("report")
    prediction_id = query.get("prediction_id")
    if not user_msg:
        raise HTTPException(status_code=400, detail="Missing 'message'")
    prediction = None
    if prediction_id:
        with _STORE_LOCK:
            prediction = _PREDICTION_STORE.get(prediction_id)
        if not prediction:
            # Soft fail: still allow generic conversation if desired
            prediction_id = None
    # Auto-generate report if absent and we have prediction
    if not report_obj and prediction:
        pneu_prob = prediction.get("Pneumonia")
        pneu_map = {"Pneumonia": pneu_prob} if pneu_prob is not None else {}
        report_obj = generate_structured_report(pneu_map)
    pneumonia_prob = prediction.get("Pneumonia") if prediction else None
    masks = prediction.get("masks") if prediction else None
    threshold = prediction.get("threshold") if prediction else None
    meets_threshold = prediction.get("meets_threshold") if prediction else None
    answer = chat_followup(
        user_msg,
        report_obj,
        pneumonia_prob=pneumonia_prob,
        masks=masks,
        threshold=threshold,
        meets_threshold=meets_threshold,
    )
    return {
        "answer": answer,
        "used_prediction_id": prediction_id,
        "pneumonia_prob": pneumonia_prob,
        "has_mask": bool(masks and (masks.get("has_any") or masks.get("saliency", {}).get("available") or masks.get("rsna", {}).get("available")))
    }


@app.get("/")
async def root():
    return {"message": "Chest X-ray API. 1) POST /predict (image) -> id; 2) POST /report {prediction_id}; 3) POST /chat {message, prediction_id|report}."}
