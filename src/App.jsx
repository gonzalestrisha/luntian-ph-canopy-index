import React, { useState, useRef } from 'react';
import { CITY_PRESETS } from './constants/presets';
import { getDefaultMetrics } from './utils/spatial';
import { CITY_DATABASE } from './utils/geoCity';
import TopBar from './components/TopBar';
import TelemetryPanel from './components/TelemetryPanel';
import MapMaquette from './components/MapMaquette';
import ZoomControls from './components/ZoomControls';
import ExplainerModal from './components/ExplainerModal';

export default function App() {
  const mapRef = useRef(null);

  const [activePreset, setActivePreset] = useState(CITY_PRESETS[0]);
  const [currentLocation, setCurrentLocation] = useState(CITY_DATABASE[0]);
  const [metrics, setMetrics] = useState(getDefaultMetrics());
  const [elNinoSeverity, setElNinoSeverity] = useState(0.0);
  const [isPocketParkToolActive, setIsPocketParkToolActive] = useState(false);
  const [customParks, setCustomParks] = useState([]);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);

  // Camera state for zoom controls
  const [cameraState, setCameraState] = useState({
    zoom: CITY_PRESETS[0].zoom,
    pitch: CITY_PRESETS[0].pitch,
    bearing: CITY_PRESETS[0].bearing
  });

  const handleSelectPreset = (preset) => {
    setActivePreset(preset);
    const matchedCity = CITY_DATABASE.find(c => 
      c.name.toLowerCase().includes(preset.city.toLowerCase()) || 
      c.city.toLowerCase().includes(preset.city.toLowerCase())
    );
    if (matchedCity) {
      setCurrentLocation(matchedCity);
    }
    setCameraState({
      zoom: preset.zoom,
      pitch: preset.pitch,
      bearing: preset.bearing
    });
  };

  const handleTogglePocketParkTool = () => {
    setIsPocketParkToolActive((prev) => !prev);
  };

  const handleAddCustomPark = (parkPolygon) => {
    setCustomParks((prev) => [...prev, parkPolygon]);
  };

  const handleClearCustomParks = () => {
    setCustomParks([]);
  };

  // Camera control handlers
  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleZoomSliderChange = (newZoom) => {
    setCameraState((prev) => ({ ...prev, zoom: newZoom }));
    mapRef.current?.setZoom(newZoom);
  };

  const handleTogglePitch = () => {
    mapRef.current?.togglePitch();
  };

  const handleResetBearing = () => {
    mapRef.current?.resetBearing();
  };

  const handleResetZoom = () => {
    mapRef.current?.setZoom(15.5);
    setCameraState((prev) => ({ ...prev, zoom: 15.5 }));
  };

  const handleCameraChange = (newCam) => {
    setCameraState(newCam);
  };

  // Check if camera moved away from active preset -> auto unselect
  const handleLocationChange = (cityInfo, currentCenter) => {
    if (cityInfo) {
      setCurrentLocation(cityInfo);
    }

    if (activePreset && currentCenter) {
      const [lng, lat] = currentCenter;
      const [pLng, pLat] = activePreset.center;
      const dist = Math.sqrt(Math.pow(lng - pLng, 2) + Math.pow(lat - pLat, 2));
      // ~0.005 degrees is ~550m
      if (dist > 0.005) {
        setActivePreset(null);
      }
    }
  };

  const handleRefreshMetrics = () => {
    mapRef.current?.recalculate();
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#F3F4F6]">
      {/* Top Floating Bar */}
      <TopBar
        activePreset={activePreset}
        currentLocation={currentLocation}
        onSelectPreset={handleSelectPreset}
        elNinoSeverity={elNinoSeverity}
      />

      {/* 2.5D Map Canvas */}
      <MapMaquette
        ref={mapRef}
        initialPreset={CITY_PRESETS[0]}
        activePreset={activePreset}
        elNinoSeverity={elNinoSeverity}
        isPocketParkToolActive={isPocketParkToolActive}
        customParks={customParks}
        onAddCustomPark={handleAddCustomPark}
        onMetricsCalculated={setMetrics}
        onCameraChange={handleCameraChange}
        onLocationChange={handleLocationChange}
      />

      {/* Bottom-Left Zoom & Pitch Controls */}
      <ZoomControls
        zoom={cameraState.zoom}
        pitch={cameraState.pitch}
        bearing={cameraState.bearing}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomSliderChange={handleZoomSliderChange}
        onResetZoom={handleResetZoom}
        onTogglePitch={handleTogglePitch}
        onResetBearing={handleResetBearing}
      />

      {/* Floating Telemetry & Policy HUD */}
      <TelemetryPanel
        currentLocation={currentLocation}
        metrics={metrics}
        elNinoSeverity={elNinoSeverity}
        onElNinoChange={setElNinoSeverity}
        isPocketParkToolActive={isPocketParkToolActive}
        onTogglePocketParkTool={handleTogglePocketParkTool}
        onClearCustomParks={handleClearCustomParks}
        onRefreshMetrics={handleRefreshMetrics}
        onOpenExplainer={() => setIsExplainerOpen(true)}
      />

      {/* Concise Explainer Modal */}
      <ExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />
    </main>
  );
}
