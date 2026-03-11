import { Link } from 'react-router-dom';
import { CButton } from '@coreui/react';
import { IconType } from 'react-icons';
import { FaBoxOpen } from 'react-icons/fa';

interface EmptyStateProps {
  icon?: IconType;
  title: string;
  description?: string;
  actionLabel?: string;
  actionPath?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon = FaBoxOpen,
  title,
  description,
  actionLabel,
  actionPath,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-5">
      <Icon size={48} className="text-muted mb-3" aria-hidden="true" />
      <h5 className="text-muted">{title}</h5>
      {description && <p className="text-muted mb-4">{description}</p>}
      {actionLabel && actionPath && (
        <Link to={actionPath} className="btn btn-primary">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionPath && (
        <CButton color="primary" onClick={onAction}>
          {actionLabel}
        </CButton>
      )}
    </div>
  );
}
