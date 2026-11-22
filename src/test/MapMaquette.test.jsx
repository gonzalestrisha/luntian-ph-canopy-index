import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import MapMaquette from '../components/MapMaquette';
import { CITY_PRESETS } from '../constants/presets';

const mocks = vi.hoisted(() => ({ instance: null, fail: false }));
vi.mock('maplibre-gl', () => ({
  setWorkerUrl: vi.fn(),
  Map: class {
    constructor() {
      if (mocks.fail) throw new Error('WebGL unavailable');
      this.canvas = document.createElement('canvas');
      this.events = {};
      this.sources = {};
      this.layers = [];
      mocks.instance = this;
    }
    setStyle(_url, options) { this.transformStyle = options.transformStyle; }
    on(name, callback) { this.events[name] = callback; }
    getStyle() { return { layers: [] }; }
    getLayer() { return null; }
    setLight() {}
    addSource(id, source) { this.sources[id] = { ...source, setData: vi.fn() }; }
    getSource(id) { return this.sources[id]; }
    addLayer(layer) { this.layers.push(layer); }
    project() { return { x: 1, y: 1 }; }
    queryRenderedFeatures() { return []; }
    isStyleLoaded() { return true; }
    getCanvas() { return this.canvas; }
    getCenter() { return { lng: 121, lat: 14.6 }; }
    setMaxBounds() {}
    setMinZoom() {}
    flyTo() {}
    triggerRepaint() {}
    remove() {}
  }
}));

describe('MapMaquette', () => {
  const props = {
    initialPreset: CITY_PRESETS[0], activePreset: null, elNinoSeverity: 0,
    isPocketParkToolActive: true, customParks: [], onAddCustomPark: vi.fn(),
    onMetricsCalculated: vi.fn(), onStatusChange: vi.fn()
  };

  it('plants at the map center from the keyboard', () => {
    const addPark = vi.fn();
    render(<MapMaquette {...props} onAddCustomPark={addPark} />);
    fireEvent.keyDown(mocks.instance.canvas, { key: 'Enter' });
    expect(addPark).toHaveBeenCalledOnce();
    expect(addPark.mock.calls[0][0].properties.areaSqm).toBe(2500);
  });

  it('initializes the style before reporting measured data', () => {
    const status = vi.fn();
    const metrics = vi.fn();
    render(<MapMaquette {...props} onStatusChange={status} onMetricsCalculated={metrics} />);
    const map = mocks.instance;
    const styled = map.transformStyle(null, { layers: [{ id: 'labels', type: 'symbol' }] });
    expect(styled.layers[0].layout.visibility).toBe('none');
    map.events.load();
    const crowns = map.layers.find(layer => layer.id === 'tree-canopies-layer');
    expect(crowns.paint['circle-radius'][0]).toBe('interpolate');
    expect(metrics).not.toHaveBeenCalled();
    map.events.idle();
    expect(status).toHaveBeenCalledWith('ready');
    expect(metrics.mock.calls[0][0].greenArea).toBe(0);
  });

  it('reports unavailable when WebGL initialization fails', () => {
    mocks.fail = true;
    const status = vi.fn();
    render(<MapMaquette {...props} onStatusChange={status} />);
    expect(status).toHaveBeenCalledWith('unavailable');
    mocks.fail = false;
  });
});
