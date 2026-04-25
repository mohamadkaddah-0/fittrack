const express = require('express');
const pool = require('../db/pool');
const requireAuth = require('../middleware/auth');
const router = express.Router();

// GET /api/survey
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [[user]] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    const [limitations] = await pool.execute(
      'SELECT limitation FROM user_limitations WHERE user_id = ?',
      [userId]
    );
    
    const [equipment] = await pool.execute(
      'SELECT equipment FROM user_equipment WHERE user_id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      survey: {
        userId: user.id,
        gender: user.gender,
        age: user.age,
        height: user.height,
        weight: user.current_weight,
        targetWeight: user.target_weight,
        fitnessLevel: user.fitness_level,
        activityLevel: user.activity_level,
        weightGoal: user.goal,
        workoutDuration: user.workout_duration,  
        workoutTypes: user.workout_types,        
        workoutLocation: user.workout_location,  
        workoutTime: user.workout_time,          
        limitations: limitations.map(l => l.limitation),
        equipment: equipment.map(e => e.equipment)
      }
    });
    
  } catch (error) {
    console.error('GET survey error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/survey
router.post('/', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user.id;
    console.log('Saving survey for user:', userId);
    console.log('Request body:', req.body);
    
    const {
      birthdate,
      gender,
      height,
      weight,
      weightGoal,
      targetWeight,
      performanceGoal,
      fitnessLevel,
      activityLevel,
      timeline,
      workoutTypes,
      workoutLocation,
      workoutDuration,
      workoutTime,
      limitations = [],
      equipment = []
    } = req.body;
    
    // Calculate age from birthdate (if provided)
    let age = null;
    if (birthdate) {
      const birthDate = new Date(birthdate);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    // Convert goal to enum value
    let goalEnum = 'maintain';
    if (weightGoal === 'lose') goalEnum = 'lose';
    else if (weightGoal === 'gain') goalEnum = 'gain';
    else if (weightGoal === 'buildMuscle') goalEnum = 'gain_muscle';
    
    // Convert timeline to months
    let durationMonths = null;
    if (timeline && timeline !== 'Ongoing') {
      const months = {
        '1 month': 1,
        '3 months': 3,
        '6 months': 6,
        '1 year': 12,
        '2 years': 24
      };
      durationMonths = months[timeline] || null;
    }
    
    await connection.execute(
  `UPDATE users SET
    gender = COALESCE(?, gender),
    age = COALESCE(?, age),
    current_weight = COALESCE(?, current_weight),
    target_weight = COALESCE(?, target_weight),
    height = COALESCE(?, height),
    activity_level = COALESCE(?, activity_level),
    goal = COALESCE(?, goal),
    fitness_level = COALESCE(?, fitness_level),
    duration_months = ?,
    workout_duration = COALESCE(?, workout_duration),
    workout_types = COALESCE(?, workout_types),
    workout_location = COALESCE(?, workout_location),
    workout_time = COALESCE(?, workout_time)
  WHERE id = ?`,
  [
    gender || null,
    age || null,
    weight || null,
    targetWeight || null,
    height || null,
    activityLevel || null,
    goalEnum || null,
    fitnessLevel || null,
    durationMonths,
    workoutDuration || null,
    workoutTypes || null,
    workoutLocation || null,
    workoutTime || null,
    userId
  ]
);
    
    // Update limitations (delete and reinsert)
    await connection.execute('DELETE FROM user_limitations WHERE user_id = ?', [userId]);
    for (const limitation of limitations) {
      if (limitation && limitation !== 'No limitations') {
        await connection.execute(
          'INSERT INTO user_limitations (user_id, limitation) VALUES (?, ?)',
          [userId, limitation]
        );
      }
    }
    
    // Update equipment (delete and reinsert)
    await connection.execute('DELETE FROM user_equipment WHERE user_id = ?', [userId]);
    for (const item of equipment) {
      if (item && item !== 'None' && item !== 'none') {
        await connection.execute(
          'INSERT INTO user_equipment (user_id, equipment) VALUES (?, ?)',
          [userId, item.toLowerCase()]
        );
      }
    }
    
    await connection.commit();
    
    console.log('Survey saved successfully for user:', userId);
    res.json({ success: true, message: 'Survey saved successfully' });
    
  } catch (error) {
    await connection.rollback();
    console.error('POST survey error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;