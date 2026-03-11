import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CRow, CCol, CCard, CCardHeader, CCardBody, CForm, CFormLabel, CFormInput, CButton, CAlert } from '@coreui/react';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showVerificationError, setShowVerificationError] = useState(false);
  const { login } = useAuth();
  const { showSuccess, showError } = useAlert();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setShowVerificationError(false);

    const result = await login({ email, password });
    if (result.user) {
      showSuccess('Signed in successfully.');
      navigate('/items');
    } else if (result.error === 'email_not_verified') {
      setShowVerificationError(true);
    } else {
      showError('Invalid email or password.');
    }
  };

  return (
    <CRow className="justify-content-center">
      <CCol md={6} lg={4}>
        <CCard className="border-primary">
          <CCardHeader className="bg-primary text-white">
            <h4 className="mb-0">Sign In</h4>
          </CCardHeader>
          <CCardBody>
            {showVerificationError && (
              <CAlert color="warning">
                <h4 className="alert-heading">Email Not Verified</h4>
                <p>
                  Your email address has not been verified yet. Please check your inbox for a verification email.
                </p>
                <hr />
                <p className="mb-0">
                  <Link to={`/resend-verification?email=${encodeURIComponent(email)}`}>
                    Resend verification email
                  </Link>
                </p>
              </CAlert>
            )}
            <CForm onSubmit={handleSubmit}>
              <div className="mb-3">
                <CFormLabel htmlFor="email">Email</CFormLabel>
                <CFormInput
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="password">Password</CFormLabel>
                <CFormInput
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="d-grid gap-2">
                <CButton color="primary" type="submit">
                  Sign In
                </CButton>
              </div>
            </CForm>
            <div className="mt-3 text-center">
              <Link to="/register" className="btn btn-link">
                Don't have an account? Register
              </Link>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
}
