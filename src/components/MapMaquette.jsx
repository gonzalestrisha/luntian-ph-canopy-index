import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import { getInspectionPolygon, computeZoneMetrics } from '../utils/spatial';
import { getElNinoGreenColor } from '../utils/color';
import { getNearestCity } from '../utils/geoCity';

// Bounding box constraints
const NCR_BOUNDS = [[120.88, 14.32], [121.18, 14.80]];
const SINGAPORE_BOUNDS = [[103.82, 1.25], [103.88, 1.32]];

const BLUEPRINT = {
  paper: '#F7F8FA',
  paperDark: '#E7EAF0',
  ink: '#334155',
  inkSoft: '#94A3B8',
  water: '#E2E8F0',
  green: '#10B981'
};

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function getTreeCanopyFeatures(map) {
  const layers = ['park', 'landcover_wood', 'luntian-green-landcover', 'luntian-green-landuse']
    .filter(id => !!map.getLayer(id));
  if (!layers.length) return turf.featureCollection([]);

  const features = map.queryRenderedFeatures({ layers });
  const seen = new Set();
  const canopies = [];

  features.forEach((feature, featureIndex) => {
    if (!feature.geometry) return;
    const key = feature.id != null
      ? String(feature.id)
      : `${feature.layer?.id}-${featureIndex}-${feature.properties?.class || ''}`;
    if (seen.has(key)) return;
    seen.add(key);

    try {
      const [minLng, minLat, maxLng, maxLat] = turf.bbox(feature);
      const widthMeters = Math.abs(maxLng - minLng) * 105000;
      const heightMeters = Math.abs(maxLat - minLat) * 111000;
      const count = Math.min(14, Math.max(1, Math.round((widthMeters + heightMeters) / 180)));

      for (let i = 0; i < count && canopies.length < 900; i += 1) {
        const seed = hashString(`${key}-${i}`);
        const lng = minLng + (maxLng - minLng) * ((seed * 0.73 + 0.13) % 1);
        const lat = minLat + (maxLat - minLat) * ((seed * 0.41 + 0.29) % 1);
        const point = turf.point([lng, lat]);

        if (turf.booleanPointInPolygon(point, feature)) {
          canopies.push(turf.feature(point, {
            size: 0.75 + hashString(`${key}-size-${i}`) * 0.75,
            rotation: Math.round(hashString(`${key}-rotation-${i}`) * 360)
          }));
        }
      }
    } catch {
      // Ignore malformed or unloaded vector-tile features.
    }
  });

  return turf.featureCollection(canopies);
}

const MapMaquette = forwardRef(function MapMaquette(
  {
    initialPreset,
    activePreset,
    elNinoSeverity,
    isPocketParkToolActive,
    customParks,
    onAddCustomPark,
    onMetricsCalculated,
    onCameraChange,
    onLocationChange
  },
  ref
) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const isPocketParkToolActiveRef = useRef(isPocketParkToolActive);
  const customParksRef = useRef(customParks);
  const isCalculatingRef = useRef(false);
  const recalculateTimerRef = useRef(null);
  const treeCanopyTimerRef = useRef(null);
  // Keep a ref to always-fresh callbacks/values to avoid stale closures in map event handlers
  const elNinoSeverityRef = useRef(elNinoSeverity);
  const onMetricsCalculatedRef = useRef(onMetricsCalculated);
  const onLocationChangeRef = useRef(onLocationChange);
  const onCameraChangeRef = useRef(onCameraChange);

  useEffect(() => {
    isPocketParkToolActiveRef.current = isPocketParkToolActive;
  }, [isPocketParkToolActive]);

  useEffect(() => {
    customParksRef.current = customParks;
  }, [customParks]);

  useEffect(() => {
    elNinoSeverityRef.current = elNinoSeverity;
  }, [elNinoSeverity]);

  useEffect(() => {
    onMetricsCalculatedRef.current = onMetricsCalculated;
  }, [onMetricsCalculated]);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    onCameraChangeRef.current = onCameraChange;
  }, [onCameraChange]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (mapRef.current) mapRef.current.zoomIn({ duration: 300 });
    },
    zoomOut: () => {
      if (mapRef.current) mapRef.current.zoomOut({ duration: 300 });
    },
    setZoom: (newZoom) => {
      if (mapRef.current) mapRef.current.setZoom(newZoom);
    },
    togglePitch: () => {
      const map = mapRef.current;
      if (!map) return;
      const currentPitch = map.getPitch();
      const targetPitch = currentPitch > 20 ? 0 : 58;
      map.easeTo({ pitch: targetPitch, duration: 600 });
    },
    resetBearing: () => {
      if (mapRef.current) mapRef.current.easeTo({ bearing: 0, duration: 500 });
    },
    recalculate: () => {
      forceRecalculate();
    }
  }));

  // Stable ref-based recalculate — always reads latest values via refs, safe to call from any stale closure
  const forceRecalculateRef = useRef(null);
  forceRecalculateRef.current = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const center = map.getCenter();
    const reticle = getInspectionPolygon([center.lng, center.lat]);
    
    const source = map.getSource('reticle-source');
    if (source) {
      source.setData(reticle);
    }

    const computed = computeZoneMetrics(map, reticle, customParksRef.current, elNinoSeverityRef.current);
    if (onMetricsCalculatedRef.current) onMetricsCalculatedRef.current(computed);

    const nearestCity = getNearestCity([center.lng, center.lat]);
    if (onLocationChangeRef.current) {
      onLocationChangeRef.current(nearestCity, [center.lng, center.lat]);
    }
  };

  // Stable wrapper so map event handlers always call latest version
  const forceRecalculate = useCallback(() => {
    forceRecalculateRef.current?.();
  }, []);

  const scheduleRecalculate = useCallback(() => {
    if (recalculateTimerRef.current) {
      clearTimeout(recalculateTimerRef.current);
    }
    recalculateTimerRef.current = setTimeout(() => {
      recalculateTimerRef.current = null;
      forceRecalculate();
    }, 200);
  }, [forceRecalculate]);

  useEffect(() => {
    if (mapRef.current) return;

    const initialBounds = initialPreset.id === 'singapore-marina' ? SINGAPORE_BOUNDS : NCR_BOUNDS;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: initialPreset.center,
      zoom: initialPreset.zoom,
      pitch: initialPreset.pitch,
      bearing: initialPreset.bearing,
      antialias: true,
      maxPitch: 75,
      minZoom: 13.5,
      maxBounds: initialBounds,
      fadeDuration: 0
    });

    mapRef.current = map;

    map.on('load', () => {
      const layers = map.getStyle().layers;
      layers.forEach(layer => {
        if (layer.type === 'symbol') {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        }

        // Quiet the source style into a paper/ink architectural base.
        if (layer.type === 'background' && map.getLayer(layer.id)) {
          map.setPaintProperty(layer.id, 'background-color', BLUEPRINT.paper);
        }
        if (layer.type === 'fill' && map.getLayer(layer.id)) {
          const id = layer.id.toLowerCase();
          if (id.includes('water')) {
            map.setPaintProperty(layer.id, 'fill-color', BLUEPRINT.water);
            map.setPaintProperty(layer.id, 'fill-opacity', 0.8);
          } else if (id.includes('building')) {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
          } else if (id.includes('park') || id.includes('landcover') || id.includes('landuse')) {
            map.setPaintProperty(layer.id, 'fill-color', BLUEPRINT.paperDark);
            map.setPaintProperty(layer.id, 'fill-opacity', 0.55);
          }
        }
        if (layer.type === 'line' && map.getLayer(layer.id)) {
          const id = layer.id.toLowerCase();
          if (id.includes('road') || id.includes('transport') || id.includes('street')) {
            map.setPaintProperty(layer.id, 'line-color', BLUEPRINT.inkSoft);
            map.setPaintProperty(layer.id, 'line-opacity', 0.55);
          }
        }
      });

      if (map.getLayer('background')) {
        map.setPaintProperty('background', 'background-color', BLUEPRINT.paper);
      }

      map.setLight({
        anchor: 'viewport',
        color: '#FFFFFF',
        intensity: 0.32,
        position: [1.15, 210, 30]
      });

      const initialGreen = getElNinoGreenColor(0);

      if (map.getLayer('park')) {
        map.setPaintProperty('park', 'fill-color', initialGreen);
        map.setPaintProperty('park', 'fill-opacity', [
          'interpolate', ['linear'], ['zoom'], 13.5, 0.28, 16, 0.46, 18, 0.58
        ]);
      }

      if (map.getLayer('landcover_wood')) {
        map.setPaintProperty('landcover_wood', 'fill-color', initialGreen);
        map.setPaintProperty('landcover_wood', 'fill-opacity', [
          'interpolate', ['linear'], ['zoom'], 13.5, 0.24, 16, 0.42, 18, 0.54
        ]);
      }

      if (!map.getLayer('luntian-green-landcover')) {
        map.addLayer({
          id: 'luntian-green-landcover',
          type: 'fill',
          source: 'openmaptiles',
          'source-layer': 'landcover',
          filter: ['in', 'class', 'grass', 'wood', 'scrub', 'wetland', 'crop'],
          paint: {
            'fill-color': initialGreen,
            'fill-opacity': [
              'interpolate', ['linear'], ['zoom'], 13.5, 0.22, 16, 0.4, 18, 0.52
            ]
          }
        });
      }

      if (!map.getLayer('luntian-green-landuse')) {
        map.addLayer({
          id: 'luntian-green-landuse',
          type: 'fill',
          source: 'openmaptiles',
          'source-layer': 'landuse',
          filter: ['in', 'class', 'park', 'cemetery', 'recreation_ground', 'forest', 'meadow', 'pitch', 'grass'],
          paint: {
            'fill-color': initialGreen,
            'fill-opacity': [
              'interpolate', ['linear'], ['zoom'], 13.5, 0.24, 16, 0.44, 18, 0.56
            ]
          }
        });
      }

      if (map.getLayer('building')) {
        map.setLayoutProperty('building', 'visibility', 'none');
      }

      if (!map.getLayer('luntian-3d-buildings')) {
        map.addLayer({
          id: 'luntian-3d-buildings',
          type: 'fill-extrusion',
          source: 'openmaptiles',
          'source-layer': 'building',
          paint: {
            'fill-extrusion-color': [
              'interpolate', ['linear'], ['zoom'], 13.5, '#E2E8F0', 16, '#F8FAFC', 18, '#FFFFFF'
            ],
            'fill-extrusion-height': [
              'coalesce',
              ['get', 'render_height'],
              ['*', ['coalesce', ['get', 'levels'], 1], 3.2],
              10
            ],
            'fill-extrusion-base': [
              'coalesce',
              ['get', 'render_min_height'],
              0
            ],
            'fill-extrusion-opacity': [
              'interpolate', ['linear'], ['zoom'], 13.5, 0.78, 16, 0.88, 18, 0.94
            ]
          }
        });
      }

      // Inspection reticle
      const initialCenter = map.getCenter();
      const initialReticle = getInspectionPolygon([initialCenter.lng, initialCenter.lat]);

      map.addSource('reticle-source', {
        type: 'geojson',
        data: initialReticle
      });

      map.addLayer({
        id: 'reticle-layer-fill',
        type: 'fill',
        source: 'reticle-source',
        paint: {
          'fill-color': '#10B981',
          'fill-opacity': 0.035
        }
      });

      map.addLayer({
        id: 'reticle-layer-outline',
        type: 'line',
        source: 'reticle-source',
        paint: {
          'line-color': BLUEPRINT.ink,
          'line-width': 1.5,
          'line-dasharray': [2.5, 2],
          'line-opacity': 0.82
        }
      });

      // Tree canopies: the green signal is carried by clustered crowns, not solid landcover.
      map.addSource('tree-canopies-source', {
        type: 'geojson',
        data: turf.featureCollection([])
      });

      map.addLayer({
        id: 'tree-canopies-shadow',
        type: 'circle',
        source: 'tree-canopies-source',
        minzoom: 13.5,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 13.5, 3, 16, 5.5, 18, 8],
          'circle-color': BLUEPRINT.ink,
          'circle-opacity': 0.16,
          'circle-translate': [1.5, 1.5],
          'circle-blur': 0.25
        }
      });

      map.addLayer({
        id: 'tree-canopies-layer',
        type: 'circle',
        source: 'tree-canopies-source',
        minzoom: 13.5,
        paint: {
          'circle-radius': [
            '*',
            ['get', 'size'],
            ['interpolate', ['linear'], ['zoom'], 13.5, 3, 16, 5.5, 18, 8]
          ],
          'circle-color': initialGreen,
          'circle-stroke-color': BLUEPRINT.ink,
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 13.5, 0.35, 16, 0.7, 18, 1],
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 13.5, 0.7, 16, 0.88, 18, 0.96],
          'circle-blur': 0.08
        }
      });

      const refreshTreeCanopies = () => {
        const source = map.getSource('tree-canopies-source');
        if (source && map.isStyleLoaded()) {
          source.setData(getTreeCanopyFeatures(map));
        }
      };

      const scheduleTreeCanopies = () => {
        if (treeCanopyTimerRef.current) clearTimeout(treeCanopyTimerRef.current);
        treeCanopyTimerRef.current = setTimeout(() => {
          treeCanopyTimerRef.current = null;
          refreshTreeCanopies();
        }, 220);
      };

      setTimeout(refreshTreeCanopies, 250);

      // Custom Dropped Parks (Source + 2.5D Green Terrace Extrusion + Crisp Outline)
      map.addSource('custom-parks-source', {
        type: 'geojson',
        data: turf.featureCollection(customParksRef.current)
      });

      map.addLayer({
        id: 'custom-parks-extrusion',
        type: 'fill-extrusion',
        source: 'custom-parks-source',
        paint: {
          'fill-extrusion-color': initialGreen,
          'fill-extrusion-height': 20,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.95
        }
      });

      map.addLayer({
        id: 'custom-parks-layer',
        type: 'fill',
        source: 'custom-parks-source',
        paint: {
          'fill-color': initialGreen,
          'fill-opacity': 0.9
        }
      });

      map.addLayer({
        id: 'custom-parks-outline',
        type: 'line',
        source: 'custom-parks-source',
        paint: {
          'line-color': '#047857',
          'line-width': 2,
          'line-opacity': 1
        }
      });

      // Centroid circle markers — always visible even when extrusion is occluded by taller buildings
      map.addSource('custom-parks-centroids', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'custom-parks-centroids-layer',
        type: 'circle',
        source: 'custom-parks-centroids',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 13.5, 5, 16, 8, 18, 11],
          'circle-color': initialGreen,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#047857',
          'circle-opacity': 1
        }
      });

      forceRecalculate();
    });

    const onMapMoveEnd = () => {
      scheduleRecalculate();
      if (map.isStyleLoaded()) {
        if (treeCanopyTimerRef.current) clearTimeout(treeCanopyTimerRef.current);
        treeCanopyTimerRef.current = setTimeout(() => {
          treeCanopyTimerRef.current = null;
          const source = map.getSource('tree-canopies-source');
          if (source) source.setData(getTreeCanopyFeatures(map));
        }, 220);
      }

      if (onCameraChangeRef.current) {
        onCameraChangeRef.current({
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing()
        });
      }
    };

    map.on('moveend', onMapMoveEnd);

    // Map Click
    map.on('click', (e) => {
      const [lng, lat] = [e.lngLat.lng, e.lngLat.lat];

      if (isPocketParkToolActiveRef.current) {
        const halfKm = 0.025; // 25m
        const diagKm = halfKm * Math.SQRT2;
        const nw = turf.destination([lng, lat], diagKm, 315, { units: 'kilometers' }).geometry.coordinates;
        const ne = turf.destination([lng, lat], diagKm, 45, { units: 'kilometers' }).geometry.coordinates;
        const se = turf.destination([lng, lat], diagKm, 135, { units: 'kilometers' }).geometry.coordinates;
        const sw = turf.destination([lng, lat], diagKm, 225, { units: 'kilometers' }).geometry.coordinates;

        const parkPoly = turf.polygon([[nw, ne, se, sw, nw]], {
          id: `pocket-park-${Date.now()}`,
          name: 'Pocket Park (2,500 m²)',
          areaSqm: 2500
        });

        onAddCustomPark(parkPoly);
      } else {
        map.easeTo({
          center: [lng, lat],
          duration: 600
        });
      }
    });

    return () => {
      if (recalculateTimerRef.current) {
        clearTimeout(recalculateTimerRef.current);
        recalculateTimerRef.current = null;
      }
      if (treeCanopyTimerRef.current) {
        clearTimeout(treeCanopyTimerRef.current);
        treeCanopyTimerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update green colors AND force recalculate when El Niño severity changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const dynamicColor = getElNinoGreenColor(elNinoSeverity);

    if (map.getLayer('park')) map.setPaintProperty('park', 'fill-color', dynamicColor);
    if (map.getLayer('landcover_wood')) map.setPaintProperty('landcover_wood', 'fill-color', dynamicColor);
    if (map.getLayer('luntian-green-landcover')) map.setPaintProperty('luntian-green-landcover', 'fill-color', dynamicColor);
    if (map.getLayer('luntian-green-landuse')) map.setPaintProperty('luntian-green-landuse', 'fill-color', dynamicColor);
    if (map.getLayer('tree-canopies-layer')) map.setPaintProperty('tree-canopies-layer', 'circle-color', dynamicColor);
    if (map.getLayer('custom-parks-layer')) map.setPaintProperty('custom-parks-layer', 'fill-color', dynamicColor);
    if (map.getLayer('custom-parks-extrusion')) map.setPaintProperty('custom-parks-extrusion', 'fill-extrusion-color', dynamicColor);
    if (map.getLayer('custom-parks-centroids-layer')) map.setPaintProperty('custom-parks-centroids-layer', 'circle-color', dynamicColor);

    if (map.getLayer('reticle-layer-outline')) {
      const outlineColor = elNinoSeverity > 0.5 ? '#D97706' : BLUEPRINT.ink;
      map.setPaintProperty('reticle-layer-outline', 'line-color', outlineColor);
    }

    map.triggerRepaint();
    forceRecalculate();
  }, [elNinoSeverity]);

  // Update custom parks data dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('custom-parks-source');
    if (source) {
      source.setData(turf.featureCollection([...customParks]));
    }

    // Also update centroid markers so parks are always visible even behind tall buildings
    const centroidSource = map.getSource('custom-parks-centroids');
    if (centroidSource) {
      const centroids = customParks.map(park => {
        try {
          return turf.centroid(park, { properties: park.properties });
        } catch {
          return null;
        }
      }).filter(Boolean);
      centroidSource.setData(turf.featureCollection(centroids));
    }

    map.triggerRepaint();
    forceRecalculate();
  }, [customParks]);

  // Handle Preset Switching & Bounding Box Restrictions
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activePreset) return;

    // Switch geographical boundary
    if (activePreset.id === 'singapore-marina') {
      map.setMaxBounds(SINGAPORE_BOUNDS);
      map.setMinZoom(14.0);
    } else {
      map.setMaxBounds(NCR_BOUNDS);
      map.setMinZoom(13.5);
    }

    map.flyTo({
      center: activePreset.center,
      zoom: activePreset.zoom,
      pitch: activePreset.pitch,
      bearing: activePreset.bearing,
      essential: true,
      duration: 1400
    });
  }, [activePreset]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = isPocketParkToolActive ? 'crosshair' : '';
  }, [isPocketParkToolActive]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
});

export default MapMaquette;
