import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [email, setEmail] = useState(queryParams.get('email') || '');
  const [enteredCode, setEnteredCode] = useState('');
  const [expectedCode, setExpectedCode] = useState(queryParams.get('code') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: verify code, 2: new password
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Verify the code matches
      if (enteredCode === expectedCode) {
        setStep(2);
        setMessage({ text: 'Code verified! Set your new password.', type: 'success' });
      } else {
        setMessage({ text: 'Invalid reset code. Please try again.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Verification failed. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match!', type: 'error' });
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 3) {
      setMessage({ text: 'Password must be at least 3 characters', type: 'error' });
      setIsLoading(false);
      return;
    }

    try {
      // MOCK: In real app, we would send this to your backend
      // to update the user's password
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMessage({ 
        text: 'Password reset successful! Redirecting to login...', 
        type: 'success' 
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setMessage({ text: 'Failed to reset password. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="login-section">
      <div className="login-card">
  
        
        <div className="login-header">
          
          <div className="login-title">
            {step === 1 ? 'verify' : 'new'}
            <em>{step === 1 ? 'code' : 'password'}</em>
          </div>
        </div>

        <div className="login-body">
          {step === 1 ? (
            <form onSubmit={handleVerifyCode}>
              <div className="field">
                <label className="field-label" htmlFor="code">
                  RESET CODE
                </label>
                <input
                  type="text"
                  id="code"
                  className="field-input"
                  placeholder="000000"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  required
                  maxLength="6"
                />
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={isLoading || enteredCode.length !== 6}
              >
                <span>{isLoading ? 'VERIFYING...' : 'VERIFY CODE →'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="field">
                <label className="field-label" htmlFor="newPassword">
                  NEW PASSWORD
                </label>
                <input
                  type="password"
                  id="newPassword"
                  className="field-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength="3"
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="confirmPassword">
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="field-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength="3"
                />
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                <span>{isLoading ? 'RESETTING...' : 'RESET PASSWORD →'}</span>
              </button>
            </form>
          )}

          {message.text && (
            <div className={`mock-alert ${message.type}`}>
              <span>⏣ {message.type === 'success' ? 'SUCCESS' : 'ERROR'}</span>
              {' '}{message.text}
            </div>
          )}

          <div className="auth-foot">
            <Link to="/login">back to login</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
