import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  
  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    
    if (!email.includes('@') || !email.includes('.')) {
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const data = await api.forgotPassword(email);
      
      if (data.success) {
        const resetCode = data.devCode;
        setGeneratedCode(resetCode);
        setMessage({ 
          text: `Reset code generated successfully!`, 
          type: 'success' 
        });
        setStep(2);
      } else {
        setMessage({ text: data.message || 'Failed to send reset code', type: 'error' });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage({ text: error.message || 'Failed to send reset code. Please try again.', type: 'error' });
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
    
    if (!code || code.length !== 6) {
      setMessage({ text: 'Please enter the 6-digit reset code', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const verifyResponse = await fetch('https://fittrack-t4iu.onrender.com/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const verifyData = await verifyResponse.json();
      
      if (!verifyData.success) {
        setMessage({ text: 'Invalid or expired reset code', type: 'error' });
        setIsLoading(false);
        return;
      }
      
      const resetData = await api.resetPassword(email, code, newPassword);
      
      if (resetData.success) {
        setMessage({ text: 'Password reset successfully! Redirecting to login...', type: 'success' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage({ text: resetData.message || 'Failed to reset password', type: 'error' });
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
            <em>passphrase</em>
          </div>
        </div>
        <div className="login-body">
          {step === 1 ? (
            // Step 1: Enter email
            <form onSubmit={handleSendCode}>
              <div className="field">
                <label className="field-label">EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  className="field-input bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-xs p-[13px_16px] outline-none transition-colors duration-200 focus:border-[var(--cyan)]" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={isLoading}
                  placeholder="you@example.com"
                />
              </div>
              <button 
                type="submit" 
                className="btn-submit" 
                disabled={isLoading || !email.includes('@')}
              >
                <span>{isLoading ? 'SENDING...' : 'SEND RESET CODE →'}</span>
              </button>
            </form>
          ) : (
            // Step 2: Enter reset code and new password
            <form onSubmit={handleResetPassword}>
              {/* Reset Code Field with Label and Code side by side */}
              <div className="field">
                <div className="flex items-center justify-between mb-2">
                  <label className="field-label mb-0">ENTER RESET CODE</label>
                  <span className="font-mono text-2xl md:text-3xl font-bold tracking-[0.15em] text-[var(--cyan)]">
                    {generatedCode}
                  </span>
                </div>
                <input 
                  type="text" 
                  className="field-input bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-center text-xl tracking-[0.25em] p-[13px_16px] outline-none transition-colors duration-200 focus:border-[var(--cyan)]" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="000000"
                  required 
                  maxLength="6"
                  disabled={isLoading}
                />
              </div>
              
              {/* New Password Field with Eye Icon */}
              <div className="field">
                <label className="field-label">NEW PASSWORD</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    className="field-input w-full bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-xs p-[13px_16px] outline-none transition-colors duration-200 focus:border-[var(--cyan)] pr-12" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="••••••"
                    required 
                    disabled={isLoading}
                    minLength="3"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--dim)] hover:text-[var(--cyan)] transition-colors"
                  >
                    {showNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Confirm Password Field with Eye Icon */}
              <div className="field">
                <label className="field-label">CONFIRM PASSWORD</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="field-input w-full bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-xs p-[13px_16px] outline-none transition-colors duration-200 focus:border-[var(--cyan)] pr-12" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="••••••"
                    required 
                    disabled={isLoading}
                    minLength="3"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--dim)] hover:text-[var(--cyan)] transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn-submit" 
                disabled={isLoading || !code || code.length !== 6 || !newPassword || !confirmPassword}
              >
                <span>{isLoading ? 'RESETTING...' : 'RESET PASSWORD →'}</span>
              </button>
            </form>
          )}
          
          {/* Bigger success message */}
          {message.text && (
            <div className={`mock-alert ${message.type} text-base py-3`}>
              <span className="font-bold">{message.type === "success" ? "SUCCESS" : "ERROR"}</span> 
              <span className="ml-2">{message.text}</span>
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

export default ForgotPassword;