import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CRow, CCol, CCard, CCardHeader, CCardBody, CForm, CFormLabel, CFormInput, CFormText, CButton, CAlert } from '@coreui/react';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { PASSWORD_RULES } from '../../constants/config';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const { register } = useAuth();
  const { showError } = useAlert();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await register({ email, password, passwordConfirmation });
      if (result.success) {
        setRegistrationComplete(true);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationComplete) {
    return (
      <CRow className="justify-content-center">
        <CCol md={6} lg={4}>
          <CCard className="border-success">
            <CCardHeader className="bg-success text-white">
              <h4 className="mb-0">Check Your Email</h4>
            </CCardHeader>
            <CCardBody>
              <CAlert color="success">
                <h4 className="alert-heading">Registration Successful!</h4>
                <p>
                  We've sent a verification email to <strong>{email}</strong>.
                </p>
                <p className="mb-0">
                  Please click the link in the email to verify your account before signing in.
                </p>
              </CAlert>
              <hr />
              <p className="text-muted small">
                Didn't receive the email? Check your spam folder or{' '}
                <Link to={`/resend-verification?email=${encodeURIComponent(email)}`}>
                  request a new verification email
                </Link>.
              </p>
              <div className="d-grid gap-2 mt-3">
                <Link to="/login" className="btn btn-primary">
                  Go to Sign In
                </Link>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    );
  }

  return (
    <CRow className="justify-content-center">
      <CCol md={6} lg={4}>
        <CCard className="border-primary">
          <CCardHeader className="bg-primary text-white">
            <h4 className="mb-0">Register an Account</h4>
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
                  autoFocus
                  disabled={isLoading}
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
                  minLength={10}
                  disabled={isLoading}
                />
                {password && (
                  <ul className="list-unstyled mt-1 mb-0 small">
                    {PASSWORD_RULES.map((rule) => (
                      <li key={rule.label} className={rule.test(password) ? 'text-success' : 'text-muted'}>
                        {rule.test(password) ? '\u2713' : '\u2022'} {rule.label}
                      </li>
                    ))}
                  </ul>
                )}
                {!password && (
                  <CFormText className="text-muted">
                    Minimum 10 characters with uppercase, lowercase, number, and special character
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
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="d-grid gap-2">
                <CButton color="primary" type="submit" disabled={isLoading}>
                  {isLoading ? 'Registering...' : 'Register'}
                </CButton>
              </div>
            </CForm>
            <div className="mt-3 text-center">
              <Link to="/login" className="btn btn-link">
                Already have an account? Sign in
              </Link>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
}
