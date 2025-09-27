
// services/backendService.ts

// Baza API din env (cu fallback production)
export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_BASE ||
  "https://respace-backend.vercel.app";

console.log("API_BASE =", API_BASE);

// Funcția care cheamă backendul FastAPI
export async function generateDesignViaBackend(
  file: File,
  style: string,
  specificChanges?: string
) {
  const fd = new FormData();
  fd.append("image", file); // numele câmpurilor trebuie să fie exact acestea
  fd.append("style", style);
  if (specificChanges) fd.append("specific_changes", specificChanges);

  // dacă endpoint-ul tău e /api/generate, schimbă linia de mai jos în `${API_BASE}/api/generate`
 const res = await fetch(`https://respace-backend.vercel.app/generate`, {

  method: "POST",
  body: fd
});


  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }

  const json = await res.json();

  // Normalizează ca UI-ul să aibă mereu image_url
  if (!json.image_url && json.image_base64) {
    json.image_url = "data:image/png;base64," + json.image_base64;
  }

  return json as {
    ok: boolean;
    received: {
      filename: string;
      content_type: string;
      style: string;
      specific_changes: string;
    };
    image_url: string | null;
    design_suggestions: string;
  };
}
