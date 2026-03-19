import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState('');

  const generateResetCode = () => {
    // Generate a 6-digit random code
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Generate reset code
      const code = generateResetCode();
      setResetCode(code);
      
      // MOCK: In real app, you would send this to your backend
      // which would email the code to the user
      
      console.log(`Reset code for ${email}: ${code}`); // For testing - remove in production
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMessage({ 
        text: `Reset code sent to ${email}. Check your inbox! (For testing: ${code})`, 
        type: 'success' 
      });
      setCodeSent(true);
      
    } catch (error) {
      setMessage({ 
        text: 'Failed to send reset code. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="login-section">
      <div className="login-card">
        
        
        <div className="login-header">
          
          <div className="login-title">
            reset
            <em>passphrase</em>
          </div>
        </div>

        <div className="login-body">
          {!codeSent ? (
            <form onSubmit={handleSendCode}>
              <div className="field">
                <label className="field-label" htmlFor="email">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  id="email"
                  className="field-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
            <div className="reset-code-message">
              <p style={{ marginBottom: '20px', color: 'var(--text)' }}>
                Reset code has been sent to <strong>{email}</strong>
              </p>
              <Link to={`/reset-password?email=${encodeURIComponent(email)}&code=${resetCode}`}>
                <button className="btn-submit" style={{ background: 'var(--cyan)' }}>
                  <span>ENTER RESET CODE →</span>
                </button>
              </Link>
            </div>
          )}

          {message.text && (
            <div className={`mock-alert ${message.type}`}>
              <span>⏣ {message.type === 'success' ? 'SUCCESS' : 'ERROR'}</span>
              {' '}{message.text}
            </div>
          )}

          <div className="auth-foot">
            remember your password? <Link to="/login">back to login</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
