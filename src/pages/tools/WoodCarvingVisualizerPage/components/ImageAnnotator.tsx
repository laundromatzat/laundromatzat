import React, { useRef, useState, useEffect } from "react";
import { Check, RotateCcw } from "lucide-react";

interface ImageAnnotatorProps {
  imageUrl: string;
  onSave: (annotatedImageBase64: string) => void;
  onCancel: () => void;
  className?: string;
  isSaving?: boolean;
}

export const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({
  imageUrl,
  onSave,
  onCancel,
  className,
  isSaving,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ef4444"); // Default red for markup
  const lineWidth = 3;

  // Initialize canvas size to match image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = new Image();
    image.src = imageUrl;
    image.crossOrigin = "anonymous";
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(image, 0, 0);
      }
    };
  }, [imageUrl]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    if (canvasRef.current) {
      // Send the full data URL
      onSave(canvasRef.current.toDataURL("image/jpeg"));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = new Image();
    img.src = imageUrl;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (canvas && ctx) ctx.drawImage(img, 0, 0);
    };
  };

  return (
    <div
      className={`flex flex-col gap-2 h-full ${className}`}
      ref={containerRef}
    >
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-2 bg-black/60 p-2 rounded-lg backdrop-blur-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setColor("#ef4444")}
            className={`w-6 h-6 rounded-full border-2 ${color === "#ef4444" ? "border-white ring-2 ring-red-500" : "border-transparent"}`}
            style={{ backgroundColor: "#ef4444" }}
            title="Red Marker"
          />
          <button
            onClick={() => setColor("#22c55e")}
            className={`w-6 h-6 rounded-full border-2 ${color === "#22c55e" ? "border-white ring-2 ring-green-500" : "border-transparent"}`}
            style={{ backgroundColor: "#22c55e" }}
            title="Green Marker"
          />
          <button
            onClick={() => setColor("#3b82f6")}
            className={`w-6 h-6 rounded-full border-2 ${color === "#3b82f6" ? "border-white ring-2 ring-blue-500" : "border-transparent"}`}
            style={{ backgroundColor: "#3b82f6" }}
            title="Blue Marker"
          />
        </div>

        <button
          onClick={handleClear}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Clear Markup"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 min-h-0 bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-700">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end mt-2">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-zinc-400 hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-brand-accent hover:bg-brand-accent-light text-white rounded-lg font-medium shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            "Updating..."
          ) : (
            <>
              <Check className="w-4 h-4" /> Update Design
            </>
          )}
        </button>
      </div>
    </div>
  );
};
