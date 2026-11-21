// Interpolates between lush emerald (#10B981) and dry ochre (#D97706)
export function getElNinoGreenColor(severity = 0) {
  // severity: 0.0 (lush) to 1.0 (severe El Niño)
  const clamped = Math.max(0, Math.min(1, severity));

  // RGB for #10B981: (16, 185, 129)
  const r1 = 16, g1 = 185, b1 = 129;
  // RGB for #D97706: (217, 119, 6)
  const r2 = 217, g2 = 119, b2 = 6;

  const r = Math.round(r1 + (r2 - r1) * clamped);
  const g = Math.round(g1 + (g2 - g1) * clamped);
  const b = Math.round(b1 + (b2 - b1) * clamped);

  return `rgb(${r}, ${g}, ${b})`;
}

export function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
}
