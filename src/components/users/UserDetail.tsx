import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CCard, CCardHeader, CCardBody, CRow, CCol, CButton } from '@coreui/react';
import * as userService from '../../services/userService';
import { UserWithoutPassword } from '../../types/User';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();
  const { showError } = useAlert();
  const [user, setUser] = useState<UserWithoutPassword | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (id) {
        const userId = parseInt(id);

        // Non-admins can only view their own profile
        if (!isAdmin && currentUser?.id !== userId) {
          showError('Access denied.');
          navigate('/');
          return;
        }

        const foundUser = await userService.getUserById(userId);
        if (foundUser) {
          setUser(foundUser);
        } else {
          showError('User not found.');
          navigate('/users');
        }
      }
    };
    loadUser();
  }, [id, navigate, showError, currentUser, isAdmin]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <CCard>
      <CCardHeader>
        <h4 className="mb-0">User Details</h4>
      </CCardHeader>
      <CCardBody>
        <CRow className="mb-2">
          <CCol md={3} className="text-muted">Email</CCol>
          <CCol md={9}>{user.email}</CCol>
        </CRow>

        <CRow className="mb-2">
          <CCol md={3} className="text-muted">Role</CCol>
          <CCol md={9} className="text-capitalize">{user.role}</CCol>
        </CRow>

        <CRow className="mb-2">
          <CCol md={3} className="text-muted">Sign In Count</CCol>
          <CCol md={9}>{user.signInCount}</CCol>
        </CRow>

        <CRow className="mb-2">
          <CCol md={3} className="text-muted">Last IP</CCol>
          <CCol md={9}>{user.lastSignInIp || 'N/A'}</CCol>
        </CRow>

        <CRow className="mb-2">
          <CCol md={3} className="text-muted">Last Sign In</CCol>
          <CCol md={9}>{formatDate(user.lastSignInAt)}</CCol>
        </CRow>

        <CRow className="mb-2">
          <CCol md={3} className="text-muted">User Created</CCol>
          <CCol md={9}>{formatDate(user.createdAt)}</CCol>
        </CRow>

        <CRow className="mb-2">
          <CCol md={3} className="text-muted">User Updated</CCol>
          <CCol md={9}>{formatDate(user.updatedAt)}</CCol>
        </CRow>

        <hr />

        <CButton color="danger" onClick={() => navigate(-1)}>
          Back
        </CButton>
      </CCardBody>
    </CCard>
  );
}
