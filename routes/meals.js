const express = require('express');
const db      = require('../db/pool');
const router  = express.Router();

// GET /api/meals/pool — all 16 recommended meals
router.get('/pool', async (req, res) => {
  try {
    const [meals] = await db.execute(
      'SELECT * FROM meal_pool ORDER BY category, id'
    );
    res.json({ success: true, meals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/meals/pool/:id — ingredients for one meal
router.get('/pool/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT mpi.*, i.name, i.category, i.kcal, i.protein, i.carbs, i.fat
       FROM meal_pool_ingredients mpi
       JOIN ingredients i ON i.id = mpi.ingredient_id
       WHERE mpi.meal_id = ?`,
      [req.params.id]
    );
    res.json({ success: true, ingredients: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
