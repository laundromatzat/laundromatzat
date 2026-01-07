import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Unit, Point, MeasurementState } from '../types';

interface CutCalculatorProps {
  imageUrl: string;
  unit: Unit;
}

// --- Icons (Inline SVGs to avoid dependency issues) ---
const RulerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>
);
const MousePointerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
);
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
);
const MaximizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
);

// --- The Full Screen Workbench Modal ---

interface WorkbenchProps {
  imageUrl: string;
  unit: Unit;
  onClose: () => void;
}

const MeasurementWorkbench: React.FC<WorkbenchProps> = ({ imageUrl, unit, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // State
  const [mode, setMode] = useState<'calibrate' | 'measure'>('calibrate');
  const [physicalHeight, setPhysicalHeight] = useState<string>('6'); // Default 6
  const [measureState, setMeasureState] = useState<MeasurementState>({
    referenceHeightPhysical: 6,
    referenceLinePixels: null,
    pixelsPerUnit: null,
    measurements: []
  });

  // Interaction State
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);

  // Helper: Draw logic
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Saved Measurements
    measureState.measurements.forEach(m => {
      ctx.beginPath();
      ctx.moveTo(m.p1.x, m.p1.y);
      ctx.lineTo(m.p2.x, m.p2.y);
      ctx.strokeStyle = '#ef4444'; // Red-500
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw endpoints
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(m.p1.x, m.p1.y, 4, 0, Math.PI * 2);
      ctx.arc(m.p2.x, m.p2.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw Label
      const midX = (m.p1.x + m.p2.x) / 2;
      const midY = (m.p1.y + m.p2.y) / 2;
      const text = `${m.distanceUnits.toFixed(2)} ${unit === Unit.INCHES ? 'in' : 'mm'}`;
      
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.fillText(text, midX + 10, midY - 10);
      ctx.shadowBlur = 0;
    });

    // Draw Current Dragging Line
    if (isDrawing && startPoint && currentPoint) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.strokeStyle = mode === 'calibrate' ? '#3b82f6' : '#ef4444'; // Blue for cal, Red for measure
      ctx.lineWidth = 3;
      ctx.setLineDash(mode === 'calibrate' ? [5, 5] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      // Live label
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;
      const distPixels = Math.sqrt(dx * dx + dy * dy);
      
      let label = '';
      if (mode === 'calibrate') {
        label = 'Reference Line';
      } else if (measureState.pixelsPerUnit) {
        label = `${(distPixels / measureState.pixelsPerUnit).toFixed(2)} ${unit === Unit.INCHES ? 'in' : 'mm'}`;
      }

      if (label) {
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(label, currentPoint.x + 15, currentPoint.y + 15);
        ctx.shadowBlur = 0;
      }
    }
  }, [measureState.measurements, isDrawing, startPoint, currentPoint, mode, measureState.pixelsPerUnit, unit]);

  // Handle resizing and initial load
  const handleImageLoad = () => {
    if (containerRef.current && canvasRef.current && imageRef.current) {
      const { width, height } = imageRef.current.getBoundingClientRect();
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      drawCanvas();
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleImageLoad);
    return () => window.removeEventListener('resize', handleImageLoad);
  }, []); // eslint-disable-line

  useEffect(() => {
    // Redraw whenever state changes
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
      // Update reference height logic if input changes
      const num = parseFloat(physicalHeight);
      if (!isNaN(num) && num > 0) {
          setMeasureState(prev => ({
              ...prev,
              referenceHeightPhysical: num,
              pixelsPerUnit: prev.referenceLinePixels ? prev.referenceLinePixels / num : null
          }));
      }
  }, [physicalHeight]);

  // --- Input Handlers ---

  const getCanvasPoint = (e: React.MouseEvent): Point | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pt = getCanvasPoint(e);
    if (pt) {
      setIsDrawing(true);
      setStartPoint(pt);
      setCurrentPoint(pt);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing) {
      const pt = getCanvasPoint(e);
      if (pt) setCurrentPoint(pt);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && startPoint && currentPoint) {
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;
      const distPixels = Math.sqrt(dx * dx + dy * dy);

      // Only register if line is long enough (prevents accidental clicks)
      if (distPixels > 5) {
        if (mode === 'calibrate') {
          // Set calibration
          setMeasureState(prev => ({
            ...prev,
            referenceLinePixels: distPixels,
            pixelsPerUnit: distPixels / prev.referenceHeightPhysical
          }));
          // Auto switch to measure mode for flow
          setMode('measure');
        } else {
          // Add measurement
          if (measureState.pixelsPerUnit) {
            const distUnits = distPixels / measureState.pixelsPerUnit;
            setMeasureState(prev => ({
              ...prev,
              measurements: [
                ...prev.measurements,
                {
                  id: Date.now().toString(),
                  p1: startPoint,
                  p2: currentPoint,
                  distanceUnits: distUnits
                }
              ]
            }));
          }
        }
      }
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-sage-900 flex flex-col animate-fade-in">
      {/* Workbench Header */}
      <div className="bg-sage-800 p-4 shadow-md flex flex-col md:flex-row justify-between items-center z-50 gap-4 border-b border-sage-700">
        <div className="flex items-center gap-6">
          <h2 className="text-white font-sans text-xl font-bold tracking-tight">Workbench</h2>
          
          <div className="hidden md:block h-8 w-px bg-sage-600"></div>
          
          {/* Controls */}
          <div className="flex gap-2 bg-sage-900/50 p-1 rounded-lg">
            <button 
              onClick={() => setMode('calibrate')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${
                mode === 'calibrate' ? 'bg-blue-600 text-white shadow-lg' : 'text-sage-300 hover:bg-sage-700 hover:text-white'
              }`}
            >
              <RulerIcon />
              <span>1. Calibrate</span>
            </button>
            <button 
              onClick={() => setMode('measure')}
              disabled={!measureState.pixelsPerUnit}
              title={!measureState.pixelsPerUnit ? "Please calibrate first" : "Step 2: Draw lines to measure distances"}
              className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${
                mode === 'measure' ? 'bg-red-600 text-white shadow-lg' : 'text-sage-300 hover:bg-sage-700 hover:text-white'
              } ${!measureState.pixelsPerUnit ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <MousePointerIcon />
              <span>2. Measure</span>
            </button>
            <button
               onClick={() => setMeasureState(prev => ({...prev, measurements: []}))}
               title="Clear all measurement lines"
               className="px-3 py-2 text-sage-300 rounded-md hover:bg-sage-700 hover:text-white border-l border-sage-700 ml-2"
            >
              <RefreshIcon />
            </button>
          </div>
        </div>

        {/* Height Input & Close */}
        <div className="flex items-center gap-3">
          <label className="text-sage-400 text-sm font-medium">Real Block Height:</label>
          <div className="relative group">
            <input 
              type="number" 
              value={physicalHeight}
              onChange={(e) => setPhysicalHeight(e.target.value)}
              className="w-24 bg-sage-900 border border-sage-600 text-white rounded-lg px-3 py-2 text-right pr-8 focus:border-timber-500 focus:ring-1 focus:ring-timber-500 outline-none transition-all font-mono"
            />
            <span className="absolute right-3 top-2.5 text-sage-500 text-sm font-bold">{unit === Unit.INCHES ? 'in' : 'mm'}</span>
          </div>
          
          <button 
            onClick={onClose}
            className="ml-6 p-2 bg-sage-700 hover:bg-sage-600 text-white rounded-full transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Helper Banner */}
      <div className={`text-center py-2 text-sm font-medium transition-colors ${mode === 'calibrate' ? 'bg-blue-900/50 text-blue-200' : 'bg-red-900/50 text-red-200'}`}>
        {mode === 'calibrate' 
          ? `Draw a line along the full vertical height of the block to define "${physicalHeight} ${unit === Unit.INCHES ? 'in' : 'mm'}".`
          : "Click and drag between any two points to measure the real-world distance."}
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8 cursor-crosshair relative bg-black/20 backdrop-blur-sm">
        <div 
          ref={containerRef} 
          className="relative shadow-2xl rounded-sm overflow-hidden border border-sage-700/50"
          style={{ maxWidth: '95%', maxHeight: '85vh' }}
        >
          <img 
            ref={imageRef}
            src={imageUrl} 
            alt="Blueprint for measurement"
            className="block max-w-full max-h-[80vh] select-none pointer-events-none"
            onLoad={handleImageLoad}
          />
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="absolute inset-0 touch-none"
          />
        </div>
      </div>
    </div>
  );
};

// --- Main Card Component ---

const CutCalculator: React.FC<CutCalculatorProps> = ({ imageUrl, unit }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Card View */}
      <div className="mt-4 flex flex-col md:flex-row gap-8 items-center justify-between">
        <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-sage-200 shadow-sm max-w-md" onClick={() => setIsOpen(true)}>
            <img src={imageUrl} alt="Schematic" className="w-full h-auto object-contain bg-white" />
            <div className="absolute inset-0 bg-sage-900/0 group-hover:bg-sage-900/40 transition-all flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur text-sage-900 px-4 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all font-medium flex items-center gap-2">
                    <MaximizeIcon /> Open Workbench
                </div>
            </div>
        </div>
        
        <div className="flex-1 space-y-4 max-w-md">
            <h4 className="text-xl font-bold text-sage-800">Precision Measurement</h4>
            <p className="text-sage-600">
                Open the interactive workbench to calibrate your design against your real-world wood block. 
                You can draw multiple cut lines to get exact dimensions for every stage of your carving.
            </p>
            <button 
                onClick={() => setIsOpen(true)}
                className="w-full py-3 bg-timber-600 hover:bg-timber-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
                <MaximizeIcon />
                <span>Launch Cut Calculator</span>
            </button>
        </div>
      </div>

      {/* Full Screen Modal */}
      {isOpen && (
        <MeasurementWorkbench imageUrl={imageUrl} unit={unit} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default CutCalculator;