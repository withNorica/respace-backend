import React, { useState, useCallback, useEffect } from "react";
import { generateDesignViaBackend } from "./services/backendService";

import Header from "./components/Header";
import ImageUploader from "./components/ImageUploader";
import Spinner from "./components/Spinner";
import ThemeToggle from "./components/ThemeToggle";

const KEEP_STYLE_OPTION = "Keep current style (no style change)";
const DESIGN_STYLES = [
  KEEP_STYLE_OPTION,
  "Modern",
  "Scandinavian",
  "Bohemian (Boho)",
  "Minimalist",
  "Industrial",
  "Coastal",
  "Farmhouse",
  "Mid-Century Modern",
  "Japandi",
  "Traditional / Classic",
  "Transitional",
  "Rustic",
  "Eclectic",
];

interface Preset {
  id: string;
  name: string;
  palette: string;
  furniture: string;
  decor: string;
  mood: string;
}

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (presetData: Omit<Preset, "id">) => void;
}

const PresetModal: React.FC<PresetModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [palette, setPalette] = useState("");
  const [furniture, setFurniture] = useState("");
  const [decor, setDecor] = useState("");
  const [mood, setMood] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a name for your preset.");
      return;
    }
    onSave({ name, palette, furniture, decor, mood });
    setName("");
    setPalette("");
    setFurniture("");
    setDecor("");
    setMood("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-zinc-800 dark:text-zinc-100">Create Custom Style Preset</h2>
        <div className="space-y-4">
          <input
            className="w-full p-2 border rounded-md dark:bg-zinc-700 dark:text-zinc-200"
            placeholder="Preset Name (e.g., 'Cozy Cottage')"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className="w-full p-2 border rounded-md dark:bg-zinc-700 dark:text-zinc-200"
            placeholder="Color Palette (e.g., 'Earthy tones, cream, terracotta')"
            rows={2}
            value={palette}
            onChange={(e) => setPalette(e.target.value)}
          />
          <textarea
            className="w-full p-2 border rounded-md dark:bg-zinc-700 dark:text-zinc-200"
            placeholder="Furniture Types (e.g., 'Plush sofas, rustic wood, leather armchairs')"
            rows={2}
            value={furniture}
            onChange={(e) => setFurniture(e.target.value)}
          />
          <textarea
            className="w-full p-2 border rounded-md dark:bg-zinc-700 dark:text-zinc-200"
            placeholder="Decor Elements (e.g., 'Woven textiles, houseplants, vintage art')"
            rows={2}
            value={decor}
            onChange={(e) => setDecor(e.target.value)}
          />
          <textarea
            className="w-full p-2 border rounded-md dark:bg-zinc-700 dark:text-zinc-200"
            placeholder="Overall Mood (e.g., 'Warm, inviting, and peaceful')"
            rows={2}
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="py-2 px-4 bg-zinc-200 dark:bg-zinc-600 rounded-md">
            Cancel
          </button>
          <button onClick={handleSave} className="py-2 px-4 bg-blue-600 text-white rounded-md">
            Save Preset
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // theming
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("ai-interior-designer-theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("ai-interior-designer-theme", theme);
    } catch {}
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // upload + preview
  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // form
  const [selectedStyle, setSelectedStyle] = useState<string>(DESIGN_STYLES[0]);
  const [specificChanges, setSpecificChanges] = useState<string>("");

  // state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string, ms = 1600) {
  setToast(msg);
  window.setTimeout(() => setToast(null), ms);
}

  // results
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);

  // presets
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai-interior-designer-presets");
      if (saved) setPresets(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("ai-interior-designer-presets", JSON.stringify(presets));
    } catch {}
  }, [presets]);

  // preview file URL
  useEffect(() => {
    if (!roomImage) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(roomImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [roomImage]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setRoomImage(file);
    setResultImage(null);
    setResultText(null);
  }, []);

  const DEFAULT_CHANGES = (style: string) =>
    `Redesign in ${style} style: cohesive palette, matching furniture, improved lighting, and balanced layout. Keep walls clean; add 2–3 decor accents.`;

  const handleGenerate = useCallback(async () => {
    if (!roomImage) {
      setError("Please upload an image of your room first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResultImage(null);
    setResultText(null);

    try {
      const fallback = DEFAULT_CHANGES(selectedStyle);
      const sc = specificChanges.trim() || fallback;

      const res = await generateDesignViaBackend(roomImage, selectedStyle, sc);

      const imgFromBackend: string | null = res.image_url || null;
      setResultImage(imgFromBackend);

      const txt = (res.design_suggestions || "").trim();
      setResultText(txt || "• Keep it simple, cohesive, and functional.");

      if (imgFromBackend) setPreviewUrl(null);
    } catch (err: any) {
      console.error(err);
      setError(`Failed to generate design. ${err?.message ?? "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [roomImage, selectedStyle, specificChanges]);

  const handleReset = useCallback(() => {
    setRoomImage(null);
    setPreviewUrl(null);
    setSelectedStyle(DESIGN_STYLES[0]);
    setSpecificChanges("");
    setIsLoading(false);
    setError(null);
    setResultImage(null);
    setResultText(null);
  }, []);

  // -------- DOWNLOAD HELPERS (corecte, în interiorul componentei) ----------
  function dataURLtoBlob(dataUrl: string) {
    const [meta, b64] = dataUrl.split(",");
    const mimeMatch = /data:(.*?);base64/.exec(meta);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bin = atob(b64);
    const len = bin.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
  }

  const handleDownloadImage = useCallback(async () => {
    if (!resultImage) return;

    if (resultImage.startsWith("data:image/")) {
      const blob = dataURLtoBlob(resultImage);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-redesign.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }

    try {
      const resp = await fetch(resultImage);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-redesign.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = resultImage;
      a.download = "ai-redesign.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }, [resultImage]);
  // -------------------------------------------------------------------------

  const handleCopyText = async () => {
  if (!resultText) return;
  try {
    await navigator.clipboard.writeText(resultText);
    showToast("Design suggestions copied!");
  } catch {
    showToast("Copy failed. Select and copy manually.", 2200);
  }
};


  const handleSavePreset = (presetData: Omit<Preset, "id">) => {
    const newPreset: Preset = { id: `preset_${Date.now()}`, ...presetData };
    const updated = [...presets, newPreset];
    setPresets(updated);
    setSelectedStyle(`preset:${newPreset.id}`);
    setIsPresetModalOpen(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center animate-fade-in">
          <Spinner />
          <p className="text-xl mt-4 text-zinc-600 dark:text-zinc-400">Redesigning your room...</p>
          <p className="text-md mt-2 text-zinc-500">This may take a moment.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center animate-fade-in bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 p-8 rounded-lg max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-red-800 dark:text-red-300">An Error Occurred</h2>
          <p className="text-md text-red-700 dark:text-red-400 mb-6">{error}</p>
          <button onClick={handleReset} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
            Try Again
          </button>
        </div>
      );
    }

    if (resultText || resultImage) {
      return (
        <div className="w-full max-w-5xl mx-auto animate-fade-in">
          <h2 className="text-3xl font-extrabold text-center mb-6 text-zinc-800 dark:text-zinc-100">
            Your New Design Concept
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-4">
              <div className="rounded-lg overflow-hidden shadow-xl">
                {resultImage ? (
                  <img src={resultImage} alt={`Room redesigned in ${selectedStyle} style`} className="w-full h-full object-cover" />
                ) : previewUrl ? (
                  <img src={previewUrl} alt="Uploaded room" className="w-full h-full object-cover opacity-90" />
                ) : (
                  <div className="p-8 text-center text-zinc-500">No image available</div>
                )}
              </div>
              {resultImage && (
                <button
                  onClick={handleDownloadImage}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg"
                >
                  Download Image
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4 bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Design Suggestions</h3>
              <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">{resultText || "No suggestions yet."}</p>
              {resultText && (
                <button
                  onClick={handleCopyText}
                  className="w-full bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-100 font-bold py-3 px-4 rounded-lg mt-2"
                >
                  Copy Text
                </button>
              )}
            </div>
          </div>

          <div className="text-center mt-10">
            <button
              onClick={handleReset}
              className="font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Start a New Design
            </button>
          </div>
        </div>
      );
    }

    // ecran inițial
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in flex flex-col gap-6">
        <div className="flex flex-col">
          <label htmlFor="image-uploader" className="text-lg font-semibold mb-2 text-zinc-700 dark:text-zinc-300">
            1. Upload a Photo of Your Room
          </label>
          <ImageUploader id="image-uploader" onFileSelect={(file) => handleImageUpload(file)} imageUrl={previewUrl} />
        </div>

        <div className="flex flex-col">
          <label htmlFor="style-select" className="text-lg font-semibold mb-2 text-zinc-700 dark:text-zinc-300">
            2. Select a Design Style
          </label>
          <select
            id="style-select"
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="w-full p-3 border-2 rounded-lg bg-white dark:bg-zinc-800 dark:text-zinc-200"
          >
            <optgroup label="Standard Styles">
              {DESIGN_STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </optgroup>
            {presets.length > 0 && (
              <optgroup label="Custom Presets">
                {presets.map((p) => (
                  <option key={p.id} value={`preset:${p.id}`}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <button onClick={() => setIsPresetModalOpen(true)} className="text-sm text-blue-600 hover:underline mt-2 text-left">
            + Create Custom Style
          </button>
        </div>

        <div className="flex flex-col">
          <label htmlFor="specific-changes" className="text-lg font-semibold mb-2 text-zinc-700 dark:text-zinc-300">
            3. Add Specific Changes (optional)
          </label>
          <textarea
            id="specific-changes"
            value={specificChanges}
            onChange={(e) => setSpecificChanges(e.target.value)}
            placeholder="Ex: Change only the sofa to gray, add plants, modify only wall colors."
            className="w-full p-3 border-2 rounded-lg bg-white dark:bg-zinc-800 dark:text-zinc-200"
            rows={3}
          />
          <p className="text-sm text-zinc-500 mt-2">💡 Example: change only the sofa, add more plants, modify only the wall colors.</p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!roomImage || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 px-4 rounded-lg text-lg disabled:bg-zinc-400"
        >
          {isLoading ? "Generating…" : "Generate Design Ideas"}
        </button>
      </div>
    );
  };
  {toast && (
  <div
    className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg z-50"
    role="status"
  >
    {toast}
  </div>
)}

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex flex-col items-center p-4 md:p-8 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
      <div className="flex flex-col items-center gap-10 w-full pt-10 md:pt-0">
        <Header />
        <main className="w-full">{renderContent()}</main>
      </div>
      <PresetModal isOpen={isPresetModalOpen} onClose={() => setIsPresetModalOpen(false)} onSave={handleSavePreset} />
    </div>
  );
};

export default App;
