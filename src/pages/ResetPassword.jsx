import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [email, setEmail] = useState(queryParams.get('email') || '');
  const [code, setCode] = useState(queryParams.get('code') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  // If no email or code in URL, redirect to forgot password
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

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
    setMessage({ text: '', type: '' });
    
    try {
      const data = await api.resetPassword(email, code, newPassword);
      
      if (data.success) {
        setMessage({ text: 'Password reset successfully! Redirecting to login...', type: 'success' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage({ text: data.message || 'Failed to reset password', type: 'error' });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage({ text: error.message || 'Failed to reset password. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="login-section">
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => navigate("/")}
          className="font-['Barlow_Condensed'] text-2xl font-black tracking-wider uppercase text-[#C6F135] bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
        >
          FitTrack<sup className="text-xs">™</sup>
        </button>
      </div>
      <div className="login-card">
        <div className="login-ghost">//</div>
        <div className="login-header">
          <div className="login-title">
            reset
            <em>password</em>
          </div>
        </div>
        <div className="login-body">
          <form onSubmit={handleResetPassword}>
            <div className="field">
              <label className="field-label">EMAIL</label>
              <input 
                type="email" 
                className="field-input bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-xs p-[13px_16px] outline-none transition-colors duration-200 focus:border-[var(--cyan)]" 
                value={email} 
                disabled
                readOnly
              />
            </div>
            
            <div className="field">
              <label className="field-label">RESET CODE</label>
              <input 
                type="text" 
                className="field-input bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-xs p-[13px_16px] outline-none transition-colors duration-200 focus:border-[var(--cyan)] text-center tracking-wider" 
                value={code} 
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                placeholder="000000"
                required 
                maxLength="6"
                disabled={isLoading}
              />
            </div>
            
            <div className="field">
              <label className="field-label">NEW PASSWORD</label>
              <input 
                type="password" 
                className="field-input bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-xs p-[13px_16px] outline-none transition-colors duration-200 focus:border-[var(--cyan)]" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="••••••"
                required 
                disabled={isLoading}
                minLength="3"
              />
            </div>
            
            <div className="field">
              <label className="field-label">CONFIRM PASSWORD</label>
              <input 
                type="password" 
                className="field-input bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-xs p-[13px_16px] outline-none transition-colors duration-200 focus:border-[var(--cyan)]" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="••••••"
                required 
                disabled={isLoading}
                minLength="3"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn-submit" 
              disabled={isLoading || !code || code.length !== 6 || !newPassword || !confirmPassword}
            >
              <span>{isLoading ? 'RESETTING...' : 'RESET PASSWORD →'}</span>
            </button>
          </form>
          
          {message.text && (
            <div className={`mock-alert ${message.type}`}>
              <span>{message.type === "success" ? "SUCCESS" : "ERROR"}</span> {message.text}
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