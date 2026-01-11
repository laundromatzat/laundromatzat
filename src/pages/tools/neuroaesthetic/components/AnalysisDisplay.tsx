import React, { useState, useRef } from "react";
import { AnalysisResult } from "../types";
import { SoundPlayer } from "./SoundPlayer";

interface AnalysisDisplayProps {
  imageSrcs: string[];
  analysis: AnalysisResult;
  onVisualize: () => void;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({
  imageSrcs,
  analysis,
  onVisualize,
}) => {
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Type-guard/color helper
  const getTypeColor = (type: string) => {
    switch (type) {
      case "affirmation":
        return "bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/30";
      case "critique":
        return "bg-rose-600 border-rose-500 text-white shadow-rose-500/30";
      case "suggestion":
        return "bg-amber-600 border-amber-500 text-white shadow-amber-500/30";
      default:
        return "bg-slate-600 border-slate-500";
    }
  };

  const getRingColor = (type: string) => {
    switch (type) {
      case "affirmation":
        return "ring-emerald-200";
      case "critique":
        return "ring-rose-200";
      case "suggestion":
        return "ring-amber-200";
      default:
        return "ring-gray-200";
    }
  };

  const getHoverRingColor = (type: string) => {
    switch (type) {
      case "affirmation":
        return "group-hover:ring-emerald-300/50";
      case "critique":
        return "group-hover:ring-rose-300/50";
      case "suggestion":
        return "group-hover:ring-amber-300/50";
      default:
        return "group-hover:ring-gray-300/50";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-80px)] overflow-hidden">
      {/* Image Area */}
      <div className="relative flex-1 bg-slate-900 flex flex-col p-4 lg:p-8 overflow-hidden">
        {/* Main Image Viewport */}
        <div className="flex-1 relative flex items-center justify-center min-h-0">
          <div
            ref={imageContainerRef}
            className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-visible transition-all duration-500 ease-out inline-block"
          >
            <img
              src={imageSrcs[currentImageIndex]}
              alt={`Analyzed Room View ${currentImageIndex + 1}`}
              className="block max-w-full max-h-[75vh] object-contain rounded-lg"
            />

            {/* Annotations - Only show on the first image for now as coordinate mapping is complex across multi-views */}
            {currentImageIndex === 0 &&
              (analysis.annotations || []).map((ann) => (
                <div
                  key={ann.id}
                  className="absolute"
                  style={{
                    left: `${ann.coordinates.x}%`,
                    top: `${ann.coordinates.y}%`,
                  }}
                >
                  {/* Ripple Effect Container */}
                  <div className="relative -ml-3 -mt-3 lg:-ml-4 lg:-mt-4 group">
                    {/* Animated Pulse Ring */}
                    <div
                      className={`absolute inset-0 rounded-full animate-ping opacity-75 w-6 h-6 lg:w-8 lg:h-8 ${
                        ann.type === "affirmation"
                          ? "bg-emerald-400"
                          : ann.type === "critique"
                            ? "bg-rose-400"
                            : "bg-amber-400"
                      }`}
                    ></div>

                    {/* Button with Hover Visuals */}
                    <button
                      onClick={() =>
                        setActiveAnnotation(
                          activeAnnotation === ann.id ? null : ann.id
                        )
                      }
                      className={`relative w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 shadow-lg transform transition-all duration-300 
                            hover:scale-110 group-hover:ring-4 ${getHoverRingColor(ann.type)}
                            focus:outline-none z-10 flex items-center justify-center 
                            ${getTypeColor(ann.type)} 
                            ${activeAnnotation === ann.id ? "scale-125 ring-4 " + getRingColor(ann.type) : ""}`}
                      aria-label={ann.label}
                    >
                      {activeAnnotation === ann.id ? (
                        <span className="text-xs font-bold">×</span>
                      ) : (
                        <span className="w-1.5 h-1.5 bg-white rounded-full opacity-90 group-hover:scale-150 transition-transform"></span>
                      )}
                    </button>

                    {/* Interactive Tooltip */}
                    {activeAnnotation === ann.id && (
                      <div
                        className="absolute z-50 w-72 bg-slate-800/95 backdrop-blur-md p-5 rounded-xl shadow-2xl border border-slate-700 text-left animate-fade-in-up mt-3"
                        style={{
                          transform: "translateX(-50%)",
                          left: "50%",
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAnnotation(null);
                          }}
                          className="absolute top-2 right-2 text-slate-400 hover:text-slate-200 rounded-full p-1 hover:bg-slate-700 transition-colors"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>

                        <div className="flex items-center gap-2 mb-2 pr-4">
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                              ann.type === "affirmation"
                                ? "bg-emerald-900/40 text-emerald-300"
                                : ann.type === "critique"
                                  ? "bg-rose-900/40 text-rose-300"
                                  : "bg-amber-900/40 text-amber-300"
                            }`}
                          >
                            {ann.type}
                          </span>
                        </div>

                        <h4 className="font-bold text-white mb-1 leading-tight text-lg">
                          {ann.label}
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed mb-3">
                          {ann.description}
                        </p>

                        <div className="pt-3 border-t border-slate-700 space-y-2">
                          <div className="flex items-start gap-2">
                            <svg
                              className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                            <div>
                              <span className="text-xs font-bold text-slate-200 block mb-0.5">
                                Principle: {ann.principle}
                              </span>
                              {ann.principleDescription && (
                                <p className="text-xs text-slate-400 italic leading-snug">
                                  {ann.principleDescription}
                                </p>
                              )}
                            </div>
                          </div>

                          <a
                            href={`https://www.google.com/search?q=neuroaesthetics+${encodeURIComponent(ann.principle)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors mt-1 group-link"
                          >
                            Learn more about {ann.principle}
                            <svg
                              className="w-3 h-3 ml-1 transition-transform group-link-hover:translate-x-0.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Thumbnail Gallery */}
        {imageSrcs.length > 1 && (
          <div className="mt-4 flex justify-center gap-2 overflow-x-auto py-2">
            {imageSrcs.map((src, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  currentImageIndex === idx
                    ? "border-emerald-500 scale-105 shadow-lg"
                    : "border-slate-600 opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={src}
                  alt={`Thumbnail ${idx}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Visualize Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={onVisualize}
            className="flex items-center gap-2 px-8 py-3 bg-white text-slate-900 rounded-full shadow-2xl hover:shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all font-medium border border-slate-200"
          >
            <svg
              className="w-5 h-5 text-emerald-400 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
            Visualize Improvements
          </button>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="w-full lg:w-96 bg-slate-800 border-l border-slate-700 overflow-y-auto custom-scrollbar">
        <div className="p-6 md:p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-serif text-white mb-2">
              Neuroaesthetic Report
            </h2>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 flex-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400"
                  style={{ width: `${analysis.neuroScore}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold text-slate-200">
                {analysis.neuroScore}/100
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-emerald-500 pl-4 py-1 italic bg-emerald-900/20 rounded-r">
              {analysis.overview}
            </p>
          </div>

          {/* Soundscape Section - NEW */}
          {analysis.soundscape && (
            <SoundPlayer soundscape={analysis.soundscape} />
          )}

          {/* Furniture & Layout Section */}
          {analysis.furnitureArrangement && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Furniture & Spatial Flow
              </h3>
              <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span className="font-serif font-bold text-slate-200 text-sm">
                    Prospect & Refuge
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3 italic">
                  {analysis.furnitureArrangement.currentLayout}
                </p>

                <div className="text-xs text-slate-200 font-medium mt-2">
                  Flow Assessment:
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  {analysis.furnitureArrangement.flowAssessment}
                </p>

                <div className="text-xs text-slate-200 font-medium">
                  Refuge Analysis:
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  {analysis.furnitureArrangement.prospectRefugeAnalysis}
                </p>

                <div className="text-xs text-slate-200 font-medium">
                  Layout Optimizations:
                </div>
                <ul className="list-disc list-inside text-xs text-slate-400 mt-1">
                  {analysis.furnitureArrangement.suggestions.map((s, i) => (
                    <li key={i} className="leading-5">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Texture & Haptics Section */}
          {analysis.texture && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Haptics & Materiality
              </h3>
              <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-800">
                <div className="flex items-center gap-2 mb-2">
                  {/* Fingerprint/Touch icon */}
                  <svg
                    className="w-4 h-4 text-stone-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.858.571-4.18M9.88 5.5a3 3 0 100 6 3 3 0 000-6z"
                    />
                  </svg>
                  <span className="font-serif font-bold text-stone-200 text-sm">
                    Haptic Perception
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {analysis.texture.currentMaterials.map((mat, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-stone-800 text-[10px] rounded-md text-stone-300"
                    >
                      {mat}
                    </span>
                  ))}
                </div>

                <p className="text-sm text-slate-300 mb-3">
                  {analysis.texture.hapticPerception}
                </p>

                <div className="text-xs text-stone-300 font-medium">
                  Tactile Improvements:
                </div>
                <ul className="list-disc list-inside text-xs text-slate-400 mt-1">
                  {analysis.texture.suggestions.map((s, i) => (
                    <li key={i} className="leading-5">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Fractal Fluency Section */}
          {analysis.fractalPatterns && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Fractal Fluency
              </h3>
              <div className="bg-emerald-900/20 p-4 rounded-lg border border-emerald-900/50">
                <div className="flex items-center gap-2 mb-2">
                  {/* Tree/Fractal icon */}
                  <svg
                    className="w-4 h-4 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  <span className="font-serif font-bold text-emerald-100 text-sm">
                    Pattern Complexity
                  </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">
                    Complexity Level:
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {analysis.fractalPatterns.complexityLevel}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-3 italic">
                  {analysis.fractalPatterns.presence}
                </p>

                <div className="text-xs text-emerald-300 font-medium">
                  Optimal D (1.3-1.5) Suggestions:
                </div>
                <ul className="list-disc list-inside text-xs text-slate-400 mt-1">
                  {analysis.fractalPatterns.suggestions.map((s, i) => (
                    <li key={i} className="leading-5">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Lighting Section */}
          {analysis.lighting && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lighting Ecology
              </h3>
              <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-4 h-4 text-amber-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="font-serif font-bold text-amber-100 text-sm">
                    Circadian Impact
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3 italic">
                  {analysis.lighting.condition}
                </p>
                <p className="text-sm text-slate-200 mb-3">
                  {analysis.lighting.circadianImpact}
                </p>
                <div className="text-xs text-amber-300 font-medium">
                  Optimization:
                </div>
                <ul className="list-disc list-inside text-xs text-slate-400 mt-1">
                  {analysis.lighting.suggestions.map((s, i) => (
                    <li key={i} className="leading-5">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Color Section */}
          {analysis.colorPalette && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Color Psychology
              </h3>
              <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                <div className="flex flex-wrap gap-2 mb-3">
                  {analysis.colorPalette.palette.map((color, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-slate-700 text-[10px] rounded-md text-slate-300 border border-slate-600"
                    >
                      {color}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-slate-300 mb-3">
                  {analysis.colorPalette.psychologicalImpact}
                </p>
                <div className="text-xs text-slate-500 font-medium">
                  Suggested Adjustment:
                </div>
                <ul className="list-disc list-inside text-xs text-slate-400 mt-1">
                  {analysis.colorPalette.suggestions.map((s, i) => (
                    <li key={i} className="leading-5">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dominant Principle
            </h3>
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-700">
              <span className="block font-serif text-lg text-white">
                {analysis.dominantPrinciple}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Missing Elements
            </h3>
            <ul className="space-y-2">
              {(analysis.missingElements || []).map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-slate-300"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Detailed Findings
            </h3>
            <div className="space-y-3">
              {(analysis.annotations || []).map((ann) => (
                <button
                  key={ann.id}
                  className={`w-full text-left p-4 rounded-lg border transition-all cursor-pointer ${
                    activeAnnotation === ann.id
                      ? "border-slate-500 bg-slate-700 shadow-md transform scale-[1.02]"
                      : "border-slate-700 hover:border-slate-500 hover:bg-slate-700/50"
                  }`}
                  onClick={() => setActiveAnnotation(ann.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ann.type === "affirmation"
                          ? "bg-emerald-500"
                          : ann.type === "critique"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                      }`}
                    ></span>
                    <h4 className="font-bold text-white text-sm">
                      {ann.label}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400">{ann.description}</p>
                  <div className="mt-2 text-[10px] text-slate-500 italic">
                    {ann.principle}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
