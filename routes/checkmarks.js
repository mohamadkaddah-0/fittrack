const express = require('express');
const pool    = require('../db/pool');
const router  = express.Router();

// Helper to get user_id from token or session header
function getUserId(req) {
  const headerId = req.headers['x-fittrack-user-id'];
  if (headerId) return Number(headerId);
  return null;
}

// GET /api/checkmarks → all checkmarks for today
router.get('/', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ ok: false, message: 'Not logged in' });

  try {
    const [rows] = await pool.query(
      'SELECT exercise_id, plan_day FROM exercise_checkmarks WHERE user_id = ? AND entry_date = CURDATE()',
      [userId]
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('GET /api/checkmarks error:', err);
    res.status(500).json({ ok: false, message: 'Failed to load checkmarks' });
  }
});

// POST /api/checkmarks → add a checkmark
router.post('/', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ ok: false, message: 'Not logged in' });

  const { exerciseId, planDay } = req.body;
  if (!exerciseId || !planDay) {
    return res.status(400).json({ ok: false, message: 'Missing exerciseId or planDay' });
  }

  try {
    await pool.query(
      'INSERT IGNORE INTO exercise_checkmarks (user_id, exercise_id, plan_day, entry_date) VALUES (?, ?, ?, CURDATE())',
      [userId, exerciseId, planDay]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/checkmarks error:', err);
    res.status(500).json({ ok: false, message: 'Failed to save checkmark' });
  }
});

// DELETE /api/checkmarks/:exerciseId/:planDay → remove a checkmark
router.delete('/:exerciseId/:planDay', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ ok: false, message: 'Not logged in' });

  try {
    await pool.query(
      'DELETE FROM exercise_checkmarks WHERE user_id = ? AND exercise_id = ? AND plan_day = ? AND entry_date = CURDATE()',
      [userId, Number(req.params.exerciseId), Number(req.params.planDay)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/checkmarks error:', err);
    res.status(500).json({ ok: false, message: 'Failed to remove checkmark' });
  }
});

module.exports = router;
