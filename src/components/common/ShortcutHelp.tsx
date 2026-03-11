import { CModal, CModalHeader, CModalTitle, CModalBody, CTable } from '@coreui/react';
import { useAuth } from '../../contexts/AuthContext';

interface ShortcutHelpProps {
  show: boolean;
  onClose: () => void;
}

interface ShortcutInfo {
  keys: string[];
  description: string;
  requiresAuth?: boolean;
}

const shortcuts: ShortcutInfo[] = [
  { keys: ['?'], description: 'Show this help' },
  { keys: ['/', 'Ctrl+K'], description: 'Focus search' },
  { keys: ['Escape'], description: 'Close modal / blur input' },
  { keys: ['n'], description: 'Create new item', requiresAuth: true },
  { keys: ['i'], description: 'Go to inventory', requiresAuth: true },
  { keys: ['h'], description: 'Go to home' },
  { keys: ['r'], description: 'Go to reports', requiresAuth: true },
  { keys: ['b'], description: 'Go to BOMs', requiresAuth: true },
];

export default function ShortcutHelp({ show, onClose }: ShortcutHelpProps) {
  const { isAuthenticated } = useAuth();

  const visibleShortcuts = shortcuts.filter(
    (s) => !s.requiresAuth || isAuthenticated
  );

  return (
    <CModal visible={show} onClose={onClose} alignment="center">
      <CModalHeader closeButton>
        <CModalTitle>Keyboard Shortcuts</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CTable striped small>
          <thead>
            <tr>
              <th>Key</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleShortcuts.map((shortcut, index) => (
              <tr key={index}>
                <td>
                  {shortcut.keys.map((key, i) => (
                    <span key={key}>
                      <kbd className="bg-secondary text-white px-2 py-1 rounded">
                        {key}
                      </kbd>
                      {i < shortcut.keys.length - 1 && ' or '}
                    </span>
                  ))}
                </td>
                <td>{shortcut.description}</td>
              </tr>
            ))}
          </tbody>
        </CTable>
      </CModalBody>
    </CModal>
  );
}
