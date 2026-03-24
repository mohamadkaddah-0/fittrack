// UserProfile.jsx - FIXED VERSION

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './UserProfile.css';

const SimplifiedProfile = ({ user: propUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
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

  // Load user data from multiple sources - FIXED VERSION
  const loadUserData = () => {
    console.log('=== LOADING USER DATA ===');
    
    // CRITICAL FIX: First, get the current user from sessionStorage
    const sessionUserRaw = sessionStorage.getItem('currentUser');
    if (!sessionUserRaw) {
      console.log('No session user found');
      return getDefaultUser();
    }
    
    const sessionUser = JSON.parse(sessionUserRaw);
    const userId = sessionUser.id;
    
    console.log('Session user ID:', userId);
    console.log('Session user:', sessionUser);
    
    if (!userId) {
      console.log('No user ID in session');
      return getDefaultUser();
    }
    
    // Try to load user-specific survey data
    const userSurveyRaw = localStorage.getItem(`userSurveyData_${userId}`);
    console.log(`Looking for survey data for ID ${userId}:`, userSurveyRaw);
    
    if (!userSurveyRaw) {
      console.log('No survey data found, using basic user data');
      return {
        id: userId,
        name: sessionUser.name || 'New User',
        username: sessionUser.username || 'newuser',
        email: sessionUser.email || 'user@example.com',
        phone: '',
        birthdate: '',
        height: 0,
        weight: 0,
        weightUnit: 'kg',
        heightUnit: 'cm',
        fitnessLevel: 'Not specified',
        primaryGoal: 'Not specified',
        workoutFrequency: 'Not specified',
        workoutType: 'Not specified',
        workoutLocation: 'Not specified',
        preferredTime: 'Not specified',
        limitations: [],
        equipment: [],
        location: 'Not specified',
        surveyCompleted: false,
        // Also include session data
        currentWeight: sessionUser.currentWeight || 0,
        targetWeight: sessionUser.targetWeight || 0,
        activityLevel: sessionUser.activityLevel || 'moderately_active',
        weightGoal: sessionUser.weightGoal || 'maintain'
      };
    }
    
    // Parse survey data
    let survey;
    try {
      survey = JSON.parse(userSurveyRaw);
      console.log('✅ Loaded survey data:', survey);
    } catch (error) {
      console.error('Error parsing survey data:', error);
      return getDefaultUser();
    }
    
    // Map performance goal to display string
    const getPrimaryGoal = () => {
      if (survey.performanceGoal) {
        const goalMap = {
          'buildStrength': 'Build Strength',
          'improveEndurance': 'Improve Endurance',
          'improveFlexibility': 'Improve Flexibility',
          'generalFitness': 'General Fitness'
        };
        return goalMap[survey.performanceGoal] || survey.performanceGoal;
      }
      if (survey.weightGoal) {
        const weightGoalMap = {
          'lose': 'Weight Loss',
          'gain': 'Weight Gain',
          'maintain': 'Weight Maintenance',
          'buildMuscle': 'Build Muscle'
        };
        return weightGoalMap[survey.weightGoal] || survey.weightGoal;
      }
      return 'General Fitness';
    };
    
    // Build complete user object from survey data
    const userData = {
      id: survey.userId || userId,
      name: sessionUser.name || survey.userName || `${survey.firstName || ''} ${survey.lastName || ''}`.trim() || 'FitTrack User',
      username: sessionUser.username || survey.username || `user_${userId}`,
      email: sessionUser.email || survey.userEmail || survey.email || 'user@example.com',
      phone: '',
      birthdate: survey.birthdate || '',
      height: survey.height ? parseFloat(survey.height) : 0,
      weight: survey.weight ? parseFloat(survey.weight) : 0,
      weightUnit: survey.weightUnit || 'kg',
      heightUnit: survey.heightUnit || 'cm',
      fitnessLevel: survey.fitnessLevel ? survey.fitnessLevel.charAt(0).toUpperCase() + survey.fitnessLevel.slice(1).toLowerCase() : 'Not specified',
      primaryGoal: getPrimaryGoal(),
      workoutFrequency: survey.workoutDuration || 'Not specified',
      workoutType: survey.workoutTypes || 'Not specified',
      workoutLocation: survey.workoutLocation || 'Not specified',
      preferredTime: survey.workoutTime || 'Not specified',
      weightGoal: survey.weightGoal || 'maintain',
      targetWeight: survey.targetWeight || null,
      performanceGoal: survey.performanceGoal || null,
      activityLevel: survey.activityLevel || 'moderately_active',
      limitations: survey.limitations || [],
      equipment: survey.equipment || [],
      timeline: survey.timeline || 'Not specified',
      location: 'Not specified',
      surveyCompleted: true,
      // Include these for the weight trend section
      currentWeight: survey.weight ? parseFloat(survey.weight) : 0,
      targetWeightFromSurvey: survey.targetWeight || null
    };
    
    console.log('✅ Final user data loaded:', userData);
    return userData;
  };
  
  const getDefaultUser = () => ({
    id: Date.now(),
    name: 'New User',
    username: 'newuser',
    email: 'user@example.com',
    phone: '',
    birthdate: '',
    height: 0,
    weight: 0,
    weightUnit: 'kg',
    heightUnit: 'cm',
    fitnessLevel: 'Not specified',
    primaryGoal: 'Not specified',
    workoutFrequency: 'Not specified',
    workoutType: 'Not specified',
    workoutLocation: 'Not specified',
    preferredTime: 'Not specified',
    limitations: [],
    equipment: [],
    location: 'Not specified',
    surveyCompleted: false,
    currentWeight: 0,
    targetWeight: 0
  });

  const [user, setUser] = useState(loadUserData());
  const [editForm, setEditForm] = useState({ ...user });

  // Force reload data when component mounts and when localStorage changes
  useEffect(() => {
    const freshData = loadUserData();
    setUser(freshData);
    setEditForm({ ...freshData });
    
    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key && (e.key.includes('userSurveyData') || e.key === 'userProfile')) {
        console.log('Storage changed, reloading user data');
        const updatedData = loadUserData();
        setUser(updatedData);
        setEditForm({ ...updatedData });
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle input change for edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Save changes
  const handleSave = () => {
    setUser(editForm);
    setIsEditing(false);
    // Save to localStorage with user ID
    if (user.id) {
      localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(editForm));
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditForm({ ...user });
    setIsEditing(false);
  };

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userLoggedIn');
    navigate('/');
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!user.name) return 'U';
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

        <div className="profile-actions">
          {!isEditing ? (
            <>
              <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <div className="edit-actions">
              <button className="save-btn" onClick={handleSave}>Save Changes</button>
              <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
            </div>
          )}
        </div>
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
                  <span className="info-value">{user.fitnessLevel || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Primary Goal</span>
                  <span className="info-value">{user.primaryGoal || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Workout Duration</span>
                  <span className="info-value">{user.workoutFrequency || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Workout Type</span>
                  <span className="info-value">{user.workoutType || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Workout Location</span>
                  <span className="info-value">{user.workoutLocation || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Preferred Time</span>
                  <span className="info-value">{user.preferredTime || 'Not specified'}</span>
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
              <div className="edit-grid">
                <div className="edit-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="edit-field">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={editForm.username}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="edit-field">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="edit-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="info-section">
              <h2>Edit Physical Stats</h2>
              <div className="edit-grid">
                <div className="edit-field">
                  <label>Height ({user.heightUnit})</label>
                  <input
                    type="number"
                    name="height"
                    value={editForm.height}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="edit-field">
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
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="profile-footer">
        <p>
          {user.surveyCompleted ? '✓ Profile data from fitness survey' : 'Complete the fitness survey to see your personalized data'}
        </p>
      </div>
    </div>
  );
};

export default SimplifiedProfile;