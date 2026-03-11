import { Link, useNavigate } from 'react-router-dom';
import {
  CHeader,
  CContainer,
  CHeaderToggler,
  CHeaderNav,
  CNavItem,
  CNavLink,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilMenu, cilSun, cilMoon } from '@coreui/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { showSuccess } = useAlert();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showSuccess('Signed out successfully.');
    navigate('/');
  };

  return (
    <CHeader position="sticky" className="mb-4">
      <CContainer fluid>
        <CHeaderToggler onClick={onToggleSidebar}>
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderNav className="ms-auto">
          <CNavItem>
            <CNavLink
              as="button"
              className="btn btn-link nav-link"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <CIcon icon={isDark ? cilSun : cilMoon} size="lg" />
            </CNavLink>
          </CNavItem>
          {isAuthenticated ? (
            <CDropdown variant="nav-item" alignment="end">
              <CDropdownToggle caret={false}>{user?.email}</CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem as={Link} to="/profile">Edit Profile</CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem onClick={handleLogout}>Logout</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          ) : (
            <>
              <CNavItem>
                <CNavLink as={Link} to="/register">Sign up</CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink as={Link} to="/login">Login</CNavLink>
              </CNavItem>
            </>
          )}
        </CHeaderNav>
      </CContainer>
    </CHeader>
  );
}
