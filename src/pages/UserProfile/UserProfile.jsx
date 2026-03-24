import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './UserProfile.css';

const SimplifiedProfile = ({ user: propUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  
  // Calculate age from birthdate
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

  // Format workout types properly
  const formatWorkoutTypes = (workoutTypes) => {
    if (!workoutTypes) return 'Not specified';
    if (Array.isArray(workoutTypes)) {
      return workoutTypes.join(', ');
    }
    return workoutTypes; // Already a string
  };

  // Load user data from multiple sources
const loadUserData = () => {
  console.log('=== LOADING USER DATA ===');
  
  // First check if user was passed as prop
  if (propUser) {
    console.log('Using prop user data');
    return propUser;
  }
  
  // Check for survey data first
  const surveyDataRaw = localStorage.getItem('userSurveyData');
  console.log('Raw survey data:', surveyDataRaw);
  
  let survey = null;
  if (surveyDataRaw) {
    try {
      survey = JSON.parse(surveyDataRaw);
      console.log('Parsed survey data:', survey);
    } catch (error) {
      console.error('Error parsing survey data:', error);
    }
  }
  
  // Get session user for name/email
  const sessionUserRaw = sessionStorage.getItem('currentUser');
  const sessionUser = sessionUserRaw ? JSON.parse(sessionUserRaw) : {};
  console.log('Session user:', sessionUser);
  
  // If we have survey data, use it
  if (survey) {
    console.log('✅ Using survey data');
    
    // Log all fitness preference fields to verify they exist
    console.log('Workout Types from survey:', survey.workoutTypes);
    console.log('Workout Duration from survey:', survey.workoutDuration);
    console.log('Workout Location from survey:', survey.workoutLocation);
    console.log('Workout Time from survey:', survey.workoutTime);
    console.log('Fitness Level from survey:', survey.fitnessLevel);
    console.log('Performance Goal from survey:', survey.performanceGoal);
    console.log('Weight Goal from survey:', survey.weightGoal);
    
    // Format workout types
    let workoutTypeDisplay = 'Not specified';
    if (survey.workoutTypes && survey.workoutTypes !== '') {
      workoutTypeDisplay = formatWorkoutTypes(survey.workoutTypes);
    }
    
    // Map workout duration
    let workoutDuration = 'Not specified';
    if (survey.workoutDuration && survey.workoutDuration !== '') {
      workoutDuration = survey.workoutDuration;
    }
    
    // Format fitness level
    let fitnessLevel = 'Not specified';
    if (survey.fitnessLevel && survey.fitnessLevel !== '') {
      fitnessLevel = survey.fitnessLevel.charAt(0).toUpperCase() + survey.fitnessLevel.slice(1).toLowerCase();
    }
    
    // Map primary goal - check both performanceGoal and weightGoal
    let primaryGoal = 'General Fitness';
    if (survey.performanceGoal && survey.performanceGoal !== '') {
      const goalMap = {
        'buildStrength': 'Build Strength',
        'improveEndurance': 'Improve Endurance',
        'improveFlexibility': 'Improve Flexibility',
        'generalFitness': 'General Fitness'
      };
      primaryGoal = goalMap[survey.performanceGoal] || survey.performanceGoal;
    } else if (survey.weightGoal && survey.weightGoal !== '') {
      const weightGoalMap = {
        'lose': 'Weight Loss',
        'gain': 'Weight Gain',
        'maintain': 'Weight Maintenance',
        'buildMuscle': 'Build Muscle'
      };
      primaryGoal = weightGoalMap[survey.weightGoal] || survey.weightGoal;
    }
    
    // Map workout location
    let workoutLocation = 'Not specified';
    if (survey.workoutLocation && survey.workoutLocation !== '') {
      workoutLocation = survey.workoutLocation;
    }
    
    // Map preferred time
    let preferredTime = 'Not specified';
    if (survey.workoutTime && survey.workoutTime !== '') {
      preferredTime = survey.workoutTime;
    }
    
    const userData = {
      // Personal info
      name: sessionUser.name || 'New User',
      username: sessionUser.username || 'newuser',
      email: sessionUser.email || 'user@example.com',
      phone: '',
      
      // Physical stats from survey
      birthdate: survey.birthdate || '',
      height: survey.height ? parseFloat(survey.height) : 0,
      weight: survey.weight ? parseFloat(survey.weight) : 0,
      weightUnit: survey.weightUnit || 'kg',
      heightUnit: survey.heightUnit || 'cm',
      
      // Fitness preferences - Make sure these are set
      fitnessLevel: fitnessLevel,
      primaryGoal: primaryGoal,
      workoutFrequency: workoutDuration,
      workoutType: workoutTypeDisplay,
      workoutLocation: workoutLocation,
      preferredTime: preferredTime,
      
      // Additional data
      limitations: survey.limitations || [],
      equipment: survey.equipment || [],
      timeline: survey.timeline || 'Not specified',
      weightGoal: survey.weightGoal || 'maintain',
      targetWeight: survey.targetWeight || null,
      performanceGoal: survey.performanceGoal || null,
      activityLevel: survey.activityLevel || null,
      
      // Location
      location: 'Not specified'
    };
    
    console.log('Final user data with fitness preferences:', {
      fitnessLevel: userData.fitnessLevel,
      primaryGoal: userData.primaryGoal,
      workoutFrequency: userData.workoutFrequency,
      workoutType: userData.workoutType,
      workoutLocation: userData.workoutLocation,
      preferredTime: userData.preferredTime
    });
    
    return userData;
  }
  
  // Default fallback
  console.log('Using default fallback data');
  return {
    name: sessionUser.name || 'Alex Johnson',
    username: sessionUser.username || 'alexjohnson',
    email: sessionUser.email || 'alex.johnson@example.com',
    phone: '',
    birthdate: '1996-05-15',
    height: 180,
    weight: 75,
    weightUnit: 'kg',
    heightUnit: 'cm',
    fitnessLevel: 'Intermediate',
    primaryGoal: 'Weight Loss',
    workoutFrequency: '3-4 days/week',
    workoutType: 'Mixed',
    workoutLocation: 'Gym',
    preferredTime: 'Morning',
    limitations: [],
    equipment: [],
    location: 'Not specified'
  };
};

  const [user, setUser] = useState(loadUserData());
  const [editForm, setEditForm] = useState({ ...user });

// Force reload data when component mounts
useEffect(() => {
  const freshData = loadUserData();
  setUser(freshData);
  setEditForm({ ...freshData });
}, []);

// Debug: Log what's being displayed
useEffect(() => {
  console.log('Current user data:', user);
}, [user]);

// Debug: Check what's in localStorage when component mounts
useEffect(() => {
  const surveyData = localStorage.getItem('userSurveyData');
  console.log('=== PROFILE PAGE LOADED ===');
  console.log('userSurveyData in localStorage:', surveyData);
  
  if (surveyData) {
    const parsed = JSON.parse(surveyData);
    console.log('Fitness preferences in localStorage:', {
      workoutTypes: parsed.workoutTypes,
      workoutDuration: parsed.workoutDuration,
      workoutLocation: parsed.workoutLocation,
      workoutTime: parsed.workoutTime,
      fitnessLevel: parsed.fitnessLevel,
      performanceGoal: parsed.performanceGoal
    });
  }
}, []);

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Save changes
  const handleSave = () => {
    setUser(editForm);
    setIsEditing(false);
  };

  // Cancel editing
  const handleCancel = () => {
    setEditForm({ ...user });
    setIsEditing(false);
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const age = calculateAge(user.birthdate);

  return (
    <div className="simplified-profile">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            {editForm.profilePicture ? (
              <img src={editForm.profilePicture} alt={user.name} />
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
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-username">@{user.username}</p>
          {age && <p className="profile-age">{age} years old</p>}
        </div>

        {!isEditing ? (
          <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        ) : (
          <div className="edit-actions">
            <button className="save-btn" onClick={handleSave}>Save Changes</button>
            <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        {!isEditing ? (
          /* VIEW MODE */
          <div className="view-mode">
            {/* Personal Information */}
            <div className="info-section">
              <h2>Personal Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{user.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Username</span>
                  <span className="info-value">@{user.username}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{user.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{user.phone || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Age</span>
                  <span className="info-value">{age || 'Not specified'} years</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Location</span>
                  <span className="info-value">{user.location || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Physical Stats */}
            <div className="info-section">
              <h2>Physical Statistics</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Height</span>
                  <span className="info-value">{user.height} {user.heightUnit}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Weight</span>
                  <span className="info-value">{user.weight} {user.weightUnit}</span>
                </div>
                {user.targetWeight && (
                  <div className="info-item">
                    <span className="info-label">Target Weight</span>
                    <span className="info-value">{user.targetWeight} {user.weightUnit}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fitness Preferences */}
            <div className="info-section">
              <h2>Fitness Preferences</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Fitness Level</span>
                  <span className="info-value">{user.fitnessLevel}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Primary Goal</span>
                  <span className="info-value">{user.primaryGoal}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Workout Duration</span>
                  <span className="info-value">{user.workoutFrequency}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Workout Type</span>
                  <span className="info-value">{user.workoutType}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Workout Location</span>
                  <span className="info-value">{user.workoutLocation}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Preferred Time</span>
                  <span className="info-value">{user.preferredTime}</span>
                </div>
              </div>
            </div>

            {/* Limitations & Equipment */}
            {user.limitations && user.limitations.length > 0 && !user.limitations.includes('No limitations') && (
              <div className="info-section">
                <h2>Physical Limitations</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Limitations</span>
                    <span className="info-value">{user.limitations.join(', ')}</span>
                  </div>
                </div>
              </div>
            )}

            {user.equipment && user.equipment.length > 0 && !user.equipment.includes('None') && (
              <div className="info-section">
                <h2>Available Equipment</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Equipment</span>
                    <span className="info-value">{user.equipment.join(', ')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* EDIT MODE */
          <div className="edit-mode">
            <div className="info-section">
              <h2>Edit Personal Information</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="info-section">
              <h2>Edit Physical Stats</h2>
              <div className="form-group">
                <label>Height ({user.heightUnit})</label>
                <input
                  type="number"
                  name="height"
                  value={editForm.height}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Weight ({user.weightUnit})</label>
                <input
                  type="number"
                  name="weight"
                  value={editForm.weight}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="profile-footer">
        <p style={{ fontSize: '10px', color: 'var(--dim)' }}>
          Profile data from fitness survey
        </p>
      </div>
    </div>
  );
};

export default SimplifiedProfile;