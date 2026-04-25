import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Survey.css';

const Surveys = ({ setCurrentUser }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [surveyData, setSurveyData] = useState({
    // Step 1: Basic Info
    birthdate: '',
    gender: '',
    height: '',
    heightUnit: 'cm',
    weight: '',
    weightUnit: 'kg',
    
    // Step 2: Fitness Goals
    weightGoal: '',
    performanceGoal: '',
    targetWeight: '',
    timeline: '',
    
    // Step 3: Workout Preferences
    workoutTypes: '',
    workoutLocation: '',
    workoutDuration: '',
    workoutTime: '',
    
    // Step 4: Experience Level
    fitnessLevel: '',
    activityLevel: '',
    limitations: [],
    equipment: []
  });

  const [errors, setErrors] = useState({});
  const [goalAnalysis, setGoalAnalysis] = useState(null);
  const [userId, setUserId] = useState(null);

  const API_URL = 'https://fittrack-t4iu.onrender.com/api/auth/register';

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('fittrack_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Check if user is logged in and hasn't completed survey yet
  useEffect(() => {
  const checkUserAndSurvey = async () => {
    const token = localStorage.getItem('fittrack_token');
    
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }
    
    try {
      // Try to get user from multiple sources
      let user = null;
      let userId = null;
      
      // First, try to get from API
      const response = await fetch(`${API_URL}/users/me`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success && data.user) {
        user = data.user;
        userId = user.id;
        console.log('User loaded from API:', user);
      } else {
        // If API fails, try localStorage
        const localUser = localStorage.getItem('fittrack_user');
        if (localUser) {
          user = JSON.parse(localUser);
          userId = user.id;
          console.log('User loaded from localStorage:', user);
        } else {
          // Try sessionStorage
          const sessionUser = sessionStorage.getItem('currentUser');
          if (sessionUser) {
            user = JSON.parse(sessionUser);
            userId = user.id;
            console.log('User loaded from sessionStorage:', user);
          }
        }
      }
      
      if (!userId) {
        console.error('No user ID found anywhere');
        alert('User data not found. Please try logging in again.');
        navigate('/login');
        return;
      }
      
      setUserId(userId);
      
      // Check localStorage flags for survey status
      const surveyCompleted = localStorage.getItem(`surveyCompleted_${userId}`) === 'true';
      const surveySkipped = localStorage.getItem(`surveySkipped_${userId}`) === 'true';
      
      console.log('Survey flags:', { surveyCompleted, surveySkipped, userId });
      
      // If user completed the survey, redirect to dashboard
      if (surveyCompleted) {
        console.log('User already completed survey, redirecting to dashboard');
        navigate('/dashboard');
        return;
      }
      
      // Check if user already has survey data from API
      const surveyResponse = await fetch(`${API_URL}/survey`, {
        headers: getAuthHeaders()
      });
      
      const surveyData = await surveyResponse.json();
      
      // Only redirect based on API data if user didn't skip
      if (!surveySkipped && surveyData.success && surveyData.survey && surveyData.survey.fitnessLevel && surveyData.survey.fitnessLevel !== 'Not specified') {
        console.log('API shows survey completed and not skipped, redirecting to dashboard');
        navigate('/dashboard');
        return;
      }
      
      // If user skipped, clear the flag so they can take it now
      if (surveySkipped) {
        console.log('User previously skipped survey, allowing them to take it now');
        localStorage.removeItem(`surveySkipped_${userId}`);
      }
      
      // If survey has partial data, populate it
      if (surveyData.success && surveyData.survey) {
        const existingSurvey = surveyData.survey;
        setSurveyData(prev => ({
          ...prev,
          gender: existingSurvey.gender || '',
          height: existingSurvey.height || '',
          weight: existingSurvey.weight || '',
          fitnessLevel: existingSurvey.fitnessLevel || '',
          activityLevel: existingSurvey.activityLevel || '',
          limitations: existingSurvey.limitations || [],
          equipment: existingSurvey.equipment || []
        }));
      }
      
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error checking user:', error);
      alert('Error loading user data. Please try logging in again.');
      navigate('/login');
    }
  };
  
  checkUserAndSurvey();
}, [navigate]);

  // Constants for validation (same as before)
  const VALIDATION = {
    MAX_AGE: 100,
    MIN_AGE: 13,
    MAX_HEIGHT_CM: 250,
    MIN_HEIGHT_CM: 100,
    MAX_HEIGHT_FT: 8.2,
    MIN_HEIGHT_FT: 3.2,
    MAX_WEIGHT_KG: 300,
    MIN_WEIGHT_KG: 30,
    MAX_WEIGHT_LBS: 660,
    MIN_WEIGHT_LBS: 66,
    MAX_WEIGHT_LOSS_PER_WEEK_KG: 1.0,
    MAX_WEIGHT_GAIN_PER_WEEK_KG: 0.5,
    SAFE_LOSS_PER_WEEK_KG: 0.5,
    SAFE_GAIN_PER_WEEK_KG: 0.25,
    MIN_TARGET_WEIGHT_KG: 40,
    MIN_TARGET_WEIGHT_LBS: 88,
  };

  // Options for select fields (same as before)
  const genderOptions = ['Male', 'Female'];
  
  const weightGoalOptions = [
    { value: 'lose', label: 'Lose Weight' },
    { value: 'gain', label: 'Gain Weight' },
    { value: 'maintain', label: 'Maintain Weight' },
    { value: 'buildMuscle', label: 'Build Muscle' }
  ];

  const performanceGoalOptions = [
    { value: 'buildStrength', label: 'Build Strength' },
    { value: 'improveEndurance', label: 'Improve Endurance' },
    { value: 'improveFlexibility', label: 'Improve Flexibility' },
    { value: 'generalFitness', label: 'General Fitness' }
  ];

  const workoutTypeOptions = ['Cardio', 'Weightlifting', 'Calisthenics'];
  const locationOptions = ['Home', 'Gym', 'Outdoors', 'Anywhere'];
  const durationOptions = ['15-30 min', '30-45 min', '45-60 min', '60+ min'];
  const timeOptions = ['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Late Night'];
  const fitnessLevelOptions = ['Beginner', 'Intermediate', 'Advanced', 'Athlete'];
  
  const activityLevelOptions = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little or no exercise, desk job' },
    { value: 'lightly_active', label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
    { value: 'moderately_active', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
    { value: 'very_active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' }
  ];
  
  const limitationOptions = [
    'Knee issues', 'Back problems', 'Shoulder injuries',
    'Joint pain', 'Heart condition', 'No limitations'
  ];
  
  const equipmentOptions = [
    'None', 'Dumbbells', 'Barbell', 'Kettlebell',
    'Resistance bands', 'Yoga mat', 'Pull-up bar',
    'Treadmill', 'Stationary bike', 'Rowing machine'
  ];

  const timelineOptions = ['1 month', '3 months', '6 months', '1 year', '2 years', 'Ongoing'];
  const timelineWeeks = { 
    '1 month': 4, '3 months': 12, '6 months': 24, '1 year': 52, '2 years': 104, 'Ongoing': 0 
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

  const convertToKg = (weight, unit) => {
    if (!weight) return null;
    return unit === 'lbs' ? parseFloat(weight) * 0.453592 : parseFloat(weight);
  };

  const getRecommendedTimeline = (weeks) => {
    if (weeks <= 4) return '1 month';
    if (weeks <= 12) return '3 months';
    if (weeks <= 24) return '6 months';
    if (weeks <= 52) return '1 year';
    return '2 years';
  };

  const analyzeGoal = () => {
    const weeks = timelineWeeks[surveyData.timeline];
    if (!weeks) return;

    const currentKg = convertToKg(surveyData.weight, surveyData.weightUnit);
    const targetKg = convertToKg(surveyData.targetWeight, surveyData.weightUnit);
    
    if (!currentKg || !targetKg) return;
    
    const minHealthyKg = VALIDATION.MIN_TARGET_WEIGHT_KG;
    if (targetKg < minHealthyKg) {
      setGoalAnalysis({
        status: 'error',
        title: 'Unhealthy Target Weight',
        message: `Target weight of ${surveyData.targetWeight} ${surveyData.weightUnit} is below a healthy minimum.`,
        recommendation: `Please set a target weight above ${surveyData.weightUnit === 'kg' ? VALIDATION.MIN_TARGET_WEIGHT_KG : VALIDATION.MIN_TARGET_WEIGHT_LBS} ${surveyData.weightUnit}.`,
        currentWeight: surveyData.weight,
        targetWeight: surveyData.targetWeight,
        weightUnit: surveyData.weightUnit,
        totalChange: Math.abs(surveyData.targetWeight - surveyData.weight).toFixed(1),
        timeline: surveyData.timeline,
        weeks: weeks,
        weeklyRate: (Math.abs(currentKg - targetKg) / weeks).toFixed(2)
      });
      return;
    }
    
    const weightDiff = Math.abs(currentKg - targetKg);
    const weeklyRate = weightDiff / weeks;

    let maxWeeklyRate, safeWeeklyRate, action;
    
    if (surveyData.weightGoal === 'lose') {
      maxWeeklyRate = VALIDATION.MAX_WEIGHT_LOSS_PER_WEEK_KG;
      safeWeeklyRate = VALIDATION.SAFE_LOSS_PER_WEEK_KG;
      action = 'lose';
    } else {
      maxWeeklyRate = VALIDATION.MAX_WEIGHT_GAIN_PER_WEEK_KG;
      safeWeeklyRate = VALIDATION.SAFE_GAIN_PER_WEEK_KG;
      action = 'gain';
    }

    const recommendedWeeks = Math.ceil(weightDiff / maxWeeklyRate);
    const recommendedTimeline = getRecommendedTimeline(recommendedWeeks);

    if (weeklyRate > maxWeeklyRate) {
      setGoalAnalysis({
        status: 'impossible',
        title: 'Impossible Goal!',
        message: `This goal requires ${action === 'lose' ? 'losing' : 'gaining'} ${weeklyRate.toFixed(2)} kg per week, which is impossible.`,
        details: `Maximum healthy rate is ${maxWeeklyRate} kg/week.`,
        recommendation: `To achieve this goal safely, you need at least ${recommendedWeeks} weeks (${recommendedTimeline}).`,
        currentWeight: surveyData.weight,
        targetWeight: surveyData.targetWeight,
        weightUnit: surveyData.weightUnit,
        totalChange: Math.abs(surveyData.targetWeight - surveyData.weight).toFixed(1),
        timeline: surveyData.timeline,
        weeks: weeks,
        weeklyRate: weeklyRate.toFixed(2),
        maxRate: maxWeeklyRate,
        recommendedTimeline: recommendedTimeline,
        recommendedWeeks: recommendedWeeks
      });
    } else if (weeklyRate > safeWeeklyRate) {
      setGoalAnalysis({
        status: 'ambitious',
        title: 'Ambitious Goal!',
        message: `This goal requires ${action === 'lose' ? 'losing' : 'gaining'} ${weeklyRate.toFixed(2)} kg per week.`,
        details: `The recommended safe rate is ${safeWeeklyRate} kg/week for ${action === 'lose' ? 'weight loss' : 'weight gain'}.`,
        recommendation: 'Consider a longer timeline for more sustainable results.',
        currentWeight: surveyData.weight,
        targetWeight: surveyData.targetWeight,
        weightUnit: surveyData.weightUnit,
        totalChange: Math.abs(surveyData.targetWeight - surveyData.weight).toFixed(1),
        timeline: surveyData.timeline,
        weeks: weeks,
        weeklyRate: weeklyRate.toFixed(2),
        safeRate: safeWeeklyRate
      });
    } else {
      setGoalAnalysis({
        status: 'healthy',
        title: 'Healthy Goal!',
        message: `This is a healthy and realistic goal!`,
        details: `You'll be ${action === 'lose' ? 'losing' : 'gaining'} ${weeklyRate.toFixed(2)} kg per week.`,
        recommendation: 'Stay consistent and you\'ll achieve great results.',
        currentWeight: surveyData.weight,
        targetWeight: surveyData.targetWeight,
        weightUnit: surveyData.weightUnit,
        totalChange: Math.abs(surveyData.targetWeight - surveyData.weight).toFixed(1),
        timeline: surveyData.timeline,
        weeks: weeks,
        weeklyRate: weeklyRate.toFixed(2)
      });
    }
  };

  useEffect(() => {
    if (
      surveyData.weight && 
      surveyData.targetWeight && 
      surveyData.timeline && 
      surveyData.timeline !== 'Ongoing' &&
      surveyData.weightGoal &&
      (surveyData.weightGoal === 'lose' || surveyData.weightGoal === 'gain')
    ) {
      analyzeGoal();
    } else {
      setGoalAnalysis(null);
    }
  }, [surveyData.weight, surveyData.targetWeight, surveyData.timeline, surveyData.weightGoal, surveyData.weightUnit]);

  const validateStep = (step) => {
    const errors = {};
    const age = calculateAge(surveyData.birthdate);
    
    switch(step) {
      case 1:
        if (!surveyData.birthdate) {
          errors.birthdate = 'Birthdate is required';
        } else {
          if (age < VALIDATION.MIN_AGE) {
            errors.birthdate = `You must be at least ${VALIDATION.MIN_AGE} years old`;
          } else if (age > VALIDATION.MAX_AGE) {
            errors.birthdate = `Age cannot exceed ${VALIDATION.MAX_AGE} years`;
          }
        }
        if (!surveyData.gender) errors.gender = 'Gender is required';
        if (!surveyData.height) errors.height = 'Height is required';
        if (!surveyData.weight) errors.weight = 'Weight is required';
        break;
      case 2:
        if (!surveyData.weightGoal) errors.weightGoal = 'Please select a weight goal';
        if (!surveyData.performanceGoal) errors.performanceGoal = 'Please select a performance goal';
        if (!surveyData.timeline) errors.timeline = 'Timeline is required';
        if ((surveyData.weightGoal === 'lose' || surveyData.weightGoal === 'gain') && !surveyData.targetWeight) {
          errors.targetWeight = 'Target weight is required';
        }
        if (goalAnalysis && goalAnalysis.status === 'impossible') {
          errors.targetWeight = 'This goal is impossible with the selected timeline.';
        }
        break;
      case 3:
        if (!surveyData.workoutTypes) errors.workoutTypes = 'Please select a workout type';
        if (!surveyData.workoutLocation) errors.workoutLocation = 'Workout location is required';
        if (!surveyData.workoutDuration) errors.workoutDuration = 'Workout duration is required';
        break;
      case 4:
        if (!surveyData.fitnessLevel) errors.fitnessLevel = 'Fitness level is required';
        if (!surveyData.activityLevel) errors.activityLevel = 'Activity level is required';
        break;
    }
    return errors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length === 0) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setErrors(stepErrors);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
    setErrors({});
    window.scrollTo(0, 0);
  };

  // UPDATED: Save survey to API instead of localStorage
  const handleSubmit = async () => {
    const stepErrors = validateStep(4);
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    if (goalAnalysis && goalAnalysis.status === 'impossible' && surveyData.targetWeight) {
      alert('Please fix the impossible goal before continuing.');
      return;
    }
    
    if (goalAnalysis && goalAnalysis.status === 'ambitious' && surveyData.targetWeight) {
      if (!window.confirm(
        'This goal is ambitious and may be difficult to achieve.\n\n' +
        `Weekly rate: ${goalAnalysis.weeklyRate} kg/week\n` +
        `Recommended safe rate: ${goalAnalysis.safeRate} kg/week\n\n` +
        'Do you want to continue with this ambitious goal?'
      )) {
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('fittrack_token');
      
      if (!token) {
        alert('Please log in again.');
        navigate('/login');
        return;
      }
      
      // Prepare data for API
      const surveyPayload = {
        birthdate: surveyData.birthdate,
        gender: surveyData.gender.toLowerCase(),
        height: parseFloat(surveyData.height),
        weight: parseFloat(surveyData.weight),
        weightUnit: surveyData.weightUnit,
        heightUnit: surveyData.heightUnit,
        weightGoal: surveyData.weightGoal,
        targetWeight: surveyData.weightGoal === 'maintain' ? surveyData.weight : parseFloat(surveyData.targetWeight),
        performanceGoal: surveyData.performanceGoal,
        fitnessLevel: surveyData.fitnessLevel.toLowerCase(),
        activityLevel: surveyData.activityLevel,
        timeline: surveyData.timeline,
        workoutTypes: surveyData.workoutTypes,
        workoutLocation: surveyData.workoutLocation,
        workoutDuration: surveyData.workoutDuration,
        workoutTime: surveyData.workoutTime,
        limitations: surveyData.limitations.filter(l => l !== 'No limitations'),
        equipment: surveyData.equipment.filter(e => e !== 'None').map(e => e.toLowerCase())
      };
      
      console.log('Saving survey:', surveyPayload);
      
      // Save survey to API
      const response = await fetch(`${API_URL}/survey`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(surveyPayload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Mark survey as completed
        const user = JSON.parse(localStorage.getItem('fittrack_user'));
        if (user && user.id) {
          localStorage.setItem(`surveyCompleted_${user.id}`, 'true');
          localStorage.removeItem(`surveySkipped_${user.id}`);
        }
        
        console.log('✅ Survey saved successfully!');
        
        // Update current user if function exists
        if (setCurrentUser) {
          const userResponse = await fetch(`${API_URL}/users/me`, {
            headers: getAuthHeaders()
          });
          const userData = await userResponse.json();
          if (userData.success) {
            setCurrentUser(userData.user);
          }
        }
        
        navigate('/dashboard');
      } else {
        alert('Failed to save survey: ' + data.message);
      }
    } catch (error) {
      console.error('Survey save error:', error);
      alert('Failed to save survey. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectWorkoutType = (type) => {
    setSurveyData(prev => ({ ...prev, workoutTypes: type }));
  };

  const toggleSelection = (field, value) => {
    setSurveyData(prev => {
      const current = prev[field] || [];
      const newValue = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: newValue };
    });
  };

  const progressPercentage = (currentStep / 4) * 100;

  if (isLoading) {
    return (
      <section className="survey-section">
        <div className="survey-card">
          <div className="survey-body" style={{ textAlign: 'center', padding: '60px' }}>
            <p>Loading your profile...</p>
          </div>
        </div>
      </section>
    );
  }

  // Rest of your JSX remains the SAME as before...
  return (
    <section className="survey-section">
      <div className="survey-card">
        <div className="survey-ghost">//</div>
        
        <div className="survey-header">
          <div className="survey-code">FITNESS ASSESSMENT</div>
          <div className="survey-title">
            tell us about
            <em>yourself</em>
          </div>
          <div className="survey-progress">
            <div className="progress-steps">
              <span className={`step-indicator ${currentStep >= 1 ? 'active' : ''}`}>1</span>
              <span className={`step-line ${currentStep >= 2 ? 'active' : ''}`}></span>
              <span className={`step-indicator ${currentStep >= 2 ? 'active' : ''}`}>2</span>
              <span className={`step-line ${currentStep >= 3 ? 'active' : ''}`}></span>
              <span className={`step-indicator ${currentStep >= 3 ? 'active' : ''}`}>3</span>
              <span className={`step-line ${currentStep >= 4 ? 'active' : ''}`}></span>
              <span className={`step-indicator ${currentStep >= 4 ? 'active' : ''}`}>4</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="step-label">Step {currentStep} of 4</div>
          </div>
        </div>

        <div className="survey-body">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="survey-step">
              <h3 className="step-title">Basic Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Birthdate *</label>
                  <input
                    type="date"
                    value={surveyData.birthdate}
                    onChange={(e) => setSurveyData({...surveyData, birthdate: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                    min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
                  />
                  {errors.birthdate && <span className="error-message">{errors.birthdate}</span>}
                  {surveyData.birthdate && !errors.birthdate && (
                    <span className="age-display">Age: {calculateAge(surveyData.birthdate)} years</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    value={surveyData.gender}
                    onChange={(e) => setSurveyData({...surveyData, gender: e.target.value})}
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.gender && <span className="error-message">{errors.gender}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Height *</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      value={surveyData.height}
                      onChange={(e) => setSurveyData({...surveyData, height: e.target.value})}
                      placeholder={surveyData.heightUnit === 'cm' ? "170" : "5.8"}
                      step="0.1"
                    />
                    <select
                      value={surveyData.heightUnit}
                      onChange={(e) => setSurveyData({...surveyData, heightUnit: e.target.value, height: ''})}
                      className="unit-select"
                    >
                      <option value="cm">cm</option>
                      <option value="ft">ft</option>
                    </select>
                  </div>
                  {errors.height && <span className="error-message">{errors.height}</span>}
                </div>

                <div className="form-group">
                  <label>Weight *</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      value={surveyData.weight}
                      onChange={(e) => setSurveyData({...surveyData, weight: e.target.value})}
                      placeholder={surveyData.weightUnit === 'kg' ? "70" : "154"}
                      step="0.1"
                    />
                    <select
                      value={surveyData.weightUnit}
                      onChange={(e) => {
                        const newUnit = e.target.value;
                        let newWeight = surveyData.weight;
                        
                        if (surveyData.weight && surveyData.weightUnit !== newUnit) {
                          const weightNum = parseFloat(surveyData.weight);
                          if (surveyData.weightUnit === 'kg' && newUnit === 'lbs') {
                            newWeight = (weightNum * 2.20462).toFixed(1);
                          } else if (surveyData.weightUnit === 'lbs' && newUnit === 'kg') {
                            newWeight = (weightNum * 0.453592).toFixed(1);
                          }
                        }
                        
                        setSurveyData({...surveyData, weightUnit: newUnit, weight: newWeight});
                      }}
                      className="unit-select"
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                  {errors.weight && <span className="error-message">{errors.weight}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Fitness Goals */}
          {currentStep === 2 && (
            <div className="survey-step">
              <h3 className="step-title">Your Fitness Goals</h3>
              
              <div className="form-group">
                <label>Weight Goal *</label>
                <div className="button-grid">
                  {weightGoalOptions.map(goal => (
                    <button
                      key={goal.value}
                      type="button"
                      className={`select-button ${surveyData.weightGoal === goal.value ? 'selected' : ''}`}
                      onClick={() => {
                        setSurveyData({...surveyData, weightGoal: goal.value, targetWeight: ''});
                        setGoalAnalysis(null);
                      }}
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>
                {errors.weightGoal && <span className="error-message">{errors.weightGoal}</span>}
              </div>

              {(surveyData.weightGoal === 'lose' || surveyData.weightGoal === 'gain') && (
                <div className="form-group target-weight-group">
                  <label>Target Weight ({surveyData.weightUnit}) *</label>
                  <input
                    type="number"
                    value={surveyData.targetWeight}
                    onChange={(e) => setSurveyData({...surveyData, targetWeight: e.target.value})}
                    placeholder={`Enter target weight in ${surveyData.weightUnit}`}
                    step="0.1"
                  />
                  {errors.targetWeight && <span className="error-message">{errors.targetWeight}</span>}
                </div>
              )}

              <div className="form-group">
                <label>Performance Goal *</label>
                <div className="button-grid">
                  {performanceGoalOptions.map(goal => (
                    <button
                      key={goal.value}
                      type="button"
                      className={`select-button ${surveyData.performanceGoal === goal.value ? 'selected' : ''}`}
                      onClick={() => setSurveyData({...surveyData, performanceGoal: goal.value})}
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>
                {errors.performanceGoal && <span className="error-message">{errors.performanceGoal}</span>}
              </div>

              <div className="form-group">
                <label>Goal Timeline *</label>
                <div className="button-grid">
                  {timelineOptions.map(option => (
                    <button
                      key={option}
                      type="button"
                      className={`select-button ${surveyData.timeline === option ? 'selected' : ''}`}
                      onClick={() => setSurveyData({...surveyData, timeline: option})}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {errors.timeline && <span className="error-message">{errors.timeline}</span>}
              </div>

              {goalAnalysis && (surveyData.weightGoal === 'lose' || surveyData.weightGoal === 'gain') && (
                <div className={`analysis-box ${goalAnalysis.status}`}>
                  <h4>{goalAnalysis.title}</h4>
                  <div className="goal-stats">
                    <p><strong>Current:</strong> {goalAnalysis.currentWeight} {goalAnalysis.weightUnit}</p>
                    <p><strong>Target:</strong> {goalAnalysis.targetWeight} {goalAnalysis.weightUnit}</p>
                    <p><strong>Total Change:</strong> {goalAnalysis.totalChange} {goalAnalysis.weightUnit}</p>
                    <p><strong>Timeline:</strong> {goalAnalysis.timeline} ({goalAnalysis.weeks} weeks)</p>
                    <p><strong>Weekly Rate:</strong> {goalAnalysis.weeklyRate} kg/week</p>
                  </div>
                  <div className="analysis-message">
                    <p>{goalAnalysis.message}</p>
                    <p className="recommendation">{goalAnalysis.recommendation}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Workout Preferences */}
          {currentStep === 3 && (
            <div className="survey-step">
              <h3 className="step-title">Workout Preferences</h3>
              
              <div className="form-group">
                <label>Preferred Workout Type *</label>
                <div className="button-grid">
                  {workoutTypeOptions.map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`select-button ${surveyData.workoutTypes === type ? 'selected' : ''}`}
                      onClick={() => selectWorkoutType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {errors.workoutTypes && <span className="error-message">{errors.workoutTypes}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Workout Location *</label>
                  <div className="button-grid">
                    {locationOptions.map(location => (
                      <button
                        key={location}
                        type="button"
                        className={`select-button ${surveyData.workoutLocation === location ? 'selected' : ''}`}
                        onClick={() => setSurveyData({...surveyData, workoutLocation: location})}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                  {errors.workoutLocation && <span className="error-message">{errors.workoutLocation}</span>}
                </div>

                <div className="form-group">
                  <label>Workout Duration *</label>
                  <div className="button-grid">
                    {durationOptions.map(duration => (
                      <button
                        key={duration}
                        type="button"
                        className={`select-button ${surveyData.workoutDuration === duration ? 'selected' : ''}`}
                        onClick={() => setSurveyData({...surveyData, workoutDuration: duration})}
                      >
                        {duration}
                      </button>
                    ))}
                  </div>
                  {errors.workoutDuration && <span className="error-message">{errors.workoutDuration}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Preferred Workout Time (Optional)</label>
                <div className="button-grid">
                  {timeOptions.map(time => (
                    <button
                      key={time}
                      type="button"
                      className={`select-button ${surveyData.workoutTime === time ? 'selected' : ''}`}
                      onClick={() => setSurveyData({...surveyData, workoutTime: time})}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Experience Level */}
          {currentStep === 4 && (
            <div className="survey-step">
              <h3 className="step-title">Experience & Lifestyle</h3>
              
              <div className="form-group">
                <label>Fitness Level *</label>
                <div className="button-grid">
                  {fitnessLevelOptions.map(level => (
                    <button
                      key={level}
                      type="button"
                      className={`select-button ${surveyData.fitnessLevel === level ? 'selected' : ''}`}
                      onClick={() => setSurveyData({...surveyData, fitnessLevel: level})}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                {errors.fitnessLevel && <span className="error-message">{errors.fitnessLevel}</span>}
              </div>

              <div className="form-group">
                <label>Activity Level *</label>
                <div className="activity-level-grid">
                  {activityLevelOptions.map(level => (
                    <button
                      key={level.value}
                      type="button"
                      className={`activity-button ${surveyData.activityLevel === level.value ? 'selected' : ''}`}
                      onClick={() => setSurveyData({...surveyData, activityLevel: level.value})}
                    >
                      <div className="activity-label">{level.label}</div>
                      <div className="activity-description">{level.description}</div>
                    </button>
                  ))}
                </div>
                {errors.activityLevel && <span className="error-message">{errors.activityLevel}</span>}
              </div>

              <div className="form-group">
                <label>Physical Limitations / Injuries</label>
                <div className="button-grid">
                  {limitationOptions.map(limitation => (
                    <button
                      key={limitation}
                      type="button"
                      className={`select-button ${surveyData.limitations.includes(limitation) ? 'selected' : ''}`}
                      onClick={() => toggleSelection('limitations', limitation)}
                    >
                      {limitation}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Available Equipment</label>
                <div className="button-grid">
                  {equipmentOptions.map(equipment => (
                    <button
                      key={equipment}
                      type="button"
                      className={`select-button ${surveyData.equipment.includes(equipment) ? 'selected' : ''}`}
                      onClick={() => toggleSelection('equipment', equipment)}
                    >
                      {equipment}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="survey-navigation">
            {currentStep > 1 && (
              <button className="nav-btn prev-btn" onClick={handlePrevious}>
                ← Previous
              </button>
            )}
            
            {currentStep < 4 ? (
              <button className="nav-btn next-btn" onClick={handleNext}>
                Next →
              </button>
            ) : (
              <button 
                className="nav-btn submit-btn" 
                onClick={handleSubmit}
                disabled={isLoading || (goalAnalysis?.status === 'impossible' && surveyData.targetWeight)}
              >
                {isLoading ? 'SAVING...' : 'Complete Survey'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Surveys;