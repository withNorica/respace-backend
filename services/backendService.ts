// services/backendService.ts

// Baza API din env (cu fallback local)
export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_BASE ||
  "http://127.0.0.1:8000";

console.log("API_BASE =", API_BASE);

// Funcția care cheamă backendul FastAPI
export async function generateDesignViaBackend(
  file: File,
  style: string,
  specificChanges?: string
) {
  const fd = new FormData();
  fd.append("image", file);      // numele câmpurilor trebuie să fie exact acestea
  fd.append("style", style);
  if (specificChanges) fd.append("specific_changes", specificChanges);

  const res = await fetch(`${API_BASE}/generate`, { method: "POST", body: fd });

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
