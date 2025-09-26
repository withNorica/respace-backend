// baza de API: ia din Vite env; fallback pentru dev local
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_BASE ||
  "http://127.0.0.1:8000";
console.log("API_BASE =", API_BASE);


export async function generateDesignViaBackend(
  file: File,
  style: string,
  specificChanges?: string
) {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("style", style);
  if (specificChanges) fd.append("specific_changes", specificChanges);

  const res = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    body: fd,
  });
console.log("API_BASE =", API_BASE);
// SHIM global – dacă alt cod așteaptă `API`, dăm fallback la API_BASE
;(globalThis as any).API = API_BASE;

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }

  return (await res.json()) as {
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
