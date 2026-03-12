import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CRow, CCol, CCard, CCardHeader, CCardBody, CForm, CFormLabel, CFormInput, CFormText, CButton, CButtonGroup } from '@coreui/react';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import ConfirmModal from '../common/ConfirmModal';
import { PASSWORD_RULES } from '../../constants/config';

export default function EditProfile() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { showSuccess, showError } = useAlert();
  const navigate = useNavigate();

  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password && password !== passwordConfirmation) {
      showError('Password confirmation does not match.');
      return;
    }

    try {
      const updatedUser = await updateProfile({
        email: email !== user?.email ? email : undefined,
        password: password || undefined,
        currentPassword,
      });

      if (updatedUser) {
        showSuccess('Your account has been updated successfully.');
        navigate('/items');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Update failed.');
    }
  };

  const handleDeleteAccount = async () => {
    const result = await deleteAccount();
    if (result) {
      showSuccess('Your account has been cancelled.');
      navigate('/');
    } else {
      showError('Failed to delete account.');
    }
    setShowDeleteModal(false);
  };

  return (
    <CRow className="justify-content-center">
      <CCol md={6} lg={5}>
        <CCard className="border-primary">
          <CCardHeader className="bg-primary text-white">
            <h4 className="mb-0">Edit User</h4>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSubmit}>
              <div className="mb-3">
                <CFormLabel htmlFor="email">Email</CFormLabel>
                <CFormInput
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="password">Password</CFormLabel>
                <CFormInput
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={10}
                />
                {password ? (
                  <ul className="list-unstyled mt-1 mb-0 small">
                    {PASSWORD_RULES.map((rule) => (
                      <li key={rule.label} className={rule.test(password) ? 'text-success' : 'text-muted'}>
                        {rule.test(password) ? '\u2713' : '\u2022'} {rule.label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <CFormText className="text-muted">
                    Leave blank if you don't want to change it
                  </CFormText>
                )}
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="passwordConfirmation">Password Confirmation</CFormLabel>
                <CFormInput
                  type="password"
                  id="passwordConfirmation"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="currentPassword">Current Password</CFormLabel>
                <CFormInput
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <CFormText className="text-muted">
                  Enter your current password to confirm changes
                </CFormText>
              </div>

              <CButtonGroup className="w-100">
                <CButton color="primary" type="submit">
                  Update
                </CButton>
                <CButton
                  color="danger"
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Cancel my account
                </CButton>
                <CButton
                  color="warning"
                  type="button"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </CButton>
              </CButtonGroup>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>

      <ConfirmModal
        show={showDeleteModal}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmLabel="Delete Account"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />
    </CRow>
  );
}
