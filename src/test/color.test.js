import { describe, it, expect } from 'vitest';
import { getElNinoGreenColor, formatNumber } from '../utils/color';

describe('getElNinoGreenColor', () => {
  it('returns pure emerald green at severity 0 (no drought)', () => {
    expect(getElNinoGreenColor(0)).toBe('rgb(16, 185, 129)');
  });

  it('returns dry ochre at full severity 1 (severe El Niño)', () => {
    expect(getElNinoGreenColor(1)).toBe('rgb(217, 119, 6)');
  });

  it('returns a midpoint color at severity 0.5', () => {
    // Midpoint between (16,185,129) and (217,119,6):
    // r = 16 + 0.5*(217-16) = 16+100.5 = 117 (rounded)
    // g = 185 + 0.5*(119-185) = 185-33 = 152
    // b = 129 + 0.5*(6-129) = 129-61.5 = 68 (rounded)
    expect(getElNinoGreenColor(0.5)).toBe('rgb(117, 152, 68)');
  });

  it('clamps severity below 0 to 0', () => {
    expect(getElNinoGreenColor(-0.5)).toBe(getElNinoGreenColor(0));
  });

  it('clamps severity above 1 to 1', () => {
    expect(getElNinoGreenColor(1.5)).toBe(getElNinoGreenColor(1));
  });

  it('always returns a valid rgb() string', () => {
    [0, 0.1, 0.5, 0.9, 1].forEach(s => {
      expect(getElNinoGreenColor(s)).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });
  });
});

describe('formatNumber', () => {
  it('formats large integers with comma separators', () => {
    expect(formatNumber(360000)).toBe('360,000');
  });

  it('rounds decimals (no decimal places)', () => {
    expect(formatNumber(1234.9)).toBe('1,235');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('handles undefined gracefully', () => {
    expect(formatNumber(undefined)).toBe('0');
  });

  it('handles null gracefully', () => {
    expect(formatNumber(null)).toBe('0');
  });

  it('handles NaN gracefully', () => {
    expect(formatNumber(NaN)).toBe('0');
  });

  it('handles negative numbers', () => {
    expect(formatNumber(-5000)).toBe('-5,000');
  });
});
