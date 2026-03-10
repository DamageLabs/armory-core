import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserRow from './UserRow';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  role: 'user' as const,
  signInCount: 3,
  lastSignInAt: '2026-01-01T00:00:00Z',
  lastSignInIp: '127.0.0.1',
  emailVerified: true,
  emailVerificationToken: null,
  emailVerificationTokenExpiresAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function renderRow(props: Partial<Parameters<typeof UserRow>[0]> = {}) {
  return render(
    <MemoryRouter>
      <table>
        <tbody>
          <UserRow
            user={mockUser}
            onRoleChange={vi.fn()}
            onDelete={vi.fn()}
            {...props}
          />
        </tbody>
      </table>
    </MemoryRouter>
  );
}

describe('UserRow', () => {
  it('renders user email as link', () => {
    renderRow();
    const link = screen.getByText('test@example.com');
    expect(link.closest('a')).toHaveAttribute('href', '/users/1');
  });

  it('renders role select with current role', () => {
    renderRow();
    const select = screen.getByDisplayValue('User');
    expect(select).toBeInTheDocument();
  });

  it('shows delete button when not current user', () => {
    renderRow({ currentUserId: 2 });
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('hides delete button for current user', () => {
    renderRow({ currentUserId: 1 });
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('calls onDelete when delete clicked', () => {
    const onDelete = vi.fn();
    renderRow({ currentUserId: 2, onDelete });
    screen.getByText('Delete').click();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('calls onRoleChange when Change Role clicked', () => {
    const onRoleChange = vi.fn();
    renderRow({ onRoleChange });
    screen.getByText('Change Role').click();
    expect(onRoleChange).toHaveBeenCalledWith(1, 'user');
  });
});
