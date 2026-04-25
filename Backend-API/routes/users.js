const express = require('express');
const pool = require('../db/pool');
const requireAuth = require('../middleware/auth');
const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [[user]] = await pool.execute(
      'SELECT id, name, email, gender, age, current_weight, target_weight, height, activity_level, goal, fitness_level FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        age: user.age,
        currentWeight: user.current_weight,
        targetWeight: user.target_weight,
        height: user.height,
        activityLevel: user.activity_level,
        goal: user.goal,
        fitnessLevel: user.fitness_level
      }
    });
  } catch (error) {
    console.error('GET user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      name, 
      current_weight, 
      target_weight, 
      activity_level, 
      goal, 
      fitness_level,
      height,
      age,
      gender
    } = req.body;
    
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (current_weight !== undefined) {
      updates.push('current_weight = ?');
      values.push(current_weight);
    }
    if (target_weight !== undefined) {
      updates.push('target_weight = ?');
      values.push(target_weight);
    }
    if (activity_level !== undefined) {
      updates.push('activity_level = ?');
      values.push(activity_level);
    }
    if (goal !== undefined) {
      updates.push('goal = ?');
      values.push(goal);
    }
    if (fitness_level !== undefined) {
      updates.push('fitness_level = ?');
      values.push(fitness_level);
    }
    if (height !== undefined) {
      updates.push('height = ?');
      values.push(height);
    }
    if (age !== undefined) {
      updates.push('age = ?');
      values.push(age);
    }
    if (gender !== undefined) {
      updates.push('gender = ?');
      values.push(gender);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }
    
    values.push(userId);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    await pool.execute(query, values);
    
    const [[updatedUser]] = await pool.execute(
      'SELECT id, name, email, gender, age, current_weight, target_weight, height, activity_level, goal, fitness_level FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        gender: updatedUser.gender,
        age: updatedUser.age,
        currentWeight: updatedUser.current_weight,
        targetWeight: updatedUser.target_weight,
        height: updatedUser.height,
        activityLevel: updatedUser.activity_level,
        goal: updatedUser.goal,
        fitnessLevel: updatedUser.fitness_level
      }
    });
    
  } catch (error) {
    console.error('PUT user error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;