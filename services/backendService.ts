
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
 c16:31:31.924 Running build in Washington, D.C., USA (East) – iad1
16:31:31.932 Build machine configuration: 2 cores, 8 GB
16:31:31.971 Cloning github.com/withNorica/respace-backend (Branch: main, Commit: e17cdb9)
16:31:32.531 Cloning completed: 559.000ms
16:31:32.805 Restored build cache from previous deployment (A4oxDn24mN5h5PmxwsH2KfPxBeD5)
16:31:33.063 Running "vercel build"
16:31:33.468 Vercel CLI 48.1.6
16:31:34.091 Installing dependencies...
16:31:35.001 
16:31:35.002 up to date in 667ms
16:31:35.002 
16:31:35.002 13 packages are looking for funding
16:31:35.002   run `npm fund` for details
16:31:35.032 Running "npm run build"
16:31:35.141 
16:31:35.141 > ai-interior-designer@0.0.0 build
16:31:35.142 > vite build
16:31:35.142 
16:31:35.922 [36mvite v6.3.6 [32mbuilding for production...[36m[39m
16:31:35.996 transforming...
16:31:36.273 [32m✓[39m 10 modules transformed.
16:31:36.274 [31m✗[39m Build failed in 321ms
16:31:36.275 [31merror during build:
16:31:36.275 [31m[vite:esbuild] Transform failed with 1 error:
16:31:36.275 /vercel/path0/services/backendService.ts:24:6: ERROR: Expected ";" but found "res"[31m
16:31:36.275 file: [36m/vercel/path0/services/backendService.ts:24:6[31m
16:31:36.276 [33m
16:31:36.276 [33mExpected ";" but found "res"[33m
16:31:36.276 22 |  
16:31:36.276 23 |    // dacă endpoint-ul tău e /api/generate, schimbă linia de mai jos în `${API_BASE}/api/generate`
16:31:36.276 24 |   onst res = await fetch(`https://respace-backend.vercel.app/api/generate`, {
16:31:36.277    |        ^
16:31:36.277 25 |    method: "POST",
16:31:36.277 26 |    body: fd
const res = await fetch(`https://respace-backend.vercel.app/api/generate`, {
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
