# PneumonAI – Chest X‑ray Pneumonia Triage API

An open, educational prototype for low‑resource rural clinical settings (e.g. Provincial / Barangay Health Centers in the Philippines) to assist trainees in preliminary chest X‑ray pneumonia triage. It combines:
1. TorchXRayVision DenseNet (multi‑label pathology probabilities) 
2. Structured LLM (Gemini) summarization & guarded conversational follow‑ups

> IMPORTANT: This system does NOT provide a medical diagnosis and must never replace a licensed radiologist or physician.

## Core Features
- `POST /predict` upload X‑ray (JPEG/PNG) → single pneumonia probability + threshold assessment (minimal output)
- `POST /report` uses stored prediction ID to generate structured summary via Gemini (if key configured)
- `POST /chat` guarded, context‑aware follow‑up Q&A limited to pneumonia triage scope
- `GET /prediction/{id}` fetch stored prediction by id
- `GET /healthz` basic liveness/device info
- Docker Compose dev loop with file watch (rebuild/restart on changes)

## Architecture
```
Client (trainee/helper)
    |
    |  multipart/form-data (image) /predict or /report
    v
FastAPI (api.py)
  ├── Image Preprocess (skimage + TorchXRayVision transforms)
  ├── DenseNet Inference (xrv.models.DenseNet)
  ├── Probability Map (pathology -> score)
  ├── /report: build context + call Gemini (llm.py) → JSON sections
  └── /chat: guardrails + constrained Gemini prompt using prior report

llm.py
  ├── build_context()   (subset of pneumonia-relevant pathologies)
  ├── generate_structured_report()
  └── chat_followup()
```

### Data Flow Overview
1. `/predict`: Image → preprocessing → model → pneumonia probability extracted → stored with UUID
2. Client receives JSON with `id` + pneumonia-only summary
3. `/report`: Accepts `prediction_id` → pneumonia-only context → Gemini LLM → structured JSON sections
4. `/chat`: Follow‑up referencing `prediction_id` (and/or report JSON) with pneumonia-only guardrails

### Guardrails
- Scope limited to chest X‑ray pneumonia triage
- Refuses: prescriptions, dosing, unrelated medical / non‑medical topics
- Always includes disclaimer

## Quick Start
```
# Build & start
docker compose up --build -d

# Health check
curl http://localhost:8000/healthz

# Run inference for testing
curl -X POST http://localhost:8000/predict -F file=@assets/<image>.jpeg | jq
```

## Response Schema (Predict)
Pneumonia-only minimal JSON:
```
{
  "id": "<uuid>",
  "Pneumonia": 0.7421,
  "threshold": 0.7,
  "meets_threshold": true,
  "assessment": "High likelihood of pneumonia (>= 70% threshold).",
  "inference_time_sec": 0.1234,
  "created_at": 1712345678.12
}
```
Environment variable `PNEUMONIA_THRESHOLD` (default 0.70) controls threshold logic.

### Image & Mask Fields
If Firebase Storage credentials provided (FIREBASE_BUCKET and optional FIREBASE_CREDENTIALS_JSON), `/predict` also returns:
```
image: {
  original_filename: "chest123.jpg",
  object: "predictions/<id>/image.jpg",
  url: "https://.../image.jpg",        // public for hackathon
  storage_mode: "firebase" | "static"
},
masks: {
  has_any: true|false,
  saliency: { available: bool, url?, object? },
  rsna: { available: bool, url?, object? }
},
has_mask: bool
```
If mask generation fails or thresholds not met, `has_mask=false` and mask entries show `available:false`.

Environment variables:
```
FIREBASE_BUCKET=<bucket-name>
FIREBASE_CREDENTIALS_JSON='{"type":"service_account",...}'   # (optional, else ADC)
STORAGE_PREFIX=gs://existing-bucket   # bypass firebase upload (treat as static prefix)
```

## Local Development (Without Docker)
```
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn api:app --reload
```

## LLM Endpoints (Detailed)
### 1. POST /report
JSON Body:
```
{ "prediction_id": "<uuid from /predict>" }
```
Returns pneumonia-only structured sections:
```
{
  "prediction_id": "<uuid>",
  "prediction": { ...same object as /predict... },
  "report": {
     "context": "Model probability: Pneumonia: 0.742 (NOT diagnostic, single-label focus).",
     "raw": "<LLM raw text>",
     "parsed": { "summary": "...", "pneumonia_assessment": "...", ... } | null,
     "disclaimer": "Model + LLM output not a medical diagnosis..."
  }
}
```
If `GEMINI_API_KEY` absent: `report.error` + `context` provided.

### 2. POST /chat
Body:
```
{
  "message": "Is pneumonia likely?",
  "report": { ... optional report object from /report ... }
}
```
Response:
```
{ "answer": "..." }
```
If out of scope → refusal + reminder.

## Example Session
1. Predict & get ID:
```
curl -X POST http://localhost:8000/predict -F file=@assets/test-pneumonia.jpeg | jq
```
2. Structured report (using ID):
```
curl -X POST http://localhost:8000/report \
  -H 'Content-Type: application/json' \
  -d '{"prediction_id":"<UUID_FROM_PREDICT>"}' | jq
```
3. Follow-up question:
```
curl -X POST http://localhost:8000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Explain in simple terms","prediction_id":"<UUID_FROM_PREDICT>"}' | jq
```

## Safety & Disclaimer
Outputs are NOT a medical diagnosis. Always seek a licensed physician. The system targets educational triage assistance in low-resource settings and must not be the sole basis for treatment. All usage implies acceptance of limitations and responsibility for clinical decisions lies with qualified professionals.

---
### Backward Compatibility Notes
Earlier versions returned full pathology arrays; these were removed for simplicity. For multi-label needs, use a previous tag or extend the code.

---
## Suggested Firestore Data Model

Collection: `predictions`
```
id: string
createdAt: timestamp
imageRef: string                // Cloud Storage path of original X-ray
pneumoniaProbability: number    // same as "Pneumonia" field
threshold: number
meetsThreshold: boolean
assessment: string
inferenceTimeSec: number
report: {                       // added after /report
  parsed: map | null
  raw: string
  context: string
  disclaimer: string
  generatedAt: timestamp
}
status: string                  // 'PREDICTED' | 'REPORTED'
version: number                 // schema version
```

Indexes:
- (status, createdAt desc)
- meetsThreshold

Security:
- De-identify filenames / use hashed IDs
- Restrict reads to authorized roles

Retention:
- Scheduled purge or archive to cold storage per compliance.

