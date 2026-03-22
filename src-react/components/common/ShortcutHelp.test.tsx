import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShortcutHelp from './ShortcutHelp';
import * as AuthContext from '../../contexts/AuthContext';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockAuth = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  deleteAccount: vi.fn(),
  refreshUser: vi.fn(),
};

describe('ShortcutHelp', () => {
  it('renders nothing when show is false', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue(mockAuth);
    const { container } = render(<ShortcutHelp show={false} onClose={vi.fn()} />);
    expect(container.querySelector('.modal')).not.toBeInTheDocument();
  });

  it('renders modal with title when show is true', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue(mockAuth);
    render(<ShortcutHelp show={true} onClose={vi.fn()} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('shows only non-auth shortcuts when not authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue(mockAuth);
    render(<ShortcutHelp show={true} onClose={vi.fn()} />);
    expect(screen.getByText('Show this help')).toBeInTheDocument();
    expect(screen.getByText('Go to home')).toBeInTheDocument();
    expect(screen.queryByText('Create new item')).not.toBeInTheDocument();
  });

  it('shows all shortcuts when authenticated', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({ ...mockAuth, isAuthenticated: true });
    render(<ShortcutHelp show={true} onClose={vi.fn()} />);
    expect(screen.getByText('Create new item')).toBeInTheDocument();
    expect(screen.getByText('Go to inventory')).toBeInTheDocument();
    expect(screen.getByText('Go to reports')).toBeInTheDocument();
    expect(screen.getByText('Go to BOMs')).toBeInTheDocument();
  });
});
