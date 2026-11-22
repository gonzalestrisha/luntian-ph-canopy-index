import React from 'react';
import { Plus, Minus, Compass, Box, RotateCcw } from 'lucide-react';

export default function ZoomControls({ zoom, pitch, bearing, onZoomIn, onZoomOut, onZoomSliderChange, onResetZoom, onTogglePitch, onResetBearing }) {
  const currentZoom = typeof zoom === 'number' ? zoom : 15.5;
  const is3D = pitch > 15;
  const zoomPercentage = Math.round(100 + (currentZoom - 15.5) * 20);
  const controlButton = 'w-8 h-8 border-b border-black/25 hover:bg-black hover:text-white flex items-center justify-center transition-colors';

  return (
    <div className="zoom-controls absolute bottom-5 left-5 z-20 pointer-events-auto flex flex-col gap-2">
      <div className="paper-panel w-10 flex flex-col items-center">
        <button type="button" onClick={onZoomIn} title="Zoom in" aria-label="Zoom in" className={controlButton}><Plus className="w-4 h-4" /></button>
        <div className="h-28 flex items-center justify-center border-b border-black/25">
          <input aria-label="Map zoom" type="range" min="13" max="18" step="0.1" value={currentZoom} onChange={(e) => onZoomSliderChange(parseFloat(e.target.value))} className="w-24 -rotate-90 accent-black cursor-pointer h-1 appearance-none" title={`Zoom: ${zoomPercentage}%`} />
        </div>
        <button type="button" onClick={onZoomOut} title="Zoom out" aria-label="Zoom out" className={controlButton}><Minus className="w-4 h-4" /></button>
        <button type="button" onClick={onResetZoom} title="Reset zoom" aria-label="Reset zoom" className={controlButton}><RotateCcw className="w-3.5 h-3.5" /></button>
        <div className="w-full py-1 text-center font-mono text-[9px] font-medium">{zoomPercentage}%</div>
      </div>
      <div className="paper-panel flex">
        <button type="button" onClick={onTogglePitch} aria-pressed={is3D} title={is3D ? 'Switch to 2D plan view' : 'Switch to 2.5D perspective'} className={`px-2 py-1.5 font-mono text-[10px] font-bold border-r border-black/30 flex items-center gap-1 ${is3D ? 'bg-black text-white' : ''}`}><Box className="w-3 h-3" />{is3D ? '2.5D' : '2D'}</button>
        <button type="button" onClick={onResetBearing} title="Reset camera north" aria-label="Reset camera north" className="w-8 hover:bg-black hover:text-white flex items-center justify-center transition-colors"><Compass className="w-3.5 h-3.5" style={{ transform: `rotate(${-bearing}deg)` }} /></button>
      </div>
    </div>
  );
}
