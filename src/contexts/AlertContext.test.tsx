import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AlertProvider, useAlert } from './AlertContext';

function TestComponent() {
  const { alerts, showAlert, showSuccess, showError, showWarning, dismissAlert } = useAlert();

  return (
    <div>
      <div data-testid="alert-count">{alerts.length}</div>
      {alerts.map((alert) => (
        <div key={alert.id} data-testid={`alert-${alert.id}`}>
          <span data-testid={`alert-type-${alert.id}`}>{alert.type}</span>
          <span data-testid={`alert-message-${alert.id}`}>{alert.message}</span>
          <button onClick={() => dismissAlert(alert.id)}>Dismiss</button>
        </div>
      ))}
      <button onClick={() => showAlert('Info message')}>Show Info</button>
      <button onClick={() => showSuccess('Success message')}>Show Success</button>
      <button onClick={() => showError('Error message')}>Show Error</button>
      <button onClick={() => showWarning('Warning message')}>Show Warning</button>
    </div>
  );
}

describe('AlertContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws error when useAlert is used outside AlertProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAlert must be used within an AlertProvider');

    consoleError.mockRestore();
  });

  it('provides empty alerts array initially', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );

    expect(screen.getByTestId('alert-count')).toHaveTextContent('0');
  });

  it('showAlert adds an info alert', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );

    act(() => {
      screen.getByText('Show Info').click();
    });

    expect(screen.getByTestId('alert-count')).toHaveTextContent('1');
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('showSuccess adds a success alert', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('showError adds a danger alert', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );

    act(() => {
      screen.getByText('Show Error').click();
    });

    expect(screen.getByText('danger')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('showWarning adds a warning alert', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );

    act(() => {
      screen.getByText('Show Warning').click();
    });

    expect(screen.getByText('warning')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('dismissAlert removes an alert', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    expect(screen.getByTestId('alert-count')).toHaveTextContent('1');

    act(() => {
      screen.getByText('Dismiss').click();
    });

    expect(screen.getByTestId('alert-count')).toHaveTextContent('0');
  });

  it('does not auto-dismiss alerts (handled by CToast)', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    expect(screen.getByTestId('alert-count')).toHaveTextContent('1');

    // Alerts are no longer auto-dismissed by the context - CToast handles that
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId('alert-count')).toHaveTextContent('1');
  });

  it('handles multiple alerts', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
      screen.getByText('Show Error').click();
      screen.getByText('Show Warning').click();
    });

    expect(screen.getByTestId('alert-count')).toHaveTextContent('3');
  });
});
