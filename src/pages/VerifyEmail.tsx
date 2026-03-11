import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CCard, CCardHeader, CCardBody, CRow, CCol, CAlert, CSpinner } from '@coreui/react';
import { verifyEmail } from '../services/authService';

type VerificationStatus = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided.');
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus('success');
      })
      .catch((error) => {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Verification failed');
      });
  }, [searchParams]);

  return (
    <CRow className="justify-content-center">
      <CCol md={6} lg={4}>
        {status === 'loading' && (
          <CCard className="border-primary">
            <CCardHeader className="bg-primary text-white">
              <h4 className="mb-0">Verifying Email</h4>
            </CCardHeader>
            <CCardBody className="text-center py-5">
              <CSpinner color="primary" className="mb-3" />
              <p className="text-muted">Please wait while we verify your email address...</p>
            </CCardBody>
          </CCard>
        )}

        {status === 'success' && (
          <CCard className="border-success">
            <CCardHeader className="bg-success text-white">
              <h4 className="mb-0">Email Verified</h4>
            </CCardHeader>
            <CCardBody>
              <CAlert color="success">
                <h4 className="alert-heading">Success!</h4>
                <p className="mb-0">
                  Your email address has been verified. You can now sign in to your account.
                </p>
              </CAlert>
              <div className="d-grid gap-2 mt-3">
                <Link to="/login" className="btn btn-success">
                  Sign In
                </Link>
              </div>
            </CCardBody>
          </CCard>
        )}

        {status === 'error' && (
          <CCard className="border-danger">
            <CCardHeader className="bg-danger text-white">
              <h4 className="mb-0">Verification Failed</h4>
            </CCardHeader>
            <CCardBody>
              <CAlert color="danger">
                <h4 className="alert-heading">Unable to Verify Email</h4>
                <p className="mb-0">{errorMessage}</p>
              </CAlert>
              <hr />
              <p className="text-muted">
                The verification link may have expired or already been used. You can request a new verification email.
              </p>
              <div className="d-grid gap-2 mt-3">
                <Link to="/resend-verification" className="btn btn-primary">
                  Request New Verification Email
                </Link>
                <Link to="/login" className="btn btn-outline-secondary">
                  Back to Sign In
                </Link>
              </div>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  );
}
