const express = require('express');
const resolveUser = require('../middleware/resolveUser');
const { getUserState, saveUserState } = require('../lib/activityStore');
const activityDb = require('../lib/activityDb');
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

// Homepage - MySQL when authenticated, JSON store fallback
router.get('/homepage', async (req, res) => {
  try {
    const userId = req.fittrackUserId;
    const today = getDateKey(req.query.date);

    if (!userId) {
      const { userState } = getUserState(req.fittrackUserKey);
      return res.json({
        success: true,
        homepage: {
          calendarData: userState.calendarData || {},
          waterIntake: clampNumber(userState.hydrationByDate?.[today], 0),
          stepsTaken: clampNumber(userState.stepsByDate?.[today], 0),
          daysCompleted: clampNumber(userState.planProgress?.daysCompleted, 0),
          planTotalDays: clampNumber(userState.planProgress?.totalDays, 7, 1),
        },
      });
    }

    await activityDb.ensureActivityTables();
    const [calendarData, homepageState] = await Promise.all([
      activityDb.getCalendarData(userId),
      activityDb.getHomepageState(userId, today),
    ]);

    res.json({
      success: true,
      homepage: {
        calendarData,
        ...homepageState,
      },
    });
  } catch (error) {
    console.error('GET /homepage error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/homepage', async (req, res) => {
  try {
    const userId = req.fittrackUserId;
    const today = getDateKey(req.body?.date);

    if (!userId) {
      const { userState } = getUserState(req.fittrackUserKey);
      if (req.body?.waterIntake !== undefined) userState.hydrationByDate[today] = clampNumber(req.body.waterIntake, 0);
      if (req.body?.stepsTaken !== undefined) userState.stepsByDate[today] = clampNumber(req.body.stepsTaken, 0);
      if (req.body?.daysCompleted !== undefined) {
        userState.planProgress.daysCompleted = clampNumber(req.body.daysCompleted, 0);
        userState.planProgress.updatedAt = new Date().toISOString();
      }
      saveUserState(req.fittrackUserKey, userState);
      return res.json({
        success: true,
        homepage: {
          waterIntake: clampNumber(userState.hydrationByDate[today], 0),
          stepsTaken: clampNumber(userState.stepsByDate?.[today], 0),
          daysCompleted: clampNumber(userState.planProgress.daysCompleted, 0),
          planTotalDays: clampNumber(userState.planProgress.totalDays, 7, 1),
        },
      });
    }

    await activityDb.ensureActivityTables();
    await activityDb.updateDailyMetrics(userId, today, {
      waterIntake: req.body?.waterIntake,
      stepsTaken: req.body?.stepsTaken,
    });

    if (req.body?.daysCompleted !== undefined) {
      await activityDb.updatePlanProgress(userId, req.body.daysCompleted, req.body?.planTotalDays || 7);
    }

    const homepageState = await activityDb.getHomepageState(userId, today);
    res.json({ success: true, homepage: homepageState });
  } catch (error) {
    console.error('PATCH /homepage error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Calendar - MySQL when authenticated, JSON store fallback
router.get('/calendar', async (req, res) => {
  try {
    const userId = req.fittrackUserId;
    if (!userId) {
      const { userState } = getUserState(req.fittrackUserKey);
      return res.json({ success: true, calendarData: userState.calendarData || {} });
    }
    await activityDb.ensureActivityTables();
    const calendarData = await activityDb.getCalendarData(userId);
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

    await activityDb.ensureActivityTables();
    const isMeal = entry.type === 'meal';
    const isWorkout = entry.type === 'workout';
    const [result] = await db.execute(
      `INSERT INTO calendar_entries
        (user_id, entry_date, entry_type, name, meal_category, kcal, protein, carbs, fat,
         exercise_id, sets, reps, weight_kg, duration_sec, distance_km, rest_sec, calories_burned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, date, entry.type, entry.name,
        isMeal ? (entry.cat || null) : null,
        isMeal ? (entry.kcal || null) : null,
        isMeal ? (entry.protein || null) : null,
        isMeal ? (entry.carbs || null) : null,
        isMeal ? (entry.fat || null) : null,
        isWorkout ? activityDb.nullableNumber(entry.exerciseId) : null,
        isWorkout ? activityDb.nullableNumber(entry.sets) : null,
        isWorkout ? activityDb.nullableNumber(entry.reps) : null,
        isWorkout ? activityDb.nullableNumber(entry.weight) : null,
        isWorkout ? activityDb.nullableNumber(entry.duration) : null,
        isWorkout ? activityDb.nullableNumber(entry.distance) : null,
        isWorkout ? activityDb.nullableNumber(entry.rest) : null,
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
        exerciseId: entry.exerciseId || null,
        sets: entry.sets || null,
        reps: entry.reps || null,
        weight: entry.weight || null,
        duration: entry.duration || null,
        distance: entry.distance || null,
        rest: entry.rest || null,
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

    await activityDb.ensureActivityTables();
    await db.execute(
      'UPDATE workout_log_entries SET synced_to_calendar = FALSE, calendar_entry_id = NULL WHERE calendar_entry_id = ? AND user_id = ?',
      [entryId, userId]
    );
    await db.execute('DELETE FROM calendar_entries WHERE id = ? AND user_id = ?', [entryId, userId]);
    res.json({ success: true, deletedEntryId: entryId });
  } catch (error) {
    console.error('DELETE /calendar error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Workout log - MySQL when authenticated, JSON store fallback
router.get('/workout-log', async (req, res) => {
  try {
    const date = getDateKey(req.query.date);
    const userId = req.fittrackUserId;

    if (!userId) {
      const { userState } = getUserState(req.fittrackUserKey);
      const entries = userState.workoutLogByDate[date] || [];
      return res.json({
        success: true,
        date,
        entries,
        savedToCalendar: entries.length > 0 && entries.every((e) => e.syncedToCalendar),
      });
    }

    await activityDb.ensureActivityTables();
    const workoutLog = await activityDb.getWorkoutLog(userId, date);
    res.json({ success: true, date, ...workoutLog });
  } catch (error) {
    console.error('GET /workout-log error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/workout-log', async (req, res) => {
  try {
    const date = getDateKey(req.body?.date);
    const userId = req.fittrackUserId;
    const { name, category, logType, calories, timestamp, sets, reps, weight, duration, distance, rest, notes, exerciseId } = req.body || {};
    if (!name || typeof name !== 'string') return res.status(400).json({ success: false, message: 'Workout name is required' });

    if (!userId) {
      const { userState } = getUserState(req.fittrackUserKey);
      const entry = {
        id: `workout-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        exerciseId: exerciseId ?? null,
        name, category: category || 'Workout', logType: logType || 'bodyweight',
        calories: clampNumber(calories, 0), timestamp: timestamp || new Date().toISOString(),
        sets: sets ?? null, reps: reps ?? null, weight: weight ?? null,
        duration: duration ?? null, distance: distance ?? null, rest: rest ?? null,
        notes: notes ?? '', syncedToCalendar: false,
      };
      userState.workoutLogByDate[date] = [entry, ...(userState.workoutLogByDate[date] || [])];
      saveUserState(req.fittrackUserKey, userState);
      return res.status(201).json({ success: true, entry });
    }

    await activityDb.ensureActivityTables();
    const entry = await activityDb.addWorkoutLogEntry(userId, date, {
      exerciseId,
      name,
      category,
      logType,
      calories,
      timestamp,
      sets,
      reps,
      weight,
      duration,
      distance,
      rest,
      notes,
    });
    res.status(201).json({ success: true, entry });
  } catch (error) {
    console.error('POST /workout-log error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/workout-log/save', async (req, res) => {
  try {
    const date = getDateKey(req.body?.date);
    const userId = req.fittrackUserId;

    if (!userId) {
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
      return res.json({ success: true, savedCount: updatedWorkoutEntries.length, calendarEntriesAdded: newCalendarEntries.length });
    }

    await activityDb.ensureActivityTables();
    const result = await activityDb.saveWorkoutLogToCalendar(userId, date);
    if (result.savedCount === 0) {
      return res.status(400).json({ success: false, message: 'No workouts logged for this day' });
    }
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('POST /workout-log/save error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/workout-log/:entryId', async (req, res) => {
  try {
    const date = getDateKey(req.query.date);
    const entryId = String(req.params.entryId);
    const userId = req.fittrackUserId;

    if (!userId) {
      const { userState } = getUserState(req.fittrackUserKey);
      userState.workoutLogByDate[date] = (userState.workoutLogByDate[date] || []).filter((e) => String(e.id) !== entryId);
      const filteredCalendar = (userState.calendarData[date] || []).filter((e) => String(e.sourceWorkoutEntryId) !== entryId);
      if (filteredCalendar.length === 0) delete userState.calendarData[date];
      else userState.calendarData[date] = filteredCalendar;
      if (userState.workoutLogByDate[date]?.length === 0) delete userState.workoutLogByDate[date];
      saveUserState(req.fittrackUserKey, userState);
      return res.json({ success: true, deletedEntryId: entryId });
    }

    await activityDb.ensureActivityTables();
    await activityDb.deleteWorkoutLogEntry(userId, date, entryId);
    res.json({ success: true, deletedEntryId: entryId });
  } catch (error) {
    console.error('DELETE /workout-log error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
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
