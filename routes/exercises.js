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

    const exercises = rows.map((ex) => ({
      id:                ex.id,
      name:              ex.name,
      category:          ex.category,
      difficulty:        ex.difficulty,
      logType:           ex.log_type,
      met:               ex.met_value,
      kcalPerRep:        ex.kcal_per_rep,
      kcalRange:         ex.kcal_range,
      muscles:           ex.muscles,
      desc:              ex.description,
      equipmentName:     ex.equipment_name,
      type:              ex.exercise_type,
      image:             ex.image_url,
      videoId:           ex.video_id,
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

    const exercise = {
      id:               ex.id,
      name:             ex.name,
      category:         ex.category,
      difficulty:       ex.difficulty,
      logType:          ex.log_type,
      met:              ex.met_value,
      kcalPerRep:       ex.kcal_per_rep,
      kcalRange:        ex.kcal_range,
      muscles:          ex.muscles,
      desc:             ex.description,
      equipmentName:    ex.equipment_name,
      type:             ex.exercise_type,
      image:            ex.image_url,
      videoId:          ex.video_id,
      requiredEquipment:ex.required_equipment,
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
