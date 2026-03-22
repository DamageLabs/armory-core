import { CToaster, CToast, CToastHeader, CToastBody } from '@coreui/react';
import { useAlert } from '../../contexts/AlertContext';

export default function AlertDisplay() {
  const { alerts, dismissAlert } = useAlert();

  return (
    <CToaster className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
      {alerts.map((alert) => (
        <CToast
          key={alert.id}
          visible
          autohide
          delay={5000}
          onClose={() => dismissAlert(alert.id)}
        >
          <CToastHeader closeButton>
            <div className="fw-bold me-auto">
              {alert.type === 'success' && '✓ Success'}
              {alert.type === 'danger' && '✗ Error'}
              {alert.type === 'warning' && '⚠ Warning'}
              {alert.type === 'info' && 'ℹ Info'}
            </div>
          </CToastHeader>
          <CToastBody>{alert.message}</CToastBody>
        </CToast>
      ))}
    </CToaster>
  );
}
