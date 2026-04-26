const express = require('express');
const resolveUser = require('../middleware/resolveUser');
const { getUserState, saveUserState } = require('../lib/activityStore');
const db = require('../db/pool');

const router = express.Router();

router.use(resolveUser);

function getDateKey(input) {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }
  return new Date().toISOString().split('T')[0];
}

function clampNumber(value, fallback = 0, min = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(parsed, min);
}

function createCalendarWorkoutEntry(dateKey, workoutEntry) {
  return {
    id: `cal-${workoutEntry.id}`,
    sourceWorkoutEntryId: workoutEntry.id,
    name: workoutEntry.name,
    cat: 'workout',
    type: 'workout',
    caloriesBurned: clampNumber(workoutEntry.calories, 0),
    createdAt: new Date().toISOString(),
    date: dateKey,
  };
}

function createCalendarEntry(dateKey, entry) {
  return {
    id: `entry-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    date: dateKey,
    createdAt: new Date().toISOString(),
    ...entry,
  };
}

// Homepage
router.get('/homepage', (req, res) => {
  const { userState } = getUserState(req.fittrackUserKey);
  const today = getDateKey(req.query.date);
  res.json({
    success: true,
    homepage: {
      calendarData: userState.calendarData || {},
      waterIntake: clampNumber(userState.hydrationByDate?.[today], 0),
      stepsTaken: clampNumber(userState.stepsByDate?.[today], 0),
      daysCompleted: clampNumber(userState.planProgress?.daysCompleted, 0),
      planTotalDays: clampNumber(userState.planProgress?.totalDays, 7, 1),
    },
  });
});

router.patch('/homepage', (req, res) => {
  const today = getDateKey(req.body?.date);
  const { userState } = getUserState(req.fittrackUserKey);
  if (req.body?.waterIntake !== undefined) userState.hydrationByDate[today] = clampNumber(req.body.waterIntake, 0);
  if (req.body?.stepsTaken !== undefined) userState.stepsByDate[today] = clampNumber(req.body.stepsTaken, 0);
  if (req.body?.daysCompleted !== undefined) {
    userState.planProgress.daysCompleted = clampNumber(req.body.daysCompleted, 0);
    userState.planProgress.updatedAt = new Date().toISOString();
  }
  saveUserState(req.fittrackUserKey, userState);
  res.json({
    success: true,
    homepage: {
      waterIntake: clampNumber(userState.hydrationByDate[today], 0),
      stepsTaken: clampNumber(userState.stepsByDate?.[today], 0),
      daysCompleted: clampNumber(userState.planProgress.daysCompleted, 0),
      planTotalDays: clampNumber(userState.planProgress.totalDays, 7, 1),
    },
  });
});

// Calendar - MySQL when authenticated, JSON store fallback
router.get('/calendar', async (req, res) => {
  try {
    const userId = req.fittrackUserId;
    if (!userId) {
      const { userState } = getUserState(req.fittrackUserKey);
      return res.json({ success: true, calendarData: userState.calendarData || {} });
    }
    const [rows] = await db.execute(
      'SELECT * FROM calendar_entries WHERE user_id = ? ORDER BY entry_date ASC',
      [userId]
    );
    const calendarData = {};
    for (const row of rows) {
      const dateKey = row.entry_date instanceof Date
        ? row.entry_date.toISOString().split('T')[0]
        : String(row.entry_date).split('T')[0];
      if (!calendarData[dateKey]) calendarData[dateKey] = [];
      calendarData[dateKey].push({
        id: row.id,
        name: row.name,
        type: row.entry_type,
        cat: row.meal_category || 'workout',
        kcal: row.kcal,
        protein: row.protein,
        carbs: row.carbs,
        fat: row.fat,
        caloriesBurned: row.calories_burned,
        date: dateKey,
      });
    }
    res.json({ success: true, calendarData });
  } catch (error) {
    console.error('GET /calendar error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/calendar', async (req, res) => {
  try {
    const userId = req.fittrackUserId;
    const date = getDateKey(req.body?.date);
    const entry = req.body?.entry;
    if (!entry || typeof entry !== 'object') return res.status(400).json({ success: false, message: 'Calendar entry is required' });
    if (!entry.type) return res.status(400).json({ success: false, message: 'Calendar entry type is required' });

    if (!userId) {
      const { userState } = getUserState(req.fittrackUserKey);
      const normalizedEntry = createCalendarEntry(date, entry);
      userState.calendarData[date] = [...(userState.calendarData[date] || []), normalizedEntry];
      saveUserState(req.fittrackUserKey, userState);
      return res.status(201).json({ success: true, entry: normalizedEntry });
    }

    const isMeal = entry.type === 'meal';
    const isWorkout = entry.type === 'workout';
    const [result] = await db.execute(
      `INSERT INTO calendar_entries (user_id, entry_date, entry_type, name, meal_category, kcal, protein, carbs, fat, calories_burned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, date, entry.type, entry.name,
        isMeal ? (entry.cat || null) : null,
        isMeal ? (entry.kcal || null) : null,
        isMeal ? (entry.protein || null) : null,
        isMeal ? (entry.carbs || null) : null,
        isMeal ? (entry.fat || null) : null,
        isWorkout ? (entry.caloriesBurned || null) : null,
      ]
    );
    res.status(201).json({
      success: true,
      entry: {
        id: result.insertId,
        name: entry.name,
        type: entry.type,
        cat: entry.cat || 'workout',
        kcal: entry.kcal || null,
        protein: entry.protein || null,
        carbs: entry.carbs || null,
        fat: entry.fat || null,
        caloriesBurned: entry.caloriesBurned || null,
        date,
      },
    });
  } catch (error) {
    console.error('POST /calendar error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/calendar/:entryId', async (req, res) => {
  try {
    const userId = req.fittrackUserId;
    const entryId = String(req.params.entryId);
    const date = getDateKey(req.query.date);

    if (!userId) {
      const { userState } = getUserState(req.fittrackUserKey);
      const dayEntries = userState.calendarData[date] || [];
      const entryToDelete = dayEntries.find((e) => String(e.id) === entryId);
      const updatedEntries = dayEntries.filter((e) => String(e.id) !== entryId);
      if (updatedEntries.length === 0) delete userState.calendarData[date];
      else userState.calendarData[date] = updatedEntries;
      if (entryToDelete?.sourceWorkoutEntryId) {
        const workoutEntries = userState.workoutLogByDate[date] || [];
        userState.workoutLogByDate[date] = workoutEntries.map((e) =>
          String(e.id) === String(entryToDelete.sourceWorkoutEntryId) ? { ...e, syncedToCalendar: false } : e
        );
      }
      saveUserState(req.fittrackUserKey, userState);
      return res.json({ success: true, deletedEntryId: entryId });
    }

    await db.execute('DELETE FROM calendar_entries WHERE id = ? AND user_id = ?', [entryId, userId]);
    res.json({ success: true, deletedEntryId: entryId });
  } catch (error) {
    console.error('DELETE /calendar error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Workout log (stays JSON store - no MySQL table for this)
router.get('/workout-log', (req, res) => {
  const date = getDateKey(req.query.date);
  const { userState } = getUserState(req.fittrackUserKey);
  const entries = userState.workoutLogByDate[date] || [];
  res.json({
    success: true,
    date,
    entries,
    savedToCalendar: entries.length > 0 && entries.every((e) => e.syncedToCalendar),
  });
});

router.post('/workout-log', (req, res) => {
  const date = getDateKey(req.body?.date);
  const { userState } = getUserState(req.fittrackUserKey);
  const { name, category, logType, calories, timestamp, sets, reps, weight, duration, distance, rest, notes } = req.body || {};
  if (!name || typeof name !== 'string') return res.status(400).json({ success: false, message: 'Workout name is required' });
  const entry = {
    id: `workout-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name, category: category || 'Workout', logType: logType || 'bodyweight',
    calories: clampNumber(calories, 0), timestamp: timestamp || new Date().toISOString(),
    sets: sets ?? null, reps: reps ?? null, weight: weight ?? null,
    duration: duration ?? null, distance: distance ?? null, rest: rest ?? null,
    notes: notes ?? '', syncedToCalendar: false,
  };
  userState.workoutLogByDate[date] = [entry, ...(userState.workoutLogByDate[date] || [])];
  saveUserState(req.fittrackUserKey, userState);
  res.status(201).json({ success: true, entry });
});

router.post('/workout-log/save', (req, res) => {
  const date = getDateKey(req.body?.date);
  const { userState } = getUserState(req.fittrackUserKey);
  const workoutEntries = userState.workoutLogByDate[date] || [];
  if (workoutEntries.length === 0) return res.status(400).json({ success: false, message: 'No workouts logged for this day' });
  const calendarEntries = userState.calendarData[date] || [];
  const alreadyLinkedIds = new Set(calendarEntries.map((e) => e.sourceWorkoutEntryId).filter(Boolean).map(String));
  const newCalendarEntries = [];
  const updatedWorkoutEntries = workoutEntries.map((entry) => {
    if (!alreadyLinkedIds.has(String(entry.id))) newCalendarEntries.push(createCalendarWorkoutEntry(date, entry));
    return { ...entry, syncedToCalendar: true };
  });
  userState.workoutLogByDate[date] = updatedWorkoutEntries;
  userState.calendarData[date] = [...newCalendarEntries, ...calendarEntries];
  saveUserState(req.fittrackUserKey, userState);
  res.json({ success: true, savedCount: updatedWorkoutEntries.length, calendarEntriesAdded: newCalendarEntries.length });
});

router.delete('/workout-log/:entryId', (req, res) => {
  const date = getDateKey(req.query.date);
  const entryId = String(req.params.entryId);
  const { userState } = getUserState(req.fittrackUserKey);
  userState.workoutLogByDate[date] = (userState.workoutLogByDate[date] || []).filter((e) => String(e.id) !== entryId);
  const filteredCalendar = (userState.calendarData[date] || []).filter((e) => String(e.sourceWorkoutEntryId) !== entryId);
  if (filteredCalendar.length === 0) delete userState.calendarData[date];
  else userState.calendarData[date] = filteredCalendar;
  if (userState.workoutLogByDate[date]?.length === 0) delete userState.workoutLogByDate[date];
  saveUserState(req.fittrackUserKey, userState);
  res.json({ success: true, deletedEntryId: entryId });
});

// Saved meals - MySQL when authenticated, JSON store fallback
router.get('/saved-meals', async (req, res) => {
  try {
    const userId = req.fittrackUserId;
    if (!userId) {
      const { userState } = getUserState(req.fittrackUserKey);
      return res.json({ success: true, meals: userState.savedMeals || [] });
    }
    const [rows] = await db.execute('SELECT * FROM saved_meals WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json({ success: true, meals: rows });
  } catch (error) {
    console.error('GET /saved-meals error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/saved-meals', async (req, res) => {
  try {
    const userId = req.fittrackUserId;
    const meal = req.body;
    if (!meal || !meal.name) return res.status(400).json({ success: false, message: 'Meal name is required' });
    if (!userId) {
      const { userState } = getUserState(req.fittrackUserKey);
      const newMeal = {
        id: `meal-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name: meal.name, kcal: clampNumber(meal.kcal, 0), protein: clampNumber(meal.protein, 0),
        carbs: clampNumber(meal.carbs, 0), fat: clampNumber(meal.fat, 0), cat: meal.cat || 'lunch',
        createdAt: new Date().toISOString(),
      };
      userState.savedMeals = [...(userState.savedMeals || []), newMeal];
      saveUserState(req.fittrackUserKey, userState);
      return res.status(201).json({ success: true, meal: newMeal });
    }
    const [result] = await db.execute(
      'INSERT INTO saved_meals (user_id, name, kcal, protein, carbs, fat, category) VALUES (?,?,?,?,?,?,?)',
      [userId, meal.name, clampNumber(meal.kcal, 0), clampNumber(meal.protein, 0), clampNumber(meal.carbs, 0), clampNumber(meal.fat, 0), meal.cat || 'lunch']
    );
    res.status(201).json({ success: true, meal: { id: result.insertId, name: meal.name, kcal: meal.kcal, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, cat: meal.cat || 'lunch' } });
  } catch (error) {
    console.error('POST /saved-meals error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/saved-meals/:mealId', async (req, res) => {
  try {
    const userId = req.fittrackUserId;
    const mealId = String(req.params.mealId);
    if (!userId) {
      const { userState } = getUserState(req.fittrackUserKey);
      userState.savedMeals = (userState.savedMeals || []).filter((m) => String(m.id) !== mealId);
      saveUserState(req.fittrackUserKey, userState);
      return res.json({ success: true, deletedMealId: mealId });
    }
    await db.execute('DELETE FROM saved_meals WHERE id = ? AND user_id = ?', [mealId, userId]);
    res.json({ success: true, deletedMealId: mealId });
  } catch (error) {
    console.error('DELETE /saved-meals error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
