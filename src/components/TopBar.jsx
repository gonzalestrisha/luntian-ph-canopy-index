import React from 'react';
import { CITY_PRESETS } from '../constants/presets';
import { Leaf, Navigation2 } from 'lucide-react';

export default function TopBar({ activePreset, currentLocation, onSelectPreset }) {
  const displayLocation = currentLocation?.name || 'Quezon City, Metro Manila';
  const displayCanopy = currentLocation?.leavesCanopy || '15.4%';

  return (
    <header className="top-bar absolute top-4 left-4 right-4 z-20 pointer-events-none">
      <div className="paper-panel pointer-events-auto grid grid-cols-1 xl:grid-cols-[minmax(270px,1fr)_auto]">
        <section className="top-bar-brand min-w-0 border-b xl:border-b-0 xl:border-r border-black/30 px-4 py-3 flex items-start justify-between gap-4">
          <div className="flex gap-3 min-w-0">
            <div className="w-9 h-9 bg-black text-white flex items-center justify-center shrink-0"><Leaf className="w-4 h-4" /></div>
            <div className="min-w-0">
              <div className="editorial-label text-zinc-500 mb-0.5">Urban canopy field journal · Issue 01</div>
              <h1 className="font-display text-3xl leading-none font-bold tracking-tight">LUNTIAN 2.5D</h1>
              <p className="text-[10px] leading-tight text-zinc-600 mt-1">Urban Green Massing &amp; Heat Resilience Index</p>
            </div>
          </div>
          <div className="top-bar-location border-l border-black/30 pl-3 shrink-0 text-right">
            <div className="editorial-label text-emerald-700">Active field note</div>
            <div className="text-xs font-semibold truncate max-w-[155px]">{displayLocation}</div>
            <div className="font-mono text-[10px] text-emerald-700">CANOPY {displayCanopy}</div>
          </div>
        </section>
        <nav className="px-2 py-2 flex gap-1 overflow-x-auto scrollbar-none items-center" aria-label="City presets">
          <span className="editorial-label text-zinc-500 px-2 hidden 2xl:flex items-center gap-1"><Navigation2 className="w-3 h-3" /> Sites</span>
          {CITY_PRESETS.map((preset, index) => {
            const isActive = activePreset?.id === preset.id;
            return (
              <button type="button" key={preset.id} onClick={() => onSelectPreset(preset)} aria-pressed={isActive} className={`min-w-max px-2.5 py-1.5 border text-left transition-colors ${isActive ? 'bg-black text-white border-black' : 'bg-transparent text-zinc-800 border-transparent hover:border-black'}`}>
                <span className="block editorial-label opacity-60">0{index + 1}</span>
                <span className="block text-[11px] font-semibold leading-tight">{preset.name}</span>
                <span className={`block font-mono text-[9px] ${isActive ? 'text-emerald-300' : 'text-emerald-700'}`}>{preset.leavesCanopy}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
