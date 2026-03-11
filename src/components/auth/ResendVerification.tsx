import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CRow, CCol, CCard, CCardHeader, CCardBody, CForm, CFormLabel, CFormInput, CButton, CAlert } from '@coreui/react';
import { resendVerificationEmail } from '../../services/authService';

export default function ResendVerification() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await resendVerificationEmail(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <CRow className="justify-content-center">
        <CCol md={6} lg={4}>
          <CCard className="border-success">
            <CCardHeader className="bg-success text-white">
              <h4 className="mb-0">Email Sent</h4>
            </CCardHeader>
            <CCardBody>
              <CAlert color="success">
                <h4 className="alert-heading">Check Your Inbox</h4>
                <p>
                  If an account exists for <strong>{email}</strong>, we've sent a new verification email.
                </p>
                <p className="mb-0">
                  Please check your inbox and spam folder.
                </p>
              </CAlert>
              <div className="d-grid gap-2 mt-3">
                <Link to="/login" className="btn btn-primary">
                  Back to Sign In
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
            <h4 className="mb-0">Resend Verification Email</h4>
          </CCardHeader>
          <CCardBody>
            <p className="text-muted">
              Enter your email address and we'll send you a new verification link.
            </p>
            {error && (
              <CAlert color="danger" dismissible onClose={() => setError(null)}>
                {error}
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
                  autoFocus={!email}
                  disabled={isLoading}
                  placeholder="your@email.com"
                />
              </div>

              <div className="d-grid gap-2">
                <CButton color="primary" type="submit" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Verification Email'}
                </CButton>
              </div>
            </CForm>
            <div className="mt-3 text-center">
              <Link to="/login" className="btn btn-link">
                Back to Sign In
              </Link>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
}
