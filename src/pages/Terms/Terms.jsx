import React from 'react';
import { Link } from 'react-router-dom';
import './Terms.css';

const Terms = () => {
  return (
    <section className="legal-section">
      <div className="legal-card">
        <div className="legal-ghost">//</div>
        
        <div className="legal-header">
          <div className="legal-code">LEGAL AGREEMENT</div>
          <div className="legal-title">
            terms of
            <em>service</em>
          </div>
          <div className="legal-date">Last Updated: March 15, 2024</div>
        </div>

        <div className="legal-body">
          <div className="legal-content">
            <div className="legal-intro">
              <p>Welcome to FitTrack. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.</p>
            </div>

            <div className="legal-section-block">
              <h3>1. Acceptance of Terms</h3>
              <p>By creating an account, accessing, or using FitTrack, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, you may not use our services.</p>
            </div>

            <div className="legal-section-block">
              <h3>2. Account Registration</h3>
              <p>To use certain features, you must register for an account. You agree to provide accurate, current, and complete information. You are responsible for safeguarding your password and for all activities under your account.</p>
              <ul className="legal-list">
                <li>You must be at least 13 years old to use this service</li>
                <li>You may not share your account credentials</li>
                <li>Notify us immediately of unauthorized access</li>
              </ul>
            </div>

            <div className="legal-section-block">
              <h3>3. User Data & Privacy</h3>
              <p>Your privacy is important to us. Our <Link to="/privacy">Privacy Policy</Link> explains how we collect, use, and protect your personal information. By using FitTrack, you consent to our data practices.</p>
            </div>

            <div className="legal-section-block">
              <h3>4. User Conduct</h3>
              <p>You agree not to:</p>
              <ul className="legal-list">
                <li>Violate any laws or regulations</li>
                <li>Impersonate any person or entity</li>
                <li>Upload malicious code or attempt to breach security</li>
                <li>Harass, abuse, or harm others</li>
                <li>Use the service for any illegal purpose</li>
              </ul>
            </div>

            <div className="legal-section-block">
              <h3>5. Intellectual Property</h3>
              <p>All content, features, and functionality on FitTrack are owned by us or our licensors and are protected by copyright, trademark, and other intellectual property laws.</p>
            </div>

            <div className="legal-section-block">
              <h3>6. Termination</h3>
              <p>We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.</p>
            </div>

            <div className="legal-section-block">
              <h3>7. Disclaimer of Warranties</h3>
              <p>FitTrack is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free.</p>
            </div>

            <div className="legal-section-block">
              <h3>8. Limitation of Liability</h3>
              <p>To the maximum extent permitted by law, FitTrack shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.</p>
            </div>

            <div className="legal-section-block">
              <h3>9. Changes to Terms</h3>
              <p>We reserve the right to modify these Terms at any time. We will notify users of material changes. Continued use after changes constitutes acceptance.</p>
            </div>

            <div className="legal-section-block">
              <h3>10. Contact Information</h3>
              <p>For questions about these Terms, please contact us at:</p>
              <div className="contact-info">
                <p>Email: mohammad.moghnieh@lau.edu</p>
              </div>
            </div>

            <div className="legal-footer">
              <p>By using FitTrack, you acknowledge that you have read and understood these Terms of Service.</p>
              <Link to="/register" className="legal-back-btn">← Back to Registration</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Terms;
