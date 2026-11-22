import React from 'react';
import { X, ExternalLink, BookOpen, Scale, Trees, Layers } from 'lucide-react';

const sections = [
  [Layers, '01 · The 600m × 600m Ground Reticle', 'A standard 36-hectare urban sample centred at the camera. Click the map to inspect a new neighbourhood.'],
  [Trees, '02 · Green Ground vs Built Concrete', 'Emerald planes represent vegetative ground; white extrusions represent concrete volume and heat-trapping mass.'],
  [Scale, '03 · Resilience Scale', 'A 0.0–10.0 microclimate rating based on canopy volume, concrete density, and drought stress.']
];

const references = [
  ['PD 1216', 'PH Open Space Law', 'https://lawphil.net/statutes/presdecs/pd1977/pd_1216_1977.html'],
  ['WHO', '9 m² / capita target', 'https://www.who.int/europe/publications/i/item/WHO-EURO-2016-3351-43110-60341'],
  ['Leaves.PH', 'Sentinel-2 NCR data', 'https://github.com/xmpuspus/leaves-ph'],
  ['Singapore', 'City in a Garden', 'https://www.nparks.gov.sg/']
];

export default function ExplainerModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55" onClick={onClose}>
      <article className="glass-panel-dark paper-grid max-w-2xl w-full p-5 md:p-7 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <header className="border-b-2 border-black pb-4 flex justify-between gap-4">
          <div className="flex gap-3"><div className="w-10 h-10 bg-black text-white flex items-center justify-center"><BookOpen className="w-5 h-5" /></div><div><div className="editorial-label text-emerald-700">Reader’s guide · Luntian 2.5D</div><h2 className="font-display text-3xl font-bold leading-none">How to Read LUNTIAN 2.5D</h2></div></div>
          <button type="button" onClick={onClose} className="paper-button w-8 h-8 flex items-center justify-center" aria-label="Close guide"><X className="w-4 h-4" /></button>
        </header>
        <div className="grid md:grid-cols-3 border-l border-t border-black/40 mt-5">
          {sections.map(([Icon, title, copy]) => <section key={title} className="bg-[#FDFCFA]/90 border-r border-b border-black/40 p-4"><Icon className="w-4 h-4 text-emerald-700 mb-6" /><h3 className="font-display text-xl font-bold leading-none mb-2">{title}</h3><p className="text-[11px] leading-relaxed text-zinc-700">{copy}</p></section>)}
        </div>
        <footer className="mt-5 border-t border-black/40 pt-3">
          <div className="editorial-label mb-2">Sources and standards</div>
          <div className="grid sm:grid-cols-2 border-l border-t border-black/40">
            {references.map(([source, description, href]) => <a key={source} href={href} target="_blank" rel="noopener noreferrer" className="bg-[#FDFCFA]/90 border-r border-b border-black/40 p-3 hover:bg-black hover:text-white transition-colors flex justify-between items-center"><span className="text-[11px]"><strong>{source}:</strong> {description}</span><ExternalLink className="w-3.5 h-3.5 shrink-0" /></a>)}
          </div>
        </footer>
      </article>
    </div>
  );
}
