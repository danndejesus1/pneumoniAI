import os
from typing import Dict, Any, List

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY and GEMINI_API_KEY.lower() in {"replace_me", "your_key_here", "changeme"}:
    GEMINI_API_KEY = ""
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

if not GEMINI_API_KEY:
    # Allow import without key for container build; runtime check will happen
    pass

# Lazy import of langchain / gemini to avoid overhead if unused
_llm = None
_from_langchain = False

# Central system prompt governing BOTH report generation and chat follow‑ups.
# Emphasizes scope restriction, probability usage, disclaimers, style, and bilingual (English + brief Filipino) optional clarifications.
_SYSTEM_PROMPT = (
    "You are PneumonAI, an assistant radiology support tool for CHEST X-RAY PNEUMONIA TRIAGE ONLY. "
    "Inputs you may receive: (a) a model-estimated pneumonia probability (0-1), (b) structured triage JSON, (c) a user question. "
    "Core behaviors:\n"
    "1. Always stay within chest X-ray pneumonia triage context (pattern recognition, likelihood articulation, benign differentials like atelectasis or artifact).\n"
    "2. If user asks for the probability, restate it as: 'Model-estimated pneumonia probability: <value> (not a diagnosis).'\n"
    "3. NEVER fabricate a probability if absent; say it's unavailable.\n"
    "4. Refuse out-of-scope topics (politics, unrelated anatomy, prescriptions, dosing, non-imaging diseases). Provide a short redirect.\n"
    "5. ALWAYS append a brief disclaimer: 'NOT A FINAL DIAGNOSIS. Consult a licensed physician.'\n"
    "6. Style: concise, plain English, optionally add a short Filipino parenthetical clarification for key medical terms (e.g., '(pulmonya)'). Do not exceed necessary length.\n"
    "7. Do NOT provide patient-identifying assumptions; remain general.\n"
    "8. If probability <0.6 and user seeks interpretation, optionally mention 1 benign alternative (atelectasis or artifact) unless already addressed.\n"
    "9. If asked for treatment, refuse and advise medical consultation.\n"
    "10. JSON generation phase (report) must output ONLY JSON when requested. Chat phase outputs plain text."
)

def _init_llm():
    global _llm, _from_langchain
    if _llm is None:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            # NOTE: We'll provide a SystemMessage at invocation time instead of stuffing here.
            _llm = ChatGoogleGenerativeAI(
                model=GEMINI_MODEL,
                api_key=GEMINI_API_KEY,
                temperature=0.2,
                convert_system_message_to_human=True  # compatibility safeguard
            )
            _from_langchain = True
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Gemini LLM: {e}")
    return _llm


def build_context(predictions: Dict[str, float]) -> str:
    # Expecting pneumonia-only dict but remain resilient
    if not predictions:
        return "No pneumonia probability available."
    pneu_prob = predictions.get("Pneumonia")
    if pneu_prob is None:
        # Fall back to first item
        key, val = list(predictions.items())[0]
        return f"Model probability: {key}: {val:.3f} (NOT diagnostic)."
    return f"Model probability: Pneumonia: {pneu_prob:.3f} (NOT diagnostic, single-label focus)."


def generate_structured_report(predictions: Dict[str, float]) -> Dict[str, Any]:
    """Return structured JSON triage interpretation using the LLM.

    Falls back gracefully if no key available. The LLM is instructed via a system
    prompt to stay constrained and output ONLY a JSON object.
    """
    context = build_context(predictions)
    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY not set", "context": context}
    llm = _init_llm()
    pneu_prob = predictions.get("Pneumonia") if predictions else None
    guidance = (
        f"{context}\n\n"
        "Produce a concise triage JSON with keys: summary, pneumonia_assessment, differential, next_steps, patient_friendly. Rules: summary: 1 sentence. "
        "pneumonia_assessment: one of low (<0.2), uncertain (0.2-<0.4), moderate (0.4-<0.6), high (>=0.6) plus brief justification. "
        "differential: only if probability <0.6 (1-2 benign alternatives or empty string). next_steps: brief actions (clinical correlation, follow-up). "
        "patient_friendly: <=40 words, reassuring, plain language. Output ONLY JSON."
    )
    try:
        try:
            from langchain_core.messages import SystemMessage, HumanMessage
            messages = [
                SystemMessage(content=_SYSTEM_PROMPT + " You are generating a structured triage JSON report. Output ONLY JSON object."),
                HumanMessage(content=guidance)
            ]
            response = llm.invoke(messages)
        except Exception:
            # Fallback: concatenate system + human if message classes unavailable
            combined = _SYSTEM_PROMPT + "\n---\n" + guidance
            response = llm.invoke(combined)
        text = getattr(response, 'content', str(response))
    except Exception as e:
        return {"error": f"LLM invocation failed: {e}", "context": context}

    # Attempt to extract JSON
    import json, re
    json_text = None
    # naive first brace extraction
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        snippet = match.group(0)
        try:
            json_text = json.loads(snippet)
        except Exception:
            json_text = None
    result = {
        "raw": text,
        "parsed": json_text,
        "context": context,
        "disclaimer": "Model + LLM output not a medical diagnosis. Seek licensed physician confirmation."
    }
    return result


def chat_followup(
    user_query: str,
    last_report: Dict[str, Any],
    pneumonia_prob: float = None,
    masks: Dict[str, Any] = None,
    threshold: float = None,
    meets_threshold: bool = None,
) -> str:
    """Conversational follow-up constrained to pneumonia triage.

    Provides probability directly if asked (and available) while preserving guardrails.
    """
    if not GEMINI_API_KEY:
        return "LLM unavailable: missing GEMINI_API_KEY"
    llm = _init_llm()
    # Extract parsed JSON summary if present
    report_summary = last_report.get("parsed", {}) if last_report else {}
    prob_fragment = (
        f"Model pneumonia probability: {pneumonia_prob:.4f}. " if isinstance(pneumonia_prob, (int, float)) else "Model pneumonia probability: unavailable. "
    )
    # Mask context summarization
    mask_context = ""
    if masks and isinstance(masks, dict):
        sal = masks.get("saliency", {})
        rsna = masks.get("rsna", {})
        has_any = masks.get("has_any") or masks.get("has_mask") or masks.get("has")
        details = []
        if sal.get("available"):
            details.append("saliency mask (gradient-based, highlights influential pixel regions, NOT a diagnosis)")
        if rsna.get("available"):
            details.append("RSNA reference mask (radiologist lung opacity region)")
        if details:
            mask_context = "Available explanation asset(s): " + ", ".join(details) + ". "
        else:
            if meets_threshold and isinstance(pneumonia_prob, (int, float)) and threshold is not None and pneumonia_prob >= threshold:
                mask_context = "No mask present despite meeting threshold (may be a processing issue). "
            elif not meets_threshold:
                mask_context = "No mask generated because probability did not meet threshold. "
    if threshold is not None and isinstance(pneumonia_prob, (int, float)):
        prob_fragment += f" Threshold: {threshold:.2f}. Meets threshold: {bool(meets_threshold)}. "
    chat_instruction = (
        prob_fragment + mask_context +
        "User question: " + user_query + "\nRespond within 120 words. If user asks about: \n"
        "- probability: restate it exactly (4 decimal places) and remind it's not diagnostic. \n"
        "- why/where the mask: explain saliency = sensitivity map (bright = contributed more); RSNA mask = annotated opacity region if present. \n"
        "- absence of a mask: explain threshold gating or unavailability. \n"
        "Do NOT infer or localize disease outside provided masks. Maintain disclaimer at end."
    )
    guardrail_addendum = (
        "Refuse unrelated topics (non-imaging, prescriptions, politics). Do not fabricate data."
    )
    try:
        try:
            from langchain_core.messages import SystemMessage, HumanMessage
            messages = [
                SystemMessage(content=_SYSTEM_PROMPT + " You are in chat / follow-up mode. " + guardrail_addendum),
                HumanMessage(content=f"Context JSON: {report_summary}\n{chat_instruction}")
            ]
            response = llm.invoke(messages)
        except Exception:
            # Fallback single string prompt
            fallback_prompt = (
                _SYSTEM_PROMPT + "\n--CHAT MODE--\nContext JSON: " + str(report_summary) + "\n" + chat_instruction + "\n" + guardrail_addendum
            )
            response = llm.invoke(fallback_prompt)
        return getattr(response, 'content', str(response))
    except Exception as e:
        return f"LLM error: {e}"
