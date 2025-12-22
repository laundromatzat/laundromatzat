import React, { useEffect, useRef } from "react";

interface LuminousSpinnerProps {
  size?: number;
  className?: string;
}

export const LuminousSpinner: React.FC<LuminousSpinnerProps> = ({
  size = 64,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const scale = size / 400;

    const render = (time: number) => {
      const t = time * 0.001;

      // Clear
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.scale(scale, scale);

      // Theme colors
      // Primary (Dark): #2C2A26
      // Accent (Beige): #D6D1C7
      const colorPrimary = "#2C2A26";
      const colorAccent = "#D6D1C7";

      for (let i = 0; i < 6; i++) {
        ctx.save();
        const angleOffset = i * ((Math.PI * 2) / 6);
        const wave = Math.sin(t * 2 + i * 0.8);
        const dynamicSize = 140 + wave * 40;

        ctx.rotate(t + angleOffset);

        // Settings for the "Lobe" arc
        ctx.lineWidth = 25;
        ctx.lineCap = "round";
        ctx.strokeStyle = colorPrimary;

        // Concentric lobed arcs creating a thick floral-mechanical silhouette
        // arcSpan = HALF_PI + (normalized wave) * PI
        const arcSpan = Math.PI / 2 + (wave * 0.5 + 0.5) * Math.PI;

        ctx.beginPath();
        // arc(x, y, radius, startAngle, endAngle)
        ctx.arc(0, 0, dynamicSize, 0, arcSpan);
        ctx.stroke();

        // Bold terminal caps (Circles at the end of the arc)
        ctx.save();
        ctx.rotate(arcSpan);
        ctx.translate(dynamicSize, 0);
        ctx.fillStyle = colorAccent;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2); // 40 diameter = 20 radius
        ctx.fill();
        ctx.restore();

        ctx.restore();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render(performance.now());

    return () => cancelAnimationFrame(animationFrameId);
  }, [size]);

  return (
    <canvas ref={canvasRef} width={size} height={size} className={className} />
  );
};
