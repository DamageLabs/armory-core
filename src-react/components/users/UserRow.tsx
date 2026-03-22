import { Link } from 'react-router-dom';
import { CFormSelect, CButton, CButtonGroup } from '@coreui/react';
import { UserWithoutPassword, UserRole } from '../../types/User';

interface UserRowProps {
  user: UserWithoutPassword;
  currentUserId?: number;
  onRoleChange: (userId: number, role: UserRole) => void;
  onDelete: () => void;
}

const ROLES: UserRole[] = ['user', 'vip', 'admin'];

export default function UserRow({ user, currentUserId, onRoleChange, onDelete }: UserRowProps) {
  const isCurrentUser = user.id === currentUserId;

  return (
    <tr>
      <td>
        <Link to={`/users/${user.id}`}>{user.email}</Link>
      </td>
      <td>
        <CFormSelect
          size="sm"
          value={user.role}
          onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
          style={{ width: '120px' }}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </CFormSelect>
      </td>
      <td>
        <CButtonGroup size="sm">
          <CButton
            color="primary"
            onClick={() => onRoleChange(user.id, user.role)}
          >
            Change Role
          </CButton>
          {!isCurrentUser && (
            <CButton color="danger" onClick={onDelete}>
              Delete
            </CButton>
          )}
        </CButtonGroup>
      </td>
    </tr>
  );
}
