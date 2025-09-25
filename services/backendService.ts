const API = import.meta.env.VITE_API_BASE_URL;

export async function generateDesignViaBackend(
  file: File,
  style: string,
  specificChanges?: string
) {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("style", style);
  if (specificChanges) fd.append("specific_changes", specificChanges);

  const res = await fetch(`${API}/generate`, {
    method: "POST",
    body: fd,
  });

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
