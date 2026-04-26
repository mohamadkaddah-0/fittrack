const express = require('express');
const db      = require('../db/pool');
const router  = express.Router();

// GET /api/ingredients — all 51 ingredients
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM ingredients ORDER BY category, id'
    );
    res.json({ success: true, ingredients: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
