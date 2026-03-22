import React from 'react';
import { Link } from 'react-router-dom';
import './WelcomePage.css';

const Welcome = () => {
  return (
    <section className="welcome-section">
      <div className="absolute top-8 left-8 z-50">
        <Link 
          to="/" 
          className="font-['Barlow_Condensed'] font-black tracking-wider uppercase text-[#C6F135] no-underline hover:opacity-80 transition-opacity"
          style={{ fontSize: '40px' }}
        >
          FitTrack<sup className="text-base">™</sup>
        </Link>
      </div>
      {/* Hero Section */}
      <div className="welcome-hero">
        <div className="welcome-grid">
          {/* Left Column - Text Content */}
          <div className="welcome-content">
      
            <h1 className="welcome-title">
              transform your
              <em>fitness journey</em>
            </h1>
            <p className="welcome-description">
              Track your workouts, monitor progress, and achieve your fitness goals 
              with our comprehensive tracking platform. Join thousands of users 
              who have already transformed their lives.
            </p>
            
            
          </div>

          {/* Right Column - Image Grid */}
          <div className="welcome-images">
            <div className="image-grid">
              <div className="grid-item main">
                <img 
                  src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Fitness training"
                  className="grid-image"
                />
                <div className="image-overlay"></div>
              </div>
              <div className="grid-item secondary">
                <img 
                  src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Workout tracking"
                  className="grid-image"
                />
                <div className="image-overlay"></div>
              </div>
              <div className="grid-item tertiary">
                <img 
                  src="https://images.unsplash.com/photo-1554284126-aa88f22d8b74?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Progress tracking"
                  className="grid-image"
                />
                <div className="image-overlay"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="features-header">
          <div className="features-code">WHY CHOOSE US</div>
          <h2 className="features-title">
            everything you
            <em>need to succeed</em>
          </h2>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Progress Tracking</h3>
            <p>Monitor your workouts, set goals, and track your improvements over time with detailed analytics.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Personalized Plans</h3>
            <p>Get customized workout plans based on your fitness level, goals, and available equipment.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Mobile Ready</h3>
            <p>Access your fitness data anywhere, anytime with our fully responsive platform.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Staff Support</h3>
            <p>Connect with experienced staff to help you with whatever you want.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Real-time Updates</h3>
            <p>Log your workouts instantly and see your progress update in real-time.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Secure & Private</h3>
            <p>Your data is encrypted and protected with industry-standard security measures.</p>
          </div>
        </div>
      </div>

      
      {/* Final CTA Section */}
      <div className="final-cta-section">
        <div className="final-cta-card">
          <div className="final-cta-ghost">//</div>
          <h2 className="final-cta-title">
            ready to start
            <em>your journey?</em>
          </h2>
          <p className="final-cta-text">
            Join FitTrack today and take the first step towards a healthier, stronger you.
          </p>
          <div className="final-cta-buttons">
            <Link to="/register" className="final-cta-primary" onClick={() => window.scrollTo(0, 0)}>
              Create Account
            </Link>
            <Link to="/login" className="final-cta-secondary" onClick={() => window.scrollTo(0, 0)}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Welcome;
