import * as turf from '@turf/turf';
import { POLICY_THRESHOLDS, RESILIENCE_TIERS } from '../constants/policy';

/**
 * Creates a square polygon (600m x 600m) centered at [lng, lat]
 */
export function getInspectionPolygon(centerLngLat, sizeMeters = POLICY_THRESHOLDS.INSPECTION_BOX_SIZE_METERS) {
  const [lng, lat] = centerLngLat;
  const halfDistKm = (sizeMeters / 2) / 1000;
  const cornerDistKm = halfDistKm * Math.SQRT2;

  // Bearings: NW (315°), NE (45°), SE (135°), SW (225°)
  const nw = turf.destination([lng, lat], cornerDistKm, 315, { units: 'kilometers' }).geometry.coordinates;
  const ne = turf.destination([lng, lat], cornerDistKm, 45, { units: 'kilometers' }).geometry.coordinates;
  const se = turf.destination([lng, lat], cornerDistKm, 135, { units: 'kilometers' }).geometry.coordinates;
  const sw = turf.destination([lng, lat], cornerDistKm, 225, { units: 'kilometers' }).geometry.coordinates;

  return turf.polygon([[nw, ne, se, sw, nw]], {
    id: 'inspection-reticle',
    name: 'Inspection Zone (600m × 600m)',
    sizeMeters
  });
}

/**
 * Fast bounding box overlap ratio between feature bbox and reticle bbox
 * Runs in O(1) microsecond arithmetic instead of heavy polygon clipping
 */
function getFastOverlapRatio(fBbox, reticleBbox) {
  const [fMinX, fMinY, fMaxX, fMaxY] = fBbox;
  const [rMinX, rMinY, rMaxX, rMaxY] = reticleBbox;

  // Check if completely outside
  if (fMaxX < rMinX || fMinX > rMaxX || fMaxY < rMinY || fMinY > rMaxY) {
    return 0;
  }

  // Check if completely inside
  if (fMinX >= rMinX && fMaxX <= rMaxX && fMinY >= rMinY && fMaxY <= rMaxY) {
    return 1;
  }

  // Calculate intersection bbox
  const intMinX = Math.max(fMinX, rMinX);
  const intMinY = Math.max(fMinY, rMinY);
  const intMaxX = Math.min(fMaxX, rMaxX);
  const intMaxY = Math.min(fMaxY, rMaxY);

  const fWidth = Math.max(1e-9, fMaxX - fMinX);
  const fHeight = Math.max(1e-9, fMaxY - fMinY);
  const intWidth = Math.max(0, intMaxX - intMinX);
  const intHeight = Math.max(0, intMaxY - intMinY);

  const ratio = (intWidth * intHeight) / (fWidth * fHeight);
  return Math.min(1, Math.max(0, ratio));
}

/**
 * Ultra-fast spatial metrics calculation within the inspection polygon
 */
export function computeZoneMetrics(map, inspectionPolygon, customParks = [], elNinoSeverity = 0) {
  const totalArea = POLICY_THRESHOLDS.INSPECTION_BOX_AREA_SQM; // 360,000 m²

  if (!map || !inspectionPolygon) {
    return null;
  }

  try {
    const coords = inspectionPolygon.geometry.coordinates[0];
    const screenPoints = coords.map(c => map.project(c));

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    screenPoints.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });

    const reticleBbox = turf.bbox(inspectionPolygon);

    // Add padding to ensure border features are queried from MapLibre
    const queryBbox = [
      [Math.max(0, minX - 10), Math.max(0, minY - 10)],
      [maxX + 10, maxY + 10]
    ];

    // Query 3D buildings
    const buildingFeatures = map.queryRenderedFeatures(queryBbox, {
      layers: ['luntian-3d-buildings']
    });

    // Query ALL green layers (standard OpenFreeMap style + custom added)
    const greenLayerIds = [
      'park',
      'landcover_wood',
      'luntian-green-landcover',
      'luntian-green-landuse'
    ].filter(id => !!map.getLayer(id));

    const greenFeatures = map.queryRenderedFeatures(queryBbox, {
      layers: greenLayerIds
    });

    // 1. Calculate Built Volume (m³)
    let totalBuiltVolume = 0;
    const seenBuildingKeys = new Set();

    for (let i = 0; i < buildingFeatures.length; i++) {
      const feature = buildingFeatures[i];
      if (!feature.geometry) continue;

      // Fast deduplication key
      const key = feature.id != null
        ? feature.id
        : (feature.properties?.osm_id || `${feature.properties?.render_height || ''}_${i}`);
      if (seenBuildingKeys.has(key)) continue;
      seenBuildingKeys.add(key);

      try {
        const fBbox = turf.bbox(feature);
        const overlapRatio = getFastOverlapRatio(fBbox, reticleBbox);
        if (overlapRatio <= 0) continue;

        const footprintArea = turf.area(feature) * overlapRatio;

        // Building height resolution
        const height = Number(feature.properties?.render_height) ||
          (Number(feature.properties?.levels) ? Number(feature.properties.levels) * 3.2 : null) ||
          (Number(feature.properties?.height) ? Number(feature.properties.height) : 10);

        totalBuiltVolume += footprintArea * height;
      } catch {
        // Skip malformed feature
      }
    }

    // 2. Calculate Green Ground Area (m²)
    let totalGreenArea = 0;
    const seenGreenKeys = new Set();

    for (let i = 0; i < greenFeatures.length; i++) {
      const feature = greenFeatures[i];
      if (!feature.geometry) continue;

      const key = feature.id != null
        ? feature.id
        : `${feature.layer?.id}_${feature.properties?.class || ''}_${i}`;
      if (seenGreenKeys.has(key)) continue;
      seenGreenKeys.add(key);

      try {
        const fBbox = turf.bbox(feature);
        const overlapRatio = getFastOverlapRatio(fBbox, reticleBbox);
        if (overlapRatio <= 0) continue;

        const area = turf.area(feature) * overlapRatio;
        totalGreenArea += area;
      } catch {
        // Skip malformed feature
      }
    }

    // 3. Add custom dropped pocket parks
    customParks.forEach(park => {
      try {
        const pBbox = turf.bbox(park);
        const ratio = getFastOverlapRatio(pBbox, reticleBbox);
        if (ratio > 0) {
          totalGreenArea += 2500 * ratio;
        }
      } catch {
        // Ignore malformed parks.
      }
    });

    // Clamp green area to maximum total area (360,000 m²)
    totalGreenArea = Math.min(totalArea, totalGreenArea);

    const greenPercent = (totalGreenArea / totalArea) * 100;
    const nominalCanopyVolume = totalGreenArea * POLICY_THRESHOLDS.CANOPY_WEIGHTED_HEIGHT_METERS;

    // El Niño drought degradation: up to 45% reduction in effective cooling volume
    const droughtFactor = 1 - (0.45 * elNinoSeverity);
    const effectiveCanopyVolume = nominalCanopyVolume * droughtFactor;
    const effectiveGreenPercent = greenPercent * droughtFactor;

    // Green to Concrete Volume Ratio (1 : X)
    let ratioValue = 0;
    if (effectiveCanopyVolume > 0 && totalBuiltVolume > 0) {
      ratioValue = Number((totalBuiltVolume / effectiveCanopyVolume).toFixed(1));
    }

    // Per capita green area (assuming ~7,200 people in typical dense urban block)
    const sqmPerCapita = Number((totalGreenArea / POLICY_THRESHOLDS.ASSUMED_ZONE_POPULATION).toFixed(2));

    // Determine Resilience Tier
    let resilienceTier = RESILIENCE_TIERS.BUFFERED;
    if (effectiveGreenPercent < 5.0 || (ratioValue > 40 && effectiveGreenPercent < 8.0)) {
      resilienceTier = RESILIENCE_TIERS.CRITICAL;
    } else if (effectiveGreenPercent < 12.0) {
      resilienceTier = RESILIENCE_TIERS.VULNERABLE;
    } else if (effectiveGreenPercent >= 25.0) {
      resilienceTier = RESILIENCE_TIERS.RESILIENT;
    }

    return {
      totalArea,
      greenArea: Math.round(totalGreenArea),
      greenPercent: Number(greenPercent.toFixed(1)),
      nominalCanopyVolume: Math.round(nominalCanopyVolume),
      effectiveCanopyVolume: Math.round(effectiveCanopyVolume),
      effectiveGreenPercent: Number(effectiveGreenPercent.toFixed(1)),
      builtVolume: Math.round(totalBuiltVolume),
      greenToConcreteRatio: ratioValue,
      sqmPerCapita,
      resilienceTier,
      customParksCount: customParks.length
    };
  } catch (err) {
    console.error('Spatial calculation error:', err);
    return null;
  }
}
