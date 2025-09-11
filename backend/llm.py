import os
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

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

def _init_llm():
    global _llm, _from_langchain
    if _llm is None:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            system_prompt = (
                "You are an assistant radiologist focused strictly on chest X-ray pneumonia triage. "
                "You only discuss: presence, severity indicators, differential limited to pneumonia vs common confounders (eg. atelectasis, effusion). "
                "You must refuse questions outside medical imaging scope (politics, unrelated health conditions, prescriptions). "
                "Audience: a medical trainee in a low-resource rural Philippine clinic. Use plain English, optionally short Filipino clarifications in parentheses. "
                "Always include a 'NOT A FINAL DIAGNOSIS' disclaimer and advise consulting a licensed physician."
            )
            _llm = ChatGoogleGenerativeAI(model=GEMINI_MODEL, api_key=GEMINI_API_KEY, temperature=0.2, convert_system_message_to_human=True)
            _from_langchain = True
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Gemini LLM: {e}")
    return _llm


def build_context(predictions: Dict[str, float]) -> str:
    # Focus on pneumonia related and a few context pathologies
    focus_keys = [k for k in predictions.keys() if k.lower() in {"pneumonia", "consolidation", "infiltration", "effusion", "atelectasis"}]
    sorted_focus = sorted(focus_keys, key=lambda k: predictions[k], reverse=True)
    lines = [f"{k}: {predictions[k]:.3f}" for k in sorted_focus]
    context_block = "\n".join(lines) if lines else "No target pathologies scored highly."
    return (
        "Chest X-ray model probability summary (NOT diagnostic):\n" + context_block + "\n"
        "Probabilities are model outputs; thresholds not calibrated to clinical decision."
    )


def generate_structured_report(predictions: Dict[str, float]) -> Dict[str, Any]:
    context = build_context(predictions)
    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY not set", "context": context}
    llm = _init_llm()
    prompt = (
        f"{context}\n\n"
        "Provide a concise trainee-facing summary with sections: \n"
        "1. Summary (1-2 sentences).\n"
        "2. Pneumonia likelihood commentary (low/uncertain/moderate/high) referencing relevant probabilities.\n"
        "3. Differential considerations (only if necessary).\n"
        "4. Recommended next steps (imaging, clinical correlation).\n"
        "5. Patient explanation (simple terms).\n"
        "Format as JSON with keys: summary, pneumonia_assessment, differential, next_steps, patient_friendly."
    )
    try:
        response = llm.invoke(prompt)
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


def chat_followup(user_query: str, last_report: Dict[str, Any]) -> str:
    if not GEMINI_API_KEY:
        return "LLM unavailable: missing GEMINI_API_KEY"
    llm = _init_llm()
    guardrail_prefix = (
        "If the user's question is outside chest X-ray pneumonia triage, politely refuse and redirect. "
        "Never provide medication doses, prescriptions, or definitive diagnoses. "
    )
    report_summary = last_report.get("parsed", {}) if last_report else {}
    prompt = (
        f"Report context JSON: {report_summary}\nUser: {user_query}\n"
        f"{guardrail_prefix}Respond concisely (<=120 words)."
    )
    try:
        response = llm.invoke(prompt)
        return getattr(response, 'content', str(response))
    except Exception as e:
        return f"LLM error: {e}" 
