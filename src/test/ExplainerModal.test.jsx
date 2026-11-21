import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExplainerModal from '../components/ExplainerModal';

describe('ExplainerModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ExplainerModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal content when isOpen is true', () => {
    render(<ExplainerModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('How to Read LUNTIAN 2.5D')).toBeInTheDocument();
  });

  it('shows all three concept cards', () => {
    render(<ExplainerModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/600m × 600m Ground Reticle/)).toBeInTheDocument();
    expect(screen.getByText(/Green Ground/)).toBeInTheDocument();
    expect(screen.getByText(/Resilience Scale/)).toBeInTheDocument();
  });

  it('calls onClose when the X button is clicked', () => {
    const onClose = vi.fn();
    render(<ExplainerModal isOpen={true} onClose={onClose} />);
    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<ExplainerModal isOpen={true} onClose={onClose} />);
    // The outermost fixed div is the backdrop
    const backdrop = container.firstChild;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when clicking inside the modal content', () => {
    const onClose = vi.fn();
    render(<ExplainerModal isOpen={true} onClose={onClose} />);
    const heading = screen.getByText('How to Read LUNTIAN 2.5D');
    fireEvent.click(heading);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders all 4 reference links', () => {
    render(<ExplainerModal isOpen={true} onClose={vi.fn()} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
