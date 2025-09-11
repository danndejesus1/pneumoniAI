# PneumonAI – Chest X‑ray Pneumonia Triage API

An open, educational prototype for low‑resource rural clinical settings (e.g. Provincial / Barangay Health Centers in the Philippines) to assist trainees in preliminary chest X‑ray pneumonia triage. It combines:
1. TorchXRayVision DenseNet (multi‑label pathology probabilities) 
2. Structured LLM (Gemini) summarization & guarded conversational follow‑ups

> IMPORTANT: This system does NOT provide a medical diagnosis and must never replace a licensed radiologist or physician.

## Core Features
- `POST /predict` upload X‑ray (JPEG/PNG) → pathology probability vector (multi‑label)
- `POST /report` runs prediction + generates structured summary sections via Gemini (if key configured)
- `POST /chat` guarded, context‑aware follow‑up Q&A limited to pneumonia triage scope
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

### Data Flow (/report)
1. Image → preprocessing → model scores
2. Filter pneumonia‑related pathologies (pneumonia, consolidation, infiltration, effusion, atelectasis)
3. Build context string
4. Gemini prompt → JSON extraction attempt
5. Return `{ prediction, report }` (+ fallback error if key missing)

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
```
{
  "pathologies": ["Atelectasis", ...],
  "probabilities": [0.12, ...],
  "inference_time_sec": 0.1234
}
```

## Local Development (Without Docker)
```
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn api:app --reload
```

## LLM Endpoints (Detailed)
### 1. POST /report
Multipart form-data: `file` = X‑ray image
Returns:
```
{
  "prediction": { pathologies: [...], probabilities: [...], inference_time_sec: 0.42 },
  "report": {
     "context": "Chest X-ray model probability summary...",
     "raw": "<LLM raw text>",
     "parsed": { "summary": "...", ... } | null,
     "disclaimer": "Model + LLM output not a medical diagnosis..."
  }
}
```
If `GEMINI_API_KEY` absent: `report.error` explains fallback.

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
1. Get probabilities:
```
curl -X POST http://localhost:8000/predict -F file=@assets/test-pneumonia.jpeg | jq
```
2. Structured report:
```
curl -X POST http://localhost:8000/report -F file=@assets/test-pneumonia.jpeg | jq
```
3. Follow-up question:
```
curl -X POST http://localhost:8000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Explain in simple terms","report": <REPORT_JSON>}' | jq
```

## Safety & Disclaimer
Outputs are NOT a medical diagnosis. Always seek a licensed physician. The system targets educational triage assistance in low-resource settings and must not be the sole basis for treatment. All usage implies acceptance of limitations and responsibility for clinical decisions lies with qualified professionals.

