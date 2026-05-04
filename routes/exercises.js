const express = require('express');
const pool    = require('../db/pool');
const router  = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM v_exercises ORDER BY id');

    const [limRows] = await pool.query(
      'SELECT exercise_id, limitation FROM exercise_limitations ORDER BY exercise_id'
    );

    const limMap = {};
    for (const row of limRows) {
      if (!limMap[row.exercise_id]) limMap[row.exercise_id] = [];
      limMap[row.exercise_id].push(row.limitation);
    }

    // Send BOTH naming styles so old and new frontend code both work
    const exercises = rows.map((ex) => ({
      id:                ex.id,
      name:              ex.name,
      category:          ex.category,
      difficulty:        ex.difficulty,

      // Both styles for log_type
      log_type:          ex.log_type,
      logType:           ex.log_type,

      // Both styles for met_value
      met_value:         ex.met_value,
      met:               ex.met_value,

      // Both styles for kcal_per_rep
      kcal_per_rep:      ex.kcal_per_rep,
      kcalPerRep:        ex.kcal_per_rep,

      // Both styles for kcal_range
      kcal_range:        ex.kcal_range,
      kcalRange:         ex.kcal_range,

      muscles:           ex.muscles,

      // Both styles for description
      description:       ex.description,
      desc:              ex.description,

      // Both styles for equipment_name
      equipment_name:    ex.equipment_name,
      equipmentName:     ex.equipment_name,

      // Both styles for exercise_type
      exercise_type:     ex.exercise_type,
      type:              ex.exercise_type,

      // Both styles for image_url
      image_url:         ex.image_url,
      image:             ex.image_url,

      // Both styles for video_id
      video_id:          ex.video_id,
      videoId:           ex.video_id,

      required_equipment:ex.required_equipment,
      requiredEquipment: ex.required_equipment,

      limitedFor:        limMap[ex.id] || [],
      link:              `/exercises/${ex.id}`,
    }));

    res.json({ ok: true, data: exercises });
  } catch (err) {
    console.error('GET /api/exercises error:', err);
    res.status(500).json({ ok: false, message: 'Failed to load exercises' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(400).json({ ok: false, message: 'Invalid exercise id' });
  }

  try {
    const [
      [exRows],
      [stepRows],
      [tipRows],
      [muscleRows],
      [varRows],
      [limRows],
    ] = await Promise.all([
      pool.query('SELECT * FROM v_exercises WHERE id = ?', [id]),
      pool.query(
        'SELECT step_text FROM exercise_steps WHERE exercise_id = ? ORDER BY sort_order',
        [id]
      ),
      pool.query(
        'SELECT entry_type, entry_text FROM exercise_tips_mistakes WHERE exercise_id = ? ORDER BY entry_type, sort_order',
        [id]
      ),
      pool.query(
        'SELECT muscle_name, muscle_type FROM exercise_muscles WHERE exercise_id = ?',
        [id]
      ),
      pool.query(
        'SELECT variation FROM exercise_variations WHERE exercise_id = ? ORDER BY sort_order',
        [id]
      ),
      pool.query(
        'SELECT limitation FROM exercise_limitations WHERE exercise_id = ?',
        [id]
      ),
    ]);

    if (exRows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Exercise not found' });
    }

    const ex = exRows[0];

    // Send BOTH naming styles
    const exercise = {
      id:                ex.id,
      name:              ex.name,
      category:          ex.category,
      difficulty:        ex.difficulty,
      log_type:          ex.log_type,
      logType:           ex.log_type,
      met_value:         ex.met_value,
      met:               ex.met_value,
      kcal_per_rep:      ex.kcal_per_rep,
      kcalPerRep:        ex.kcal_per_rep,
      kcal_range:        ex.kcal_range,
      kcalRange:         ex.kcal_range,
      muscles:           ex.muscles,
      description:       ex.description,
      desc:              ex.description,
      equipment_name:    ex.equipment_name,
      equipmentName:     ex.equipment_name,
      exercise_type:     ex.exercise_type,
      type:              ex.exercise_type,
      image_url:         ex.image_url,
      image:             ex.image_url,
      video_id:          ex.video_id,
      videoId:           ex.video_id,
      required_equipment:ex.required_equipment,
      requiredEquipment: ex.required_equipment,

      // Detail data
      steps:            stepRows.map((r) => r.step_text),
      tips:             tipRows.filter((r) => r.entry_type === 'tip').map((r) => r.entry_text),
      mistakes:         tipRows.filter((r) => r.entry_type === 'mistake').map((r) => r.entry_text),
      primaryMuscles:   muscleRows.filter((r) => r.muscle_type === 'primary').map((r) => r.muscle_name),
      secondaryMuscles: muscleRows.filter((r) => r.muscle_type === 'secondary').map((r) => r.muscle_name),
      variations:       varRows.map((r) => r.variation),
      limitedFor:       limRows.map((r) => r.limitation),
      link:             `/exercises/${ex.id}`,
    };

    res.json({ ok: true, data: exercise });
  } catch (err) {
    console.error(`GET /api/exercises/${id} error:`, err);
    res.status(500).json({ ok: false, message: 'Failed to load exercise' });
  }
});

module.exports = router;
