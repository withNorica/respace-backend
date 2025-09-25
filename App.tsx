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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-zinc-800 dark:text-zinc-100">
          Create Custom Style Preset
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Preset Name (e.g., 'Cozy Cottage')"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          <textarea
            placeholder="Color Palette (e.g., 'Earthy tones, cream, terracotta')"
            value={palette}
            onChange={(e) => setPalette(e.target.value)}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            rows={2}
          />
          <textarea
            placeholder="Furniture Types (e.g., 'Plush sofas, rustic wood, leather armchairs')"
            value={furniture}
            onChange={(e) => setFurniture(e.target.value)}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            rows={2}
          />
          <textarea
            placeholder="Decor Elements (e.g., 'Woven textiles, houseplants, vintage art')"
            value={decor}
            onChange={(e) => setDecor(e.target.value)}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            rows={2}
          />
          <textarea
            placeholder="Overall Mood (e.g., 'Warm, inviting, and peaceful')"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            rows={2}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 dark:text-zinc-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Save Preset
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [roomImageUrl, setRoomImageUrl] = useState<string | null>(null);

  const [selectedStyle, setSelectedStyle] = useState<string>(DESIGN_STYLES[0]);
  const [specificChanges, setSpecificChanges] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // rezultatele
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);

  // presets
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  // theming
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("ai-interior-designer-theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("ai-interior-designer-theme", theme);
    } catch (e) {
      console.error("Failed to save theme to localStorage", e);
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // load/save presets
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai-interior-designer-presets");
      if (saved) setPresets(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load presets from localStorage", e);
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("ai-interior-designer-presets", JSON.stringify(presets));
    } catch (e) {
      console.error("Failed to save presets to localStorage", e);
    }
  }, [presets]);

  // preview upload
  useEffect(() => {
    if (roomImage) {
      const url = URL.createObjectURL(roomImage);
      setRoomImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setRoomImageUrl(null);
  }, [roomImage]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setRoomImage(file);
  }, []);

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
      // Chemăm backendul nostru (FastAPI) care folosește Gemini pentru text.
      const res = await generateDesignViaBackend(roomImage, selectedStyle, specificChanges);

      // Imaginea încă e null (o vom adăuga în pasul următor din backend)
      setResultImage(res.image_url || null);

      // Sugestiile vin de la Gemini prin backend:
      setResultText(res.design_suggestions || "");

    } catch (err: any) {
      console.error(err);
      const msg = err?.message ?? "Unknown error";
      setError(`Failed to generate design. ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [roomImage, selectedStyle, specificChanges]);

  const handleReset = useCallback(() => {
    setRoomImage(null);
    setRoomImageUrl(null);
    setSelectedStyle(DESIGN_STYLES[0]);
    setSpecificChanges("");
    setIsLoading(false);
    setError(null);
    setResultImage(null);
    setResultText(null);
  }, []);

  const handleDownloadImage = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `ai-redesign.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText).then(
      () => alert("Design suggestions copied to clipboard!"),
      (err) => {
        console.error("Failed to copy text: ", err);
        alert("Failed to copy text.");
      }
    );
  };

  const handleSavePreset = (presetData: Omit<Preset, "id">) => {
    const newPreset: Preset = {
      id: `preset_${Date.now()}`,
      ...presetData,
    };
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
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
          <button
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    // Afișează rezultatul dacă avem text SAU imagine (pentru că imaginea poate fi null în această etapă)
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
                  <img
                    src={resultImage}
                    alt={`Room redesigned in ${selectedStyle} style`}
                    className="w-full h-full object-cover"
                  />
                ) : roomImageUrl ? (
                  // dacă nu avem încă imagine generată, arătăm poza originală ca referință
                  <img
                    src={roomImageUrl}
                    alt="Uploaded room"
                    className="w-full h-full object-cover opacity-90"
                  />
                ) : (
                  <div className="p-8 text-center text-zinc-500">No image available</div>
                )}
              </div>
              {resultImage && (
                <button
                  onClick={handleDownloadImage}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Download Image
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4 bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Design Suggestions</h3>
              <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                {resultText || "No suggestions yet."}
              </p>
              {resultText && (
                <button
                  onClick={handleCopyText}
                  className="w-full bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-100 font-bold py-3 px-4 rounded-lg transition-colors mt-2"
                >
                  Copy Text
                </button>
              )}
            </div>
          </div>

          <div className="text-center mt-10">
            <button
              onClick={handleReset}
              className="font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors"
            >
              Start a New Design
            </button>
          </div>
        </div>
      );
    }

    // Ecranul inițial
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in flex flex-col gap-6">
        <div className="flex flex-col">
          <label
            htmlFor="image-uploader"
            className="text-lg font-semibold mb-2 text-zinc-700 dark:text-zinc-300"
          >
            1. Upload a Photo of Your Room
          </label>
          <ImageUploader id="image-uploader" onFileSelect={handleImageUpload} imageUrl={roomImageUrl} />
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="style-select"
            className="text-lg font-semibold mb-2 text-zinc-700 dark:text-zinc-300"
          >
            2. Select a Design Style
          </label>
          <select
            id="style-select"
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="w-full p-3 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 dark:text-zinc-200 focus:border-blue-500 focus:ring-blue-500 transition"
          >
            <optgroup label="Standard Styles">
              {DESIGN_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </optgroup>
            {presets.length > 0 && (
              <optgroup label="Custom Presets">
                {presets.map((preset) => (
                  <option key={preset.id} value={`preset:${preset.id}`}>
                    {preset.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <button
            onClick={() => setIsPresetModalOpen(true)}
            className="text-sm text-blue-600 hover:underline mt-2 text-left dark:text-blue-400 dark:hover:text-blue-300"
          >
            + Create Custom Style
          </button>
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="specific-changes"
            className="text-lg font-semibold mb-2 text-zinc-700 dark:text-zinc-300"
          >
            3. Add Specific Changes (optional)
          </label>
          <textarea
            id="specific-changes"
            value={specificChanges}
            onChange={(e) => setSpecificChanges(e.target.value)}
            placeholder="Ex: Change only the sofa to gray, add more green plants, modify only the wall colors."
            className="w-full p-3 border-2 border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 dark:text-zinc-200 focus:border-blue-500 focus:ring-blue-500 transition placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            rows={3}
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            💡 Example: change only the sofa, add more plants, modify only the wall colors.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!roomImage || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 px-4 rounded-lg text-lg transition-colors disabled:bg-zinc-400 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed"
        >
          Generate Design Ideas
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex flex-col items-center p-4 md:p-8 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
      <div className="flex flex-col items-center gap-10 w-full pt-10 md:pt-0">
        <Header />
        <main className="w-full">{renderContent()}</main>
      </div>

      <PresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onSave={handleSavePreset}
      />
    </div>
  );
};

export default App;
