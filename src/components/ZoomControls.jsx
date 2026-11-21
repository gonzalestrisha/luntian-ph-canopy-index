import React from 'react';
import { Plus, Minus, Compass, Box, RotateCcw } from 'lucide-react';

export default function ZoomControls({
  zoom,
  pitch,
  bearing,
  onZoomIn,
  onZoomOut,
  onZoomSliderChange,
  onResetZoom,
  onTogglePitch,
  onResetBearing
}) {
  const currentZoom = typeof zoom === 'number' ? zoom : 15.5;
  const is3D = pitch > 15;

  // Percentage relative to baseline 15.5 (100%)
  const zoomPercentage = Math.round(100 + (currentZoom - 15.5) * 20);

  return (
    <div className="absolute bottom-6 left-6 z-20 pointer-events-auto flex flex-col items-center gap-1.5">
      {/* Compact Zoom Pill (Subtle border, light glass, no heavy backgrounds) */}
      <div className="p-1.5 rounded-2xl bg-white/80 backdrop-blur-md shadow-md border border-slate-300/80 flex flex-col items-center gap-1.5">
        {/* Zoom In Button */}
        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In"
          aria-label="Zoom In"
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 active:scale-95 text-slate-700 flex items-center justify-center transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* Compact Vertical Slider */}
        <div className="h-24 flex flex-col items-center justify-center py-0.5">
          <input
            type="range"
            min="13"
            max="18"
            step="0.1"
            value={currentZoom}
            onChange={(e) => onZoomSliderChange(parseFloat(e.target.value))}
            className="w-20 -rotate-90 origin-center accent-slate-900 cursor-pointer h-1 bg-slate-300/80 rounded-lg appearance-none"
            title={`Zoom: ${zoomPercentage}%`}
          />
        </div>

        {/* Zoom Out Button */}
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="w-7 h-7 rounded-lg hover:bg-slate-200/70 active:scale-95 text-slate-700 flex items-center justify-center transition-all"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Reset Zoom to 100% (Icon-only) */}
        <button
          type="button"
          onClick={onResetZoom}
          title="Reset zoom to 100%"
          aria-label="Reset zoom to 100%"
          className="p-1 rounded-md hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        {/* Zoom Readout */}
        <div className="text-[9px] font-mono font-bold text-slate-700 px-1 py-0.5 rounded bg-slate-100">
          {zoomPercentage}%
        </div>
      </div>

      {/* Compact Camera Controls */}
      <div className="p-1 rounded-xl bg-white/80 backdrop-blur-md shadow-md border border-slate-300/80 flex items-center gap-1">
        <button
          type="button"
          onClick={onTogglePitch}
          title={is3D ? "Switch to 2D Plan View" : "Switch to 2.5D Perspective"}
          className={`px-1.5 py-1 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
            is3D ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200/60'
          }`}
        >
          <Box className="w-3 h-3" />
          <span>{is3D ? '2.5D' : '2D'}</span>
        </button>

        <button
          type="button"
          onClick={onResetBearing}
          title="Reset Camera North"
          className="p-1 rounded-md text-slate-700 hover:bg-slate-200/60 transition-all"
        >
          <Compass
            className="w-3.5 h-3.5 text-emerald-600 transition-transform duration-200"
            style={{ transform: `rotate(${-bearing}deg)` }}
          />
        </button>
      </div>
    </div>
  );
}
