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
  
  // First check if user was passed as prop
  if (propUser) {
    console.log('Using prop user data');
    return propUser;
  }
  
  // Check for survey data first
  const surveyDataRaw = localStorage.getItem('userSurveyData');
  console.log('Raw survey data from localStorage:', surveyDataRaw);
  
  let survey = null;
  if (surveyDataRaw) {
    try {
      survey = JSON.parse(surveyDataRaw);
      console.log('Parsed survey data:', survey);
    } catch (error) {
      console.error('Error parsing survey data:', error);
    }
  } else {
    console.log('No survey data found in localStorage');
  }
  
  // Check localStorage for profile
  const savedProfile = localStorage.getItem('userProfile');
  let profile = null;
  if (savedProfile) {
    try {
      profile = JSON.parse(savedProfile);
      console.log('Parsed profile data:', profile);
    } catch (error) {
      console.error('Error parsing profile data:', error);
    }
  }
  
  // Get session user for name/email
  const sessionUserRaw = sessionStorage.getItem('currentUser');
  const sessionUser = sessionUserRaw ? JSON.parse(sessionUserRaw) : {};
  console.log('Session user:', sessionUser);
  
  // Prioritize survey data for fitness preferences
  if (survey) {
    console.log('✅ Using survey data for fitness preferences');
    
    // Format workout types (handle both string and array)
    let workoutTypeDisplay = 'Not specified';
    if (survey.workoutTypes) {
      workoutTypeDisplay = formatWorkoutTypes(survey.workoutTypes);
      console.log('Workout types:', survey.workoutTypes, 'Formatted:', workoutTypeDisplay);
    }
    
    // Map workout duration (profile expects workoutFrequency)
    let workoutFrequency = survey.workoutDuration || 'Not specified';
    console.log('Workout duration:', workoutFrequency);
    
    // Map fitness level (convert to proper case)
    let fitnessLevel = survey.fitnessLevel || 'Beginner';
    if (fitnessLevel) {
      fitnessLevel = fitnessLevel.charAt(0).toUpperCase() + fitnessLevel.slice(1).toLowerCase();
    }
    console.log('Fitness level:', fitnessLevel);
    
    // Map primary goal - check both weightGoal and performanceGoal
    let primaryGoal = 'General Fitness';
    if (survey.performanceGoal) {
      // Map performance goal to display name
      const goalMap = {
        'buildStrength': 'Build Strength',
        'improveEndurance': 'Improve Endurance',
        'improveFlexibility': 'Improve Flexibility',
        'generalFitness': 'General Fitness'
      };
      primaryGoal = goalMap[survey.performanceGoal] || survey.performanceGoal;
      console.log('Performance goal:', survey.performanceGoal, 'Mapped to:', primaryGoal);
    } else if (survey.weightGoal) {
      // Fallback to weight goal
      const weightGoalMap = {
        'lose': 'Weight Loss',
        'gain': 'Weight Gain',
        'maintain': 'Weight Maintenance',
        'buildMuscle': 'Build Muscle'
      };
      primaryGoal = weightGoalMap[survey.weightGoal] || survey.weightGoal;
      console.log('Weight goal:', survey.weightGoal, 'Mapped to:', primaryGoal);
    }
    
    const userData = {
      // Personal info from session or profile
      name: sessionUser.name || profile?.name || survey.name || 'New User',
      username: sessionUser.username || profile?.username || 'newuser',
      email: sessionUser.email || profile?.email || 'user@example.com',
      phone: profile?.phone || '',
      memberSince: profile?.memberSince || survey.memberSince || new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' }),
      
      // Physical stats from survey
      birthdate: survey.birthdate || profile?.birthdate,
      height: survey.height ? parseFloat(survey.height) : (profile?.height || 0),
      weight: survey.weight ? parseFloat(survey.weight) : (profile?.weight || 0),
      weightUnit: survey.weightUnit || 'kg',
      heightUnit: survey.heightUnit || 'cm',
      
      // Fitness preferences from survey - map correctly
      fitnessLevel: fitnessLevel,
      primaryGoal: primaryGoal,
      workoutFrequency: workoutFrequency, // This maps workoutDuration to workoutFrequency
      workoutType: workoutTypeDisplay,
      workoutLocation: survey.workoutLocation || profile?.workoutLocation || 'Not specified',
      preferredTime: survey.workoutTime || profile?.preferredTime || 'Not specified',
      
      // Additional data from survey
      limitations: survey.limitations || [],
      equipment: survey.equipment || [],
      timeline: survey.timeline || 'Not specified',
      weightGoal: survey.weightGoal || 'maintain',
      targetWeight: survey.targetWeight || null,
      performanceGoal: survey.performanceGoal || null,
      activityLevel: survey.activityLevel || null,
      
      // Location (if any)
      location: profile?.location || 'Not specified'
    };
    
    console.log('Final user data from survey:', userData);
    return userData;
  }
  
  // Fallback to profile data if no survey
  if (profile) {
    console.log('Using profile data as fallback');
    return {
      name: sessionUser.name || profile.name || 'New User',
      username: sessionUser.username || profile.username || 'newuser',
      email: sessionUser.email || profile.email || 'user@example.com',
      phone: profile.phone || '',
      memberSince: profile.memberSince || new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' }),
      birthdate: profile.birthdate,
      height: profile.height || 0,
      weight: profile.weight || 0,
      weightUnit: profile.weightUnit || 'kg',
      heightUnit: profile.heightUnit || 'cm',
      fitnessLevel: profile.fitnessLevel || 'Beginner',
      primaryGoal: profile.primaryGoal || 'General Fitness',
      workoutFrequency: profile.workoutDuration || 'Not specified',
      workoutType: profile.workoutTypes || 'Not specified',
      workoutLocation: profile.workoutLocation || 'Not specified',
      preferredTime: profile.workoutTime || 'Not specified',
      limitations: profile.limitations || [],
      equipment: profile.equipment || [],
      location: profile.location || 'Not specified'
    };
  }
  
  // Default fallback
  console.log('Using default fallback data');
  return {
    name: sessionUser.name || 'Alex Johnson',
    username: sessionUser.username || 'alexjohnson',
    email: sessionUser.email || 'alex.johnson@example.com',
    phone: '+1 (555) 123-4567',
    memberSince: new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' }),
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

  // Save to localStorage whenever user changes
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(user));
  }, [user]);

  // Debug: Log what's being displayed
  useEffect(() => {
    console.log('Current user data:', user);
  }, [user]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle profile picture upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

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
          <p className="profile-member">Member since {user.memberSince}</p>
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
                <div className="info-item">
                  <span className="info-label">From Survey</span>
                  <span className="info-value" style={{ color: 'var(--lime)' }}>
                    ✓ Data imported
                  </span>
                </div>
                {user.targetWeight && (
                  <div className="info-item">
                    <span className="info-label">Target Weight</span>
                    <span className="info-value">{user.targetWeight} {user.weightUnit}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fitness Preferences - Now properly showing survey data */}
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

            {/* Limitations & Equipment - Additional info from survey */}
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
          /* EDIT MODE - Keep your existing edit form or add a simple one */
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

      {/* Footer Note */}
      <div className="profile-footer">
        <p>Member since {user.memberSince}</p>
        <p style={{ fontSize: '10px', color: 'var(--dim)' }}>
          Profile data from survey • Age calculated from birthdate
        </p>
      </div>
    </div>
  );
};

export default SimplifiedProfile;