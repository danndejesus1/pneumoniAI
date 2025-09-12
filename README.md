# PneumoniAI: Chest X-Ray Pneumonia Triage Suite

**An open-source, AI-powered prototype for pneumonia triage in resource-limited clinical settings**

---

> ⚠️ **Disclaimer: This system is for educational use only. It does NOT provide a diagnosis and must never replace the
judgment of a licensed radiologist or physician. All outputs are non-diagnostic. Use of this tool implies acceptance of
these limitations and compliance with your local medical and privacy regulations.**

---

## Table of Contents

- [What is PneumoniaAI?](#what-is-pneumoniaai)
- [Core Features](#core-features)
- [Tech Stack & Architecture](#tech-stack--architecture)
    - [Architecture Diagram](#architecture-diagram)
- [Backend API](#backend-api)
    - [Endpoints](#api-endpoints)
    - [Setup & Local Dev](#backend-setup--local-dev)
    - [Docker Compose](#docker-compose)
    - [Environment Variables](#backend-environment-variables)
- [Frontend UI](#frontend-ui)
    - [Main Screens & Flow](#main-screens--flow)
    - [Frontend Setup](#frontend-setup)
    - [Frontend Environment Variables](#frontend-environment-variables)
- [How The Pieces Fit (User Flow)](#how-the-pieces-fit-user-flow)
- [Security, Compliance & Data Protection](#security-compliance--data-protection)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License & References](#license--references)

---

## What is PneumoniaAI?

**PneumoniaAI** is an educational prototype for preliminary chest X-ray pneumonia triage, designed especially for
low-resource settings like rural health centers. Its goal is to support trainees and clinicians with fast, explainable
AI assessments, visual highlights, and clear disclaimers—not to replace expert clinical review.

Suitable for:

- Trainee radiologists/clinicians in low-resource clinical settings
- Technical audiences exploring explainable AI in medicine

**NOT for unsupervised clinical use or real patient triage!**

---

## Core Features

- **Image Inference:** Upload a chest X-ray (JPEG/PNG) and get a model-based pneumonia probability, and threshold
  assessment.
- **LLM-Powered Reporting:** Summarized, patient-friendly and structured output via Gemini LLM.
- **Guarded Clinical Chat:** Ask follow-up questions within strict scope, with guardrails and disclaimers enforced.
- **Session Tracking:** Keeps prediction/report by case/session ID for revisit.
- **Security:** Image uploads via Firebase Storage, access logged, role-based future support.
- **Modern UI:** Responsive, mobile-friendly frontend with clear user journeys for staff/trainee roles.

---

## Tech Stack & Architecture

- **Backend:** Python (FastAPI), PyTorch/TorchXRayVision (DenseNet), Google Gemini via LangChain, scikit-image for
  preprocessing, Firebase admin for storage.
- **Frontend:** React 19 + Vite, Material UI (MUI), Firebase Auth, Firestore, and Storage; modular page-level routing.
- **DevOps:** Docker Compose support (hot-reload for code and dependencies), easy .env config, one-command setup for
  both parts.

### Architecture Diagram

```
[User]
   |
   |  (Image Upload / Chat Request)
   v
[Frontend: React+Firebase Auth/UI]
   |
   |------------------------API Call---------------------------
   v
[Backend: FastAPI (TorchXRayVision DenseNet + Gemini LLM)]
   |
   v
[Model Inference  ──>  Storage  ──>  Reporting  ──>  Chat]
```

See sections below for request/response flow.

---

## Backend API

The backend provides REST endpoints for:

- Image inference (`/predict`)
- Report generation (`/report`)
- Chat follow-up (`/chat`)
- Prediction/session retrieval (`/prediction/{id}`)
- Health check (`/healthz`)

### API Endpoints

- `POST /predict` — Multipart image upload, returns pneumonia-only risk score, and threshold justification. Stores to in-memory session and optionally uploads to Firebase Storage if
  configured.
- `POST /report` — JSON ingestion (ID or full prediction), returns LLM-structured (Gemini) report: context, summary,
  justification, differentials, and patient-facing explanation. Fails gracefully if key absent.
- `POST /chat` — User message + session context → strictly triage-scoped LLM chat, enforcing medical guardrails and
  disclaimers on every reply.
- `GET /prediction/{id}` — Retrieve stored prediction result.
- `GET /healthz` — Basic server/device info for monitoring.

**Sample Predict Response:**

```json
{
  "id": "6ac3cb...",
  "Pneumonia": 0.81,
  "threshold": 0.7,
  "meets_threshold": true,
  "assessment": "High likelihood of pneumonia (>=70% threshold)",
  "inference_time_sec": 0.12,
  "created_at": 1712345678.12,
  "image": { "url": "..." },
  "masks": { "saliency": {...} }
}
```

**Environment Variables:**

- `PNEUMONIA_THRESHOLD` (float, default `0.7`): Model output cutoff for higher flagging.
- `GEMINI_API_KEY`: (for LLM report/chat; optional but required for those features)
- `FIREBASE_BUCKET`, `FIREBASE_CREDENTIALS_JSON`: (optional, to enable Firebase upload)
- `RSNA_DATASET_PATH`, `STORAGE_PREFIX`: Optional advanced/override options.

Place these in a `.env` file for local/dev. See the provided Compose example.

#### Backend Setup & Local Dev

- Clone repo: `git clone ... && cd project`
- Install Python deps: `pip install -r backend/requirements.txt`
- Run: `uvicorn api:app --reload` (default: http://localhost:8000)

#### Docker Compose

- One-liner: `docker compose up --build -d`
- Edits to api, model, Dockerfile, or requirements auto-reload (volumes/watch enabled)
- All ports, env, and API persistent per Compose config

---

## Frontend UI

_Make sure your backend is running & API endpoint is reachable_

- Built in React + Vite + MUI for ease of development and rapid prototyping
- Handles login (Firebase Auth), role-restricted assessment flows, intake form, image upload, and results/reports UX
- Responsive for mobile/desktop; step-based flow from intake → upload → assessment → chat/report
- Visualizes all server responses and shows image masks if present

### Main Screens & Flow

- **Home/Landing** — What is this, prompt to start/learn more
- **Login** — Minimal, staff-only for controlled access (extendable per institution)
- **Assessment** — Form: patient info, symptoms, exposure, image upload (with preview and progress)
- **Results** — Shows probability,  structured report; launches guarded chat for follow-up Q&A
- **Chat** — Within scope (triage), chatbot with context from structured report/session

### Frontend Setup

- Install Node LTS (see `package.json` for specifics)
- `cd frontend && npm install`
- `npm run dev` (default: http://localhost:5173)

#### Frontend Environment Variables

[Use a `.env` file or similar w/ Vite]

- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc. (see `src/firebase.js`)

---

## How The Pieces Fit (User Flow)

1. **Login**: Only authorized users can access the intake/assessment flow.
2. **Intake**: Staff/trainee enters patient info, symptoms, and uploads X-ray.
3. **Image Submission**: Image uploads to Firebase (if enabled), triggers `/predict` API call.
4. **Results**: User sees pneumonia probability, and assessment.
5. **LLM Report**: User may generate a structured report and send queries to the [guardrails] chatbot with the
   session/report as context.

---

## Security, Compliance & Data Protection

- All images and data are non-diagnostic and anonymized at ingest (filenames de-identified, session-unique UUIDs)
- Firebase Storage and Firestore use time-limited, role-gated access rules (see `/firestore.rules`)
- Strong disclaimer at all layers: No clinical or patient use outside research or training
- Deployment in a real clinical or research context requires adaptation of access control, encryption at rest, audit
  logs, & formal IRB/PI approval

---

## FAQ

**Q: Can I run this in production/clinical workflows?**  
A: No, unless you add robust authentication, monitoring, and policy-driven data handling to meet your
regulatory/jurisdictional standards.

**Q: Is the model accurate—should I trust its outputs?**  
A: No diagnosis is ever made. Model predictions are illustrative and for proof of concept only. See source code and original X-ray model
references for limitations.

**Q: Can I extend this to other X-ray classes/labels?**  
A: Yes—the architecture is open. See backend `api.py` & model references to expand to multi-label or other pathologies.

**Q: How do I contribute?**  
A: Please open issues, pull requests, or discussion threads! For technical issues, follow best practices (linting, PR
templates coming soon).

---


## License & References

- MIT License; see individual files for third-party library licenses
- TorchXRayVision, scikit-image, Google Generative AI (Gemini), Firebase, Material UI, etc. licensed as per vendor/OSS
- For academic/research citation and attributions, see backend/README.md and comments in model code

**Acknowledgments:** Special thanks to the open-source, data science, radiology, and global health communities for
feedback and support.

---

