import React, { useState } from "react";

interface ComparisonViewProps {
  originalImage: string;
  improvedImage: string;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRegenerate: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  originalImage,
  improvedImage,
  onReset,
  onUndo,
  onRedo,
  onRegenerate,
  canUndo,
  canRedo,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  // Touch support
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isResizing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <h2 className="text-xl font-serif font-semibold text-white">
          Neuroaesthetic Visualization
        </h2>
        <button
          onClick={onReset}
          className="text-sm text-slate-400 hover:text-white font-medium transition-colors"
        >
          Analyze Another Photo
        </button>
      </div>

      {/* Comparison Area */}
      <div className="flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-5xl aspect-[4/3] max-h-[75vh] shadow-2xl rounded-lg overflow-hidden select-none cursor-ew-resize group outline-none"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          role="slider"
          aria-label="Before/After comparison slider"
          aria-valuenow={sliderPosition}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft")
              setSliderPosition(Math.max(0, sliderPosition - 5));
            if (e.key === "ArrowRight")
              setSliderPosition(Math.min(100, sliderPosition + 5));
          }}
        >
          {/* Modified Image (Bottom Layer) */}
          <img
            src={`data:image/jpeg;base64,${improvedImage}`}
            alt="Neuroaesthetic Enhanced"
            className="absolute top-0 left-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* Original Image (Top Layer - Clipped) */}
          <div
            className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-white/50 bg-gray-200"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={originalImage}
              alt="Original Space"
              className="absolute top-0 left-0 max-w-none h-full w-auto object-cover"
              style={{ width: `${100 / (sliderPosition / 100)}%` }} // Counter-scale to keep image fixed
              draggable={false}
            />
          </div>

          {/* Slider Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center transition-opacity opacity-70 group-hover:opacity-100"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center -ml-3.5">
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                  transform="rotate(90 12 12)"
                />
              </svg>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider pointer-events-none">
            ORIGINAL
          </div>
          <div className="absolute top-4 right-4 bg-emerald-600/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider pointer-events-none">
            ENHANCED
          </div>
        </div>
      </div>

      {/* Control Footer */}
      <div className="px-6 py-4 bg-slate-900 border-t border-slate-700 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-full hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-400"
            title="Undo"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-full hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-400"
            title="Redo"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
              />
            </svg>
          </button>
          <span className="text-xs text-gray-400 font-medium ml-2">
            History
          </span>
        </div>

        <p className="text-slate-500 text-sm hidden md:block">
          We&apos;ve applied neuroaesthetic principles to soften geometry and
          optimize flow.
        </p>

        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Regenerate
        </button>
      </div>
    </div>
  );
};
