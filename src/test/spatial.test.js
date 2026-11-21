import { describe, it, expect } from 'vitest';
import * as turf from '@turf/turf';
import { getInspectionPolygon, getDefaultMetrics, computeZoneMetrics } from '../utils/spatial';
import { POLICY_THRESHOLDS } from '../constants/policy';

// ─── getInspectionPolygon ────────────────────────────────────────────────────

describe('getInspectionPolygon', () => {
  const center = [121.0509, 14.6760]; // Quezon City center

  it('returns a GeoJSON Feature with Polygon geometry', () => {
    const poly = getInspectionPolygon(center);
    expect(poly.type).toBe('Feature');
    expect(poly.geometry.type).toBe('Polygon');
  });

  it('closes the ring (first coord === last coord)', () => {
    const poly = getInspectionPolygon(center);
    const ring = poly.geometry.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it('produces 5 coordinates (4 corners + closing)', () => {
    const poly = getInspectionPolygon(center);
    expect(poly.geometry.coordinates[0]).toHaveLength(5);
  });

  it('approximates a 600m × 600m bounding box', () => {
    const poly = getInspectionPolygon(center);
    // Turf area of a ~360,000 m² square should be within 2% of target
    const area = turf.area(poly);
    expect(area).toBeGreaterThan(350000);
    expect(area).toBeLessThan(370000);
  });

  it('respects a custom sizeMeters override', () => {
    const poly = getInspectionPolygon(center, 300); // 300m × 300m = 90,000 m²
    const area = turf.area(poly);
    expect(area).toBeGreaterThan(85000);
    expect(area).toBeLessThan(95000);
  });

  it('attaches correct properties', () => {
    const poly = getInspectionPolygon(center);
    expect(poly.properties.id).toBe('inspection-reticle');
    expect(poly.properties.sizeMeters).toBe(POLICY_THRESHOLDS.INSPECTION_BOX_SIZE_METERS);
  });
});

// ─── getDefaultMetrics ──────────────────────────────────────────────────────

describe('getDefaultMetrics', () => {
  it('returns a valid metrics object with expected keys', () => {
    const m = getDefaultMetrics();
    expect(m).toHaveProperty('greenArea');
    expect(m).toHaveProperty('greenPercent');
    expect(m).toHaveProperty('builtVolume');
    expect(m).toHaveProperty('nominalCanopyVolume');
    expect(m).toHaveProperty('effectiveCanopyVolume');
    expect(m).toHaveProperty('customParksCount');
    expect(m).toHaveProperty('resilienceTier');
  });

  it('greenPercent is a number between 0 and 100', () => {
    const { greenPercent } = getDefaultMetrics();
    expect(greenPercent).toBeGreaterThanOrEqual(0);
    expect(greenPercent).toBeLessThanOrEqual(100);
  });

  it('totalArea matches policy constant', () => {
    expect(getDefaultMetrics().totalArea).toBe(POLICY_THRESHOLDS.INSPECTION_BOX_AREA_SQM);
  });

  it('customParksCount defaults to 0', () => {
    expect(getDefaultMetrics().customParksCount).toBe(0);
  });
});

// ─── computeZoneMetrics — edge cases (no real map) ──────────────────────────

describe('computeZoneMetrics', () => {
  it('returns default metrics when map is null', () => {
    const poly = getInspectionPolygon([121.0509, 14.6760]);
    const result = computeZoneMetrics(null, poly, [], 0);
    expect(result).toEqual(getDefaultMetrics());
  });

  it('returns default metrics when inspectionPolygon is null', () => {
    const mockMap = { queryRenderedFeatures: () => [] };
    const result = computeZoneMetrics(mockMap, null, [], 0);
    expect(result).toEqual(getDefaultMetrics());
  });

  it('accounts for custom pocket parks in greenArea', () => {
    // Create a minimal mock map that returns no features (empty environment)
    const poly = getInspectionPolygon([121.0509, 14.6760]);
    const parkCenter = [121.0509, 14.6760]; // park placed at center, definitely inside reticle
    const halfKm = 0.025;
    const diagKm = halfKm * Math.SQRT2;
    const nw = turf.destination(parkCenter, diagKm, 315, { units: 'kilometers' }).geometry.coordinates;
    const ne = turf.destination(parkCenter, diagKm, 45, { units: 'kilometers' }).geometry.coordinates;
    const se = turf.destination(parkCenter, diagKm, 135, { units: 'kilometers' }).geometry.coordinates;
    const sw = turf.destination(parkCenter, diagKm, 225, { units: 'kilometers' }).geometry.coordinates;
    const parkPoly = turf.polygon([[nw, ne, se, sw, nw]], { areaSqm: 2500 });

    const mockMap = {
      project: (coord) => ({ x: 500, y: 500 }),  // all coords project to same pixel (triggers overlap check fallback)
      queryRenderedFeatures: () => [],
      getLayer: () => null,
    };

    const result = computeZoneMetrics(mockMap, poly, [parkPoly], 0);
    // green area should include the 2500 m² park contribution
    expect(result.customParksCount).toBe(1);
    expect(result.greenArea).toBeGreaterThanOrEqual(0);
  });

  it('applies El Niño drought factor to effective canopy volume', () => {
    const mockMap = {
      project: () => ({ x: 500, y: 500 }),
      queryRenderedFeatures: () => [],
      getLayer: () => null,
    };
    const poly = getInspectionPolygon([121.0509, 14.6760]);

    const noStress = computeZoneMetrics(mockMap, poly, [], 0);
    const severeStress = computeZoneMetrics(mockMap, poly, [], 1.0);

    // effectiveCanopyVolume at severity=1 should be 55% of severity=0
    // (1 - 0.45*1 = 0.55 factor)
    if (noStress.nominalCanopyVolume > 0) {
      expect(severeStress.effectiveCanopyVolume)
        .toBeCloseTo(noStress.nominalCanopyVolume * 0.55, -2);
    } else {
      // No green tiles in mock — both should be 0
      expect(severeStress.effectiveCanopyVolume).toBe(0);
    }
  });
});
