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

  const API_URL = 'http://localhost:3000/api';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('fittrack_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return null;
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch user data from API
  const fetchUserData = async () => {
  const token = localStorage.getItem('fittrack_token');
  
  if (!token) {
    console.log('No token found');
    navigate('/login');
    return;
  }
  
  setIsLoading(true);
  
  try {
    // Fetch user profile
    const userResponse = await fetch(`${API_URL}/users/me`, {
      headers: getAuthHeaders()
    });
    const userResult = await userResponse.json();
    
    if (!userResult.success) {
      console.log('Failed to fetch user:', userResult.message);
      if (userResult.message === 'Invalid token' || userResult.message === 'No token provided') {
        navigate('/login');
      }
      return;
    }
    
    // Fetch survey data
    const surveyResponse = await fetch(`${API_URL}/survey`, {
      headers: getAuthHeaders()
    });
    const surveyResult = await surveyResponse.json();
    
    console.log('Survey result:', surveyResult);
    
    // Determine if survey is completed
    // A survey is completed ONLY if it has meaningful fitnessLevel data
    let surveyCompleted = false;
    let survey = null;
    
    if (surveyResult.success && surveyResult.survey) {
      survey = surveyResult.survey;
      // Check if survey has actual data (not just empty/default values)
      surveyCompleted = !!(survey.fitnessLevel && 
                       survey.fitnessLevel !== 'Not specified' &&
                       survey.fitnessLevel !== '' &&
                       survey.fitnessLevel !== null);
    }
    
    // Also check localStorage flags for skipped survey
    const userId = userResult.user.id;
    const surveySkipped = localStorage.getItem(`surveySkipped_${userId}`) === 'true';
    
    // If survey was skipped, it's NOT completed
    if (surveySkipped) {
      surveyCompleted = false;
    }
    
    console.log('Survey completed:', surveyCompleted);
    console.log('Survey skipped:', surveySkipped);
    
    // Combine user and survey data
    const combinedData = {
      id: userResult.user.id,
      name: userResult.user.name,
      email: userResult.user.email,
      username: userResult.user.email.split('@')[0],
      age: userResult.user.age || null,
      gender: userResult.user.gender || '',
      phone: '',
      birthdate: '',
      height: survey?.height || userResult.user.height || 0,
      weight: survey?.weight || userResult.user.currentWeight || 0,
      weightUnit: 'kg',
      heightUnit: 'cm',
      fitnessLevel: survey?.fitnessLevel ? 
        survey.fitnessLevel.charAt(0).toUpperCase() + survey.fitnessLevel.slice(1) : 
        'Not specified',
      primaryGoal: survey?.weightGoal || userResult.user.goal || 'Not specified',
      workoutFrequency: survey?.workoutDuration || 'Not specified',
      workoutType: survey?.workoutTypes || 'Not specified',
      workoutLocation: survey?.workoutLocation || 'Not specified',
      preferredTime: survey?.workoutTime || 'Not specified',
      limitations: survey?.limitations || [],
      equipment: survey?.equipment || [],
      location: 'Not specified',
      surveyCompleted: surveyCompleted,
      currentWeight: survey?.weight || userResult.user.currentWeight || 0,
      targetWeight: survey?.targetWeight || userResult.user.targetWeight || null,
      activityLevel: survey?.activityLevel || userResult.user.activityLevel || 'moderately_active',
      weightGoal: survey?.weightGoal || userResult.user.goal || 'maintain',
      performanceGoal: survey?.performanceGoal || null,
      timeline: survey?.timeline || 'Not specified'
    };
    
    console.log('Combined data:', combinedData);
    
    setUserData(combinedData);
    setHasCompletedSurvey(surveyCompleted);
    
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
  
  console.log('=== SAVING PROFILE ===');
  
console.log('=== PROFILE RENDER STATE ===');
console.log('hasCompletedSurvey:', hasCompletedSurvey);
console.log('userData?.surveyCompleted:', userData?.surveyCompleted);
console.log('userData?.fitnessLevel:', userData?.fitnessLevel);
  
  setSaveMessage({ text: 'Saving...', type: 'info' });
  
  try {
    const token = localStorage.getItem('fittrack_token');
    
    if (!token) {
      setSaveMessage({ text: 'Not logged in. Please log in again.', type: 'error' });
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    
    // 1. Update User table data (name, weight, height, etc.)
    const userUpdateData = {
      name: userData.name,
      current_weight: parseFloat(userData.currentWeight),
      target_weight: userData.targetWeight ? parseFloat(userData.targetWeight) : null,
      activity_level: userData.activityLevel,
      goal: userData.weightGoal,
      fitness_level: userData.fitnessLevel.toLowerCase(),
      height: parseFloat(userData.height)
    };
    
    console.log('Updating user data:', userUpdateData);
    
    const userResponse = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userUpdateData)
    });
    
    const userResult = await userResponse.json();
    console.log('User update result:', userResult);
    
    if (!userResult.success) {
      throw new Error(userResult.message || 'Failed to update user data');
    }
    
    // 2. Update Survey data (workout preferences, limitations, equipment)
    const surveyUpdateData = {
      fitnessLevel: userData.fitnessLevel.toLowerCase(),
      activityLevel: userData.activityLevel,
      workoutDuration: userData.workoutFrequency,
      workoutTypes: userData.workoutType,
      workoutLocation: userData.workoutLocation,
      workoutTime: userData.preferredTime,
      weightGoal: userData.weightGoal,
      performanceGoal: userData.performanceGoal,
      limitations: userData.limitations.filter(l => l !== 'No limitations'),
      equipment: userData.equipment.filter(e => e !== 'None').map(e => e.toLowerCase()),
      height: parseFloat(userData.height),
      weight: parseFloat(userData.currentWeight),
      targetWeight: userData.targetWeight ? parseFloat(userData.targetWeight) : null
    };
    
    console.log('Updating survey data:', surveyUpdateData);
    
    const surveyResponse = await fetch(`${API_URL}/survey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(surveyUpdateData)
    });
    
    const surveyResult = await surveyResponse.json();
    console.log('Survey update result:', surveyResult);
    
    if (surveyResult.success) {
      setSaveMessage({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
      
      // Refresh all data
      setTimeout(async () => {
        await fetchUserData();
        setSaveMessage({ text: '', type: '' });
      }, 1000);
    } else {
      throw new Error(surveyResult.message || 'Failed to update survey data');
    }
    
  } catch (error) {
    console.error('Error updating profile:', error);
    setSaveMessage({ text: 'Error: ' + error.message, type: 'error' });
    setTimeout(() => setSaveMessage({ text: '', type: '' }), 3000);
  }
};

  const handleCancel = () => {
    setIsEditing(false);
    fetchUserData(); // Reload original data
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

  const age = calculateAge(userData?.birthdate);

  const fitnessLevelOptions = ['Beginner', 'Intermediate', 'Advanced', 'Athlete'];
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
          {age && <p className="profile-age">{age} years old</p>}
        </div>

        {!isEditing && (
          <div className="profile-actions">
            {/* Show Take Survey button only if survey NOT completed */}
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

      {/* Save message */}
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
                  <span className="info-value">{age || 'Not specified'} years</span>
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
                  <span className="info-value">{userData.weight} {userData.weightUnit}</span>
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

            {userData.limitations && userData.limitations.length > 0 && !userData.limitations.includes('No limitations') && (
              <div className="info-section">
                <h2>Physical Limitations</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Limitations</span>
                    <span className="info-value">{userData.limitations.join(', ')}</span>
                  </div>
                </div>
              </div>
            )}

            {userData.equipment && userData.equipment.length > 0 && !userData.equipment.includes('None') && (
              <div className="info-section">
                <h2>Available Equipment</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Equipment</span>
                    <span className="info-value">{userData.equipment.join(', ')}</span>
                  </div>
                </div>
              </div>
            )}
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
                  <input
                    type="text"
                    name="primaryGoal"
                    value={userData.primaryGoal}
                    onChange={handleInputChange}
                    placeholder="e.g., Weight Loss, Build Muscle"
                  />
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
          {hasCompletedSurvey ? '✓ Profile data from fitness survey' : '⚠️ Complete the fitness survey to get personalized recommendations'}
        </p>
      </div>
    </div>
  );
};

export default SimplifiedProfile;