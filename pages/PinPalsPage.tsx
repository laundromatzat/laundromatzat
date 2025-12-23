/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { PinState } from "../components/pin-pals/types";
import { Setup } from "../components/pin-pals/Setup";
import { Book } from "../components/pin-pals/Book";
import { useApiKey } from "../components/pin-pals/useApiKey";
import { ApiKeyDialog } from "../components/pin-pals/ApiKeyDialog";
import { LoadingFX } from "../components/pin-pals/LoadingFX";

const MODEL_NAME = "gemini-3-pro-image-preview";
const DETECTION_MODEL = "gemini-2.5-flash";

// --- API Helpers ---
const API_BASE = "http://localhost:4000/api/pin-pals";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const savePinToGallery = async (pin: {
  imageUrl: string;
  petType: string;
  petCount: number;
}) => {
  try {
    const res = await fetch(`${API_BASE}/gallery`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(pin),
    });
    if (!res.ok) throw new Error("Failed to save pin");
    return await res.json();
  } catch (e) {
    console.error(e);
    alert("Failed to save pin to gallery. Ensure you are logged in.");
  }
};

const fetchCheckGallery = async () => {
  try {
    const res = await fetch(`${API_BASE}/gallery`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.pins || [];
    }
    return [];
  } catch (e) {
    console.error("Failed to fetch gallery", e);
    return [];
  }
};

const PinPalsPage: React.FC = () => {
  const { validateApiKey, showApiKeyDialog, handleApiKeyDialogContinue } =
    useApiKey();

  const [state, setState] = useState<PinState>({
    petImage: null,
    petType: "DOG",
    petCount: 1,
    generatedImage: null,
    isLoading: false,
    isDetecting: false,
  });

  interface GalleryItem {
    id: number;
    imageUrl: string;
    petType: string;
    petCount: number;
  }

  const [view, setView] = useState<"create" | "gallery">("create");
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  // Load gallery when switching view
  React.useEffect(() => {
    if (view === "gallery") {
      fetchCheckGallery().then(setGallery);
    }
  }, [view]);

  const handleSaveToGallery = async () => {
    if (state.generatedImage) {
      await savePinToGallery({
        imageUrl: state.generatedImage,
        petType: state.petType,
        petCount: state.petCount,
      });
      alert("Pin saved to gallery!");
    }
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];

      setState((prev) => ({
        ...prev,
        petImage: base64,
        generatedImage: null,
        isDetecting: true,
      }));

      const hasKey = await validateApiKey();
      if (!hasKey) {
        setState((prev) => ({ ...prev, isDetecting: false }));
        return;
      }

      try {
        const apiKey =
          import.meta.env.VITE_GEMINI_API_KEY ||
          import.meta.env.VITE_GOOGLE_GENAI_API_KEY ||
          import.meta.env.VITE_API_KEY ||
          "";
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: DETECTION_MODEL,
          contents: {
            parts: [
              {
                text: "Analyze the image and identify the main animal subject(s). Return a JSON object with: 1. 'species': the singular type of animal (e.g., DOG, CAT, RABBIT). 2. 'count': the integer number of these animals visible. 3. 'label': a short uppercase label for the pin text (e.g., 'DOG' for 1, 'DOGS' for 2). If unsure, default to count 1.",
              },
              { inlineData: { mimeType: "image/jpeg", data: base64 } },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                species: { type: Type.STRING },
                count: { type: Type.INTEGER },
                label: { type: Type.STRING },
              },
            },
          },
        });

        const result = JSON.parse(response.text || "{}");
        if (result.label) {
          setState((prev) => ({
            ...prev,
            petType: result.label,
            petCount: result.count || 1,
            isDetecting: false,
          }));
        } else {
          setState((prev) => ({ ...prev, isDetecting: false }));
        }
      } catch (e) {
        console.error("Detection failed:", e);
        setState((prev) => ({ ...prev, isDetecting: false }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTypeChange = (type: string) => {
    setState((prev) => ({ ...prev, petType: type }));
  };

  const handleCountChange = (count: number) => {
    setState((prev) => ({ ...prev, petCount: Math.max(1, count) }));
  };

  const handleGenerate = async () => {
    const hasKey = await validateApiKey();
    if (!hasKey) return;

    if (!state.petImage) {
      alert("Please upload a picture of your pet first!");
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, generatedImage: null }));

    try {
      const apiKey =
        import.meta.env.VITE_GEMINI_API_KEY ||
        import.meta.env.VITE_GOOGLE_GENAI_API_KEY ||
        import.meta.env.VITE_API_KEY ||
        "";
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        Create a circular pin button design on a plain white background.
        
        REFERENCE IMAGE INSTRUCTION:
        Use the provided pet photo as the source. You must create a high-fidelity vector illustration of the ${state.petCount} specific subject${state.petCount > 1 ? "s" : ""} in the photo, capturing breed, fur markings, and expression accurately.

        ART STYLE TARGET:
        - **Highly detailed semi-realistic vector illustration**.
        - This should NOT look like a simple flat cartoon or clip art.
        - **Fur Rendering:** Use detailed, sharp vector strokes to depict fur texture.
        - **Eyes:** Deep, glossy, and expressive with distinct highlights.
        - **Line Work:** Clean, refined edges, resembling high-end digital sticker art.
        - **Color:** Naturalistic but vibrant.

        COMPOSITION & LAYOUT:
        - **Shape:** A perfect circle.
        - **Background:** A soft, pleasant gradient (e.g., pale blue, mint, or lavender).
        - **Subject:** The vector illustration of the pet${state.petCount > 1 ? "s" : ""} should be large and prominent, filling the majority of the circle. The bottom of the pet${state.petCount > 1 ? "s" : ""} (chest/paws) should extend towards the bottom edge.

        TEXT & GRAPHIC OVERLAYS (CRITICAL):
        - **Top Text:** "ASK ME ABOUT MY ${state.petType.toUpperCase()}..." arched along the top inner edge in bold, black, handwritten-style marker font.
        
        - **Bottom Text Banner:** The text "or harm reduction!" must be inside a **white ribbon banner** (with a black outline) that curves across the bottom of the design.
          - **Placement:** This banner should **OVERLAY** the pet's chest/body near the bottom. Do not shrink the pet to make room; place the banner on top of the illustration.
        
        - **Iconography (Three Specific Items):**
           You must include exactly **THREE** distinct icons clustered together at the bottom, near the banner, overlapping the pet. They must be styled consistently as vector stickers:
           1. **Naloxone:** A nasal spray device (often white/purple).
           2. **Test Strip:** A small strip representing a fentanyl test strip.
           3. **Syringe:** A clean, stylized medical syringe.
           
           - **Visual Style:** These icons must have a **strong white glowing halo** or a thick white sticker outline around them. This is essential to ensure they are readable and contrast sharply against the pet's fur behind them.
        
        The final output should be a single square image containing the circular pin design on a white background.
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: state.petImage } },
          ],
        },
        config: {
          imageConfig: { aspectRatio: "1:1" },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.find(
        (p) => p.inlineData
      );
      if (part?.inlineData?.data) {
        const url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        setState((prev) => ({
          ...prev,
          generatedImage: url,
          isLoading: false,
        }));
      } else {
        throw new Error("No image generated");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong generating the pin. Please try again.");
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleReset = () => {
    setState({
      petImage: null,
      petType: "DOG",
      petCount: 1,
      generatedImage: null,
      isLoading: false,
      isDetecting: false,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />
      )}

      <div className="max-w-3xl w-full mx-auto">
        <header className="mb-10 text-center md:text-left flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
              Pin Pals
            </h1>
            <p className="text-zinc-500 font-medium">
              Generate harm reduction art featuring your pets
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView("create")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === "create"
                  ? "bg-white text-zinc-900"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Create
            </button>
            <button
              onClick={() => setView("gallery")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === "gallery"
                  ? "bg-white text-zinc-900"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              My Pins
            </button>
          </div>
        </header>

        {view === "gallery" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((pin) => (
              <div
                key={pin.id}
                className="bg-zinc-800 rounded-xl overflow-hidden aspect-square relative group"
              >
                <img
                  src={pin.imageUrl}
                  alt={pin.petType}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {pin.petCount} {pin.petType}
                </div>
              </div>
            ))}
            {gallery.length === 0 && (
              <div className="col-span-full text-center text-zinc-500 py-10">
                No saved pins found.
              </div>
            )}
          </div>
        ) : (
          <>
            {state.isLoading ? (
              <div className="card h-[400px]">
                <LoadingFX />
              </div>
            ) : state.generatedImage ? (
              <div className="flex flex-col gap-4">
                <Book imageUrl={state.generatedImage} onReset={handleReset} />
                <button
                  onClick={handleSaveToGallery}
                  className="mx-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-lg transition-colors border-2 border-emerald-400/30"
                >
                  Save to Gallery ❤️
                </button>
              </div>
            ) : (
              <Setup
                petImage={state.petImage}
                petType={state.petType}
                petCount={state.petCount}
                isDetecting={state.isDetecting}
                onImageUpload={handleImageUpload}
                onTypeChange={handleTypeChange}
                onCountChange={handleCountChange}
                onGenerate={handleGenerate}
              />
            )}
          </>
        )}
      </div>

      <footer className="mt-12 text-center text-zinc-600 text-xs">
        <p>Powered by Gemini 3 Pro Image Preview</p>
      </footer>
    </div>
  );
};

export default PinPalsPage;
