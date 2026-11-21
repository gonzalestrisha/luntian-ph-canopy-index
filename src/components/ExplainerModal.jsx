import React from 'react';
import { X, ExternalLink, BookOpen, Scale, Trees, Layers } from 'lucide-react';

export default function ExplainerModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="glass-panel-dark text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/20 flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">How to Read LUNTIAN 2.5D</h2>
              <p className="text-xs text-slate-400">Urban Green Massing & Heat Resilience Index</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Concise Concept Cards */}
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> 1. The 600m × 600m Ground Reticle
            </span>
            <p>
              A standardized <strong>36-hectare (360,000 m²)</strong> urban block sample centered at the camera. Click anywhere on the map to jump and inspect that neighborhood.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
            <span className="font-bold text-teal-400 flex items-center gap-1.5">
              <Trees className="w-4 h-4" /> 2. Green Ground (m²) vs Built Concrete (m³)
            </span>
            <p>
              Vivid emerald planes mark permeable vegetative ground. Matte white 2.5D extrusions represent concrete volume trapping solar radiation (Urban Heat Island effect).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4" /> 3. Resilience Scale (0.0 – 10.0)
            </span>
            <p>
              A composite microclimate rating from <strong>0.0 (Critical heat vulnerability)</strong> to <strong>10.0 (Resilient oasis)</strong>, factoring in canopy volume, concrete density, and drought stress.
            </p>
          </div>
        </div>

        {/* Linked Legal & Scientific References */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Authoritative References:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <a
              href="https://lawphil.net/statutes/presdecs/pd1977/pd_1216_1977.html"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-slate-200 hover:text-emerald-300 transition-colors"
            >
              <span><strong>PD 1216:</strong> PH Open Space Law</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>

            <a
              href="https://www.who.int/europe/publications/i/item/WHO-EURO-2016-3351-43110-60341"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-slate-200 hover:text-emerald-300 transition-colors"
            >
              <span><strong>WHO:</strong> 9 m²/Capita Urban Target</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>

            <a
              href="https://github.com/xmpuspus/leaves-ph"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-slate-200 hover:text-emerald-300 transition-colors"
            >
              <span><strong>Leaves.PH:</strong> Sentinel-2 NCR 2026</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>

            <a
              href="https://www.nparks.gov.sg/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-slate-200 hover:text-emerald-300 transition-colors"
            >
              <span><strong>Singapore:</strong> City in a Garden (30%)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
