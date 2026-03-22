import React from 'react';
import { Link } from 'react-router-dom';
import "./ReadySurvey.css";
const ReadySurvey = () => {
  return (
    <section className="ready-section">
      <div className="ready-card">
        <div className="ready-ghost">//</div>
        
        <div className="ready-header">
          <div className="ready-code">FITNESS ASSESSMENT</div>
          <div className="ready-title">
            ready to
            <em>begin?</em>
          </div>
        </div>

        <div className="ready-body">
          
          
          <h2 className="ready-question">Are you ready to take the fitness survey?</h2>
          
          <p className="ready-description">
            This survey will help us understand your fitness goals, preferences, 
            and current activity level. Based on your responses, we'll create a 
            personalized workout plan tailored just for you.
          </p>

          <div className="ready-stats">
            <div className="ready-stat">
              <span className="stat-number">4</span>
              <span className="stat-label">Quick Steps</span>
            </div>
            <div className="ready-stat">
              <span className="stat-number">5-7</span>
              <span className="stat-label">Minutes</span>
            </div>
            <div className="ready-stat">
              <span className="stat-number">100%</span>
              <span className="stat-label">Personalized</span>
            </div>
          </div>

          <div className="ready-benefits">
            <h3>You'll get:</h3>
            <ul>
              <li>Personalized workout recommendations</li>
              <li>Customized fitness goals</li>
              <li>Tailored progress tracking</li>
              <li>Better workout suggestions</li>
            </ul>
          </div>

          <div className="ready-actions">
            <Link to="/surveys" onClick={() => window.scrollTo(0, 0)}>
              <button className="ready-btn start-btn">
                YES, START SURVEY →
              </button>
            </Link>
            
            <Link 
              to="/dashboard"
              onClick={() => window.scrollTo(0, 0)}
            >
              <button className="ready-btn later-btn">
                NOT NOW, TAKE ME HOME
              </button>
            </Link>
          </div>

          <p className="ready-note">
            You can always take the survey later from your profile settings.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ReadySurvey;
