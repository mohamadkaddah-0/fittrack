import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [email] = useState(queryParams.get('email') || '');
  const [code, setCode] = useState(queryParams.get('code') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/auth/verify-code', { email, code });
      if (response.data.success) {
        setStep(2);
        setMessage({ text: 'Code verified! Set new password.', type: 'success' });
      }
    } catch (error) {
      setMessage({ text: 'Invalid or expired code', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    if (newPassword.length < 3) {
      setMessage({ text: 'Password must be at least 3 characters', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { email, code, newPassword });
      if (response.data.success) {
        setMessage({ text: 'Password reset! Redirecting...', type: 'success' });
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Reset failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="login-section">
      <div className="login-card">
        <div className="login-header">
          <div className="login-title">{step === 1 ? 'verify' : 'new'}<em>{step === 1 ? 'code' : 'password'}</em></div>
        </div>
        <div className="login-body">
          {step === 1 ? (
            <form onSubmit={handleVerifyCode}>
              <div className="field">
                <label className="field-label">RESET CODE</label>
                <input type="text" className="field-input" value={code} onChange={(e) => setCode(e.target.value)} required maxLength="6" />
              </div>
              <button type="submit" className="btn-submit" disabled={isLoading || code.length !== 6}>
                {isLoading ? 'VERIFYING...' : 'VERIFY CODE →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="field">
                <label className="field-label">NEW PASSWORD</label>
                <input type="password" className="field-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="field">
                <label className="field-label">CONFIRM PASSWORD</label>
                <input type="password" className="field-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? 'RESETTING...' : 'RESET PASSWORD →'}
              </button>
            </form>
          )}
          {message.text && <div className={`mock-alert ${message.type}`}>{message.text}</div>}
          <div className="auth-foot"><Link to="/login">back to login</Link></div>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;