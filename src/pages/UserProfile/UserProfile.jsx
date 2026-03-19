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

  // Load user data from multiple sources
  const loadUserData = () => {
    // First check if user was passed as prop
    if (propUser) return propUser;
    
    // Then check localStorage for profile
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      return JSON.parse(savedProfile);
    }
    
    // Then check for survey data
    const surveyData = localStorage.getItem('userSurveyData');
    if (surveyData) {
      const survey = JSON.parse(surveyData);
      // Map survey data to profile format
      return {
        name: 'New User', // You'd get this from registration
        username: 'newuser',
        email: 'user@example.com', // From registration
        phone: '',
        memberSince: new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' }),
        birthdate: survey.birthdate,
        height: survey.height,
        weight: survey.weight,
        fitnessLevel: survey.fitnessLevel,
        primaryGoal: survey.performanceGoal || 'General Fitness',
        workoutFrequency: survey.workoutDuration || '3-4 days/week',
        workoutType: survey.workoutTypes?.join(', ') || 'Mixed',
        workoutLocation: survey.workoutLocation || 'Gym',
        preferredTime: survey.workoutTime || 'Morning',
        limitations: survey.limitations || []
      };
    }
    
    // Default fallback
    return {
      name: 'Alex Johnson',
      username: 'alexjohnson',
      email: 'alex.johnson@example.com',
      phone: '+1 (555) 123-4567',
      memberSince: 'March 2024',
      birthdate: '1996-05-15',
      height: 180,
      weight: 75,
      fitnessLevel: 'Intermediate',
      primaryGoal: 'Weight Loss',
      workoutFrequency: '4-5 days/week',
      workoutType: 'Mixed',
      workoutLocation: 'Gym',
      preferredTime: 'Morning'
    };
  };

  const [user, setUser] = useState(loadUserData());
  const [editForm, setEditForm] = useState({ ...user });

  // Save to localStorage whenever user changes
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(user));
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
                  <span className="info-value">{user.phone}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Age</span>
                  <span className="info-value">{age || 'Not specified'} years</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Location</span>
                  <span className="info-value">{user.location}</span>
                </div>
              </div>
            </div>

            {/* Physical Stats */}
            <div className="info-section">
              <h2>Physical Statistics</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Height</span>
                  <span className="info-value">{user.height} cm</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Weight</span>
                  <span className="info-value">{user.weight} kg</span>
                </div>
                <div className="info-item">
                  <span className="info-label">From Survey</span>
                  <span className="info-value" style={{ color: 'var(--lime)' }}>
                    ✓ Data imported
                  </span>
                </div>
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
                  <span className="info-label">Workout Frequency</span>
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
          </div>
        ) : (
          /* EDIT MODE - Keep your existing edit form */
          <div className="edit-mode">
            {/* ... your existing edit form ... */}
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
