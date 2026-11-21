import React, { useState } from 'react';
import { POLICY_THRESHOLDS, RESILIENCE_TIERS } from '../constants/policy';
import { formatNumber } from '../utils/color';
import {
  Flame,
  ShieldAlert,
  Building2,
  Trees,
  CheckCircle2,
  AlertTriangle,
  Layers,
  PlusCircle,
  RotateCcw,
  RefreshCw,
  HelpCircle,
  Scale,
  MapPin,
  Sparkles,
  Undo2
} from 'lucide-react';

export default function TelemetryPanel({
  currentLocation,
  metrics,
  elNinoSeverity,
  onElNinoChange,
  isPocketParkToolActive,
  onTogglePocketParkTool,
  onClearCustomParks,
  onRefreshMetrics,
  onOpenExplainer
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    greenArea,
    greenPercent,
    builtVolume,
    nominalCanopyVolume,
    customParksCount
  } = metrics;

  // Zero-latency El Niño math
  const droughtFactor = 1 - (0.45 * elNinoSeverity);
  const effectiveCanopyVolume = Math.round((nominalCanopyVolume || (greenArea * 6)) * droughtFactor);
  const effectiveGreenPercent = Number((greenPercent * droughtFactor).toFixed(1));

  // Dynamic green-to-concrete ratio
  let ratioValue = 0;
  if (effectiveCanopyVolume > 0 && builtVolume > 0) {
    ratioValue = Number((builtVolume / effectiveCanopyVolume).toFixed(1));
  }

  const sqmPerCapita = Number((greenArea / POLICY_THRESHOLDS.ASSUMED_ZONE_POPULATION).toFixed(2));

  // Compute 0.0 - 10.0 continuous score
  let rawScore = (effectiveGreenPercent / 30.0) * 10.0;
  if (ratioValue > 25) rawScore *= 0.85;
  if (ratioValue > 50) rawScore *= 0.70;
  const resilienceScore = Number(Math.min(10.0, Math.max(0.0, rawScore)).toFixed(1));

  // Determine resilience tier based on 0-10 score
  let resilienceTier = RESILIENCE_TIERS.BUFFERED;
  if (resilienceScore < 3.0) {
    resilienceTier = RESILIENCE_TIERS.CRITICAL;
  } else if (resilienceScore < 5.5) {
    resilienceTier = RESILIENCE_TIERS.VULNERABLE;
  } else if (resilienceScore >= 8.0) {
    resilienceTier = RESILIENCE_TIERS.RESILIENT;
  }

  // Policy threshold targets
  const pdParkTarget = POLICY_THRESHOLDS.PD1216_PARK_PERCENT; // 9%
  const pdGrossTarget = POLICY_THRESHOLDS.PD1216_GROSS_OPEN_SPACE_PERCENT; // 30%
  const whoCapitaTarget = POLICY_THRESHOLDS.WHO_TARGET_SQM_PER_CAPITA; // 9 m²
  const sgTarget = POLICY_THRESHOLDS.SINGAPORE_TARGET_PERCENT; // 30%

  const handleRefreshClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRefreshing(true);
    if (onRefreshMetrics) {
      onRefreshMetrics();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <aside className="absolute right-4 top-20 bottom-4 w-84 md:w-96 z-20 pointer-events-none flex flex-col justify-between">
      <div className="glass-panel p-4 md:p-5 rounded-3xl pointer-events-auto flex flex-col gap-3.5 shadow-2xl border border-white/70 overflow-y-auto max-h-full scrollbar-none">
        
        {/* Header & Location */}
        <div className="flex flex-col gap-2 border-b border-slate-200/60 pb-3">
          {/* Location Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-sm truncate max-w-[210px]">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{currentLocation?.name || 'Quezon City, Metro Manila'}</span>
            </div>

            {/* Manual Recalculate / Refresh Button */}
            <button
              type="button"
              onClick={handleRefreshClick}
              title="Force recalculate active 600m block"
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Block Green & Heat Index
              </h2>
              <div className="text-[11px] text-slate-500 font-medium">
                600m × 600m Zone (36 Hectares)
              </div>
            </div>

            {/* Quick Explainer Modal Trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onOpenExplainer) onOpenExplainer();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>How it works</span>
            </button>
          </div>

          {/* 0.0 - 10.0 Resilience Gauge Card */}
          <div className="mt-1 p-2.5 rounded-2xl bg-white/90 border border-slate-200/70 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Resilience Score
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-base font-extrabold text-slate-900">
                  {resilienceScore.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 10.0</span>
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${resilienceTier.badgeClass}`}>
                  {resilienceTier.label}
                </span>
              </div>
            </div>

            {/* Continuous 0 to 10 Scale Bar */}
            <div className="relative w-full">
              <div className="w-full h-2.5 rounded-full bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 to-emerald-600 shadow-inner overflow-hidden relative">
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-slate-900 ring-2 ring-white rounded-full transition-all duration-300"
                  style={{ left: `calc(${Math.min(98, Math.max(2, (resilienceScore / 10) * 100))}% - 3px)` }}
                />
              </div>

              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1 px-0.5">
                <span>0.0 (Critical)</span>
                <span>3.0</span>
                <span>5.5</span>
                <span>8.0</span>
                <span>10.0 (Resilient)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Metric Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Green Ground Area */}
          <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold flex items-center gap-1">
                <Trees className="w-3.5 h-3.5 text-emerald-600" /> Green Cover
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100/70 px-1.5 rounded">
                {greenPercent}%
              </span>
            </div>
            <div className="font-extrabold text-lg text-slate-900 tracking-tight">
              {formatNumber(greenArea)} <span className="text-xs font-normal text-slate-500">m²</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              {sqmPerCapita} m² per resident
            </div>
          </div>

          {/* Built Concrete Volume */}
          <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-600" /> Built Concrete
              </span>
              <span className="text-[10px] font-mono text-slate-600 font-bold bg-slate-200/80 px-1.5 rounded">
                Volume
              </span>
            </div>
            <div className="font-extrabold text-lg text-slate-900 tracking-tight">
              {formatNumber(builtVolume)} <span className="text-xs font-normal text-slate-500">m³</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              Extruded white massing
            </div>
          </div>

          {/* Effective Canopy Volume */}
          <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-teal-600" /> Canopy Cooling
              </span>
            </div>
            <div className="font-extrabold text-lg text-emerald-700 tracking-tight">
              {formatNumber(effectiveCanopyVolume)} <span className="text-xs font-normal text-slate-500">m³</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              {elNinoSeverity > 0 ? `Reduced by ${Math.round(elNinoSeverity * 45)}% in drought` : 'Full 6m tree depth'}
            </div>
          </div>

          {/* Green-to-Concrete Ratio */}
          <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-slate-500" /> Green : Built
              </span>
            </div>
            <div className="font-extrabold text-lg text-slate-900 tracking-tight font-mono">
              1 : {ratioValue || '0'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              m³ canopy to m³ concrete
            </div>
          </div>
        </div>

        {/* Policy & Benchmark Progress Bars */}
        <div className="flex flex-col gap-2 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              Urban Green Law & Benchmarks
            </span>
            <span className="text-[10px] font-mono text-slate-400">Target vs Block</span>
          </div>

          {/* PD 1216 Park Benchmark */}
          <div className="bg-white/80 rounded-xl p-2.5 border border-slate-200/50 shadow-sm flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">
                PD 1216 Dedicated Park (PH Law)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-slate-600">
                  <strong>{greenPercent}%</strong> / {pdParkTarget}%
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  greenPercent >= pdParkTarget ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {greenPercent >= pdParkTarget ? 'PASSED' : 'DEFICIT'}
                </span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  greenPercent >= pdParkTarget ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, (greenPercent / pdParkTarget) * 100)}%` }}
              />
            </div>
          </div>

          {/* PD 1216 Gross Open Space Benchmark */}
          <div className="bg-white/80 rounded-xl p-2.5 border border-slate-200/50 shadow-sm flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">
                PD 1216 Gross Open Space (≥1 ha)
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-slate-600">
                  <strong>{greenPercent}%</strong> / {pdGrossTarget}%
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  greenPercent >= pdGrossTarget ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {greenPercent >= pdGrossTarget ? 'PASSED' : 'DEFICIT'}
                </span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  greenPercent >= pdGrossTarget ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
                style={{ width: `${Math.min(100, (greenPercent / pdGrossTarget) * 100)}%` }}
              />
            </div>
          </div>

          {/* WHO 9m² per Capita Target */}
          <div className="bg-white/80 rounded-xl p-2.5 border border-slate-200/50 shadow-sm flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">
                WHO 9 m² / Resident Target
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-slate-600">
                  <strong>{sqmPerCapita}</strong> / {whoCapitaTarget} m²
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  sqmPerCapita >= whoCapitaTarget ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {sqmPerCapita >= whoCapitaTarget ? 'PASSED' : 'DEFICIT'}
                </span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  sqmPerCapita >= whoCapitaTarget ? 'bg-emerald-500' : 'bg-red-400'
                }`}
                style={{ width: `${Math.min(100, (sqmPerCapita / whoCapitaTarget) * 100)}%` }}
              />
            </div>
          </div>

          {/* Singapore Benchmark */}
          <div className="bg-white/80 rounded-xl p-2.5 border border-slate-200/50 shadow-sm flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">
                Singapore Benchmark (30%)
              </span>
              <span className="font-mono text-[11px] text-slate-600">
                <strong>{greenPercent}%</strong> / {sgTarget}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  greenPercent >= sgTarget ? 'bg-emerald-500' : 'bg-emerald-300'
                }`}
                style={{ width: `${Math.min(100, (greenPercent / sgTarget) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* El Niño Heat Stress Simulator */}
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10 rounded-2xl p-3.5 border border-amber-300/60 flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <Flame className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>El Niño Drought Simulator</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-lg border border-amber-200">
                {Math.round(elNinoSeverity * 100)}%
              </span>
              {/* Reset El Niño Icon-Only Button */}
              {elNinoSeverity > 0 && (
                <button
                  type="button"
                  onClick={() => onElNinoChange(0)}
                  title="Reset El Niño severity to 0%"
                  className="p-1 rounded-lg bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-amber-200 transition-colors shadow-sm"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Slider */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={elNinoSeverity}
            onChange={(e) => onElNinoChange(parseFloat(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
            <button
              type="button"
              onClick={() => onElNinoChange(0)}
              className={`hover:text-slate-900 transition-colors ${elNinoSeverity === 0 ? 'font-bold text-emerald-700' : ''}`}
            >
              Normal (0%)
            </button>
            <button
              type="button"
              onClick={() => onElNinoChange(0.5)}
              className={`hover:text-slate-900 transition-colors ${elNinoSeverity === 0.5 ? 'font-bold text-amber-700' : ''}`}
            >
              Moderate (50%)
            </button>
            <button
              type="button"
              onClick={() => onElNinoChange(1.0)}
              className={`hover:text-slate-900 transition-colors ${elNinoSeverity === 1.0 ? 'font-bold text-red-700' : ''}`}
            >
              Severe (100%)
            </button>
          </div>

          <div className="text-[11px] text-slate-600 leading-snug">
            {resilienceTier.description}
          </div>
        </div>

        {/* Pocket Park Dropper */}
        <div className="flex flex-col gap-1.5 pt-0.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTogglePocketParkTool}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm border ${
                isPocketParkToolActive
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-500/20 scale-[1.02] ring-2 ring-emerald-400'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isPocketParkToolActive ? 'Click Map to Plant' : 'Plant Pocket Park'}</span>
              <span className="text-[10px] font-mono px-1.5 rounded bg-black/10">50m²</span>
            </button>

            {customParksCount > 0 && (
              <button
                type="button"
                onClick={onClearCustomParks}
                title="Clear all planted pocket parks"
                className="p-2 rounded-xl bg-white text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors shadow-sm flex items-center gap-1 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="font-mono text-[10px] font-bold">({customParksCount})</span>
              </button>
            )}
          </div>

          {isPocketParkToolActive && (
            <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl font-medium animate-pulse">
              📍 <strong>Active:</strong> Click anywhere on the map to drop a 50m × 50m green park and watch metrics rise!
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}
