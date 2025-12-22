import React, { useEffect, useRef } from "react";
import { useLoading } from "../context/LoadingContext";
import { LuminousSpinner } from "./ui/LuminousSpinner";

export const GlobalLoadingCursor: React.FC = () => {
  const { isLoading } = useLoading();
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading) {
      document.body.style.cursor = "";
      return;
    }

    document.body.style.cursor = "none";

    const updatePosition = (e: MouseEvent) => {
      if (cursorRef.current) {
        // Translate X/Y to move the div.
        // Note: The div has negative margins to center it on the cursor point.
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };

    window.addEventListener("mousemove", updatePosition);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      document.body.style.cursor = "";
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div
      ref={cursorRef}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        pointerEvents: "none",
        zIndex: 9999,
        marginTop: -32, // Center the 64px spinner
        marginLeft: -32,
      }}
    >
      <LuminousSpinner size={64} />
    </div>
  );
};
