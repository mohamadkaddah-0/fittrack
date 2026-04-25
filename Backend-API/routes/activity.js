const express = require('express');
const resolveUser = require('../middleware/resolveUser');
const { getUserState, saveUserState } = require('../lib/activityStore');

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
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
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

  if (req.body?.waterIntake !== undefined) {
    userState.hydrationByDate[today] = clampNumber(req.body.waterIntake, 0);
  }

  if (req.body?.stepsTaken !== undefined) {
    userState.stepsByDate[today] = clampNumber(req.body.stepsTaken, 0);
  }

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

router.get('/calendar', (req, res) => {
  const { userState } = getUserState(req.fittrackUserKey);

  res.json({
    success: true,
    calendarData: userState.calendarData || {},
  });
});

router.post('/calendar', (req, res) => {
  const date = getDateKey(req.body?.date);
  const { userState } = getUserState(req.fittrackUserKey);
  const entry = req.body?.entry;

  if (!entry || typeof entry !== 'object') {
    return res.status(400).json({ success: false, message: 'Calendar entry is required' });
  }

  if (!entry.type) {
    return res.status(400).json({ success: false, message: 'Calendar entry type is required' });
  }

  const normalizedEntry = createCalendarEntry(date, entry);
  userState.calendarData[date] = [...(userState.calendarData[date] || []), normalizedEntry];
  saveUserState(req.fittrackUserKey, userState);

  res.status(201).json({
    success: true,
    entry: normalizedEntry,
  });
});

router.delete('/calendar/:entryId', (req, res) => {
  const date = getDateKey(req.query.date);
  const entryId = String(req.params.entryId);
  const { userState } = getUserState(req.fittrackUserKey);
  const dayEntries = userState.calendarData[date] || [];

  const entryToDelete = dayEntries.find((entry) => String(entry.id) === entryId);
  const updatedEntries = dayEntries.filter((entry) => String(entry.id) !== entryId);

  if (updatedEntries.length === 0) {
    delete userState.calendarData[date];
  } else {
    userState.calendarData[date] = updatedEntries;
  }

  if (entryToDelete?.sourceWorkoutEntryId) {
    const workoutEntries = userState.workoutLogByDate[date] || [];
    userState.workoutLogByDate[date] = workoutEntries.map((entry) =>
      String(entry.id) === String(entryToDelete.sourceWorkoutEntryId)
        ? { ...entry, syncedToCalendar: false }
        : entry
    );
  }

  saveUserState(req.fittrackUserKey, userState);

  res.json({
    success: true,
    deletedEntryId: entryId,
  });
});

router.get('/workout-log', (req, res) => {
  const date = getDateKey(req.query.date);
  const { userState } = getUserState(req.fittrackUserKey);
  const entries = userState.workoutLogByDate[date] || [];

  res.json({
    success: true,
    date,
    entries,
    savedToCalendar: entries.length > 0 && entries.every((entry) => entry.syncedToCalendar),
  });
});

router.post('/workout-log', (req, res) => {
  const date = getDateKey(req.body?.date);
  const { userState } = getUserState(req.fittrackUserKey);
  const {
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
  } = req.body || {};

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, message: 'Workout name is required' });
  }

  const entry = {
    id: `workout-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name,
    category: category || 'Workout',
    logType: logType || 'bodyweight',
    calories: clampNumber(calories, 0),
    timestamp: timestamp || new Date().toISOString(),
    sets: sets ?? null,
    reps: reps ?? null,
    weight: weight ?? null,
    duration: duration ?? null,
    distance: distance ?? null,
    rest: rest ?? null,
    notes: notes ?? '',
    syncedToCalendar: false,
  };

  userState.workoutLogByDate[date] = [entry, ...(userState.workoutLogByDate[date] || [])];
  saveUserState(req.fittrackUserKey, userState);

  res.status(201).json({
    success: true,
    entry,
  });
});

router.post('/workout-log/save', (req, res) => {
  const date = getDateKey(req.body?.date);
  const { userState } = getUserState(req.fittrackUserKey);
  const workoutEntries = userState.workoutLogByDate[date] || [];

  if (workoutEntries.length === 0) {
    return res.status(400).json({ success: false, message: 'No workouts logged for this day' });
  }

  const calendarEntries = userState.calendarData[date] || [];
  const alreadyLinkedIds = new Set(
    calendarEntries
      .map((entry) => entry.sourceWorkoutEntryId)
      .filter(Boolean)
      .map(String)
  );

  const newCalendarEntries = [];

  const updatedWorkoutEntries = workoutEntries.map((entry) => {
    if (!alreadyLinkedIds.has(String(entry.id))) {
      newCalendarEntries.push(createCalendarWorkoutEntry(date, entry));
    }

    return {
      ...entry,
      syncedToCalendar: true,
    };
  });

  userState.workoutLogByDate[date] = updatedWorkoutEntries;
  userState.calendarData[date] = [...newCalendarEntries, ...calendarEntries];
  saveUserState(req.fittrackUserKey, userState);

  res.json({
    success: true,
    savedCount: updatedWorkoutEntries.length,
    calendarEntriesAdded: newCalendarEntries.length,
  });
});

router.delete('/workout-log/:entryId', (req, res) => {
  const date = getDateKey(req.query.date);
  const entryId = String(req.params.entryId);
  const { userState } = getUserState(req.fittrackUserKey);
  const workoutEntries = userState.workoutLogByDate[date] || [];

  userState.workoutLogByDate[date] = workoutEntries.filter(
    (entry) => String(entry.id) !== entryId
  );

  const calendarEntries = userState.calendarData[date] || [];
  const filteredCalendarEntries = calendarEntries.filter(
    (entry) => String(entry.sourceWorkoutEntryId) !== entryId
  );

  if (filteredCalendarEntries.length === 0) {
    delete userState.calendarData[date];
  } else {
    userState.calendarData[date] = filteredCalendarEntries;
  }

  if (userState.workoutLogByDate[date]?.length === 0) {
    delete userState.workoutLogByDate[date];
  }

  saveUserState(req.fittrackUserKey, userState);

  res.json({
    success: true,
    deletedEntryId: entryId,
  });
});

// ── Saved meals ───────────────────────────────────────────────

router.get('/saved-meals', (req, res) => {
  const { userState } = getUserState(req.fittrackUserKey);
  const meals = userState.savedMeals || [];
  res.json({ success: true, meals });
});

router.post('/saved-meals', (req, res) => {
  const { userState } = getUserState(req.fittrackUserKey);
  const meal = req.body;

  if (!meal || !meal.name) {
    return res.status(400).json({ success: false, message: 'Meal name is required' });
  }

  const newMeal = {
    id: `meal-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name:     meal.name,
    kcal:     clampNumber(meal.kcal, 0),
    protein:  clampNumber(meal.protein, 0),
    carbs:    clampNumber(meal.carbs, 0),
    fat:      clampNumber(meal.fat, 0),
    cat:      meal.cat || 'lunch',
    createdAt: new Date().toISOString(),
  };

  userState.savedMeals = [...(userState.savedMeals || []), newMeal];
  saveUserState(req.fittrackUserKey, userState);

  res.status(201).json({ success: true, meal: newMeal });
});

router.delete('/saved-meals/:mealId', (req, res) => {
  const mealId = String(req.params.mealId);
  const { userState } = getUserState(req.fittrackUserKey);

  userState.savedMeals = (userState.savedMeals || []).filter(
    (m) => String(m.id) !== mealId
  );
  saveUserState(req.fittrackUserKey, userState);

  res.json({ success: true, deletedMealId: mealId });
});

module.exports = router;
