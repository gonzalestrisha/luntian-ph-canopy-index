import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import { getInspectionPolygon, computeZoneMetrics } from '../utils/spatial';
import { getElNinoGreenColor } from '../utils/color';
import { getNearestCity } from '../utils/geoCity';

// Bounding box constraints
const NCR_BOUNDS = [[120.88, 14.32], [121.18, 14.80]];
const SINGAPORE_BOUNDS = [[103.82, 1.25], [103.88, 1.32]];

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

  useEffect(() => {
    isPocketParkToolActiveRef.current = isPocketParkToolActive;
  }, [isPocketParkToolActive]);

  useEffect(() => {
    customParksRef.current = customParks;
  }, [customParks]);

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

  const forceRecalculate = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const center = map.getCenter();
    const reticle = getInspectionPolygon([center.lng, center.lat]);
    
    const source = map.getSource('reticle-source');
    if (source) {
      source.setData(reticle);
    }

    const computed = computeZoneMetrics(map, reticle, customParksRef.current, elNinoSeverity);
    onMetricsCalculated(computed);

    const nearestCity = getNearestCity([center.lng, center.lat]);
    if (onLocationChange) {
      onLocationChange(nearestCity, [center.lng, center.lat]);
    }
  };

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
      });

      if (map.getLayer('background')) {
        map.setPaintProperty('background', 'background-color', '#F3F4F6');
      }

      map.setLight({
        anchor: 'viewport',
        color: '#FFFFFF',
        intensity: 0.45,
        position: [1.15, 210, 30]
      });

      const initialGreen = getElNinoGreenColor(0);

      if (map.getLayer('park')) {
        map.setPaintProperty('park', 'fill-color', initialGreen);
        map.setPaintProperty('park', 'fill-opacity', 0.85);
      }

      if (map.getLayer('landcover_wood')) {
        map.setPaintProperty('landcover_wood', 'fill-color', initialGreen);
        map.setPaintProperty('landcover_wood', 'fill-opacity', 0.85);
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
            'fill-opacity': 0.85
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
            'fill-opacity': 0.85
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
            'fill-extrusion-color': '#FFFFFF',
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
            'fill-extrusion-opacity': 0.96
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
          'fill-opacity': 0.06
        }
      });

      map.addLayer({
        id: 'reticle-layer-outline',
        type: 'line',
        source: 'reticle-source',
        paint: {
          'line-color': '#059669',
          'line-width': 2.5,
          'line-dasharray': [3, 2],
          'line-opacity': 0.90
        }
      });

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
          'fill-extrusion-height': 5,
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
          'fill-opacity': 0.95
        }
      });

      map.addLayer({
        id: 'custom-parks-outline',
        type: 'line',
        source: 'custom-parks-source',
        paint: {
          'line-color': '#047857',
          'line-width': 3.5,
          'line-opacity': 1
        }
      });

      forceRecalculate();
    });

    const onMapMoveEnd = () => {
      forceRecalculate();

      if (onCameraChange) {
        onCameraChange({
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing()
        });
      }
    };

    map.on('moveend', onMapMoveEnd);

    map.on('idle', () => {
      if (!isCalculatingRef.current) {
        forceRecalculate();
      }
    });

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
    if (map.getLayer('custom-parks-layer')) map.setPaintProperty('custom-parks-layer', 'fill-color', dynamicColor);
    if (map.getLayer('custom-parks-extrusion')) map.setPaintProperty('custom-parks-extrusion', 'fill-extrusion-color', dynamicColor);

    if (map.getLayer('reticle-layer-outline')) {
      const outlineColor = elNinoSeverity > 0.5 ? '#D97706' : '#059669';
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
      map.triggerRepaint();
      forceRecalculate();
    }
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
