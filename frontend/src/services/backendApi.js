// Custom backend API utility for X-ray inference and chat

const BACKEND_BASE_URL = 'https://treasurable-laila-unglobularly.ngrok-free.app';

// Predict endpoint: accepts file upload (FormData) and returns prediction
export async function predictXray(file) {
    const url = `${BACKEND_BASE_URL}/predict`;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(url, {
        method: 'POST',
        body: fd,
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}

// Get prediction by ID
export async function getPrediction(predictionId) {
    const url = `${BACKEND_BASE_URL}/prediction/${predictionId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}

// Generate structured report from prediction ID (or prediction object)
export async function generateReport({predictionId, prediction}) {
    const url = `${BACKEND_BASE_URL}/report`;
    const body = predictionId ? {prediction_id: predictionId} : {prediction};
    const res = await fetch(url, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}

// Chat endpoint: send a message (with optional report/predictionId)
export async function chatWithBot({message, predictionId = undefined, report = undefined}) {
    const url = `${BACKEND_BASE_URL}/chat`;
    const payload = {message};
    if (predictionId) payload.prediction_id = predictionId;
    if (report) payload.report = report;
    const res = await fetch(url, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}
