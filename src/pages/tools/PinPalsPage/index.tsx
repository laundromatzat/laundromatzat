/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { Download } from "lucide-react";
import { AuraButton } from "@/components/aura";
import { PinState } from "./components/types";
import { Setup } from "./components/Setup";
import { Book } from "./components/Book";
import { useApiKey } from "./components/useApiKey";
import { ApiKeyDialog } from "./components/ApiKeyDialog";
import { LoadingFX } from "./components/LoadingFX";
import { DesignGallery, SortOption } from "@/components/DesignGallery";
import { ClockIcon } from "@heroicons/react/24/outline";

const MODEL_NAME = "gemini-2.5-flash-image";
const DETECTION_MODEL = "gemini-2.5-flash";

// --- API Helpers ---
import { getApiUrl } from "@/utils/api";

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
    // Compress image to avoid 413 Payload Too Large
    const img = new Image();
    img.src = pin.imageUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    // Limit size for gallery thumbnail/save
    const maxSize = 600;
    let width = img.width;
    let height = img.height;

    if (width > height && width > maxSize) {
      height = (height * maxSize) / width;
      width = maxSize;
    } else if (height > maxSize) {
      width = (width * maxSize) / height;
      height = maxSize;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
    }

    // More aggressive compression: 60% quality instead of 80%
    const compressedImageUrl = canvas.toDataURL("image/jpeg", 0.6);

    const res = await fetch(getApiUrl("/api/pin-pals/gallery"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...pin, imageUrl: compressedImageUrl }),
    });
    if (!res.ok) throw new Error("Failed to save pin");
    return await res.json();
  } catch (e) {
    console.error(e);
    alert("Failed to save pin to gallery. Ensure you are logged in.");
    throw e;
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

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const handleSaveToGallery = async () => {
    if (state.generatedImage) {
      try {
        await savePinToGallery({
          imageUrl: state.generatedImage,
          petType: state.petType,
          petCount: state.petCount,
        });
        alert("Pin saved to gallery!");
      } catch {
        // Error already handled
      }
    }
  };

  const handleLoadGalleryItem = (item: {
    imageUrl?: string;
    petType?: string;
    petCount?: number;
  }) => {
    if (!item.imageUrl) return;

    setState((prev) => ({
      ...prev,
      generatedImage: item.imageUrl,
      petType: item.petType || "DOG",
      petCount: item.petCount || 1,
      isLoading: false,
    }));
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
          localStorage.getItem("gemini_api_key") ||
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
        localStorage.getItem("gemini_api_key") ||
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
        (p) => p.inlineData,
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

  const handleDownloadPrintTemplate = async () => {
    if (!state.generatedImage) return;

    try {
      // 1. Create a canvas for 6x4" print at 300 DPI (1800x1200)
      const canvas = document.createElement("canvas");
      canvas.width = 1800;
      canvas.height = 1200;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 2. Fill white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Load the generated image
      const img = new Image();
      img.src = state.generatedImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 4. Calculate dimensions for 4 pins (Staggered Layout)
      const pinSize = 600;
      const radius = pinSize / 2;
      const margin = 20;

      const topRowY = margin + radius;
      const botRowY = 1200 - margin - radius;
      const tr_x1 = 425;
      const tr_x2 = 1075;
      const br_x1 = 725;
      const br_x2 = 1375;

      const drawPinAt = (xCenter: number, yCenter: number) => {
        const x = xCenter - pinSize / 2;
        const y = yCenter - pinSize / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(xCenter, yCenter, pinSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, pinSize, pinSize);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(xCenter, yCenter, pinSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth = 1;
        ctx.stroke();
      };

      drawPinAt(tr_x1, topRowY);
      drawPinAt(tr_x2, topRowY);
      drawPinAt(br_x1, botRowY);
      drawPinAt(br_x2, botRowY);

      const link = document.createElement("a");
      link.download = `pin-pals-print-sheet-${state.petType.toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Failed to generate print template", e);
      alert("Failed to generate print template.");
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setIsGalleryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white hover:bg-aura-surface text-aura-text-secondary hover:text-aura-text-primary rounded-full shadow-aura-sm hover:shadow-aura-md aura-transition"
        >
          <ClockIcon className="w-5 h-5" />
          <span className="font-medium">Gallery</span>
        </button>
      </div>

      <DesignGallery
        title="My Pin Collection"
        fetchEndpoint="/api/pin-pals/gallery"
        deleteEndpoint="/api/pin-pals/gallery"
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onLoad={handleLoadGalleryItem}
        sortOptions={
          [
            {
              label: "Newest First",
              value: "date-desc",
              compareFn: (a: unknown, b: unknown) => {
                const aDate = new Date(
                  (a as { createdAt?: string }).createdAt || 0,
                ).getTime();
                const bDate = new Date(
                  (b as { createdAt?: string }).createdAt || 0,
                ).getTime();
                return bDate - aDate;
              },
            },
            {
              label: "Oldest First",
              value: "date-asc",
              compareFn: (a: unknown, b: unknown) => {
                const aDate = new Date(
                  (a as { createdAt?: string }).createdAt || 0,
                ).getTime();
                const bDate = new Date(
                  (b as { createdAt?: string }).createdAt || 0,
                ).getTime();
                return aDate - bDate;
              },
            },
            {
              label: "By Pet Type",
              value: "pet-type",
              compareFn: (a: unknown, b: unknown) => {
                const aType = (a as { petType?: string }).petType || "";
                const bType = (b as { petType?: string }).petType || "";
                return aType.localeCompare(bType);
              },
            },
          ] as SortOption[]
        }
        renderPreview={(item: {
          imageUrl: string;
          petType: string;
          petCount: number;
          createdAt: string;
        }) => (
          <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-8 bg-black/40">
              <img
                src={item.imageUrl}
                alt={item.petType}
                className="max-h-[60vh] object-contain drop-shadow-2xl"
              />
            </div>
            <div className="p-6 bg-slate-800 border-t border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-white capitalize">
                  {item.petType} Pin
                </h3>
                <span className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-400">
                A custom pin design featuring {item.petCount}{" "}
                {item.petCount === 1 ? "pet" : "pets"}.
              </p>
            </div>
          </div>
        )}
        renderItem={(item: {
          imageUrl: string;
          petType: string;
          petCount: number;
          createdAt: string;
        }) => (
          <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="aspect-square relative flex items-center justify-center bg-black/40 p-4">
              <img
                src={item.imageUrl}
                alt={item.petType}
                className="max-h-full max-w-full drop-shadow-xl object-contain"
              />
            </div>
            <div className="p-4 border-t border-slate-800">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-100 capitalize">
                  {item.petType} Pin
                </h4>
                <span className="text-xs text-slate-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {item.petCount} {item.petCount === 1 ? "Pet" : "Pets"}
              </p>
            </div>
          </div>
        )}
      />

      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />
      )}

      <div className="max-w-3xl w-full mx-auto">
        <header className="mb-10 text-center md:text-left flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-aura-text-primary mb-1">
              Pin Pals
            </h1>
            <p className="text-aura-text-secondary font-medium">
              Generate harm reduction art featuring your pets
            </p>
          </div>
        </header>

        {state.isLoading ? (
          <div className="card h-[400px]">
            <LoadingFX />
          </div>
        ) : state.generatedImage ? (
          <div className="flex flex-col gap-4">
            <Book imageUrl={state.generatedImage} onReset={handleReset} />
            <AuraButton
              onClick={handleSaveToGallery}
              variant="primary"
              className="mx-auto"
            >
              Save to Gallery ❤️
            </AuraButton>
            <div className="flex justify-center mt-2">
              <AuraButton
                onClick={handleDownloadPrintTemplate}
                variant="ghost"
                icon={<Download size={16} />}
              >
                Download 6x4&quot; Print Sheet (4 copies)
              </AuraButton>
            </div>
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
      </div>

      <footer className="mt-12 text-center text-aura-text-secondary text-xs">
        <p>Powered by Gemini 3 Pro Image Preview</p>
      </footer>
    </div>
  );
};

export default PinPalsPage;
