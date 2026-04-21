import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./ReadySurvey.css";

const ReadySurvey = () => {
  const navigate = useNavigate();

  const handleSkipSurvey = () => {
  // Try to get user from multiple sources
  let user = null;
  let userId = null;
  
  const localUser = localStorage.getItem('fittrack_user');
  const sessionUser = sessionStorage.getItem('currentUser');
  const token = localStorage.getItem('fittrack_token');
  
  if (localUser) {
    user = JSON.parse(localUser);
    userId = user.id;
  } else if (sessionUser) {
    user = JSON.parse(sessionUser);
    userId = user.id;
  }
  
  if (userId) {
    // Mark that user skipped the survey
    localStorage.setItem(`surveySkipped_${userId}`, 'true');
    localStorage.setItem(`surveyCompleted_${userId}`, 'false');
    console.log('Survey skipped for user:', userId);
  } else {
    console.error('No user found when skipping survey');
  }
  
  navigate('/dashboard');
};

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
            
            <button className="ready-btn later-btn" onClick={handleSkipSurvey}>
              NOT NOW, TAKE ME HOME
            </button>
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