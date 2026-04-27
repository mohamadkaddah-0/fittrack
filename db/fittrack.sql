-- ============================================================
-- FitTrack — Phase 2 Database
-- Course  : CSC 443  Spring 2026
-- Engine  : MySQL 8+
-- Charset : utf8mb4 (supports Arabic, emoji, special chars)
-- ============================================================
--
-- HOW TO RUN
--   Option 1 (terminal):
--     mysql -u root -p < fittrack.sql
--   Option 2 (GUI):
--     Paste the entire file into MySQL Workbench or phpMyAdmin
--     and execute all.
--
-- ─────────────────────────────────────────────────────────────
-- WHAT THIS FILE CONTAINS
-- ─────────────────────────────────────────────────────────────
--   PART A  — Schema     : 15 CREATE TABLE statements
--   PART B  — Seed data  : realistic mock rows for testing
--   PART C  — Views      : 4 pre-built queries used by the API
--   PART D  — Triggers   : 3 automatic business-logic rules
--   PART E  — Verification queries (run after import to confirm)
--
-- ─────────────────────────────────────────────────────────────
-- TABLE LIST  (15 tables)
-- ─────────────────────────────────────────────────────────────
--   01  users                  — registered accounts + survey data
--   02  user_limitations       — physical limitations per user
--   03  user_equipment         — available equipment per user
--   04  password_reset_codes   — 6-digit codes for forgot-password flow
--   05  exercises              — the 20 exercises from Phase 1 mockData
--   05b exercise_limitations   — which exercises conflict with which limitations
--   06  exercise_muscles       — primary/secondary muscle groups per exercise
--   07  exercise_steps         — ordered how-to steps per exercise
--   08  exercise_tips_mistakes — tips and common mistakes per exercise
--   09  exercise_variations    — easier/harder variants per exercise
--   10  ingredients            — 51 food ingredients with macros per 100 g
--   11  meal_pool              — 16 pre-built meals shown in DietProgram
--   12  meal_pool_ingredients  — ingredient breakdown for each meal_pool row
--   13  calendar_entries       — every meal and workout ever logged
--   14  saved_meals            — custom meals saved by users in My Meals tab
--   15  deleted_entries_log    — audit table, written by trigger automatically
--
-- ─────────────────────────────────────────────────────────────
-- VIEW LIST  (4 views)
-- ─────────────────────────────────────────────────────────────
--   v_exercises       — flat exercise rows for GET /api/exercises
--   v_daily_totals    — kcal/macro/workout totals per user per day
--   v_weekly_summary  — 7-day rolling totals per user
--   v_user_profile    — full user row including all new workout columns
--
-- ─────────────────────────────────────────────────────────────
-- TRIGGER LIST  (3 triggers)
-- ─────────────────────────────────────────────────────────────
--   trg_set_ongoing_on_insert  — auto-sets is_ongoing flag on registration
--   trg_log_deleted_entry      — writes audit record when calendar row deleted
--   trg_update_last_active     — keeps users.last_active current after every log
--
-- ============================================================


-- ============================================================
-- DATABASE SETUP
-- ============================================================
-- Create the database if it does not already exist.
-- utf8mb4 allows Arabic names, emoji, and any Unicode character.
-- ============================================================

CREATE DATABASE IF NOT EXISTS fittrack
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fittrack;


-- ============================================================
-- PART A — SCHEMA  (15 tables)
-- ============================================================


-- ============================================================
-- TABLE 01 — users
-- ============================================================
-- Central account table. One row per registered user.
--
-- How it is populated:
--   POST /api/auth/register inserts one row here.
--   The bcrypt hash of the password is stored, never plaintext.
--
-- Nullable fitness columns (gender, activity_level, goal,
-- fitness_level):
--   These were previously NOT NULL with forced defaults.
--   They are now NULL so a user can register with partial survey
--   data and fill in the rest later via PUT /api/users/me.
--
-- Workout preference columns (workout_duration, workout_types,
-- workout_location, workout_time):
--   Added in Phase 2 to store the extra survey questions.
--   Each has a sensible default so existing rows are not broken.
--
-- Automatic behaviour:
--   is_ongoing is set by trigger trg_set_ongoing_on_insert.
--   last_active is updated by trigger trg_update_last_active.
--   updated_at refreshes automatically on every UPDATE.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  -- Primary key — auto-incremented integer, used as JWT sub
  id               INT           PRIMARY KEY AUTO_INCREMENT,

  -- Basic identity — name and email come from the register form
  name             VARCHAR(100)  NOT NULL,
  email            VARCHAR(150)  NOT NULL UNIQUE,

  -- Password is hashed with bcrypt (saltRounds 12) before storage
  -- See: routes/auth.js — bcrypt.genSalt(12) + bcrypt.hash()
  password_hash    VARCHAR(255)  NOT NULL,

  -- Survey: physical stats
  -- gender is NULL — filled during survey, not forced on register
  gender           ENUM('male','female','other') NULL,
  age              TINYINT UNSIGNED NOT NULL,
  current_weight   DECIMAL(5,2)  NOT NULL,   -- kilograms, e.g. 78.50
  target_weight    DECIMAL(5,2)  NOT NULL,   -- kilograms
  height           DECIMAL(5,1)  NOT NULL,   -- centimetres, e.g. 180.0

  -- Survey: fitness preferences — NULL because survey fills them in steps
  activity_level   ENUM('sedentary','lightly_active','moderately_active','very_active') NULL,
  goal             ENUM('lose','maintain','gain_muscle','gain') NULL,
  fitness_level    ENUM('beginner','intermediate','advanced','athlete') NULL,

  -- Plan duration: NULL means open-ended (is_ongoing = TRUE)
  -- is_ongoing is set automatically by trigger trg_set_ongoing_on_insert
  duration_months  TINYINT UNSIGNED NULL,
  is_ongoing       BOOLEAN NOT NULL DEFAULT TRUE,

  -- Updated by trigger trg_update_last_active every time the user
  -- logs a meal or workout — used for streak calculation in HomePage
  last_active      DATE NULL,

  -- Phase 2 — additional survey fields for workout preferences
  -- Defaults provided so existing rows work without a migration step
  workout_duration VARCHAR(50)  NULL DEFAULT '3-4 days',        -- e.g. '5-6 days'
  workout_types    VARCHAR(100) NULL DEFAULT 'Strength Training',-- e.g. 'Cardio', 'Mixed'
  workout_location VARCHAR(50)  NULL DEFAULT 'Gym',             -- e.g. 'Home', 'Outdoor'
  workout_time     VARCHAR(20)  NULL DEFAULT 'Morning',         -- e.g. 'Evening', 'Flexible'

  -- Timestamps — created_at is set once on INSERT
  -- updated_at refreshes automatically on every UPDATE
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- Seed: 4 test users  (password for all = "password123")
-- IMPORTANT: Replace PLACEHOLDER hashes with real bcrypt hashes
-- before final submission, or register fresh test accounts via
-- POST /api/auth/register — that route hashes automatically.
-- ─────────────────────────────────────────────────────────────
INSERT INTO users
  (name, email, password_hash, gender, age, current_weight, target_weight,
   height, activity_level, goal, fitness_level, duration_months, is_ongoing)
VALUES
  ('Alex Johnson', 'alex@fittrack.com', '$2b$10$PLACEHOLDER_HASH_ALEX',
   'male',   22, 78.00, 85.00, 180.0, 'moderately_active', 'gain_muscle', 'beginner',     6, FALSE),
  ('Sara Ahmed',   'sara@fittrack.com', '$2b$10$PLACEHOLDER_HASH_SARA',
   'female', 24, 72.00, 62.00, 165.0, 'lightly_active',    'lose',        'beginner',     3, FALSE),
  ('Omar Khalil',  'omar@fittrack.com', '$2b$10$PLACEHOLDER_HASH_OMAR',
   'male',   28, 90.00, 90.00, 175.0, 'very_active',       'maintain',    'intermediate', NULL, TRUE),
  ('Lara Nassar',  'lara@fittrack.com', '$2b$10$PLACEHOLDER_HASH_LARA',
   'female', 21, 55.00, 60.00, 160.0, 'sedentary',         'gain',        'beginner',     4, FALSE);


-- ============================================================
-- TABLE 02 — user_limitations
-- ============================================================
-- Stores physical limitations for each user (e.g. Knee issues).
-- Many-to-one: one user can have multiple limitation rows.
-- Used by ExerciseLibrary and ExerciseDetailPage to warn the
-- user if an exercise conflicts with their limitations.
-- ON DELETE CASCADE: deleting a user removes all their rows here.
-- UNIQUE KEY prevents the same limitation being stored twice.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_limitations (
  id         INT          PRIMARY KEY AUTO_INCREMENT,
  user_id    INT          NOT NULL,
  limitation VARCHAR(100) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_limitation (user_id, limitation)  -- no duplicates per user
);

-- Seed: Sara (user 2) has knee and joint limitations
INSERT INTO user_limitations (user_id, limitation) VALUES
  (2, 'Knee issues'),
  (2, 'Joint pain');


-- ============================================================
-- TABLE 03 — user_equipment
-- ============================================================
-- Stores gym equipment available to each user.
-- Many-to-one: one user can have multiple equipment rows.
-- Used by ExerciseLibrary to filter exercises by available gear.
-- ON DELETE CASCADE removes equipment rows when user is deleted.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_equipment (
  id        INT          PRIMARY KEY AUTO_INCREMENT,
  user_id   INT          NOT NULL,
  equipment VARCHAR(100) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_equipment (user_id, equipment)
);

-- Seed: Alex (1) has barbell + dumbbells; Omar (3) has a full gym setup
INSERT INTO user_equipment (user_id, equipment) VALUES
  (1,'barbell'),(1,'dumbbells'),
  (3,'barbell'),(3,'dumbbells'),(3,'pull-up bar'),
  (3,'treadmill'),(3,'stationary bike'),(3,'rowing machine');


-- ============================================================
-- TABLE 04 — password_reset_codes
-- ============================================================
-- Stores 6-digit codes generated by POST /api/auth/forgot-password.
-- Each code expires 15 minutes after creation (enforced by the API).
-- used = 1 once the code has been successfully consumed so it
-- cannot be reused even if it has not expired yet.
-- ON DELETE CASCADE removes codes when the linked user is deleted.
-- ============================================================

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id         INT       PRIMARY KEY AUTO_INCREMENT,
  user_id    INT       NOT NULL,
  code       CHAR(6)   NOT NULL,             -- always a 6-digit string e.g. '482901'
  expires_at TIMESTAMP NOT NULL,             -- set to NOW() + 15 minutes by the API
  used       BOOLEAN   NOT NULL DEFAULT FALSE, -- flipped to TRUE after successful reset
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ============================================================
-- TABLE 05 — exercises
-- ============================================================
-- All 20 exercises from Phase 1 mockData.js EXERCISES array.
-- IDs are fixed (1-20) and match the frontend exercise objects.
-- log_type determines which input fields LogWorkoutPage shows.
-- met_value and kcal_per_rep are used by estimateCalories().
-- ============================================================

CREATE TABLE IF NOT EXISTS exercises (
  id                 INT          PRIMARY KEY,   -- fixed IDs match Phase 1 mockData
  name               VARCHAR(100) NOT NULL,
  category           ENUM('Cardio','Weightlifting') NOT NULL,
  difficulty         ENUM('Beginner','Intermediate','Advanced','Athlete') NOT NULL,

  -- log_type tells LogWorkoutPage.jsx which form fields to render:
  --   duration     → sets + time per set  (cardio machines like cycling)
  --   reps-cardio  → sets + reps          (HIIT like burpees, high knees)
  --   bodyweight   → sets + reps          (push-ups, pull-ups, squats)
  --   weighted     → sets + reps + weight (bench press, deadlift)
  --   distance     → distance km + duration min (running, rowing)
  log_type           ENUM('duration','reps-cardio','bodyweight','weighted','distance') NOT NULL,

  -- Calorie estimation helpers — used by estimateCalories() in LogWorkoutPage.jsx
  met_value          DECIMAL(5,2) NULL,   -- Metabolic Equivalent of Task (duration/distance types)
  kcal_per_rep       DECIMAL(6,3) NULL,   -- calories burned per single rep (reps-cardio type)

  kcal_range         VARCHAR(20)  NOT NULL,   -- display string e.g. '60-80'
  muscles            VARCHAR(150) NOT NULL,   -- short summary e.g. 'Chest, Triceps'
  description        TEXT         NOT NULL,
  equipment_name     VARCHAR(100) NOT NULL DEFAULT 'None',
  exercise_type      VARCHAR(80)  NOT NULL,   -- e.g. 'Compound strength', 'HIIT'
  image_url          VARCHAR(500) NULL,       -- Unsplash image for the exercise card
  video_id           VARCHAR(30)  NULL,       -- YouTube video ID for ExerciseDetailPage
  required_equipment VARCHAR(50)  NOT NULL DEFAULT 'none'  -- for equipment filtering
);

-- 20 exercises — IDs 1-20 match Phase 1 mockData.js exactly
INSERT INTO exercises VALUES
(1, 'Jump Rope',         'Cardio',        'Beginner',    'duration',    11.80,NULL,  '70-90', 'Full Body',                 'A cardio movement for endurance, rhythm, and calorie burn.',                    'Jump rope',           'Cardio endurance',   'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80','u3zgHI8QnqE','none'),
(2, 'High Knees',        'Cardio',        'Beginner',    'reps-cardio', NULL, 0.500,'60-80', 'Legs, Core',                'A fast-paced cardio drill that drives your knees up and spikes your heart rate.','None',                'Cardio drill',       'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80','ZZZoCNMU48U','none'),
(3, 'Burpees',           'Cardio',        'Intermediate','reps-cardio', NULL, 1.400,'80-100','Full Body',                 'Full-body cardio combining squat, jump, and plank.',                            'None',                'HIIT',               'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&q=80','dZgVxmf6jkA','none'),
(4, 'Mountain Climbers', 'Cardio',        'Beginner',    'duration',     8.00,NULL,  '60-80', 'Core, Shoulders',           'Core and cardio movement in a plank position.',                                 'None',                'Cardio + core',      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80','nmwgirgXLYM','none'),
(5, 'Jumping Jacks',     'Cardio',        'Beginner',    'reps-cardio', NULL, 0.200,'50-70', 'Full Body',                 'Classic warm-up and fat-loss cardio. No equipment needed.',                    'None',                'Warm-up cardio',     'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80','iSSAk4XCsRA','none'),
(6, 'Running in Place',  'Cardio',        'Beginner',    'duration',     8.00,NULL,  '55-75', 'Legs, Core',                'Indoor cardio that builds stamina without any equipment.',                      'None',                'Cardio',             'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80','wnJDq0dFJZU','none'),
(7, 'Cycling',           'Cardio',        'Intermediate','duration',     7.50,NULL,  '60-90', 'Legs, Glutes',              'Steady endurance and calorie burn. Low joint impact.',                          'Bike',                'Endurance cardio',   'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=600&q=80','LE4JHT3JTGE','stationary bike'),
(8, 'Treadmill Walk',    'Cardio',        'Beginner',    'duration',     3.50,NULL,  '35-50', 'Legs, Core',                'Low-impact cardio suitable for beginners and recovery.',                        'Treadmill',           'Low-impact cardio',  'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&q=80','iRQpYC9JXMU','treadmill'),
(9, 'Rowing Machine',    'Cardio',        'Intermediate','duration',     7.00,NULL,  '70-95', 'Back, Arms, Legs',          'Full-body cardio engaging back, arms, and legs simultaneously.',                'Rowing machine',      'Full-body cardio',   'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80','H0r_D6_S9lg','rowing machine'),
(10,'Stair Climber',     'Cardio',        'Intermediate','duration',     9.00,NULL,  '65-85', 'Glutes, Legs',              'High glute and leg activation per step.',                                       'Stair climber machine','Cardio',            'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80','p7p89P7bJa8','none'),
(11,'Push Up',           'Weightlifting', 'Beginner',    'bodyweight',   NULL,0.320,'50-65', 'Chest, Triceps, Shoulders', 'The most fundamental bodyweight exercise. Zero equipment.',                    'None',                'Bodyweight strength','https://images.unsplash.com/photo-1616803689943-5601631c7fec?w=600&q=80','IODxDxX7oi4','none'),
(12,'Bench Press',       'Weightlifting', 'Intermediate','weighted',     NULL,NULL,  '45-65', 'Chest, Triceps, Shoulders', 'Upper-body strength and power with a barbell.',                                 'Bench + barbell',     'Compound strength',  'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=600&q=80','vcBig73ojpE','barbell'),
(13,'Pull Up',           'Weightlifting', 'Intermediate','bodyweight',   NULL,0.450,'50-70', 'Back, Biceps',              'Compound back exercise building arms and grip strength.',                       'Pull-up bar',         'Bodyweight strength','https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&q=80','eGo4IYlbE5g','pull-up bar'),
(14,'Lat Pulldown',      'Weightlifting', 'Beginner',    'weighted',     NULL,NULL,  '40-55', 'Lats, Upper Back',          'Machine-based pulling targeting lats and upper back.',                          'Cable machine',       'Machine strength',   'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80','CAwf7n6Luuc','none'),
(15,'Squat',             'Weightlifting', 'Beginner',    'bodyweight',   NULL,0.320,'50-70', 'Quads, Glutes, Hamstrings', 'King of lower body exercises. Builds raw leg and glute strength.',             'None',                'Compound strength',  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80','aclHkVaku9U','none'),
(16,'Lunges',            'Weightlifting', 'Beginner',    'bodyweight',   NULL,0.280,'45-60', 'Quads, Glutes',             'Unilateral leg movement for balance and lower body strength.',                  'None',                'Bodyweight strength','https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?w=600&q=80','QOVaHwm-Q6U','none'),
(17,'Deadlift',          'Weightlifting', 'Advanced',    'weighted',     NULL,NULL,  '60-80', 'Hamstrings, Glutes, Back',  'Powerful compound lift targeting the posterior chain.',                         'Barbell',             'Compound strength',  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80','op9kVnSso6Q','barbell'),
(18,'Leg Press',         'Weightlifting', 'Intermediate','weighted',     NULL,NULL,  '45-60', 'Quads, Glutes',             'Machine exercise for quads and glutes.',                                        'Leg press machine',   'Machine strength',   'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80','IZxyjW7MPJQ','none'),
(19,'Shoulder Press',    'Weightlifting', 'Intermediate','weighted',     NULL,NULL,  '40-55', 'Shoulders, Triceps',        'Pressing movement for strong shoulders and triceps.',                           'Dumbbells or barbell','Compound strength',  'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=600&q=80','qEwKCR5JCog','dumbbells'),
(20,'Biceps Curl',       'Weightlifting', 'Beginner',    'weighted',     NULL,NULL,  '30-45', 'Biceps',                    'Classic arm isolation for direct biceps growth.',                               'Dumbbells or barbell','Isolation',         'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80','ykJmrZ5v0Oo','dumbbells');


-- ============================================================
-- TABLE 05b — exercise_limitations
-- ============================================================
-- Junction table: which exercises should be flagged for users
-- with specific physical limitations. Used by ExerciseDetailPage
-- to show a warning banner if the exercise conflicts with the
-- logged-in user's limitations stored in user_limitations.
-- Many-to-many: one exercise can conflict with many limitations;
-- one limitation can affect many exercises.
-- UNIQUE KEY prevents the same pair being stored twice.
-- ============================================================

CREATE TABLE IF NOT EXISTS exercise_limitations (
  id          INT          PRIMARY KEY AUTO_INCREMENT,
  exercise_id INT          NOT NULL,
  limitation  VARCHAR(100) NOT NULL,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
  UNIQUE KEY uq_ex_limitation (exercise_id, limitation)
);

-- Each row means: "this exercise is risky for users with this limitation"
INSERT INTO exercise_limitations (exercise_id, limitation) VALUES
(1,'Knee issues'),(1,'Joint pain'),
(2,'Knee issues'),(2,'Joint pain'),
(3,'Knee issues'),(3,'Shoulder injuries'),(3,'Back problems'),(3,'Joint pain'),
(4,'Shoulder injuries'),(4,'Back problems'),(4,'Knee issues'),
(5,'Knee issues'),(5,'Joint pain'),
(6,'Knee issues'),(6,'Joint pain'),
(9,'Back problems'),(9,'Shoulder injuries'),
(10,'Knee issues'),(10,'Joint pain'),
(11,'Shoulder injuries'),(12,'Shoulder injuries'),(13,'Shoulder injuries'),(14,'Shoulder injuries'),
(15,'Knee issues'),(15,'Back problems'),(15,'Joint pain'),
(16,'Knee issues'),(16,'Joint pain'),
(17,'Back problems'),
(18,'Knee issues'),(18,'Joint pain'),
(19,'Shoulder injuries');


-- ============================================================
-- TABLE 06 — exercise_muscles
-- ============================================================
-- Stores the muscles worked by each exercise.
-- muscle_type = 'primary'   → main muscles targeted
-- muscle_type = 'secondary' → supporting muscles activated
-- Displayed as two separate lists on ExerciseDetailPage.jsx.
-- Many-to-one: one exercise has many muscle rows.
-- ============================================================

CREATE TABLE IF NOT EXISTS exercise_muscles (
  id          INT         PRIMARY KEY AUTO_INCREMENT,
  exercise_id INT         NOT NULL,
  muscle_name VARCHAR(80) NOT NULL,
  muscle_type ENUM('primary','secondary') NOT NULL,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

INSERT INTO exercise_muscles (exercise_id, muscle_name, muscle_type) VALUES
(1,'Calves','primary'),(1,'Shoulders','primary'),(1,'Core','primary'),(1,'Forearms','secondary'),(1,'Quads','secondary'),
(2,'Hip Flexors','primary'),(2,'Quads','primary'),(2,'Core','primary'),(2,'Calves','secondary'),(2,'Glutes','secondary'),
(3,'Chest','primary'),(3,'Legs','primary'),(3,'Core','primary'),(3,'Shoulders','secondary'),(3,'Triceps','secondary'),
(4,'Core','primary'),(4,'Shoulders','primary'),(4,'Hip Flexors','secondary'),(4,'Chest','secondary'),
(5,'Shoulders','primary'),(5,'Quads','primary'),(5,'Calves','primary'),(5,'Core','secondary'),
(6,'Quads','primary'),(6,'Calves','primary'),(6,'Core','primary'),(6,'Hip Flexors','secondary'),
(7,'Quads','primary'),(7,'Glutes','primary'),(7,'Hamstrings','secondary'),(7,'Calves','secondary'),
(8,'Quads','primary'),(8,'Calves','primary'),(8,'Core','secondary'),(8,'Glutes','secondary'),
(9,'Back','primary'),(9,'Legs','primary'),(9,'Biceps','secondary'),(9,'Core','secondary'),
(10,'Glutes','primary'),(10,'Quads','primary'),(10,'Calves','secondary'),(10,'Hamstrings','secondary'),
(11,'Chest','primary'),(11,'Triceps','primary'),(11,'Shoulders','secondary'),(11,'Core','secondary'),
(12,'Chest','primary'),(12,'Triceps','secondary'),(12,'Front Delts','secondary'),
(13,'Lats','primary'),(13,'Biceps','primary'),(13,'Forearms','secondary'),(13,'Upper Back','secondary'),
(14,'Lats','primary'),(14,'Biceps','secondary'),(14,'Upper Back','secondary'),
(15,'Quads','primary'),(15,'Glutes','primary'),(15,'Hamstrings','secondary'),(15,'Core','secondary'),
(16,'Quads','primary'),(16,'Glutes','primary'),(16,'Hamstrings','secondary'),(16,'Core','secondary'),
(17,'Hamstrings','primary'),(17,'Glutes','primary'),(17,'Back','secondary'),(17,'Core','secondary'),(17,'Forearms','secondary'),
(18,'Quads','primary'),(18,'Glutes','primary'),(18,'Hamstrings','secondary'),
(19,'Shoulders','primary'),(19,'Triceps','secondary'),(19,'Upper Chest','secondary'),
(20,'Biceps','primary'),(20,'Forearms','secondary');


-- ============================================================
-- TABLE 07 — exercise_steps
-- ============================================================
-- Step-by-step instructions for each exercise.
-- sort_order controls display order — 1 is always the first step.
-- Shown as a numbered list on ExerciseDetailPage.jsx.
-- ============================================================

CREATE TABLE IF NOT EXISTS exercise_steps (
  id          INT          PRIMARY KEY AUTO_INCREMENT,
  exercise_id INT          NOT NULL,
  sort_order  TINYINT      NOT NULL,    -- 1, 2, 3... controls display order
  step_text   VARCHAR(300) NOT NULL,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

INSERT INTO exercise_steps (exercise_id, sort_order, step_text) VALUES
(1,1,'Hold the rope handles at hip level.'),(1,2,'Keep elbows close to your body.'),(1,3,'Rotate the rope mainly with your wrists.'),(1,4,'Jump lightly on the balls of your feet.'),
(2,1,'Stand tall with feet hip-width apart.'),(2,2,'Drive one knee up toward your chest.'),(2,3,'Switch sides quickly.'),(2,4,'Pump your arms naturally.'),
(3,1,'Squat down and place hands on the floor.'),(3,2,'Kick your feet back into a plank.'),(3,3,'Jump feet back toward your hands.'),(3,4,'Explode upward into a jump.'),
(4,1,'Start in a strong plank position.'),(4,2,'Drive one knee toward your chest.'),(4,3,'Switch legs quickly.'),(4,4,'Keep your hips low and stable.'),
(5,1,'Stand upright with feet together.'),(5,2,'Jump feet apart while lifting arms overhead.'),(5,3,'Return to the start position.'),(5,4,'Repeat in a steady rhythm.'),
(6,1,'Stand tall.'),(6,2,'Begin jogging in place.'),(6,3,'Use your arms naturally.'),(6,4,'Keep a steady rhythm.'),
(7,1,'Adjust the bike properly.'),(7,2,'Start pedaling at a steady pace.'),(7,3,'Keep your shoulders relaxed.'),(7,4,'Maintain smooth pedal strokes.'),
(8,1,'Start at a comfortable speed.'),(8,2,'Walk tall with chest up.'),(8,3,'Swing your arms naturally.'),(8,4,'Increase incline if needed.'),
(9,1,'Push first with your legs.'),(9,2,'Lean back slightly.'),(9,3,'Pull the handle to your lower ribs.'),(9,4,'Return smoothly in reverse order.'),
(10,1,'Step naturally with full foot contact.'),(10,2,'Keep your chest up.'),(10,3,'Use a controlled pace.'),(10,4,'Avoid leaning heavily on the handles.'),
(11,1,'Start in a plank position.'),(11,2,'Lower your chest under control.'),(11,3,'Keep elbows slightly angled.'),(11,4,'Press back up strongly.'),
(12,1,'Set your grip on the bar.'),(12,2,'Unrack the bar with control.'),(12,3,'Lower to the middle of your chest.'),(12,4,'Press back up smoothly.'),
(13,1,'Hang from the bar with straight arms.'),(13,2,'Pull your chest upward.'),(13,3,'Drive elbows down and back.'),(13,4,'Lower slowly under control.'),
(14,1,'Grip the bar comfortably.'),(14,2,'Pull it toward your upper chest.'),(14,3,'Drive elbows down.'),(14,4,'Return slowly to the top.'),
(15,1,'Stand with feet about shoulder-width apart.'),(15,2,'Sit hips back and down.'),(15,3,'Keep your chest up.'),(15,4,'Drive through your heels to stand.'),
(16,1,'Step forward with one leg.'),(16,2,'Lower both knees under control.'),(16,3,'Keep torso upright.'),(16,4,'Push back to the start.'),
(17,1,'Set feet under the bar.'),(17,2,'Hinge and grip the bar.'),(17,3,'Brace and push through the floor.'),(17,4,'Stand tall, then lower with control.'),
(18,1,'Place feet on the platform.'),(18,2,'Lower the weight under control.'),(18,3,'Keep knees aligned.'),(18,4,'Press back up smoothly.'),
(19,1,'Bring weights to shoulder height.'),(19,2,'Brace your core.'),(19,3,'Press overhead.'),(19,4,'Lower with control.'),
(20,1,'Stand tall with weights at your sides.'),(20,2,'Keep elbows tucked near your body.'),(20,3,'Curl the weight upward.'),(20,4,'Lower slowly under control.');


-- ============================================================
-- TABLE 08 — exercise_tips_mistakes
-- ============================================================
-- Coaching tips and common mistakes per exercise.
-- entry_type = 'tip'     → good coaching cue shown in Tips section
-- entry_type = 'mistake' → common error shown in Mistakes section
-- sort_order controls display order within each entry_type.
-- Both lists are shown side by side on ExerciseDetailPage.jsx.
-- ============================================================

CREATE TABLE IF NOT EXISTS exercise_tips_mistakes (
  id          INT          PRIMARY KEY AUTO_INCREMENT,
  exercise_id INT          NOT NULL,
  entry_type  ENUM('tip','mistake') NOT NULL,
  sort_order  TINYINT      NOT NULL,    -- order within tips OR within mistakes
  entry_text  VARCHAR(200) NOT NULL,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

INSERT INTO exercise_tips_mistakes (exercise_id, entry_type, sort_order, entry_text) VALUES
(1,'tip',1,'Keep jumps low.'),(1,'tip',2,'Relax your shoulders.'),(1,'tip',3,'Stay light on your feet.'),
(1,'mistake',1,'Jumping too high.'),(1,'mistake',2,'Landing heavily.'),(1,'mistake',3,'Using the whole arm to swing.'),
(2,'tip',1,'Stay upright.'),(2,'tip',2,'Keep your core tight.'),(2,'tip',3,'Move fast but controlled.'),
(2,'mistake',1,'Leaning back.'),(2,'mistake',2,'Low knee drive.'),(2,'mistake',3,'Slow pace.'),
(3,'tip',1,'Keep the core tight.'),(3,'tip',2,'Land softly.'),(3,'tip',3,'Maintain a steady rhythm.'),
(3,'mistake',1,'Rounded back.'),(3,'mistake',2,'Collapsing on landing.'),(3,'mistake',3,'Rushing too fast.'),
(4,'tip',1,'Brace your core.'),(4,'tip',2,'Keep shoulders over wrists.'),(4,'tip',3,'Move with control.'),
(4,'mistake',1,'Hips too high.'),(4,'mistake',2,'Sagging lower back.'),(4,'mistake',3,'Short range of motion.'),
(5,'tip',1,'Stay relaxed.'),(5,'tip',2,'Keep timing smooth.'),(5,'tip',3,'Land softly.'),
(5,'mistake',1,'Heavy landing.'),(5,'mistake',2,'Stiff movement.'),(5,'mistake',3,'Poor arm timing.'),
(6,'tip',1,'Stay light on your feet.'),(6,'tip',2,'Keep chest up.'),(6,'tip',3,'Breathe evenly.'),
(6,'mistake',1,'Heavy stomping.'),(6,'mistake',2,'Poor posture.'),(6,'mistake',3,'Too little effort.'),
(7,'tip',1,'Use full pedal strokes.'),(7,'tip',2,'Keep posture stable.'),(7,'tip',3,'Control the pace.'),
(7,'mistake',1,'Seat too low.'),(7,'mistake',2,'Rounded back.'),(7,'mistake',3,'Uneven pedaling.'),
(8,'tip',1,'Do not hold the rails too much.'),(8,'tip',2,'Use natural steps.'),(8,'tip',3,'Stay upright.'),
(8,'mistake',1,'Leaning forward.'),(8,'mistake',2,'Holding rails constantly.'),(8,'mistake',3,'Overstriding.'),
(9,'tip',1,'Use legs first.'),(9,'tip',2,'Keep your back neutral.'),(9,'tip',3,'Control the recovery phase.'),
(9,'mistake',1,'Pulling too early with arms.'),(9,'mistake',2,'Rounded back.'),(9,'mistake',3,'Rushing the return.'),
(10,'tip',1,'Push through the full step.'),(10,'tip',2,'Stay upright.'),(10,'tip',3,'Keep a steady pace.'),
(10,'mistake',1,'Leaning on handles.'),(10,'mistake',2,'Taking tiny steps.'),(10,'mistake',3,'Going too fast.'),
(11,'tip',1,'Keep body in one line.'),(11,'tip',2,'Brace your core.'),(11,'tip',3,'Control every rep.'),
(11,'mistake',1,'Sagging hips.'),(11,'mistake',2,'Elbows too wide.'),(11,'mistake',3,'Partial reps.'),
(12,'tip',1,'Plant feet firmly.'),(12,'tip',2,'Retract shoulders.'),(12,'tip',3,'Control the lowering phase.'),
(12,'mistake',1,'Bouncing the bar.'),(12,'mistake',2,'Bent wrists.'),(12,'mistake',3,'Elbows too wide.'),
(13,'tip',1,'Start from a dead hang.'),(13,'tip',2,'Avoid swinging.'),(13,'tip',3,'Control the negative.'),
(13,'mistake',1,'Half reps.'),(13,'mistake',2,'Kipping by mistake.'),(13,'mistake',3,'Shrugging shoulders.'),
(14,'tip',1,'Keep chest lifted.'),(14,'tip',2,'Use full range.'),(14,'tip',3,'Do not yank the weight.'),
(14,'mistake',1,'Leaning too far back.'),(14,'mistake',2,'Using momentum.'),(14,'mistake',3,'Short reps.'),
(15,'tip',1,'Brace your core.'),(15,'tip',2,'Keep knees over toes.'),(15,'tip',3,'Use full range as able.'),
(15,'mistake',1,'Knees collapsing inward.'),(15,'mistake',2,'Heels lifting.'),(15,'mistake',3,'Rounded back.'),
(16,'tip',1,'Use controlled steps.'),(16,'tip',2,'Stay balanced.'),(16,'tip',3,'Keep front foot planted.'),
(16,'mistake',1,'Leaning too far forward.'),(16,'mistake',2,'Front heel lifting.'),(16,'mistake',3,'Knee collapsing inward.'),
(17,'tip',1,'Keep the bar close.'),(17,'tip',2,'Brace hard.'),(17,'tip',3,'Hinge from the hips.'),
(17,'mistake',1,'Rounded back.'),(17,'mistake',2,'Bar drifting forward.'),(17,'mistake',3,'Jerking from the floor.'),
(18,'tip',1,'Keep lower back stable.'),(18,'tip',2,'Control the full rep.'),(18,'tip',3,'Avoid snapping knees straight.'),
(18,'mistake',1,'Knees collapsing inward.'),(18,'mistake',2,'Too short range.'),(18,'mistake',3,'Lifting hips off seat.'),
(19,'tip',1,'Keep ribs down.'),(19,'tip',2,'Use full range.'),(19,'tip',3,'Control the descent.'),
(19,'mistake',1,'Overarching lower back.'),(19,'mistake',2,'Uneven lockout.'),(19,'mistake',3,'Pressing too far forward.'),
(20,'tip',1,'Do not swing.'),(20,'tip',2,'Squeeze at the top.'),(20,'tip',3,'Control the negative.'),
(20,'mistake',1,'Using momentum.'),(20,'mistake',2,'Elbows drifting.'),(20,'mistake',3,'Partial reps.');


-- ============================================================
-- TABLE 09 — exercise_variations
-- ============================================================
-- Easier and harder variants of each exercise.
-- sort_order goes from easiest (1) to hardest (3).
-- Shown as a progression list on ExerciseDetailPage.jsx.
-- ============================================================

CREATE TABLE IF NOT EXISTS exercise_variations (
  id          INT          PRIMARY KEY AUTO_INCREMENT,
  exercise_id INT          NOT NULL,
  sort_order  TINYINT      NOT NULL,    -- 1 = easiest variant, 3 = hardest
  variation   VARCHAR(100) NOT NULL,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

INSERT INTO exercise_variations (exercise_id, sort_order, variation) VALUES
(1,1,'Single unders'),(1,2,'Alternate foot jumps'),(1,3,'Double unders'),
(2,1,'Slow high knees'),(2,2,'Sprint high knees'),(2,3,'Band-resisted high knees'),
(3,1,'Half burpee'),(3,2,'Push-up burpee'),(3,3,'Tuck jump burpee'),
(4,1,'Slow climbers'),(4,2,'Cross-body climbers'),(4,3,'Slider climbers'),
(5,1,'Half jacks'),(5,2,'Power jacks'),(5,3,'Seal jacks'),
(6,1,'Jog in place'),(6,2,'Fast run'),(6,3,'High-knee run'),
(7,1,'Steady cycling'),(7,2,'Intervals'),(7,3,'Hill simulation'),
(8,1,'Flat walk'),(8,2,'Incline walk'),(8,3,'Interval walk'),
(9,1,'Steady rowing'),(9,2,'Sprint intervals'),(9,3,'Power strokes'),
(10,1,'Steady climb'),(10,2,'Intervals'),(10,3,'Two-step climb'),
(11,1,'Knee push-up'),(11,2,'Standard push-up'),(11,3,'Decline push-up'),
(12,1,'Dumbbell bench press'),(12,2,'Incline bench press'),(12,3,'Close-grip bench press'),
(13,1,'Band-assisted pull-up'),(13,2,'Standard pull-up'),(13,3,'Weighted pull-up'),
(14,1,'Wide grip'),(14,2,'Close grip'),(14,3,'Single-arm pulldown'),
(15,1,'Bodyweight squat'),(15,2,'Goblet squat'),(15,3,'Back squat'),
(16,1,'Forward lunge'),(16,2,'Reverse lunge'),(16,3,'Walking lunge'),
(17,1,'Romanian deadlift'),(17,2,'Conventional deadlift'),(17,3,'Trap bar deadlift'),
(18,1,'Narrow stance'),(18,2,'Wide stance'),(18,3,'Single-leg press'),
(19,1,'Seated dumbbell press'),(19,2,'Standing press'),(19,3,'Arnold press'),
(20,1,'Alternating curl'),(20,2,'Hammer curl'),(20,3,'Preacher curl');


-- ============================================================
-- TABLE 10 — ingredients
-- ============================================================
-- 51 food ingredients with macros per 100 g.
-- IDs are fixed and match the Phase 1 INGREDIENTS array.
-- Used by DietProgram.jsx, MealLog.jsx, and IngredientDetail.jsx.
-- category groups ingredients for filtering in the diet pages.
-- ============================================================

CREATE TABLE IF NOT EXISTS ingredients (
  id       INT          PRIMARY KEY,    -- fixed IDs match Phase 1 mockData
  name     VARCHAR(100) NOT NULL,
  category ENUM('protein','carbs','vegetable','fat','dairy') NOT NULL,
  kcal     SMALLINT UNSIGNED NOT NULL,  -- calories per 100 g
  protein  DECIMAL(5,2)     NOT NULL,  -- grams per 100 g
  carbs    DECIMAL(5,2)     NOT NULL,
  fat      DECIMAL(5,2)     NOT NULL
);

INSERT INTO ingredients VALUES
(1,'Chicken Breast','protein',165,31.00,0.00,3.60),(2,'Salmon Fillet','protein',208,20.00,0.00,13.00),
(3,'Tuna (canned)','protein',116,26.00,0.00,1.00),(4,'Eggs (whole)','protein',155,13.00,1.10,11.00),
(5,'Egg Whites','protein',52,11.00,0.70,0.20),(6,'Turkey Breast','protein',135,30.00,0.00,1.00),
(7,'Beef Steak (lean)','protein',217,26.00,0.00,12.00),(8,'Tilapia','protein',128,26.00,0.00,2.70),
(9,'Kafta (beef & lamb)','protein',260,18.00,4.00,19.00),(10,'Shish Tawook','protein',185,28.00,3.00,7.00),
(11,'Grilled Samke (Fish)','protein',140,26.00,0.00,4.00),(12,'Shawarma Chicken','protein',220,24.00,6.00,11.00),
(13,'White Rice (cooked)','carbs',130,2.70,28.00,0.30),(14,'Brown Rice (cooked)','carbs',123,2.70,26.00,1.00),
(15,'Oats (dry)','carbs',389,17.00,66.00,7.00),(16,'Sweet Potato','carbs',86,1.60,20.00,0.10),
(17,'Pita Bread','carbs',275,9.00,55.00,1.20),(18,'Markouk (Saj Bread)','carbs',230,7.00,48.00,0.80),
(19,'Bulgur Wheat','carbs',342,12.00,76.00,1.30),(20,'Lentils (cooked)','carbs',116,9.00,20.00,0.40),
(21,'Freekeh (cooked)','carbs',130,5.00,24.00,0.50),(22,'Banana','carbs',89,1.10,23.00,0.30),
(23,'Apple','carbs',52,0.30,14.00,0.20),(24,'Broccoli','vegetable',34,2.80,7.00,0.40),
(25,'Spinach','vegetable',23,2.90,3.60,0.40),(26,'Tomato','vegetable',18,0.90,3.90,0.20),
(27,'Cucumber','vegetable',15,0.70,3.60,0.10),(28,'Parsley','vegetable',36,3.00,6.00,0.80),
(29,'Mint','vegetable',70,3.80,15.00,0.90),(30,'Onion','vegetable',40,1.10,9.00,0.10),
(31,'Bell Pepper','vegetable',31,1.00,6.00,0.30),(32,'Eggplant (Batinjan)','vegetable',25,1.00,6.00,0.20),
(33,'Avocado','fat',160,2.00,9.00,15.00),(34,'Olive Oil','fat',884,0.00,0.00,100.00),
(35,'Mixed Nuts','fat',607,20.00,21.00,54.00),(36,'Almonds','fat',579,21.00,22.00,50.00),
(37,'Tahini','fat',595,17.00,21.00,54.00),(38,'Pine Nuts','fat',673,14.00,13.00,68.00),
(39,'Walnuts','fat',654,15.00,14.00,65.00),(40,'Greek Yogurt','dairy',97,9.00,3.60,5.00),
(41,'Labneh','dairy',170,10.00,4.00,13.00),(42,'Akkawi Cheese','dairy',260,20.00,1.00,19.00),
(43,'Halloumi','dairy',321,22.00,1.00,25.00),(44,'Milk (whole)','dairy',61,3.20,4.80,3.30),
(45,'Cottage Cheese','dairy',98,11.00,3.40,4.30),(46,'Hummus (homemade)','fat',177,8.00,20.00,8.00),
(47,'Moutabal','fat',88,3.00,9.00,5.00),(48,'Fattoush Salad','vegetable',80,2.00,12.00,3.00),
(49,'Tabbouleh','vegetable',90,3.00,14.00,3.50),(50,'Zaatar Mix','fat',310,10.00,42.00,12.00),
(51,'Protein Shake Powder','protein',380,80.00,7.00,4.00);


-- ============================================================
-- TABLE 11 — meal_pool
-- ============================================================
-- 16 pre-built meals shown in DietProgram.jsx.
-- profile column drives the GET /api/meals/recommended logic:
--   the API picks the meal whose profile best matches the user goal:
--     lose        → low_cal
--     gain_muscle → high_protein
--     gain        → high_carb
--     maintain    → balanced
-- ============================================================

CREATE TABLE IF NOT EXISTS meal_pool (
  id        VARCHAR(3)   PRIMARY KEY,   -- e.g. 'B1', 'L2', 'D3', 'S4'
  category  ENUM('breakfast','lunch','dinner','snack') NOT NULL,
  name      VARCHAR(100) NOT NULL,
  meal_time TIME         NOT NULL,      -- suggested serving time
  kcal      SMALLINT     NOT NULL,
  protein   TINYINT      NOT NULL,      -- grams
  carbs     TINYINT      NOT NULL,
  fat       TINYINT      NOT NULL,
  -- profile is matched against user goal in GET /api/meals/recommended
  profile   ENUM('balanced','high_protein','low_cal','high_carb','high_fat')
            NOT NULL DEFAULT 'balanced'
);

INSERT INTO meal_pool VALUES
('B1','breakfast','Oats & Protein Shake',     '07:30',520,42,62, 8,'high_protein'),
('B2','breakfast','Scrambled Eggs on Toast',  '07:30',380,28,30,14,'balanced'),
('B3','breakfast','Egg White Omelette',       '07:00',220,32, 8, 6,'low_cal'),
('B4','breakfast','Manakish Zaatar',          '08:00',420,12,56,16,'high_carb'),
('B5','breakfast','Eggs, Avocado & Labneh',   '08:00',540,34, 6,42,'high_fat'),
('L1','lunch',   'Grilled Chicken Rice Bowl','13:00',620,48,68,12,'high_protein'),
('L2','lunch',   'Chicken Tawook Salad',     '12:30',360,44,14,12,'low_cal'),
('L3','lunch',   'Mjaddara & Fattoush',      '13:00',480,18,72,10,'high_carb'),
('L4','lunch',   'Caesar Salad with Steak',  '13:00',580,50, 8,40,'high_protein'),
('D1','dinner',  'Grilled Kafta & Rice',     '19:00',580,38,52,20,'balanced'),
('D2','dinner',  'Samkeh Harra (Spicy Fish)','19:00',340,46,12,11,'low_cal'),
('D3','dinner',  'Butter-Basted Salmon',     '19:00',520,44, 4,36,'high_protein'),
('S1','snack',   'Greek Yogurt & Fruit',     '15:30',220,18,26, 4,'balanced'),
('S2','snack',   'Cottage Cheese & Apple',   '21:00',180,14,16, 5,'low_cal'),
('S3','snack',   'Protein Shake',            '21:00',160,28, 8, 3,'high_protein'),
('S4','snack',   'Mixed Nuts & Banana',      '16:00',310, 8,34,16,'high_carb');


-- ============================================================
-- TABLE 12 — meal_pool_ingredients
-- ============================================================
-- Ingredient breakdown for each pre-built meal.
-- portion_g = how many grams of that ingredient appear in the meal.
-- label     = display name shown on the meal detail card.
-- Used by GET /api/meals/pool/:id to return the full ingredient list.
-- ============================================================

CREATE TABLE IF NOT EXISTS meal_pool_ingredients (
  id            INT         PRIMARY KEY AUTO_INCREMENT,
  meal_id       VARCHAR(3)  NOT NULL,
  ingredient_id INT         NOT NULL,
  portion_g     SMALLINT    NOT NULL,   -- grams used in this meal
  label         VARCHAR(80) NOT NULL,   -- display label e.g. 'Chicken Breast'
  FOREIGN KEY (meal_id)       REFERENCES meal_pool(id)   ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

INSERT INTO meal_pool_ingredients (meal_id, ingredient_id, portion_g, label) VALUES
('B1',15, 80,'Oats (dry)'),          ('B1',51,30,'Protein Shake Powder'),('B1',44,250,'Milk (whole)'),
('B2', 4,200,'Eggs (whole)'),         ('B2',17,80,'Pita Bread'),          ('B2',34,10,'Olive Oil'),   ('B2',25,40,'Spinach'),
('B3', 5,250,'Egg Whites'),           ('B3',31,60,'Bell Pepper'),         ('B3',25,40,'Spinach'),     ('B3',34, 5,'Olive Oil'),
('B4',17,100,'Pita Bread'),           ('B4',50,30,'Zaatar Mix'),          ('B4',34,15,'Olive Oil'),
('B5', 4,180,'Eggs (whole)'),         ('B5',33,100,'Avocado'),            ('B5',41,60,'Labneh'),
('L1', 1,200,'Chicken Breast'),       ('L1',13,200,'White Rice (cooked)'),('L1',24,80,'Broccoli'),    ('L1',34,10,'Olive Oil'),
('L2',10,180,'Shish Tawook'),         ('L2',48,120,'Fattoush Salad'),     ('L2',27,80,'Cucumber'),
('L3',20,200,'Lentils (cooked)'),     ('L3',13,150,'White Rice (cooked)'),('L3',48,100,'Fattoush Salad'),('L3',34,10,'Olive Oil'),
('L4', 7,220,'Beef Steak (lean)'),    ('L4',25,100,'Spinach'),            ('L4',37,30,'Tahini'),      ('L4',34,15,'Olive Oil'),
('D1', 9,180,'Kafta (beef & lamb)'),  ('D1',13,200,'White Rice (cooked)'),('D1',26,60,'Tomato'),      ('D1',30,40,'Onion'),
('D2',11,220,'Grilled Samke (Fish)'), ('D2',26, 80,'Tomato'),             ('D2',30,50,'Onion'),       ('D2',34,12,'Olive Oil'),
('D3', 2,250,'Salmon Fillet'),        ('D3',25, 80,'Spinach'),            ('D3',34,20,'Olive Oil'),
('S1',40,200,'Greek Yogurt'),         ('S1',22,100,'Banana'),
('S2',45,150,'Cottage Cheese'),       ('S2',23,100,'Apple'),
('S3',51, 35,'Protein Shake Powder'), ('S3',44,200,'Milk (whole)'),
('S4',35, 40,'Mixed Nuts'),           ('S4',22,120,'Banana');


-- ============================================================
-- TABLE 13 — calendar_entries
-- ============================================================
-- Every meal and workout ever logged by any user.
-- This replaces the calendarData shared state from Phase 1 App.jsx.
--
-- Meal rows  (entry_type = 'meal'):
--   Fill: name, meal_category, kcal, protein, carbs, fat
--   Leave NULL: exercise columns (sets, reps, weight_kg, etc.)
--
-- Workout rows  (entry_type = 'workout'):
--   Fill: name, exercise_id (optional), calories_burned
--         and whichever of sets/reps/weight_kg/duration_sec/
--         distance_km/rest_sec the user entered
--   Leave NULL: meal_category, kcal, protein, carbs, fat
--
-- Trigger trg_update_last_active fires after every INSERT here
-- and updates users.last_active automatically.
--
-- Trigger trg_log_deleted_entry fires after every DELETE here
-- and writes an audit record to deleted_entries_log automatically.
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_entries (
  id              INT     PRIMARY KEY AUTO_INCREMENT,

  -- Owner of this entry — FK to users
  user_id         INT     NOT NULL,

  -- Date only (no time) — matches the YYYY-MM-DD key in calendarData
  entry_date      DATE    NOT NULL,

  -- Determines which set of columns is meaningful for this row
  entry_type      ENUM('meal','workout') NOT NULL,

  -- Display name — always required for both meals and workouts
  name            VARCHAR(100) NOT NULL,

  -- ── Meal-only columns ──────────────────────────────────────
  meal_category   ENUM('breakfast','lunch','dinner','snack') NULL,
  kcal            SMALLINT     NULL,
  protein         DECIMAL(5,2) NULL,   -- grams
  carbs           DECIMAL(5,2) NULL,
  fat             DECIMAL(5,2) NULL,

  -- ── Workout-only columns ───────────────────────────────────
  exercise_id     INT          NULL,   -- optional link to exercises table
  sets            TINYINT      NULL,
  reps            TINYINT      NULL,
  weight_kg       DECIMAL(5,2) NULL,
  duration_sec    SMALLINT     NULL,   -- seconds per set, or total duration
  distance_km     DECIMAL(6,2) NULL,
  rest_sec        SMALLINT     NULL,
  calories_burned SMALLINT     NULL,

  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Deleting a user removes all their calendar entries
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  -- Deleting an exercise sets exercise_id to NULL (keeps the log row)
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL
);

-- ============================================================
-- Activity state used by HomePage and LogWorkoutPage
-- ============================================================

CREATE TABLE IF NOT EXISTS user_daily_metrics (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  user_id      INT NOT NULL,
  metric_date  DATE NOT NULL,
  water_intake DECIMAL(5,2) NOT NULL DEFAULT 0,
  steps_taken  INT UNSIGNED NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_metric_date (user_id, metric_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_plan_progress (
  user_id        INT PRIMARY KEY,
  days_completed INT UNSIGNED NOT NULL DEFAULT 0,
  total_days     INT UNSIGNED NOT NULL DEFAULT 7,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workout_log_entries (
  id                 INT PRIMARY KEY AUTO_INCREMENT,
  user_id            INT NOT NULL,
  entry_date         DATE NOT NULL,
  exercise_id        INT NULL,
  name               VARCHAR(100) NOT NULL,
  category           VARCHAR(50) NOT NULL DEFAULT 'Workout',
  log_type           VARCHAR(30) NOT NULL DEFAULT 'bodyweight',
  calories_burned    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  sets               SMALLINT UNSIGNED NULL,
  reps               SMALLINT UNSIGNED NULL,
  weight_kg          DECIMAL(6,2) NULL,
  duration_sec       SMALLINT UNSIGNED NULL,
  distance_km        DECIMAL(6,2) NULL,
  rest_sec           SMALLINT UNSIGNED NULL,
  notes              TEXT NULL,
  workout_timestamp  DATETIME NULL,
  synced_to_calendar BOOLEAN NOT NULL DEFAULT FALSE,
  calendar_entry_id  INT NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_workout_log_user_date (user_id, entry_date),
  INDEX idx_workout_log_calendar_entry (calendar_entry_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL,
  FOREIGN KEY (calendar_entry_id) REFERENCES calendar_entries(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- Seed: Omar (user 3) — fixed dates so demo data is always visible.
-- Using fixed dates (not DATE_SUB) ensures the data does not shift
-- when the database is re-imported on a different day.
-- ─────────────────────────────────────────────────────────────
INSERT INTO calendar_entries
  (user_id, entry_date, entry_type, name, meal_category, kcal, protein, carbs, fat)
VALUES
  -- Day 1
  (3,'2026-04-14','meal','Oats & Shake',    'breakfast',520,42,62, 8),
  (3,'2026-04-14','meal','Chicken Bowl',    'lunch',    620,48,68,12),
  (3,'2026-04-14','meal','Grilled Kafta',   'dinner',   580,38,52,20),
  -- Day 2
  (3,'2026-04-15','meal','Scrambled Eggs',  'breakfast',380,28,30,14),
  (3,'2026-04-15','meal','Tawook Salad',    'lunch',    360,44,14,12),
  (3,'2026-04-15','meal','Protein Shake',   'snack',    160,28, 8, 3),
  -- Day 3
  (3,'2026-04-16','meal','Oats & Shake',    'breakfast',520,42,62, 8),
  (3,'2026-04-16','meal','Mjaddara',        'lunch',    480,18,72,10),
  (3,'2026-04-16','meal','Samkeh Harra',    'dinner',   340,46,12,11),
  (3,'2026-04-16','meal','Greek Yogurt',    'snack',    220,18,26, 4);


-- ============================================================
-- TABLE 14 — saved_meals
-- ============================================================
-- Custom meals created by users in the My Meals tab of MealLog.
-- Each row belongs to exactly one user (user_id FK).
--
-- This table satisfies the Phase 2 requirement for a PUT/UPDATE
-- route on a user-owned resource:
--   PUT /api/meals/saved/:id  →  UPDATE saved_meals SET ...
--
-- updated_at is refreshed automatically by MySQL on every UPDATE.
-- ON DELETE CASCADE removes a user's saved meals when they are deleted.
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_meals (
  id         INT          PRIMARY KEY AUTO_INCREMENT,
  user_id    INT          NOT NULL,
  name       VARCHAR(100) NOT NULL,
  kcal       INT          NOT NULL,
  protein    INT          NOT NULL,   -- grams
  carbs      INT          NOT NULL,
  fat        INT          NOT NULL,
  category   VARCHAR(20)  NOT NULL DEFAULT 'lunch',  -- 'breakfast', 'lunch', etc.
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  -- Refreshes automatically when the row is edited (PUT /api/meals/saved/:id)
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed: three saved meals for Omar so the My Meals tab has demo data
INSERT INTO saved_meals (user_id, name, kcal, protein, carbs, fat, category) VALUES
  (3, 'My Protein Bowl',    620, 48, 68, 12, 'lunch'),
  (3, 'Morning Oats Stack', 520, 42, 62,  8, 'breakfast'),
  (3, 'Post-Workout Shake', 160, 28,  8,  3, 'snack');


-- ============================================================
-- TABLE 15 — deleted_entries_log
-- ============================================================
-- Audit log that records every calendar entry that gets deleted.
-- This table is NEVER written to manually by the API.
-- It is populated automatically by trigger trg_log_deleted_entry
-- which fires AFTER DELETE on calendar_entries.
-- Useful for debugging and showing deleted history.
-- ============================================================

CREATE TABLE IF NOT EXISTS deleted_entries_log (
  id          INT          PRIMARY KEY AUTO_INCREMENT,
  original_id INT          NOT NULL,    -- the id from calendar_entries before deletion
  user_id     INT          NOT NULL,    -- which user owned the deleted entry
  entry_type  VARCHAR(20)  NOT NULL,    -- 'meal' or 'workout'
  name        VARCHAR(100) NOT NULL,    -- name of the deleted entry
  entry_date  DATE         NOT NULL,    -- date the entry was originally logged
  deleted_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP   -- when it was deleted
);


-- ============================================================
-- PART C — VIEWS  (4 views)
-- ============================================================
-- Views are saved SELECT queries stored inside MySQL.
-- The API queries views instead of writing complex JOINs or
-- GROUP BY clauses in every route handler.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- VIEW 1 — v_exercises
-- ────────────────────────────────────────────────────────────
-- Flat view of all exercise columns.
-- Used by: GET /api/exercises  (returns all 20 exercises)
-- Usage  : SELECT * FROM v_exercises
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_exercises AS
SELECT
  id, name, category, difficulty, log_type,
  met_value, kcal_per_rep, kcal_range, muscles,
  description, equipment_name, exercise_type,
  image_url, video_id, required_equipment
FROM exercises;


-- ────────────────────────────────────────────────────────────
-- VIEW 2 — v_daily_totals
-- ────────────────────────────────────────────────────────────
-- Pre-calculates nutrition and workout totals per user per day.
-- The API queries this view instead of summing values in JavaScript.
-- Used by: GET /api/calendar/today  → HomePage stats bar
--          GET /api/calendar/today  → UserProgress daily rings
-- Usage  : SELECT * FROM v_daily_totals
--            WHERE user_id = ? AND entry_date = ?
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_daily_totals AS
SELECT
  user_id,
  entry_date,
  -- Sum kcal only from meal rows (workouts have kcal = NULL)
  SUM(CASE WHEN entry_type = 'meal'    THEN kcal            ELSE 0 END) AS kcal_eaten,
  SUM(CASE WHEN entry_type = 'meal'    THEN protein         ELSE 0 END) AS protein_eaten,
  SUM(CASE WHEN entry_type = 'meal'    THEN carbs           ELSE 0 END) AS carbs_eaten,
  SUM(CASE WHEN entry_type = 'meal'    THEN fat             ELSE 0 END) AS fat_eaten,
  -- Sum calories_burned only from workout rows
  SUM(CASE WHEN entry_type = 'workout' THEN calories_burned ELSE 0 END) AS kcal_burned,
  -- Count of distinct workout entries logged this day
  COUNT(CASE WHEN entry_type = 'workout' THEN 1 END)                    AS workouts_done
FROM calendar_entries
GROUP BY user_id, entry_date;


-- ────────────────────────────────────────────────────────────
-- VIEW 3 — v_weekly_summary
-- ────────────────────────────────────────────────────────────
-- Rolls up the last 7 days of activity per user.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_weekly_summary AS
SELECT
  user_id,
  SUM(CASE WHEN entry_type = 'meal'    THEN kcal            ELSE 0 END) AS total_kcal_eaten,
  SUM(CASE WHEN entry_type = 'workout' THEN calories_burned ELSE 0 END) AS total_kcal_burned,
  -- Total workout sessions in the last 7 days
  COUNT(CASE WHEN entry_type = 'workout' THEN 1 END)                    AS total_workouts,
  -- How many distinct days had at least one log entry
  COUNT(DISTINCT entry_date)                                            AS active_days
FROM calendar_entries
-- Only the rolling last 7 days — recalculates fresh every query
WHERE entry_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY user_id;


-- ────────────────────────────────────────────────────────────
-- VIEW 4 — v_user_profile
-- ────────────────────────────────────────────────────────────
-- Returns the full user row including last_active and all
-- Phase 2 workout preference columns.
-- Used by: GET /api/users/me → currentUser in App.jsx
-- Usage  : SELECT * FROM v_user_profile WHERE id = ?
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_user_profile AS
SELECT
  id, name, email, gender, age,
  current_weight, target_weight, height,
  activity_level, goal, fitness_level,
  duration_months, is_ongoing, last_active,
  -- Phase 2 workout preference columns included here
  workout_duration, workout_types, workout_location, workout_time,
  created_at
FROM users;


-- ============================================================
-- PART D — TRIGGERS  (3 triggers)
-- ============================================================
-- Triggers are functions that run automatically inside MySQL
-- when a specific event (INSERT, DELETE) occurs on a table.
-- The API routes do NOT need any extra code — triggers fire
-- on their own whenever the matching SQL event happens.
-- ============================================================

DELIMITER $$

-- ────────────────────────────────────────────────────────────
-- TRIGGER 1 — trg_set_ongoing_on_insert
-- ────────────────────────────────────────────────────────────
-- Fires  : BEFORE INSERT on users
-- Purpose: Automatically sets is_ongoing based on duration_months.
--   duration_months IS NULL  → open-ended plan → is_ongoing = TRUE
--   duration_months has value → fixed plan     → is_ongoing = FALSE
-- Why BEFORE INSERT: the value must be set before the row is written.
-- The API register route sends duration_months (or null) and does
-- NOT calculate or send is_ongoing — MySQL handles it here.
-- ────────────────────────────────────────────────────────────
CREATE TRIGGER trg_set_ongoing_on_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.duration_months IS NULL THEN
    SET NEW.is_ongoing = TRUE;   -- no end date → open-ended plan
  ELSE
    SET NEW.is_ongoing = FALSE;  -- fixed duration → not ongoing
  END IF;
END$$
-- END OF FILE
-- ============================================================
