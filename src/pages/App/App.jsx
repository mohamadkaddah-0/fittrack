import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './styles.css';
import Register from './Register';
import UserProfile from './userProfile';
import Survey from './Surveys';
import Terms from './Terms';
import Privacy from './Privacy';
import Support from './Support';
import API from './API';
import ReadySurvey from './readySurvey';
import Welcome from './Welcome';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

// Dashboard Placeholder
const Dashboard = () => (
  <section className="login-section">
    <div className="login-card">
      <div className="login-header">
        <div className="login-title">
          dashboard
          <em>overview</em>
        </div>
      </div>
    </div>
  </section>
);



// Get Started Placeholder
const GetStarted = () => (
  <section className="login-section">
    <div className="login-card">
      <div className="login-header">
        <div className="login-title">
          get
          <em>started</em>
        </div>
      </div>
    </div>
  </section>
);

// Login Component with Tailwind CSS
const Login = ({ 
  email, setEmail, 
  password, setPassword, 
  rememberMe, setRememberMe, 
  message, showExtraInfo, setShowExtraInfo,
  handleLogin, isFormValid 
}) => {
  return (
    <section className="login-section">
      <div className="login-card">
        <div className="login-ghost">//</div>
        
        <div className="login-header">
          <div className="login-title">
            member
            <em>login</em>
          </div>
        </div>

        <div className="login-body">
          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="field">
              <label className="field-label" htmlFor="email">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                id="email"
                className="field-input bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-xs p-[13px_16px] outline-none transition-colors duration-200 autofill:!bg-[var(--bg)] autofill:!text-[var(--text)] autofill:shadow-[inset_0_0_0px_1000px_var(--bg)] focus:border-[var(--cyan)] [-webkit-autofill]:[box-shadow:0_0_0px_1000px_var(--bg)_inset] [-webkit-autofill]:[text-fill-color:var(--text)]"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field */}
            <div className="field">
              <label className="field-label" htmlFor="password">
                PASSWORD
              </label>
              <input
                type="password"
                id="password"
                className="field-input bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-xs p-[13px_16px] outline-none transition-colors duration-200 autofill:!bg-[var(--bg)] autofill:!text-[var(--text)] autofill:shadow-[inset_0_0_0px_1000px_var(--bg)] focus:border-[var(--cyan)] [-webkit-autofill]:[box-shadow:0_0_0px_1000px_var(--bg)_inset] [-webkit-autofill]:[text-fill-color:var(--text)]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="3"
              />
            </div>

            {/* Options Row */}
            <div className="login-options">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                keep me logged in
              </label>
              <Link to="/forgot-password" className="forgot-link">
                reset passphrase
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-submit"
              disabled={!isFormValid()}
            >
              <span>Login →</span>
            </button>
          </form>

          {/* Message Display */}
          {message.text && (
            <div className={`mock-alert ${message.type}`}>
              <span>⏣ {message.type === 'success' ? 'SUCCESS' : 'ERROR'}</span>
              {' '}{message.text}
            </div>
          )}

          {/* Register Link */}
          <div className="auth-foot">
            no credentials? <Link to="/register" onClick={() => window.scrollTo(0, 0)}>join now</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

// Navigation component
const Navigation = ({ toggleTheme }) => {
  const location = useLocation();
  
  // Check if current path is homepage
  const isHomePage = location.pathname === '/';
  // Check if current path is login, register, OR profile
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/profile';
  
  
  
  return (
    <nav>
      <div className="nav-logo" onClick={toggleTheme} style={{ cursor: 'pointer' }}>
        FitTrack<sup>™</sup>
      </div>
      
      {isHomePage && (
        <div className="welcome-message" style={{ 
          fontSize: '24px',
          fontWeight: '500',
          letterSpacing: '0.02em',
          color: 'var(--text)',
          fontFamily: "'Barlow Condensed', sans-serif",
          textTransform: 'uppercase',
          borderLeft: '1px solid var(--line)',
          paddingLeft: '32px',
          marginLeft: '16px'
        }}>
          WELCOME TO FITTRACK
        </div>
      )}
    </nav>
  );
};


function App() {
  // State for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState({
    text: '',
    type: 'info'
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // State for theme
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // State for showing/hiding additional info
  const [showExtraInfo, setShowExtraInfo] = useState(false);

  // State for current logged in user
  const [currentUser, setCurrentUser] = useState(null);

  // Mock users for testing (DELETE THIS WHEN BACKEND IS READY)
  const mockUsers = [
    { email: 'demo@fittrack.io', password: 'demo123', name: 'Demo User' },
    { email: 'test@test.com', password: 'test123', name: 'Test User' }
  ];

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: 'info' });
    
    try {
      // MOCK LOGIN - REPLACE THIS WITH REAL BACKEND CALL
      console.log('Login attempt with:', { email, password });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation - DELETE THIS BLOCK WHEN BACKEND IS READY
      const foundUser = mockUsers.find(
        u => u.email === email && u.password === password
      );
      
      if (foundUser) {
        // THIS IS WHERE YOU'LL REPLACE WITH REAL BACKEND RESPONSE
        setCurrentUser({
          name: foundUser.name,
          email: foundUser.email
        });
        
        setMessage({
          text: `Welcome back, ${foundUser.name}!`,
          type: 'success'
        });
        
        
      setTimeout(() => {
        window.location.href = '/login'; // Changed from '/surveys'
      }, 1000);

      } else {
        setMessage({
          text: 'Invalid email or password',
          type: 'error'
        });
      }
      
      // WHEN BACKEND IS READY, REPLACE THE ABOVE WITH:
      /*
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCurrentUser(data.user);
        
        if (rememberMe) {
          localStorage.setItem('token', data.token);
        } else {
          sessionStorage.setItem('token', data.token);
        }
        
        setMessage({
          text: `Welcome back, ${data.user.name}!`,
          type: 'success'
        });
        
        setTimeout(() => {
          window.location.href = '/surveys';
        }, 1000);
      } else {
        setMessage({
          text: data.message || 'Login failed',
          type: 'error'
        });
      }
      */
      
    } catch (error) {
      console.error('Login error:', error);
      setMessage({
        text: 'Connection error. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', !isDarkMode ? 'dark' : 'light');
  };

  // Form validation
  const isFormValid = () => {
    return email.includes('@') && email.includes('.') && password.length >= 3;
  };

  return (
    <Router>
      {/* Ticker Bar */}
      <div className="ticker-bar">
        <div className="ticker-track">
          <span className="ticker-item">TRACK YOUR LIMITS</span>
          <span className="ticker-sep">✦</span>
          <span className="ticker-item">LOG EVERY REP</span>
          <span className="ticker-sep">✦</span>
          <span className="ticker-item">BURN CALORIES</span>
          <span className="ticker-sep">✦</span>
          <span className="ticker-item">BUILD STRENGTH</span>
          <span className="ticker-sep">✦</span>
          <span className="ticker-item">MONITOR PROGRESS</span>
          <span className="ticker-sep">✦</span>
          <span className="ticker-item">ACHIEVE GOALS</span>
          <span className="ticker-sep">✦</span>
          <span className="ticker-item">FITTRACK 2026</span>
          <span className="ticker-sep">✦</span>
          <span className="ticker-item">TRACK YOUR LIMITS</span>
          <span className="ticker-sep">✦</span>
          <span className="ticker-item">LOG EVERY REP</span>
          <span className="ticker-sep">✦</span>
        </div>
      </div>

      {/* Navigation */}
      <Navigation toggleTheme={toggleTheme} />

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/ready-survey" element={<ReadySurvey />} />
        <Route 
          path="/login" 
          element={
            <Login 
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              message={message}
              setMessage={setMessage}
              showExtraInfo={showExtraInfo}
              setShowExtraInfo={setShowExtraInfo}
              handleLogin={handleLogin}
              isFormValid={isFormValid}
            />
          } 
        />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfile user={currentUser} />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/surveys" element={<Survey />} />
        <Route path="/support" element={<Support />} />
        <Route path="/api" element={<API />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>

      {/* Footer */}
      <footer>
        <div className="footer-logo">FitTrack<sup>™</sup></div>
        <ul className="footer-links">
          <li><Link to="/privacy" onClick={() => window.scrollTo(0, 0)}>PRIVACY</Link></li>
          <li><Link to="/terms" onClick={() => window.scrollTo(0, 0)}>TERMS</Link></li>
          <li><Link to="/support" onClick={() => window.scrollTo(0, 0)}>SUPPORT</Link></li>
          
        </ul>
        <div className="footer-copy">© 2026 FITTRACK · V3.0.0</div>
      </footer>
    </Router>
  );
}

export default App;
/*
When ready to add the backend:
Delete the mockUsers array (line ~135)

Delete the mock validation block (lines 205-227)

Uncomment the real backend code (lines 230-259)

Update the API URL to your actual backend server
*/
