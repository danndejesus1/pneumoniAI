import io, os, json, time
from typing import List, Optional, Dict, Any

import torch
import torchvision
import torchxrayvision as xrv
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import skimage.io
from llm import generate_structured_report, chat_followup

# Lazy global model to avoid reload on every request
_model = None
_device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

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


@app.get("/healthz")
async def health() -> Dict[str, str]:
    return {"status": "ok", "device": str(_device)}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type not in {"image/jpeg", "image/png", "image/jpg", "application/octet-stream"}:
        raise HTTPException(status_code=415, detail="Unsupported file type")

    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    img_tensor = prepare_image(data).to(_device)
    model = get_model()

    start = time.time()
    with torch.no_grad():
        outputs = model(img_tensor[None, ...])  # (1, 1, H, W) -> model adds channels internally
    elapsed = time.time() - start
    probs = outputs[0].detach().cpu().numpy().tolist()

    response = {
        "pathologies": model.pathologies,
        "probabilities": probs,
        "inference_time_sec": round(elapsed, 4)
    }
    return JSONResponse(response)


@app.post("/report")
async def report(file: UploadFile = File(...)):
    # Reuse prediction pipeline then feed to LLM
    pred = await predict(file)  # FastAPI Response object
    if isinstance(pred, JSONResponse):
        data = pred.body
        try:
            parsed = json.loads(data)
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to parse prediction output")
    else:
        parsed = pred
    probs_map = dict(zip(parsed.get("pathologies", []), parsed.get("probabilities", [])))
    report = generate_structured_report(probs_map)
    return JSONResponse({"prediction": parsed, "report": report})


@app.post("/chat")
async def chat(query: Dict[str, Any] = Body(...)):
    user_msg = query.get("message")
    last_report = query.get("report")
    if not user_msg:
        raise HTTPException(status_code=400, detail="Missing 'message'")
    answer = chat_followup(user_msg, last_report)
    return {"answer": answer}


@app.get("/")
async def root():
    return {"message": "Chest X-ray API. POST /predict with form-data 'file' = image."}
