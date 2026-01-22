import React, { useState, useEffect } from "react";
import { AuraButton } from "@/components/aura";

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageTitle: string;
  images?: { stage: string; svg: string }[];
  currentIndex?: number;
  onNavigate?: (direction: "prev" | "next") => void;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageTitle,
  images,
  currentIndex = 0,
  onNavigate,
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom and position when modal opens or image changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (onNavigate && images && currentIndex > 0) {
            onNavigate("prev");
          }
          break;
        case "ArrowRight":
          if (onNavigate && images && currentIndex < images.length - 1) {
            onNavigate("next");
          }
          break;
        case "+":
        case "=":
          e.preventDefault();
          handleZoomIn();
          break;
        case "-":
        case "_":
          e.preventDefault();
          handleZoomOut();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onNavigate, images, currentIndex]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    const blob = new Blob([imageSrc], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${imageTitle.replace(/\s+/g, "_")}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="relative w-full h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-aura-surface/90 backdrop-blur-md border-b border-aura-border">
          <h3 className="text-xl font-bold text-aura-text-primary">
            {imageTitle}
          </h3>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 border-r border-aura-border pr-4">
              <AuraButton
                variant="secondary"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                -
              </AuraButton>
              <span className="text-aura-text-secondary min-w-[4rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <AuraButton
                variant="secondary"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                +
              </AuraButton>
            </div>

            {/* Download Button */}
            <AuraButton variant="secondary" size="sm" onClick={handleDownload}>
              Download
            </AuraButton>

            {/* Close Button */}
            <AuraButton variant="danger" size="sm" onClick={onClose}>
              ✕
            </AuraButton>
          </div>
        </div>

        {/* Image Container */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden p-8 bg-aura-bg"
          style={{
            cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="transition-transform"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            }}
            dangerouslySetInnerHTML={{ __html: imageSrc }}
          />
        </div>

        {/* Navigation Arrows */}
        {images && images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-aura-surface/90 backdrop-blur-md hover:bg-aura-surface-elevated p-4 rounded-full shadow-aura-lg transition-all"
                onClick={() => onNavigate?.("prev")}
              >
                <svg
                  className="w-6 h-6 text-aura-text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            {currentIndex < images.length - 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-aura-surface/90 backdrop-blur-md hover:bg-aura-surface-elevated p-4 rounded-full shadow-aura-lg transition-all"
                onClick={() => onNavigate?.("next")}
              >
                <svg
                  className="w-6 h-6 text-aura-text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </>
        )}

        {/* Image Counter */}
        {images && images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-aura-surface/90 backdrop-blur-md px-4 py-2 rounded-full text-aura-text-secondary">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageZoomModal;
