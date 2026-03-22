import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type AlertType = 'success' | 'danger' | 'warning' | 'info';

interface Alert {
  id: number;
  type: AlertType;
  message: string;
}

interface AlertContextType {
  alerts: Alert[];
  showAlert: (message: string, type?: AlertType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  dismissAlert: (id: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

let alertId = 0;

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const showAlert = useCallback((message: string, type: AlertType = 'info') => {
    const id = ++alertId;
    setAlerts((prev) => [...prev, { id, type, message }]);
    
    // Note: CToast component handles auto-dismiss with autohide prop
    // Manual dismissal happens via dismissAlert function
  }, []);

  const showSuccess = useCallback((message: string) => {
    showAlert(message, 'success');
  }, [showAlert]);

  const showError = useCallback((message: string) => {
    showAlert(message, 'danger');
  }, [showAlert]);

  const showWarning = useCallback((message: string) => {
    showAlert(message, 'warning');
  }, [showAlert]);

  const dismissAlert = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const value: AlertContextType = {
    alerts,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    dismissAlert,
  };

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlert(): AlertContextType {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
