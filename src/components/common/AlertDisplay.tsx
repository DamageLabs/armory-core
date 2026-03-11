import { CAlert } from '@coreui/react';
import { useAlert } from '../../contexts/AlertContext';

export default function AlertDisplay() {
  const { alerts, dismissAlert } = useAlert();

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="alert-container">
      {alerts.map((alert) => (
        <CAlert
          key={alert.id}
          color={alert.type}
          dismissible
          onClose={() => dismissAlert(alert.id)}
        >
          {alert.message}
        </CAlert>
      ))}
    </div>
  );
}
