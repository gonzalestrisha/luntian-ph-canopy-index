import React, { useState } from 'react';
import { POLICY_THRESHOLDS, RESILIENCE_TIERS } from '../constants/policy';
import { formatNumber } from '../utils/color';
import { Flame, Building2, Trees, Layers, PlusCircle, RotateCcw, RefreshCw, HelpCircle, Scale, MapPin } from 'lucide-react';

function PolicyRow({ name, current, target, suffix = '%', passed }) {
  const progress = Math.min(100, (Number(current) / Number(target)) * 100);
  return (
    <div className="border-t border-black/25 py-2">
      <div className="flex items-baseline justify-between gap-3 text-[11px]"><span className="font-semibold">{name}</span><span className="font-mono shrink-0"><strong>{current}</strong>{suffix} / {target}{suffix}</span></div>
      <div className="h-1.5 bg-zinc-200 mt-1.5 relative"><div className={passed ? 'h-full bg-emerald-600' : 'h-full bg-black'} style={{ width: `${progress}%` }} /></div>
      <div className={`editorial-label mt-1 ${passed ? 'text-emerald-700' : 'text-zinc-500'}`}>{passed ? 'Target met' : 'Target gap'}</div>
    </div>
  );
}

export default function TelemetryPanel({ currentLocation, metrics, elNinoSeverity, onElNinoChange, isPocketParkToolActive, onTogglePocketParkTool, onClearCustomParks, onRefreshMetrics, onOpenExplainer, mapStatus = 'ready', parkCount, sheetOpen = true, onToggleSheet, onRetry }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { greenArea = 0, greenPercent = 0, builtVolume = 0, nominalCanopyVolume = 0 } = metrics ?? {};
  const customParksCount = parkCount ?? metrics?.customParksCount ?? 0;
  const droughtFactor = 1 - (0.45 * elNinoSeverity);
  const effectiveCanopyVolume = Math.round((nominalCanopyVolume || (greenArea * 6)) * droughtFactor);
  const effectiveGreenPercent = Number((greenPercent * droughtFactor).toFixed(1));
  const ratioValue = effectiveCanopyVolume > 0 && builtVolume > 0 ? Number((builtVolume / effectiveCanopyVolume).toFixed(1)) : 0;
  const sqmPerCapita = Number((greenArea / POLICY_THRESHOLDS.ASSUMED_ZONE_POPULATION).toFixed(2));
  let rawScore = (effectiveGreenPercent / 30) * 10;
  if (ratioValue > 25) rawScore *= 0.85;
  if (ratioValue > 50) rawScore *= 0.7;
  const resilienceScore = Number(Math.min(10, Math.max(0, rawScore)).toFixed(1));
  let resilienceTier = RESILIENCE_TIERS.BUFFERED;
  if (resilienceScore < 3) resilienceTier = RESILIENCE_TIERS.CRITICAL;
  else if (resilienceScore < 5.5) resilienceTier = RESILIENCE_TIERS.VULNERABLE;
  else if (resilienceScore >= 8) resilienceTier = RESILIENCE_TIERS.RESILIENT;
  const assessmentTone = resilienceScore < 3
    ? 'text-red-600'
    : resilienceScore < 5.5
      ? 'text-orange-600'
      : resilienceScore < 8
        ? 'text-amber-600'
        : 'text-emerald-700';
  const scoreBarTone = resilienceScore < 3
    ? 'bg-red-600'
    : resilienceScore < 5.5
      ? 'bg-orange-500'
      : resilienceScore < 8
        ? 'bg-amber-400'
        : 'bg-emerald-600';

  const refresh = () => {
    setIsRefreshing(true);
    onRefreshMetrics?.();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const metricsGrid = [
    ['GREEN COVER', formatNumber(greenArea), 'm²', `${sqmPerCapita} m² / resident`, Trees, true],
    ['BUILT CONCRETE', formatNumber(builtVolume), 'm³', 'Extruded white massing', Building2, false],
    ['CANOPY COOLING', formatNumber(effectiveCanopyVolume), 'm³', elNinoSeverity ? `${Math.round(elNinoSeverity * 45)}% drought loss` : 'Full 6m tree depth', Layers, true],
    ['GREEN : BUILT', `1 : ${ratioValue || 0}`, '', 'Canopy m³ / concrete m³', Scale, false]
  ];

  return (
    <aside className={`telemetry-sheet absolute right-4 top-40 xl:top-[7.5rem] bottom-4 w-[21rem] md:w-[23rem] z-20 pointer-events-none flex flex-col ${sheetOpen ? 'sheet-open' : ''}`}>
      <div className="paper-panel paper-grid pointer-events-auto overflow-y-auto max-h-full scrollbar-none">
        <button type="button" className="sheet-toggle" aria-expanded={sheetOpen} aria-controls="telemetry-content" onClick={onToggleSheet}><span>Block index <small className="block font-normal mt-1">{isPocketParkToolActive ? 'Tap map or press Enter to plant' : mapStatus === 'ready' ? `${resilienceScore.toFixed(1)} / 10 resilience` : mapStatus === 'loading' ? 'Loading map data...' : 'Map data unavailable'}</small></span><span>{sheetOpen ? '-' : '+'}</span></button>
        <div id="telemetry-content" className="telemetry-content">
        {mapStatus !== 'ready' && <div className="p-4 border-b border-black" role="status">{mapStatus === 'loading' ? 'Loading map data for this block...' : 'Map data is unavailable.'} {mapStatus === 'unavailable' && <button type="button" className="underline font-semibold" onClick={onRetry}>Retry map</button>}</div>}
        <section className="p-4 border-b-2 border-black">
          <div className="flex justify-between gap-3">
            <div><div className="editorial-label text-emerald-700">Live inspection block</div><h2 className="font-display text-2xl font-bold leading-none mt-0.5">Block Green &amp; Heat Index</h2></div>
            <button type="button" onClick={refresh} className="paper-button w-8 h-8 flex items-center justify-center" title="Refresh active block" aria-label="Refresh"><RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /></button>
          </div>
          <div className="mt-3 flex items-center justify-between border-y border-black/30 py-2 gap-2">
            <div className="flex items-center gap-1.5 min-w-0"><MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" /><span className="text-xs font-semibold truncate">{currentLocation?.name || 'Quezon City, Metro Manila'}</span></div>
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenExplainer?.(); }} className="text-[10px] font-mono underline underline-offset-2 shrink-0 flex items-center gap-1"><HelpCircle className="w-3 h-3" /> How it works</button>
          </div>
          {mapStatus === 'ready' && <><div className="mt-3 grid grid-cols-[1fr_auto] gap-3 items-end">
            <div><div className="editorial-label">Resilience Score</div><div className="font-display text-5xl font-bold leading-[.8]">{resilienceScore.toFixed(1)}<span className="font-mono text-sm font-normal text-zinc-500"> / 10.0</span></div></div>
            <div className="text-right"><div className="editorial-label text-black">Assessment</div><div className={`text-xs font-semibold ${assessmentTone}`}>{resilienceTier.label}</div></div>
          </div>
          <div className="h-1.5 bg-zinc-200 mt-3 relative"><div className={`h-full ${scoreBarTone}`} style={{ width: `${resilienceScore * 10}%` }} /><span className="absolute -top-1.5 h-4 border-l-2 border-black" style={{ left: `${Math.min(98, Math.max(2, resilienceScore * 10))}%` }} /></div>
          <div className="flex justify-between font-mono text-[8px] text-zinc-500 mt-1"><span>CRITICAL 0</span><span>BUFFERED 5.5</span><span>RESILIENT 10</span></div></>}
        </section>

        {mapStatus === 'ready' && <><section className="grid grid-cols-2 border-l border-t border-black/30">
          {metricsGrid.map(([label, value, unit, note, Icon, isGreen]) => <div key={label} className="bg-[#FDFCFA]/90 border-r border-b border-black/30 p-3 min-h-[100px]"><div className={`editorial-label flex gap-1 items-center ${isGreen ? 'text-emerald-700' : 'text-zinc-600'}`}><Icon className="w-3 h-3" />{label}</div><div className={`font-display text-2xl font-bold leading-none mt-3 ${isGreen ? 'text-emerald-700' : 'text-zinc-900'}`}>{value} <span className="font-mono text-[10px] font-normal">{unit}</span></div><div className="text-[9px] text-zinc-500 mt-2">{note}</div></div>)}
        </section>

        <section className="p-4 border-b border-black/30 bg-[#FDFCFA]/90">
          <div className="flex justify-between items-end mb-1"><h3 className="font-display text-xl font-bold leading-none">POLICY LEDGER</h3><span className="editorial-label text-zinc-500">Target / block</span></div>
          <PolicyRow name="PD 1216 · dedicated parks" current={greenPercent} target={POLICY_THRESHOLDS.PD1216_PARK_PERCENT} passed={greenPercent >= POLICY_THRESHOLDS.PD1216_PARK_PERCENT} />
          <PolicyRow name="PD 1216 · gross open space" current={greenPercent} target={POLICY_THRESHOLDS.PD1216_GROSS_OPEN_SPACE_PERCENT} passed={greenPercent >= POLICY_THRESHOLDS.PD1216_GROSS_OPEN_SPACE_PERCENT} />
          <PolicyRow name="WHO · per resident" current={sqmPerCapita} target={POLICY_THRESHOLDS.WHO_TARGET_SQM_PER_CAPITA} suffix=" m²" passed={sqmPerCapita >= POLICY_THRESHOLDS.WHO_TARGET_SQM_PER_CAPITA} />
          <PolicyRow name="Singapore benchmark" current={greenPercent} target={POLICY_THRESHOLDS.SINGAPORE_TARGET_PERCENT} passed={greenPercent >= POLICY_THRESHOLDS.SINGAPORE_TARGET_PERCENT} />
        </section>

        </>}
        <section className="p-4 border-b border-black/30">
          <div className="flex justify-between items-center"><div className="flex items-center gap-1.5"><Flame className="w-4 h-4" /><h3 className="font-display text-xl font-bold">STRESS TEST</h3></div><div className="font-mono text-xs border border-black px-1.5 py-0.5">{Math.round(elNinoSeverity * 100)}%</div></div>
          <div className="editorial-label text-zinc-500 mt-1">El Niño drought simulator</div>
          <input aria-label="El Niño drought severity" aria-valuetext={`${Math.round(elNinoSeverity * 100)}%`} type="range" min="0" max="1" step="0.01" value={elNinoSeverity} onChange={(e) => onElNinoChange(parseFloat(e.target.value))} className="w-full accent-black cursor-pointer h-1.5 appearance-none mt-4 bg-zinc-300" />
          <div className="grid grid-cols-3 border-l border-t border-black/30 mt-3">
            {[[0, 'Normal'], [0.5, 'Moderate'], [1, 'Severe']].map(([value, label]) => <button type="button" key={label} aria-pressed={elNinoSeverity === value} onClick={() => onElNinoChange(value)} className={`border-r border-b border-black/30 px-1 py-1.5 font-mono text-[9px] ${elNinoSeverity === value ? 'bg-black text-white' : 'hover:bg-zinc-100'}`}>{label} {value * 100}%</button>)}
          </div>
          {mapStatus === 'ready' && <p className="text-[10px] leading-snug text-zinc-600 mt-3">{resilienceTier.description}</p>}
        </section>

        <section className="p-4 bg-[#FDFCFA]/90">
          <div className="editorial-label mb-2">Urban intervention</div>
          <div className="flex gap-2"><button type="button" onClick={onTogglePocketParkTool} aria-pressed={isPocketParkToolActive} className={`flex-1 min-h-10 border border-black px-3 text-xs font-semibold flex justify-center items-center gap-1.5 ${isPocketParkToolActive ? 'bg-emerald-600 text-white border-emerald-700' : 'hover:bg-black hover:text-white'}`}><PlusCircle className="w-3.5 h-3.5" />{isPocketParkToolActive ? 'Click Map to Plant' : 'Plant Pocket Park'} <span className="font-mono text-[9px]">2,500 m²</span></button>{customParksCount > 0 && <button type="button" onClick={onClearCustomParks} title="Clear all planted parks" className="paper-button px-2 flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /><span className="font-mono text-[9px]">{customParksCount}</span></button>}</div>
          {isPocketParkToolActive && <p className="mt-2 border-l-2 border-emerald-600 pl-2 text-[10px] text-emerald-800">ACTIVE · Click anywhere on the map to drop a 25m × 25m green park, or focus the map and press Enter to plant at its center.</p>}
        </section>
        </div>
      </div>
    </aside>
  );
}
