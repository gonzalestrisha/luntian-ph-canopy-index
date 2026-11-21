import React from 'react';
import { CITY_PRESETS } from '../constants/presets';
import { Leaf, Sparkles, Navigation2 } from 'lucide-react';

export default function TopBar({
  activePreset,
  currentLocation,
  onSelectPreset,
  elNinoSeverity
}) {
  const displayLocation = currentLocation?.name || 'Quezon City, Metro Manila';
  const displayCanopy = currentLocation?.leavesCanopy || '15.4%';

  return (
    <header className="absolute top-4 left-4 right-4 z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pointer-events-none">
      {/* Brand & Dynamic Location Badge */}
      <div className="glass-panel px-4 py-2.5 rounded-2xl pointer-events-auto flex items-center justify-between gap-4 shadow-lg border border-white/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-slate-900">
                LUNTIAN <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-semibold">2.5D</span>
              </h1>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">v1.2</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Urban Green Massing & Heat Resilience
            </p>
          </div>
        </div>

        {/* Dynamic Location & Leaves.PH Canopy Tag */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-900 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
          <div>
            <span className="text-[9px] uppercase font-mono text-emerald-600 block leading-tight font-bold truncate max-w-[170px]">
              {displayLocation}
            </span>
            <span className="font-semibold text-xs text-slate-800">
              Sentinel-2: <strong className="text-emerald-700">{displayCanopy}</strong> canopy
            </span>
          </div>
        </div>
      </div>

      {/* Preset Quick-Jumps (unselects automatically when moved away) */}
      <div className="glass-panel p-1.5 rounded-2xl pointer-events-auto flex items-center gap-1.5 overflow-x-auto shadow-lg border border-white/60 scrollbar-none">
        <div className="text-[11px] font-mono font-semibold text-slate-400 uppercase px-2 hidden xl:flex items-center gap-1">
          <Navigation2 className="w-3 h-3 text-slate-400 rotate-45" /> Presets:
        </div>
        {CITY_PRESETS.map((preset) => {
          const isActive = activePreset?.id === preset.id;
          return (
            <button
              type="button"
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <span>{preset.name}</span>
              <span
                className={`text-[10px] font-mono px-1 rounded ${
                  isActive ? 'bg-slate-800 text-emerald-300' : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {preset.leavesCanopy}
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
