import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setResetCode(response.data.devCode);
        setMessage({ text: `Your reset code is: ${response.data.devCode}`, type: 'success' });
        setCodeSent(true);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setMessage({ text: 'Email not found. Please register first.', type: 'error' });
      } else {
        setMessage({ text: 'Failed to send code. Try again.', type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="login-section">
      <div className="login-card">
        <div className="login-header">
          <div className="login-title">reset<em>passphrase</em></div>
        </div>
        <div className="login-body">
          {!codeSent ? (
            <form onSubmit={handleSendCode}>
              <div className="field">
                <label className="field-label">EMAIL ADDRESS</label>
                <input type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn-submit" disabled={isLoading || !email.includes('@')}>
                {isLoading ? 'SENDING...' : 'SEND RESET CODE →'}
              </button>
            </form>
          ) : (
            <div>
              <p>Reset code sent to {email}</p>
              <Link to={`/reset-password?email=${encodeURIComponent(email)}&code=${resetCode}`}>
                <button className="btn-submit">ENTER RESET CODE →</button>
              </Link>
            </div>
          )}
          {message.text && <div className={`mock-alert ${message.type}`}>{message.text}</div>}
          <div className="auth-foot"><Link to="/login">back to login</Link></div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;