import { useNavigate } from 'react-router-dom';
import CIcon from '@coreui/icons-react';
import {
  cilPlus,
  cilPencil,
  cilTrash,
  cilUser,
  cilCloudUpload,
  cilLayers,
  cilApplications,
  cilSettings,
  cilWarning,
  cilSwapHorizontal,
} from '@coreui/icons';
import { CBadge } from '@coreui/react';
import { AuditEntry } from '../../types/AuditLog';

const ACTION_CONFIG: Record<string, { icon: string[]; color: string; label: string }> = {
  'item.created': { icon: cilPlus, color: 'success', label: 'Created' },
  'item.updated': { icon: cilPencil, color: 'info', label: 'Updated' },
  'item.deleted': { icon: cilTrash, color: 'danger', label: 'Deleted' },
  'item.bulk_created': { icon: cilPlus, color: 'success', label: 'Bulk Created' },
  'item.bulk_deleted': { icon: cilTrash, color: 'danger', label: 'Bulk Deleted' },
  'item.category_changed': { icon: cilSwapHorizontal, color: 'warning', label: 'Category Changed' },
  'user.login': { icon: cilUser, color: 'info', label: 'Login' },
  'user.login_failed': { icon: cilWarning, color: 'danger', label: 'Login Failed' },
  'user.registered': { icon: cilPlus, color: 'success', label: 'Registered' },
  'user.profile_updated': { icon: cilPencil, color: 'info', label: 'Profile Updated' },
  'user.deleted': { icon: cilTrash, color: 'danger', label: 'Deleted' },
  'user.role_changed': { icon: cilSettings, color: 'warning', label: 'Role Changed' },
  'receipt.uploaded': { icon: cilCloudUpload, color: 'success', label: 'Uploaded' },
  'receipt.deleted': { icon: cilTrash, color: 'danger', label: 'Deleted' },
  'category.created': { icon: cilPlus, color: 'success', label: 'Created' },
  'category.updated': { icon: cilPencil, color: 'info', label: 'Updated' },
  'category.deleted': { icon: cilTrash, color: 'danger', label: 'Deleted' },
  'type.created': { icon: cilPlus, color: 'success', label: 'Created' },
  'type.updated': { icon: cilPencil, color: 'info', label: 'Updated' },
  'type.deleted': { icon: cilTrash, color: 'danger', label: 'Deleted' },
  'bom.created': { icon: cilLayers, color: 'success', label: 'Created' },
  'bom.updated': { icon: cilPencil, color: 'info', label: 'Updated' },
  'bom.deleted': { icon: cilTrash, color: 'danger', label: 'Deleted' },
  'bom.duplicated': { icon: cilLayers, color: 'info', label: 'Duplicated' },
};

const RESOURCE_LABELS: Record<string, string> = {
  item: 'Item',
  user: 'User',
  receipt: 'Receipt',
  category: 'Category',
  inventory_type: 'Inventory Type',
  bom: 'BOM',
};

function getResourceLink(entry: AuditEntry): string | null {
  if (!entry.resourceId) return null;
  switch (entry.resourceType) {
    case 'item': return `/items/${entry.resourceId}`;
    case 'user': return `/users/${entry.resourceId}`;
    case 'bom': return `/bom/${entry.resourceId}`;
    default: return null;
  }
}

function formatDescription(entry: AuditEntry): string {
  const name = entry.details?.name as string | undefined;
  const resourceLabel = RESOURCE_LABELS[entry.resourceType] || entry.resourceType;

  if (name) return `${resourceLabel} "${name}"`;
  if (entry.details?.count) return `${entry.details.count} ${resourceLabel.toLowerCase()}(s)`;
  if (entry.details?.email) return `${entry.details.email}`;
  return `${resourceLabel} #${entry.resourceId || ''}`;
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

interface AuditLogEntryProps {
  entry: AuditEntry;
}

export default function AuditLogEntryRow({ entry }: AuditLogEntryProps) {
  const navigate = useNavigate();
  const config = ACTION_CONFIG[entry.action] || { icon: cilApplications, color: 'secondary', label: entry.action };
  const link = getResourceLink(entry);
  const description = formatDescription(entry);

  return (
    <tr>
      <td className="text-center" style={{ width: 40 }}>
        <CIcon icon={config.icon} className={`text-${config.color}`} />
      </td>
      <td>
        <CBadge color={config.color} shape="rounded-pill" size="sm">
          {config.label}
        </CBadge>
      </td>
      <td>
        {link ? (
          <a
            href={link}
            onClick={(e) => { e.preventDefault(); navigate(link); }}
            className="text-decoration-none"
          >
            {description}
          </a>
        ) : (
          description
        )}
      </td>
      <td className="text-muted">{entry.userEmail || 'System'}</td>
      <td className="text-muted text-end" title={new Date(entry.timestamp).toLocaleString()}>
        {timeAgo(entry.timestamp)}
      </td>
    </tr>
  );
}
