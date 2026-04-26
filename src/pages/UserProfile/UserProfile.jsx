import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';

const SimplifiedProfile = ({ user: propUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const API_URL = 'https://fittrack-t4iu.onrender.com/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('fittrack_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchUserData = async () => {
    const token = localStorage.getItem('fittrack_token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userResponse = await fetch(`${API_URL}/users/me`, {
        headers: getAuthHeaders()
      });
      const userResult = await userResponse.json();
      
      if (!userResult.success) {
        if (userResult.message === 'Invalid token' || userResult.message === 'No token provided') {
          navigate('/login');
        }
        return;
      }
      
      const user = userResult.user;
      
      // Fetch survey data to get workout preferences
      let surveyData = {};
      try {
        const surveyResponse = await fetch(`${API_URL}/survey`, {
          headers: getAuthHeaders()
        });
        const surveyResult = await surveyResponse.json();
        if (surveyResult.success && surveyResult.survey) {
          surveyData = surveyResult.survey;
        }
      } catch (err) {
        console.log('No survey data found, using defaults');
      }
      
      const combinedData = {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.email.split('@')[0],
        age: user.age || '',
        gender: user.gender || '',
        phone: '',
        height: user.height || '',
        currentWeight: user.currentWeight || null,
        targetWeight: user.targetWeight || '',
        weightUnit: 'kg',
        heightUnit: 'cm',
        fitnessLevel: user.fitnessLevel ? 
          user.fitnessLevel.charAt(0).toUpperCase() + user.fitnessLevel.slice(1) : '',
        primaryGoal: user.goal || '',
        activityLevel: user.activityLevel || '',
        workoutFrequency: surveyData.workoutDuration || '',
        workoutType: surveyData.workoutTypes || '',
        workoutLocation: surveyData.workoutLocation || '',
        preferredTime: surveyData.workoutTime || '',
        limitations: surveyData.limitations || [],
        equipment: surveyData.equipment || []
      };
      
      console.log('Loaded survey data:', {
        workoutDuration: surveyData.workoutDuration,
        workoutTypes: surveyData.workoutTypes,
        workoutLocation: surveyData.workoutLocation,
        workoutTime: surveyData.workoutTime
      });
      
      setUserData(combinedData);
      
      const hasSurvey = localStorage.getItem(`surveySkipped_${user.id}`) === 'true';
      setHasCompletedSurvey(!hasSurvey && !!user.fitnessLevel);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleTakeSurvey = () => {
    navigate('/surveys');
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData(prev => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!userData) return;
    
    setSaveMessage({ text: 'Saving...', type: 'info' });
    
    try {
      const token = localStorage.getItem('fittrack_token');
      
      if (!token) {
        setSaveMessage({ text: 'Not logged in. Please log in again.', type: 'error' });
        setTimeout(() => navigate('/login'), 1500);
        return;
      }
      
      const userUpdateData = {
        name: userData.name,
        current_weight: parseFloat(userData.currentWeight),
        target_weight: userData.targetWeight ? parseFloat(userData.targetWeight) : null,
        activity_level: userData.activityLevel,
        goal: userData.primaryGoal,
        fitness_level: userData.fitnessLevel.toLowerCase(),
        height: parseFloat(userData.height),
        age: userData.age ? parseInt(userData.age) : null,
        gender: userData.gender
      };
      
      console.log('Saving:', userUpdateData);
      
      const userResponse = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userUpdateData)
      });
      
      const userResult = await userResponse.json();
      
      if (!userResult.success) {
        throw new Error(userResult.message || 'Failed to update user data');
      }

      const surveyUpdateData = {
        workoutTypes: userData.workoutType,
        workoutLocation: userData.workoutLocation,
        workoutTime: userData.preferredTime,
        workoutDuration: userData.workoutFrequency,
        fitnessLevel: userData.fitnessLevel.toLowerCase(),
        activityLevel: userData.activityLevel,
        weightGoal: userData.primaryGoal,
        height: parseFloat(userData.height),
        weight: parseFloat(userData.currentWeight),
        targetWeight: userData.targetWeight ? parseFloat(userData.targetWeight) : null
      };
      
      console.log('Saving survey data:', surveyUpdateData);
      
      const surveyResponse = await fetch(`${API_URL}/survey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(surveyUpdateData)
      });
      
      const surveyResult = await surveyResponse.json();
      console.log('Survey save result:', surveyResult);
      
      setSaveMessage({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
      
      setTimeout(() => {
        fetchUserData();
        setTimeout(() => {
          setSaveMessage({ text: '', type: '' });
        }, 2000);
      }, 500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage({ text: 'Error: ' + error.message, type: 'error' });
      setTimeout(() => setSaveMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchUserData();
  };

  const handleLogout = () => {
    localStorage.removeItem('fittrack_token');
    localStorage.removeItem('fittrack_user');
    sessionStorage.removeItem('currentUser');
    navigate('/login');
  };

  const getInitials = () => {
    if (!userData?.name) return 'U';
    return userData.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const fitnessLevelOptions = ['Beginner', 'Intermediate', 'Advanced', 'Athlete'];
  const goalOptions = ['lose', 'maintain', 'gain_muscle', 'gain'];
  const activityLevelOptions = ['sedentary', 'lightly_active', 'moderately_active', 'very_active'];
  const workoutFrequencyOptions = ['1-2 days', '3-4 days', '5-6 days', 'Every day'];
  const workoutTypeOptions = ['Strength Training', 'Cardio', 'HIIT', 'Yoga', 'Crossfit', 'Calisthenics'];
  const workoutLocationOptions = ['Gym', 'Home', 'Outdoor', 'Any'];
  const preferredTimeOptions = ['Morning', 'Afternoon', 'Evening', 'Late Night'];

  if (isLoading) {
    return (
      <div className="simplified-profile">
        <div style={{ textAlign: 'center', padding: '60px' }}>Loading profile...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="simplified-profile">
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <p>Unable to load profile. Please <button onClick={() => navigate('/login')} style={{ background: 'none', color: 'var(--cyan)', border: 'none', cursor: 'pointer' }}>log in again</button>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="simplified-profile">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            {userData.profilePicture ? (
              <img src={userData.profilePicture} alt={userData.name} />
            ) : (
              <div className="avatar-placeholder">
                {getInitials()}
              </div>
            )}
          </div>
          {isEditing && (
            <>
              <button 
                type="button" 
                className="upload-photo-btn"
                onClick={triggerFileInput}
              >
                Upload Photo
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </>
          )}
        </div>
        
        <div className="profile-title-section">
          <h1 className="profile-name">{userData.name}</h1>
          <p className="profile-username">@{userData.username}</p>
  
        </div>

        {!isEditing && (
          <div className="profile-actions">
            {!hasCompletedSurvey && (
              <button className="take-survey-btn" onClick={handleTakeSurvey}>
                Complete Fitness Survey →
              </button>
            )}
            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>

      {saveMessage.text && (
        <div className={`save-message ${saveMessage.type}`} style={{
          padding: '10px 20px',
          margin: '10px 0',
          borderRadius: '4px',
          textAlign: 'center',
          backgroundColor: saveMessage.type === 'success' ? 'rgba(198, 241, 53, 0.2)' : 'rgba(255, 68, 68, 0.2)',
          color: saveMessage.type === 'success' ? 'var(--lime)' : 'var(--hot)'
        }}>
          {saveMessage.text}
        </div>
      )}

      <div className="profile-content">
        {!isEditing ? (
          <div className="view-mode">
            <div className="info-section">
              <h2>Personal Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{userData.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Username</span>
                  <span className="info-value">@{userData.username}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{userData.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{userData.phone || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Age</span>
                  <span className="info-value">{userData.age || 'Not specified'} years</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Gender</span>
                  <span className="info-value">{userData.gender || 'Not specified'}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h2>Physical Statistics</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Height</span>
                  <span className="info-value">{userData.height} {userData.heightUnit}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Weight</span>
                  <span className="info-value">{userData.currentWeight} {userData.weightUnit}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Target Weight</span>
                  <span className="info-value">{userData.targetWeight ? `${userData.targetWeight} ${userData.weightUnit}` : 'Not specified'}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h2>Fitness Preferences</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Fitness Level</span>
                  <span className="info-value">{userData.fitnessLevel || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Primary Goal</span>
                  <span className="info-value">{userData.primaryGoal || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Activity Level</span>
                  <span className="info-value">{userData.activityLevel?.replace('_', ' ') || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Workout Duration</span>
                  <span className="info-value">{userData.workoutFrequency || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Workout Type</span>
                  <span className="info-value">{userData.workoutType || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Workout Location</span>
                  <span className="info-value">{userData.workoutLocation || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Preferred Time</span>
                  <span className="info-value">{userData.preferredTime || 'Not specified'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="edit-mode">
            <div className="info-section">
              <h2>Personal Information</h2>
              <div className="edit-grid">
                <div className="edit-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="edit-field">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={userData.username}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="edit-field">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="edit-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={userData.phone || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="edit-field">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={userData.age || ''}
                    onChange={handleInputChange}
                    placeholder="Age in years"
                  />
                </div>
                <div className="edit-field">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={userData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h2>Physical Statistics</h2>
              <div className="edit-grid">
                <div className="edit-field">
                  <label>Height ({userData.heightUnit})</label>
                  <input
                    type="number"
                    name="height"
                    value={userData.height}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="edit-field">
                  <label>Weight ({userData.weightUnit})</label>
                  <input
                    type="number"
                    name="currentWeight"
                    value={userData.currentWeight}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="edit-field">
                  <label>Target Weight ({userData.weightUnit})</label>
                  <input
                    type="number"
                    name="targetWeight"
                    value={userData.targetWeight || ''}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            <div className="info-section">
              <h2>Fitness Preferences</h2>
              <div className="edit-grid">
                <div className="edit-field">
                  <label>Fitness Level</label>
                  <select
                    name="fitnessLevel"
                    value={userData.fitnessLevel}
                    onChange={handleInputChange}
                  >
                    {fitnessLevelOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="edit-field">
                  <label>Primary Goal</label>
                  <select
                    name="primaryGoal"
                    value={userData.primaryGoal}
                    onChange={handleInputChange}
                  >
                    {goalOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="edit-field">
                  <label>Activity Level</label>
                  <select
                    name="activityLevel"
                    value={userData.activityLevel}
                    onChange={handleInputChange}
                  >
                    {activityLevelOptions.map(option => (
                      <option key={option} value={option}>{option.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="edit-field">
                  <label>Workout Duration</label>
                  <select
                    name="workoutFrequency"
                    value={userData.workoutFrequency}
                    onChange={handleInputChange}
                  >
                    {workoutFrequencyOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="edit-field">
                  <label>Workout Type</label>
                  <select
                    name="workoutType"
                    value={userData.workoutType}
                    onChange={handleInputChange}
                  >
                    {workoutTypeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="edit-field">
                  <label>Workout Location</label>
                  <select
                    name="workoutLocation"
                    value={userData.workoutLocation}
                    onChange={handleInputChange}
                  >
                    {workoutLocationOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="edit-field">
                  <label>Preferred Time</label>
                  <select
                    name="preferredTime"
                    value={userData.preferredTime}
                    onChange={handleInputChange}
                  >
                    {preferredTimeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="edit-actions-bottom">
          <button className="save-btn" onClick={handleSave}>Save Changes</button>
          <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
        </div>
      )}

      <div className="profile-footer">
        <p>
          {hasCompletedSurvey ? '✓ Profile data from fitness survey' : 'Complete the fitness survey to get personalized recommendations'}
        </p>
      </div>
    </div>
  );
};

export default SimplifiedProfile;