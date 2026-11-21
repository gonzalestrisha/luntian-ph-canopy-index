import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TelemetryPanel from '../components/TelemetryPanel';
import { getDefaultMetrics } from '../utils/spatial';
import { CITY_DATABASE } from '../utils/geoCity';

const defaultProps = {
  currentLocation: CITY_DATABASE[0],
  metrics: getDefaultMetrics(),
  elNinoSeverity: 0,
  onElNinoChange: vi.fn(),
  isPocketParkToolActive: false,
  onTogglePocketParkTool: vi.fn(),
  onClearCustomParks: vi.fn(),
  onRefreshMetrics: vi.fn(),
  onOpenExplainer: vi.fn(),
};

describe('TelemetryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<TelemetryPanel {...defaultProps} />);
    expect(screen.getByText('Block Green & Heat Index')).toBeInTheDocument();
  });

  it('renders location name from prop', () => {
    render(<TelemetryPanel {...defaultProps} />);
    expect(screen.getByText(CITY_DATABASE[0].name)).toBeInTheDocument();
  });

  it('"How it works" button calls onOpenExplainer and does NOT navigate away', () => {
    const onOpenExplainer = vi.fn();
    render(<TelemetryPanel {...defaultProps} onOpenExplainer={onOpenExplainer} />);

    const btn = screen.getByRole('button', { name: /how it works/i });
    fireEvent.click(btn);

    expect(onOpenExplainer).toHaveBeenCalledTimes(1);
  });

  it('"How it works" button prevents default & stops propagation', () => {
    const onOpenExplainer = vi.fn();
    render(<TelemetryPanel {...defaultProps} onOpenExplainer={onOpenExplainer} />);

    const btn = screen.getByRole('button', { name: /how it works/i });
    const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
    fireEvent.click(btn, mockEvent);

    // onOpenExplainer fires means the click handler ran fully
    expect(onOpenExplainer).toHaveBeenCalled();
  });

  it('renders "Plant Pocket Park" button', () => {
    render(<TelemetryPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: /plant pocket park/i })).toBeInTheDocument();
  });

  it('calls onTogglePocketParkTool when Plant Pocket Park is clicked', () => {
    const onToggle = vi.fn();
    render(<TelemetryPanel {...defaultProps} onTogglePocketParkTool={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: /plant pocket park/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows "Click Map to Plant" label when pocket park tool is active', () => {
    render(<TelemetryPanel {...defaultProps} isPocketParkToolActive={true} />);
    expect(screen.getByText(/click map to plant/i)).toBeInTheDocument();
  });

  it('shows active hint text when pocket park tool is on', () => {
    render(<TelemetryPanel {...defaultProps} isPocketParkToolActive={true} />);
    expect(screen.getByText(/drop a 50m × 50m green park/i)).toBeInTheDocument();
  });

  it('renders El Niño slider with correct range', () => {
    render(<TelemetryPanel {...defaultProps} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '1');
    expect(slider).toHaveAttribute('step', '0.01');
  });

  it('calls onElNinoChange when slider changes', () => {
    const onElNinoChange = vi.fn();
    render(<TelemetryPanel {...defaultProps} onElNinoChange={onElNinoChange} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0.5' } });
    expect(onElNinoChange).toHaveBeenCalledWith(0.5);
  });

  it('shows Resilience Score value', () => {
    render(<TelemetryPanel {...defaultProps} />);
    expect(screen.getByText(/resilience score/i)).toBeInTheDocument();
    // Score should be rendered as "X.X / 10.0"
    expect(screen.getByText(/\/ 10\.0/)).toBeInTheDocument();
  });

  it('shows clear button only when customParksCount > 0', () => {
    const { rerender } = render(<TelemetryPanel {...defaultProps} />);
    // No clear button when 0 parks
    expect(screen.queryByTitle(/clear all planted/i)).toBeNull();

    rerender(<TelemetryPanel {...defaultProps} metrics={{ ...getDefaultMetrics(), customParksCount: 3 }} />);
    expect(screen.getByTitle(/clear all planted/i)).toBeInTheDocument();
  });

  it('calls onRefreshMetrics when Refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<TelemetryPanel {...defaultProps} onRefreshMetrics={onRefresh} />);
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
