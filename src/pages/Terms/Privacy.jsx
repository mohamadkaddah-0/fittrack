import React from 'react';
import { Link } from 'react-router-dom';
import './Terms.css';

const Privacy = () => {
  return (
    <section className="legal-section">
      <div className="legal-card">
        <div className="legal-ghost">//</div>
        
        <div className="legal-header">
          <div className="legal-code">DATA PROTECTION</div>
          <div className="legal-title">
            privacy
            <em>policy</em>
          </div>
          <div className="legal-date">Last Updated: April 17, 2026</div>
        </div>

        <div className="legal-body">
          <div className="legal-content">
            <div className="legal-intro">
              <p>At FitTrack, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.</p>
            </div>

            <div className="legal-section-block">
              <h3>1. Information We Collect</h3>
              <p>We collect information to provide better services to you:</p>
              <h4>1.1 Information You Provide</h4>
              <ul className="legal-list">
                <li>Account information (name, email, username, password)</li>
                <li>Profile information (age, height, weight, fitness goals)</li>
                <li>Workout data and progress tracking</li>
                <li>Communications with support</li>
              </ul>
              
              <h4>1.2 Automatically Collected Information</h4>
              <ul className="legal-list">
                <li>Usage data (features used, time spent)</li>
                <li>Device information (IP address, browser type)</li>
                <li>Cookies and similar technologies</li>
              </ul>
            </div>

            <div className="legal-section-block">
              <h3>2. How We Use Your Information</h3>
              <p>We use the information we collect to:</p>
              <ul className="legal-list">
                <li>Provide and maintain our services</li>
                <li>Track your fitness progress and personalize experience</li>
                <li>Communicate with you about updates and offers</li>
                <li>Improve and develop new features</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <div className="legal-section-block">
              <h3>3. Data Sharing and Disclosure</h3>
              <p>We do not sell your personal information. We may share data:</p>
              <ul className="legal-list">
                <li>With your consent</li>
                <li>With service providers who assist our operations</li>
                <li>To comply with legal requirements</li>
                <li>To protect rights and safety</li>
                <li>In connection with business transfers</li>
              </ul>
            </div>

            <div className="legal-section-block">
              <h3>4. Data Security</h3>
              <p>We implement appropriate technical and organizational measures to protect your personal information, including:</p>
              <ul className="legal-list">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
                <li>Employee training on data protection</li>
              </ul>
            </div>

            <div className="legal-section-block">
              <h3>5. Your Rights and Choices</h3>
              <p>Depending on your location, you may have the right to:</p>
              <ul className="legal-list">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
              <p>To exercise these rights, contact us at privacy@fittrack.io</p>
            </div>

            <div className="legal-section-block">
              <h3>6. Data Retention</h3>
              <p>We retain your information for as long as your account is active or as needed to provide services. When you delete your account, we will delete your personal information within 30 days, unless we need to retain it for legal reasons.</p>
            </div>

            <div className="legal-section-block">
              <h3>7. Children's Privacy</h3>
              <p>FitTrack is not intended for children under 13. We do not knowingly collect information from children under 13. If you become aware that a child has provided us with personal information, please contact us.</p>
            </div>

            <div className="legal-section-block">
              <h3>8. International Data Transfers</h3>
              <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.</p>
            </div>

            <div className="legal-section-block">
              <h3>9. Changes to Privacy Policy</h3>
              <p>We may update this policy periodically. We will notify you of material changes via email or through the platform. Continued use after changes constitutes acceptance.</p>
            </div>

            <div className="legal-section-block">
              <h3>10. Contact Us</h3>
              <p>If you have questions about this Privacy Policy, please contact:</p>
              <div className="contact-info">
                <p>Email: mohammad.moghnieh@au.edu</p>
                <p>Data Protection Officer: Mohammad Moghnieh</p>
              </div>
            </div>

            <div className="legal-footer">
              <p>Your privacy is important to us. We're committed to protecting your personal information.</p>
              <Link to="/register" className="legal-back-btn">← Back to Registration</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Privacy;
