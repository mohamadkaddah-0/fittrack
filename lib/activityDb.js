const db = require('../db/pool');

let ensurePromise = null;

function formatDateKey(value) {
  if (!value) return new Date().toISOString().split('T')[0];
  if (typeof value === 'string') return value.split('T')[0];
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value).split('T')[0];
}

function nullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampNumber(value, fallback = 0, min = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(parsed, min);
}

function parseTimestamp(value) {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function createActivityTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_daily_metrics (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      metric_date DATE NOT NULL,
      water_intake DECIMAL(5,2) NOT NULL DEFAULT 0,
      steps_taken INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_metric_date (user_id, metric_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_plan_progress (
      user_id INT PRIMARY KEY,
      days_completed INT UNSIGNED NOT NULL DEFAULT 0,
      total_days INT UNSIGNED NOT NULL DEFAULT 7,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS workout_log_entries (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      entry_date DATE NOT NULL,
      exercise_id INT NULL,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'Workout',
      log_type VARCHAR(30) NOT NULL DEFAULT 'bodyweight',
      calories_burned SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      sets SMALLINT UNSIGNED NULL,
      reps SMALLINT UNSIGNED NULL,
      weight_kg DECIMAL(6,2) NULL,
      duration_sec SMALLINT UNSIGNED NULL,
      distance_km DECIMAL(6,2) NULL,
      rest_sec SMALLINT UNSIGNED NULL,
      notes TEXT NULL,
      workout_timestamp DATETIME NULL,
      synced_to_calendar BOOLEAN NOT NULL DEFAULT FALSE,
      calendar_entry_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_workout_log_user_date (user_id, entry_date),
      INDEX idx_workout_log_calendar_entry (calendar_entry_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL,
      FOREIGN KEY (calendar_entry_id) REFERENCES calendar_entries(id) ON DELETE SET NULL
    )
  `);
}

async function ensureActivityTables() {
  if (!ensurePromise) {
    ensurePromise = createActivityTables().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  return ensurePromise;
}

function calendarRowToEntry(row) {
  const date = formatDateKey(row.entry_date);
  return {
    id: row.id,
    name: row.name,
    type: row.entry_type,
    cat: row.meal_category || 'workout',
    kcal: row.kcal,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    caloriesBurned: row.calories_burned,
    exerciseId: row.exercise_id,
    sets: row.sets,
    reps: row.reps,
    weight: row.weight_kg,
    duration: row.duration_sec,
    distance: row.distance_km,
    rest: row.rest_sec,
    date,
  };
}

function workoutRowToEntry(row) {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    name: row.name,
    category: row.category,
    logType: row.log_type,
    calories: clampNumber(row.calories_burned, 0),
    timestamp: row.workout_timestamp ? new Date(row.workout_timestamp).toISOString() : new Date(row.created_at).toISOString(),
    sets: row.sets,
    reps: row.reps,
    weight: row.weight_kg,
    duration: row.duration_sec,
    distance: row.distance_km,
    rest: row.rest_sec,
    notes: row.notes || '',
    syncedToCalendar: Boolean(row.synced_to_calendar),
    calendarEntryId: row.calendar_entry_id,
  };
}

async function getCalendarData(userId) {
  const [rows] = await db.execute(
    'SELECT * FROM calendar_entries WHERE user_id = ? ORDER BY entry_date ASC, created_at ASC, id ASC',
    [userId]
  );
  const calendarData = {};
  for (const row of rows) {
    const entry = calendarRowToEntry(row);
    if (!calendarData[entry.date]) calendarData[entry.date] = [];
    calendarData[entry.date].push(entry);
  }
  return calendarData;
}

async function getHomepageState(userId, date) {
  const [[metrics]] = await db.execute(
    'SELECT water_intake, steps_taken FROM user_daily_metrics WHERE user_id = ? AND metric_date = ?',
    [userId, date]
  );
  const [[progress]] = await db.execute(
    'SELECT days_completed, total_days FROM user_plan_progress WHERE user_id = ?',
    [userId]
  );
  return {
    waterIntake: clampNumber(metrics?.water_intake, 0),
    stepsTaken: clampNumber(metrics?.steps_taken, 0),
    daysCompleted: clampNumber(progress?.days_completed, 0),
    planTotalDays: clampNumber(progress?.total_days, 7, 1),
  };
}

async function updateDailyMetrics(userId, date, values) {
  if (values.waterIntake !== undefined) {
    await db.execute(
      `INSERT INTO user_daily_metrics (user_id, metric_date, water_intake)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE water_intake = VALUES(water_intake)`,
      [userId, date, clampNumber(values.waterIntake, 0)]
    );
  }

  if (values.stepsTaken !== undefined) {
    await db.execute(
      `INSERT INTO user_daily_metrics (user_id, metric_date, steps_taken)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE steps_taken = VALUES(steps_taken)`,
      [userId, date, clampNumber(values.stepsTaken, 0)]
    );
  }
}

async function updatePlanProgress(userId, daysCompleted, totalDays = 7) {
  await db.execute(
    `INSERT INTO user_plan_progress (user_id, days_completed, total_days)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE days_completed = VALUES(days_completed), total_days = VALUES(total_days)`,
    [userId, clampNumber(daysCompleted, 0), clampNumber(totalDays, 7, 1)]
  );
}

async function getWorkoutLog(userId, date) {
  const [rows] = await db.execute(
    `SELECT * FROM workout_log_entries
     WHERE user_id = ? AND entry_date = ?
     ORDER BY created_at DESC, id DESC`,
    [userId, date]
  );
  const entries = rows.map(workoutRowToEntry);
  return {
    entries,
    savedToCalendar: entries.length > 0 && entries.every((entry) => entry.syncedToCalendar),
  };
}

async function addWorkoutLogEntry(userId, date, payload) {
  const [result] = await db.execute(
    `INSERT INTO workout_log_entries
      (user_id, entry_date, exercise_id, name, category, log_type, calories_burned,
       sets, reps, weight_kg, duration_sec, distance_km, rest_sec, notes, workout_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      date,
      nullableNumber(payload.exerciseId),
      payload.name,
      payload.category || 'Workout',
      payload.logType || 'bodyweight',
      clampNumber(payload.calories, 0),
      nullableNumber(payload.sets),
      nullableNumber(payload.reps),
      nullableNumber(payload.weight),
      nullableNumber(payload.duration),
      nullableNumber(payload.distance),
      nullableNumber(payload.rest),
      payload.notes || '',
      parseTimestamp(payload.timestamp),
    ]
  );
  const [[row]] = await db.execute('SELECT * FROM workout_log_entries WHERE id = ? AND user_id = ?', [result.insertId, userId]);
  return workoutRowToEntry(row);
}

async function saveWorkoutLogToCalendar(userId, date) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT * FROM workout_log_entries
       WHERE user_id = ? AND entry_date = ? AND synced_to_calendar = FALSE
       ORDER BY created_at ASC, id ASC
       FOR UPDATE`,
      [userId, date]
    );

    if (rows.length === 0) {
      const [[existing]] = await connection.execute(
        `SELECT COUNT(*) AS count FROM workout_log_entries
         WHERE user_id = ? AND entry_date = ?`,
        [userId, date]
      );
      await connection.commit();
      return {
        savedCount: clampNumber(existing?.count, 0),
        calendarEntriesAdded: 0,
      };
    }

    let added = 0;
    for (const row of rows) {
      const [insertResult] = await connection.execute(
        `INSERT INTO calendar_entries
          (user_id, entry_date, entry_type, name, exercise_id, sets, reps, weight_kg,
           duration_sec, distance_km, rest_sec, calories_burned)
         VALUES (?, ?, 'workout', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          date,
          row.name,
          row.exercise_id,
          row.sets,
          row.reps,
          row.weight_kg,
          row.duration_sec,
          row.distance_km,
          row.rest_sec,
          row.calories_burned,
        ]
      );
      await connection.execute(
        `UPDATE workout_log_entries
         SET synced_to_calendar = TRUE, calendar_entry_id = ?
         WHERE id = ? AND user_id = ?`,
        [insertResult.insertId, row.id, userId]
      );
      added += 1;
    }

    await connection.commit();
    const [[total]] = await db.execute(
      `SELECT COUNT(*) AS count FROM workout_log_entries
       WHERE user_id = ? AND entry_date = ?`,
      [userId, date]
    );
    return {
      savedCount: clampNumber(total?.count, rows.length),
      calendarEntriesAdded: added,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deleteWorkoutLogEntry(userId, date, entryId) {
  const [[entry]] = await db.execute(
    'SELECT calendar_entry_id FROM workout_log_entries WHERE id = ? AND user_id = ? AND entry_date = ?',
    [entryId, userId, date]
  );

  if (entry?.calendar_entry_id) {
    await db.execute(
      'DELETE FROM calendar_entries WHERE id = ? AND user_id = ?',
      [entry.calendar_entry_id, userId]
    );
  }

  await db.execute(
    'DELETE FROM workout_log_entries WHERE id = ? AND user_id = ? AND entry_date = ?',
    [entryId, userId, date]
  );
}

module.exports = {
  ensureActivityTables,
  formatDateKey,
  getCalendarData,
  getHomepageState,
  updateDailyMetrics,
  updatePlanProgress,
  getWorkoutLog,
  addWorkoutLogEntry,
  saveWorkoutLogToCalendar,
  deleteWorkoutLogEntry,
  nullableNumber,
  clampNumber,
};
