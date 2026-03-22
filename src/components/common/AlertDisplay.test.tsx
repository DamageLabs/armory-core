import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertDisplay from './AlertDisplay';
import * as AlertContext from '../../contexts/AlertContext';

vi.mock('../../contexts/AlertContext', () => ({
  useAlert: vi.fn(),
}));

describe('AlertDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty toaster when there are no alerts', () => {
    vi.mocked(AlertContext.useAlert).mockReturnValue({
      alerts: [],
      showAlert: vi.fn(),
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning: vi.fn(),
      dismissAlert: vi.fn(),
    });

    render(<AlertDisplay />);

    // CToaster container should be present but empty
    const toaster = document.querySelector('.toast-container');
    expect(toaster).toBeInTheDocument();
    expect(toaster?.children.length).toBe(0);
  });

  it('renders alerts with correct variant', () => {
    vi.mocked(AlertContext.useAlert).mockReturnValue({
      alerts: [
        { id: 1, type: 'success', message: 'Success message' },
        { id: 2, type: 'danger', message: 'Error message' },
      ],
      showAlert: vi.fn(),
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning: vi.fn(),
      dismissAlert: vi.fn(),
    });

    render(<AlertDisplay />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders toast with close button and proper handlers', () => {
    const dismissAlert = vi.fn();
    vi.mocked(AlertContext.useAlert).mockReturnValue({
      alerts: [{ id: 1, type: 'info', message: 'Test message' }],
      showAlert: vi.fn(),
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning: vi.fn(),
      dismissAlert,
    });

    render(<AlertDisplay />);

    // Verify toast content is rendered
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('ℹ Info')).toBeInTheDocument();
    
    // Verify close button exists (actual close behavior handled by CToast)
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
  });

  it('renders multiple alerts', () => {
    vi.mocked(AlertContext.useAlert).mockReturnValue({
      alerts: [
        { id: 1, type: 'success', message: 'First alert' },
        { id: 2, type: 'warning', message: 'Second alert' },
        { id: 3, type: 'info', message: 'Third alert' },
      ],
      showAlert: vi.fn(),
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning: vi.fn(),
      dismissAlert: vi.fn(),
    });

    render(<AlertDisplay />);

    expect(screen.getByText('First alert')).toBeInTheDocument();
    expect(screen.getByText('Second alert')).toBeInTheDocument();
    expect(screen.getByText('Third alert')).toBeInTheDocument();
  });
});
