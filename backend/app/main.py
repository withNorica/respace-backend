# === imports ===
import os
import base64
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()  # local folosește backend/.env; pe Render citim din env vars

# === FastAPI app + CORS ===
app = FastAPI(title="ReSpace Design API", version="0.1.0")

# CORS: permite frontendul local și (mai târziu) domeniul Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",                       # dev local
        "https://respace-backend-nfiv.onrender.com",   # (safe to include)
        # adaugă aici domeniul Vercel când îl ai:
        # "https://respace-design.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("WARNING: GEMINI_API_KEY not set")
else:
    genai.configure(api_key=API_KEY)

IMAGE_MODEL_ID = "gemini-2.5-flash-image-preview"


# --- Health check ---
@app.get("/health")
async def health():
    return {"status": "ok"}


# --- Prompt builder (cu opțiunea de păstrare a stilului curent) ---
def build_image_edit_prompt(style: str, specific_changes: str | None) -> str:
    keep_style_aliases = {
        "", "keep current style (no style change)", "keep current style",
        "no style change", "original", "as is"
    }
    s = (style or "").strip().lower()

    if s in keep_style_aliases:
        base = (
            "You are an expert interior designer. Keep the existing style, theme, and overall aesthetic of the provided room. "
            "Do not restyle or re-theme the space. Preserve the layout, geometry, and lighting approach. "
            "Apply ONLY the specific changes requested below, leaving everything else as-is. "
            "Avoid altering walls, floors, ceiling, windows, major furniture, or materials unless explicitly requested.\n"
        )
        if specific_changes:
            base += f"- Specific changes to apply: {specific_changes}\n"
        else:
            base += "- Specific changes to apply: (user did not specify)\n"
        base += "- Also provide 3–5 concise, practical design suggestions as text, consistent with the current style."
        return base

    # Altfel: re-style în stilul selectat
    base = (
        "You are an expert interior designer. Restyle the provided room photo "
        f"into a '{style}' style while preserving the core layout and geometry. "
        "Adjust furniture, materials, colors, lighting, and décor to match the style. "
        "The output must be a photorealistic image with no overlaid text.\n"
    )
    if specific_changes:
        base += f"- Specific changes requested by user: {specific_changes}\n"
    base += "- Also provide 4–6 concise, practical design suggestions as text."
    return base


# --- Call Gemini 2.5 Flash Image (image + text out) ---
async def redesign_with_gemini25(
    image_file: UploadFile,
    content_type: str,
    style: str,
    specific_changes: Optional[str],
):
    image_bytes = await image_file.read()
    prompt = build_image_edit_prompt(style, specific_changes)

    try:
        model = genai.GenerativeModel(IMAGE_MODEL_ID)
        resp = model.generate_content([
            prompt,
            {"mime_type": content_type, "data": image_bytes}
        ])
    except Exception as e:
        # întoarcem un răspuns „blând” pentru UI, nu 500
        return {
            "suggestions_text": (
                "Sorry, I couldn't process that request. "
                "Try specifying the item more clearly (e.g., 'coffee table', 'area rug', 'wall color')."
            ),
            "image_url": None,
        }

    # Extragem text + imagine
    suggestions: list[str] = []
    image_data_url: Optional[str] = None

    for cand in getattr(resp, "candidates", []) or []:
        parts = getattr(getattr(cand, "content", None), "parts", None)
        if not parts:
            continue
        for part in parts:
            if getattr(part, "text", None):
                suggestions.append(part.text)
            elif getattr(part, "inline_data", None):
                b = part.inline_data.data
                if b:
                    b64 = base64.b64encode(b).decode("utf-8")
                    image_data_url = f"data:image/png;base64,{b64}"

    if not suggestions and getattr(resp, "text", None):
        suggestions = [resp.text]

    return {
        "suggestions_text": "\n".join(suggestions).strip(),
        "image_url": image_data_url,
    }


# --- Endpoint principal ---
@app.post("/generate")
async def generate_design(
    image: UploadFile = File(...),
    style: str = Form(...),
    specific_changes: Optional[str] = Form(None)
):
    filename = image.filename
    content_type = image.content_type

    result = await redesign_with_gemini25(image, content_type, style, specific_changes)

    return {
        "ok": True,
        "received": {
            "filename": filename,
            "content_type": content_type,
            "style": style,
            "specific_changes": specific_changes or "",
        },
        "image_url": result["image_url"],
        "design_suggestions": result["suggestions_text"],
    }
