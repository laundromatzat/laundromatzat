import React, { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageMetadata from "@/components/PageMetadata";
import Container from "@/components/Container";
import { savePalette, type ColorPalette } from "@/services/colorPaletteApi";
import { compressImage } from "@/utils/imageUtils";
import { DesignGallery, SortOption } from "@/components/DesignGallery";
import { ClockIcon } from "@heroicons/react/24/outline";

interface ExtractedColor {
  hex: string;
  rgb: [number, number, number];
}

const MAX_CANVAS_SIZE = 600;
const PALETTE_SIZE = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function componentToHex(component: number): string {
  const hex = clamp(Math.round(component), 0, 255)
    .toString(16)
    .padStart(2, "0");
  return hex;
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function colorDistance(
  a: [number, number, number],
  b: [number, number, number],
): number {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
      Math.pow(a[1] - b[1], 2) +
      Math.pow(a[2] - b[2], 2),
  );
}

function averageColor(
  colors: [number, number, number][],
): [number, number, number] {
  if (colors.length === 0) {
    return [128, 128, 128];
  }

  const sums = colors.reduce<[number, number, number]>(
    (acc, color) => [acc[0] + color[0], acc[1] + color[1], acc[2] + color[2]],
    [0, 0, 0],
  );

  return [
    sums[0] / colors.length,
    sums[1] / colors.length,
    sums[2] / colors.length,
  ];
}

function initializeCentroids(
  pixels: [number, number, number][],
  k: number,
): [number, number, number][] {
  if (pixels.length === 0) {
    return new Array(k).fill(null).map(() => [128, 128, 128]);
  }

  const centroids: [number, number, number][] = [];
  centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);

  while (centroids.length < k) {
    let candidate: [number, number, number] | null = null;
    let bestDistance = -Infinity;

    for (let i = 0; i < 32; i += 1) {
      const sample = pixels[Math.floor(Math.random() * pixels.length)];
      const minDistance = centroids.reduce((min, centroid) => {
        const distance = colorDistance(sample, centroid);
        return Math.min(min, distance);
      }, Infinity);

      if (minDistance > bestDistance) {
        bestDistance = minDistance;
        candidate = sample;
      }
    }

    if (candidate) {
      centroids.push(candidate);
    } else {
      centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
    }
  }

  return centroids;
}

function kMeans(
  pixels: [number, number, number][],
  k: number,
): [number, number, number][] {
  if (pixels.length === 0) {
    return new Array(k).fill(null).map(() => [128, 128, 128]);
  }

  let centroids = initializeCentroids(pixels, k);
  const assignments = new Array<number>(pixels.length).fill(0);

  for (let iteration = 0; iteration < 10; iteration += 1) {
    const clusters: [number, number, number][][] = Array.from(
      { length: k },
      () => [],
    );

    pixels.forEach((pixel, index) => {
      let closest = 0;
      let closestDistance = Infinity;

      centroids.forEach((centroid, centroidIndex) => {
        const distance = colorDistance(pixel, centroid);
        if (distance < closestDistance) {
          closest = centroidIndex;
          closestDistance = distance;
        }
      });

      clusters[closest].push(pixel);
      assignments[index] = closest;
    });

    centroids = clusters.map((cluster) => averageColor(cluster));
  }

  return centroids;
}

const ColorPalettePage: React.FC = () => {
  const [palette, setPalette] = useState<ExtractedColor[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sampleColors = useCallback(
    (context: CanvasRenderingContext2D, width: number, height: number) => {
      const imageData = context.getImageData(0, 0, width, height);
      const data = imageData.data;
      const pixels: [number, number, number][] = [];
      const maxSamples = 12000;
      const step = Math.max(1, Math.floor(data.length / 4 / maxSamples));

      for (let i = 0; i < data.length; i += step * 4) {
        pixels.push([data[i], data[i + 1], data[i + 2]]);
      }

      return pixels;
    },
    [],
  );

  const processImage = useCallback(
    async (img: HTMLImageElement, file: File) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const scale = Math.min(
        MAX_CANVAS_SIZE / img.width,
        MAX_CANVAS_SIZE / img.height,
        1,
      );
      const width = Math.floor(img.width * scale);
      const height = Math.floor(img.height * scale);

      canvas.width = width;
      canvas.height = height;

      context.clearRect(0, 0, width, height);
      context.drawImage(img, 0, 0, width, height);

      const sampledPixels = sampleColors(context, width, height);
      const centroids = kMeans(sampledPixels, PALETTE_SIZE);

      const colors = centroids.map((color) => {
        const rounded: [number, number, number] = [
          Math.round(color[0]),
          Math.round(color[1]),
          Math.round(color[2]),
        ];

        return {
          hex: rgbToHex(rounded),
          rgb: rounded,
        };
      });

      setPalette(colors);

      // Save to backend with image compression
      try {
        const rawDataUrl = canvas.toDataURL();
        const compressedDataUrl = await compressImage(
          rawDataUrl,
          1920,
          1080,
          0.85,
        );

        await savePalette({
          fileName: file.name,
          imageDataUrl: compressedDataUrl,
          palette: colors,
        });
      } catch (err) {
        console.error("Failed to save palette:", err);
        // Don't show error to user - background operation
      }
    },
    [sampleColors],
  );

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback(
      (event) => {
        const [file] = event.target.files ?? [];

        if (!file) {
          return;
        }

        if (!file.type.startsWith("image/")) {
          setError("Please upload an image file.");
          return;
        }

        setError(null);
        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result !== "string") {
            setIsProcessing(false);
            setError("Something went wrong while reading the image.");
            return;
          }

          const img = new Image();
          img.onload = () => {
            setImagePreview(result);
            processImage(img, file);
            setIsProcessing(false);
          };
          img.onerror = () => {
            setIsProcessing(false);
            setError("Could not load the image. Try a different file.");
          };
          img.src = result;
        };
        reader.onerror = () => {
          setIsProcessing(false);
          setError("Something went wrong while reading the image.");
        };

        reader.readAsDataURL(file);
      },
      [processImage],
    );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const copyToClipboard = useCallback((value: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopiedValue(value);
        setTimeout(() => {
          setCopiedValue((prev) => (prev === value ? null : prev));
        }, 1500);
      })
      .catch(() => {
        setError("Copy to clipboard failed.");
      });
  }, []);

  const loadHistoricalPalette = useCallback((stored: ColorPalette) => {
    const parsedPalette: ExtractedColor[] = JSON.parse(stored.palette_json);
    setPalette(parsedPalette);
    setImagePreview(stored.image_data_url);
  }, []);

  const sortOptions: SortOption[] = [
    {
      label: "Newest First",
      value: "date-desc",
      compareFn: (a: unknown, b: unknown) => {
        const aDate = new Date((a as ColorPalette).created_at).getTime();
        const bDate = new Date((b as ColorPalette).created_at).getTime();
        return bDate - aDate;
      },
    },
    {
      label: "Oldest First",
      value: "date-asc",
      compareFn: (a: unknown, b: unknown) => {
        const aDate = new Date((a as ColorPalette).created_at).getTime();
        const bDate = new Date((b as ColorPalette).created_at).getTime();
        return aDate - bDate;
      },
    },
  ];

  const placeholders = useMemo(() => new Array(PALETTE_SIZE).fill(null), []);

  return (
    <Container className="space-y-10 pt-8">
      <PageMetadata
        title="Color Palette Extractor"
        description="Upload an image and instantly generate a five-color palette with copy-ready values."
        path="/tools/color-palette"
        type="article"
      />
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-aura-text-secondary">
            <Link to="/tools" className="text-brand-accent hover:underline">
              ← back to tools
            </Link>
            <span className="text-sm">
              extract a color palette from an image.
            </span>
          </div>
          <button
            onClick={() => setIsGalleryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white hover:bg-aura-surface text-aura-text-secondary hover:text-aura-text-primary rounded-full shadow-aura-sm hover:shadow-aura-md aura-transition"
          >
            <ClockIcon className="w-5 h-5" />
            <span className="font-medium">History</span>
          </button>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-aura-text-primary">
          Color Palette Extractor
        </h1>
        <p className="text-lg text-aura-text-secondary max-w-2xl">
          Upload an image and instantly generate a five-color palette with
          copy-ready values.
        </p>
      </section>

      <section className="rounded-3xl border border-brand-secondary/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:w-1/2">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-aura-text-primary">
                Extract a Color Palette
              </h2>
              <p className="text-aura-text-secondary">
                Upload an image and instantly generate a five-color palette with
                copy-ready values.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <button
                type="button"
                onClick={handleUploadClick}
                className="inline-flex items-center justify-center rounded-xl bg-aura-text-primary px-5 py-2.5 text-sm font-semibold text-white shadow-aura-sm hover:shadow-aura-md aura-transition hover:bg-aura-text-primary/90"
              >
                Choose Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-aura-text-secondary">
                <span>
                  {isProcessing
                    ? "processing image…"
                    : imagePreview
                      ? "palette ready"
                      : "waiting for image"}
                </span>
                {isProcessing && (
                  <span
                    className="h-2 w-2 animate-pulse rounded-full bg-brand-accent"
                    aria-hidden
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 lg:flex-row">
            <div className="flex-1 rounded-2xl border border-brand-secondary/40 bg-brand-secondary/10 p-3">
              <div className="flex h-full items-center justify-center overflow-hidden rounded-xl bg-brand-secondary/20">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Uploaded preview"
                    className="max-h-72 w-full object-contain"
                  />
                ) : (
                  <div className="flex h-48 w-full flex-col items-center justify-center gap-2 text-aura-text-secondary">
                    <span
                      className="text-4xl"
                      role="img"
                      aria-label="framed picture"
                    >
                      🖼️
                    </span>
                    <span className="text-sm">upload an image to begin</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-aura-text-secondary">
                extracted colors
              </h3>
              <div className="space-y-3">
                {(palette.length ? palette : placeholders).map(
                  (color, index) => {
                    const hex = color?.hex ?? "#------";
                    const rgb = color?.rgb ?? [0, 0, 0];
                    const rgbLabel = color
                      ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
                      : "rgb(--, --, --)";
                    const isPlaceholder = !color;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-2xl border border-brand-secondary/40 bg-white/60 p-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-12 w-12 rounded-xl border border-brand-secondary/50"
                            style={{
                              backgroundColor: isPlaceholder ? "#E5E7EB" : hex,
                            }}
                            aria-hidden
                          />
                          <div className="flex flex-col text-sm">
                            <span className="font-semibold text-aura-text-primary">
                              {hex}
                            </span>
                            <span className="text-aura-text-secondary">
                              {rgbLabel}
                            </span>
                          </div>
                        </div>
                        {!isPlaceholder && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(hex)}
                              className="rounded-lg border border-brand-secondary/40 px-3 py-1 text-xs font-medium text-aura-text-primary transition hover:border-brand-accent hover:text-brand-accent"
                            >
                              copy hex
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(rgbLabel)}
                              className="rounded-lg border border-brand-secondary/40 px-3 py-1 text-xs font-medium text-aura-text-primary transition hover:border-brand-accent hover:text-brand-accent"
                            >
                              copy rgb
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
              {copiedValue && (
                <p className="text-xs text-aura-text-secondary">
                  Copied {copiedValue} to your clipboard.
                </p>
              )}
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </section>

      {/* Design Gallery */}
      <DesignGallery
        title="Color Palette History"
        fetchEndpoint="/api/color-palettes"
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onLoad={(item: ColorPalette) => {
          loadHistoricalPalette(item);
          setIsGalleryOpen(false);
        }}
        deleteEndpoint="/api/color-palettes"
        emptyMessage="No palettes found. Upload an image to get started."
        sortOptions={sortOptions}
        renderPreview={(item: ColorPalette) => {
          const parsedPalette: ExtractedColor[] = JSON.parse(item.palette_json);
          return (
            <div className="flex flex-col gap-6 h-full">
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <img
                  src={item.image_data_url}
                  alt={item.file_name}
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Extracted Colors
                </h3>
                <div className="space-y-3">
                  {parsedPalette.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg"
                    >
                      <div
                        className="w-12 h-12 rounded border border-slate-700"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="flex-1">
                        <p className="text-white font-mono">{color.hex}</p>
                        <p className="text-slate-400 text-sm">
                          rgb({color.rgb[0]}, {color.rgb[1]}, {color.rgb[2]})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }}
        renderItem={(item: ColorPalette) => {
          const parsedPalette: ExtractedColor[] = JSON.parse(item.palette_json);
          return (
            <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors cursor-pointer group">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {item.file_name}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex-1 p-4">
                <div className="flex gap-1 h-16">
                  {parsedPalette.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex-1 rounded"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        }}
      />
    </Container>
  );
};

export default ColorPalettePage;
