import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for form inputs
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  // Check if we're coming back from terms/privacy pages
  useEffect(() => {
    const fromTerms = sessionStorage.getItem('from_terms_page');
    if (fromTerms === 'true') {
      sessionStorage.removeItem('from_terms_page');
      // Load saved form data only when coming back from terms/privacy
      const savedData = sessionStorage.getItem('register_form_temp');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData(parsedData);
          
          // Re-check password strength if password exists
          if (parsedData.password) {
            setPasswordStrength(checkPasswordStrength(parsedData.password));
          }
        } catch (error) {
          console.error('Error loading saved form data:', error);
        }
      }
    }
  }, []);

  // Save form data temporarily when leaving for terms/privacy
  useEffect(() => {
    // Only save if we have any form data
    const hasFormData = Object.values(formData).some(value => 
      typeof value === 'string' ? value.trim() !== '' : value === true
    );
    
    if (hasFormData) {
      sessionStorage.setItem('register_form_temp', JSON.stringify(formData));
    }
  }, [formData]);

  // Clear temporary storage when component unmounts (user leaves page normally)
  useEffect(() => {
    return () => {
      // Don't clear if we're going to terms/privacy
      const isLeavingToTerms = sessionStorage.getItem('from_terms_page') === 'true';
      if (!isLeavingToTerms) {
        sessionStorage.removeItem('register_form_temp');
      }
    };
  }, []);

  // Password strength checker - sanitized and secure
  const checkPasswordStrength = (password) => {
    if (!password) {
      return { score: 0, label: '' };
    }

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    
    // Complexity checks using regex (safe from XSS)
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Determine strength label
    let label = '';
    if (password.length < 6) {
      label = 'Too short';
    } else if (score <= 2) {
      label = 'Weak';
    } else if (score <= 3) {
      label = 'Medium';
    } else if (score <= 4) {
      label = 'Good';
    } else {
      label = 'Strong';
    }

    return { score: Math.min(score, 5), label };
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    const { value } = e.target;
    // Sanitize input - remove any HTML tags
    const sanitizedValue = value.replace(/<[^>]*>/g, '');
    setFormData(prev => ({ ...prev, password: sanitizedValue }));
    setPasswordStrength(checkPasswordStrength(sanitizedValue));
    
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  // Handle input changes with sanitization
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Sanitize text inputs to prevent XSS
    const sanitizedValue = type === 'text' || type === 'email' || type === 'password' 
      ? value.replace(/<[^>]*>/g, '') 
      : value;
    
    if (name === 'password') {
      handlePasswordChange(e);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : sanitizedValue
      }));
      
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  // Handle navigation to terms/privacy with form data preservation
  const handleLinkClick = (e, path) => {
    e.preventDefault();
    // Set flag that we're going to terms/privacy page
    sessionStorage.setItem('from_terms_page', 'true');
    // Form data is already being saved automatically in useEffect
    navigate(path);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Min 3 characters';
    }
    
    if (!formData.password) {
      newErrors.password = 'Required';
    } else if (passwordStrength.score < 2) {
      newErrors.password = 'Password too weak';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Required';
    }
    
    return newErrors;
  };

  // Save user to localStorage
  const saveUser = () => {
    // Get existing users or initialize empty array
    const existingUsers = JSON.parse(localStorage.getItem('fittrack_users') || '[]');
    
    // Check if email already exists
    const emailExists = existingUsers.some(user => user.email === formData.email);
    if (emailExists) {
      setErrors({ form: 'Email already registered' });
      return false;
    }
    
    // Check if username already exists
    const usernameExists = existingUsers.some(user => user.username === formData.username);
    if (usernameExists) {
      setErrors({ form: 'Username already taken' });
      return false;
    }
    
    // Create new user object
    const newUser = {
      id: Date.now(), // Make sure this ID is properly set
      firstName: formData.firstName,
      lastName: formData.lastName,
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      username: formData.username,
      password: formData.password,
      createdAt: new Date().toISOString(),
      profilePicture: null,
      isLoggedIn: false
    };
    
    // Add to array and save
    existingUsers.push(newUser);
    localStorage.setItem('fittrack_users', JSON.stringify(existingUsers));
    
    // Save to login credentials array (for easier login)
    const loginCredentials = existingUsers.map(user => ({
      email: user.email,
      password: user.password,
      name: user.name,
      username: user.username
    }));
    localStorage.setItem('fittrack_logins', JSON.stringify(loginCredentials));
    
    return newUser;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save user to localStorage
      const newUser = saveUser();
      
      if (newUser) {
        // Set success message
        setMessage({
          text: `Welcome, ${newUser.name}! Redirecting to setup...`,
          type: 'success'
        });
        
        // Store current user in session
        sessionStorage.setItem('currentUser', JSON.stringify({
          id: newUser.id,  // Include the ID
          name: newUser.name,
          email: newUser.email,
          username: newUser.username
        }));
        
        // Clear temporary form data on successful registration
        sessionStorage.removeItem('register_form_temp');
        sessionStorage.removeItem('from_terms_page');
        
        // Reset form data
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          username: '',
          password: '',
          confirmPassword: '',
          acceptTerms: false
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.scrollTo(0, 0);
          navigate('/ready-survey');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setMessage({
        text: 'Registration failed. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get strength color - using your app's color scheme
  const getStrengthColor = () => {
    switch(passwordStrength.label) {
      case 'Strong': return 'var(--lime)';
      case 'Good': return '#8BC34A';
      case 'Medium': return 'var(--amber)';
      case 'Weak': return 'var(--hot)';
      case 'Too short': return 'var(--hot)';
      default: return 'var(--dim)';
    }
  };

  return (
    <section className="login-section">
      <div className="absolute top-6 left-6 z-50">
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
            create
            <em>account</em>
          </div>
        </div>

        <div className="login-body">
          <form onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div className="register-grid">
              <div className="field">
                <label className="field-label" htmlFor="firstName">
                  FIRST NAME
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className={`field-input ${errors.firstName ? 'error' : ''}`}
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                  maxLength="50"
                />
                {errors.firstName && (
                  <span className="error-message">{errors.firstName}</span>
                )}
              </div>

              <div className="field">
                <label className="field-label" htmlFor="lastName">
                  LAST NAME
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className={`field-input ${errors.lastName ? 'error' : ''}`}
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                  maxLength="50"
                />
                {errors.lastName && (
                  <span className="error-message">{errors.lastName}</span>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="field">
              <label className="field-label" htmlFor="email">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`field-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                maxLength="100"
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            {/* Username Field */}
            <div className="field">
              <label className="field-label" htmlFor="username">
                USERNAME
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className={`field-input ${errors.username ? 'error' : ''}`}
                placeholder="johndoe"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
                maxLength="30"
                pattern="[A-Za-z0-9_]+"
                title="Letters, numbers, and underscores only"
              />
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="field">
              <label className="field-label" htmlFor="password">
                PASSWORD
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={`field-input ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                maxLength="128"
              />
              
              {/* Clean password strength indicator */}
              {formData.password && (
                <div className="password-strength-minimal">
                  <div className="strength-bar-minimal">
                    <div 
                      className="strength-bar-fill-minimal" 
                      style={{ 
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: getStrengthColor()
                      }}
                    />
                  </div>
                  <div className="strength-label-minimal">
                    <span>Password strength: </span>
                    <strong style={{ color: getStrengthColor() }}>
                      {passwordStrength.label}
                    </strong>
                  </div>
                  
                  {/* Small note about requirements with improved colors */}
                  <div className="password-note">
                    <span className="note-text">Use 8+ chars with </span>
                    <span className="note-uppercase">uppercase</span>
                    <span className="note-text">, </span>
                    <span className="note-lowercase">lowercase</span>
                    <span className="note-text">, </span>
                    <span className="note-numbers">numbers</span>
                    <span className="note-text"> & </span>
                    <span className="note-symbols">symbols</span>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="field">
              <label className="field-label" htmlFor="confirmPassword">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`field-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                maxLength="128"
              />
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <span className="error-message">Passwords do not match</span>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="terms-agreement">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span>
                  I agree to the{' '}
                  <a 
                    href="/terms" 
                    onClick={(e) => handleLinkClick(e, '/terms')}
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Terms
                  </a>{' '}
                  and{' '}
                  <a 
                    href="/privacy" 
                    onClick={(e) => handleLinkClick(e, '/privacy')}
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Privacy
                  </a>{' '}
                  policies
                </span>
              </label>
              {errors.acceptTerms && (
                <span className="error-message">{errors.acceptTerms}</span>
              )}
            </div>

            {/* Success/Error Message */}
            {message.text && (
              <div className={`mock-alert ${message.type}`}>
                <span>⏣ {message.type === 'success' ? 'SUCCESS' : 'ERROR'}</span>
                {' '}{message.text}
              </div>
            )}

            {/* Form Error */}
            {errors.form && (
              <div className="mock-alert error">
                <span>⏣ ERROR</span> {errors.form}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading || passwordStrength.score < 2}
            >
              <span>{isLoading ? 'CREATING...' : 'CREATE ACCOUNT →'}</span>
            </button>

            {/* Login Link */}
            <div className="auth-foot">
              Already have an account? <Link to="/login" onClick={() => window.scrollTo(0, 0)}>sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Register;