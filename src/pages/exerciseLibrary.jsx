/**
 * ExerciseLibrary.jsx
 * -------------------
 * This is the List View page of the FitTrack application.
 * It is one of the two pages I (Jawad) am responsible for.
 *
 * What this page does:
 *  - Reads the user's profile from the shared App.jsx state (passed as props)
 *  - Generates a personalised 14-day workout plan based on the user's fitness
 *    level, weight goal, equipment, and activity level from the survey
 *  - Lets the user tick exercises as done on today's plan day only
 *  - Shows a calendar that displays both meals (from Sara's diet page) and
 *    completed exercises, using the shared calendarData from App.jsx
 *  - Displays a searchable, filterable grid of all exercises
 *  - Shows a Plan Complete modal on Day 14 with level progression logic
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  getUserProfile,
  workoutLog,
  EXERCISES,
  getCardioRatio,
  isRiskyForUser,
} from "../data/mockData";

// ─── Exercise data ────────────────────────────────────────────────────────────
// I reference the shared EXERCISES array from mockData so both this page
// and the detail page always show the same data.
const exercises = EXERCISES;

// ─── Colour helpers ───────────────────────────────────────────────────────────

/**
 * Returns a colour for the exercise category dot.
 * Cardio gets pink, Weightlifting gets lime green.
 */
function getCatColor(category) {
  return category === "Cardio" ? "#FF2A5E" : "#C6F135";
}

/**
 * Returns a colour for the difficulty badge.
 * Beginner → lime, Intermediate → amber, Advanced → pink, Athlete → purple.
 */
function getDiffColor(difficulty) {
  if (difficulty === "Beginner") return "#C6F135";
  if (difficulty === "Intermediate") return "#FFAA00";
  if (difficulty === "Advanced") return "#FF2A5E";
  return "#A855F7";
}

// ─── Equipment requirement map ────────────────────────────────────────────────
/**
 * Maps each exercise ID to the equipment it requires.
 * "none" means the exercise is bodyweight — available to every user.
 * This is used both to build the plan and to filter the ALL EXERCISES grid.
 */
const EXERCISE_EQUIPMENT_MAP = {
  1: "none", // Jump Rope
  2: "none", // High Knees
  3: "none", // Burpees
  4: "none", // Mountain Climbers
  5: "none", // Jumping Jacks
  6: "none", // Running in Place
  7: "stationary bike", // Cycling
  8: "treadmill", // Treadmill Walk
  9: "rowing machine", // Rowing Machine
  10: "none", // Stair Climber
  11: "none", // Push Up
  12: "barbell", // Bench Press
  13: "pull-up bar", // Pull Up
  14: "pull-up bar", // Pull Up
  15: "none", // Squat
  16: "none", // Lunges
  17: "barbell", // Deadlift
  18: "none", // Leg Press (machine — treated as none)
  19: "dumbbells", // Shoulder Press
  20: "dumbbells", // Biceps Curl
};

function normaliseEquipment(equipList) {
  if (!equipList || equipList.length === 0) return ["none"];
  return equipList.map((item) => item.toLowerCase().trim());
}

/**
 * Returns true when the user has the required equipment for the exercise.
 * Bodyweight exercises ("none") are always allowed regardless of equipment.
 */
function userHasEquipmentForExercise(exerciseId, userEquipment) {
  const needed = EXERCISE_EQUIPMENT_MAP[exerciseId] || "none";
  if (needed === "none") return true;
  const normalised = normaliseEquipment(userEquipment);
  if (normalised.length === 1 && normalised[0] === "none") return false;
  return normalised.includes(needed);
}

// ─── Activity level adjustment ────────────────────────────────────────────────
/**
 * Adjusts the effective exercise difficulty based on the user's daily
 * activity level from the survey.
 */
function getEffectiveLevel(fitnessLevel, activityLevel) {
  const level = (fitnessLevel || "beginner").toLowerCase();
  const activity = (activityLevel || "").toLowerCase();

  if (activity === "very_active") {
    if (level === "beginner") return "intermediate";
    if (level === "intermediate") return "advanced";
    if (level === "advanced") return "athlete";
  }

  if (activity === "sedentary" && level !== "beginner") return "beginner";

  return level;
}

// ─── General utilities ────────────────────────────────────────────────────────

/**
 * Returns a random subset of n unique items from an array.
 * I use this when building the daily exercise picks so each day gets variety.
 */
function pickRandom(array, count) {
  const copy = [...array];
  const result = [];
  while (result.length < count && copy.length > 0) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy[index]);
    copy.splice(index, 1);
  }
  return result;
}

/**
 * Builds a filtered exercise pool that matches the user's profile.
 * Steps:
 *  1. Filter by effective fitness level (adjusted by activity level)
 *  2. Filter by equipment the user actually has
 *  3. Apply a cardio-to-strength ratio based on the user's weight goal
 *     (e.g. lose weight → 70% cardio, build muscle → 20% cardio)
 */
function getMatchingExercises(goal, level, weightGoal, userEquipment, activityLevel) {
  const effectiveLevel = getEffectiveLevel(level, activityLevel);

  const byLevel = exercises.filter((exercise) => {
    if (effectiveLevel === "beginner") return exercise.difficulty === "Beginner";
    if (effectiveLevel === "intermediate") {
      return exercise.difficulty === "Beginner" || exercise.difficulty === "Intermediate";
    }
    if (effectiveLevel === "advanced") return exercise.difficulty !== "Athlete";
    if (effectiveLevel === "athlete") return true;
    return true;
  });

  const byEquipment = byLevel.filter((exercise) =>
    userHasEquipmentForExercise(exercise.id, userEquipment)
  );

  const cardioPool = byEquipment.filter((ex) => ex.category === "Cardio");
  const strengthPool = byEquipment.filter((ex) => ex.category === "Weightlifting");
  const ratio = getCardioRatio(weightGoal || "maintain");
  const total = byEquipment.length;
  const cardioCount = Math.round(total * ratio);
  const strengthCount = total - cardioCount;

  return [
    ...cardioPool.slice(0, Math.min(cardioCount, cardioPool.length)),
    ...strengthPool.slice(0, Math.min(strengthCount, strengthPool.length)),
  ];
}

/** Returns today's date as YYYY-MM-DD, used as the key for calendar entries. */
function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Builds a complete 14-day plan from a given exercise pool.
 * Rules:
 *  - Every 4th day is a rest day (except day 14 which is always active)
 *  - Every 3rd day has 3 exercises; other active days have 2
 *  - An exercise is not repeated within 3 days of its last appearance
 * Falls back to all bodyweight exercises if the pool is empty after filtering.
 */
function buildPlanDays(pool) {
  const safePool =
    pool.length > 0
      ? pool
      : exercises.filter((ex) => EXERCISE_EQUIPMENT_MAP[ex.id] === "none");

  const lastUsed = {};
  const days = [];

  for (let day = 1; day <= 14; day++) {
    const isRest = day % 4 === 0 && day !== 14;
    const count = day % 3 === 0 ? 3 : 2;
    let picks = [];

    if (!isRest) {
      const available = safePool.filter(
        (ex) => !lastUsed[ex.id] || day - lastUsed[ex.id] >= 3
      );
      const source = available.length >= count ? available : safePool;
      picks = pickRandom(source, count);
      picks.forEach((ex) => {
        lastUsed[ex.id] = day;
      });
    }

    days.push({ day, isRest, picks });
  }

  return days;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Meal category colours — must match Sara's diet page exactly. */
const CAT_COLORS = {
  breakfast: "#FFAA00",
  lunch: "#C6F135",
  snack: "#00E5FF",
  dinner: "#FF2A5E",
};

/** Purple dots for exercise entries — different from all four meal colours. */
const EXERCISE_DOT_COLOR = "#A855F7";

// ─── Small reusable UI components ────────────────────────────────────────────

/**
 * Animated pulsing green dot used in the hero greeting line
 * to give a "live" or "active" feel.
 */
function PulseDot() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2 w-2 shrink-0 rounded-full animate-pulse"
      style={{ background: "#C6F135" }}
    />
  );
}

// ─── Exercise card ────────────────────────────────────────────────────────────

/**
 * Renders a single exercise card in the ALL EXERCISES grid.
 *
 * Props:
 *  ex       — the exercise object from the EXERCISES array
 *  mockUser — the current user profile (used to check limitations)
 *
 * Features:
 *  - Shows a caution badge and warning text if the exercise conflicts with
 *    the user's reported physical limitations from the survey
 *  - Displays the exercise image from Unsplash with a fallback to initials
 *    if the image fails to load (using useState for imgErr)
 *  - Shows the required equipment in purple if the exercise needs gear
 *  - Hover effect scales the card and highlights its border
 */
function ExerciseCard({ ex, mockUser }) {
  const catColor = getCatColor(ex.category);
  const diffColor = getDiffColor(ex.difficulty);
  const hasWarning = isRiskyForUser(ex, mockUser.limitations);
  const [imgErr, setImgErr] = useState(false);

  const initials = ex.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const equipNeeded = EXERCISE_EQUIPMENT_MAP[ex.id];

  return (
    <article
      aria-label={`Exercise: ${ex.name}, ${ex.category}, ${ex.difficulty}${hasWarning ? ", caution for your limitations" : ""}`}
      className="cursor-pointer overflow-hidden rounded-xl border bg-[#0D0D0D] transition-all duration-300 hover:scale-[1.02]"
      style={{ borderColor: hasWarning ? "#FFAA00" : "#1E1E1E" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hasWarning ? "#FF2A5E" : "#C6F135";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = hasWarning ? "#FFAA00" : "#1E1E1E";
      }}
    >
      <Link to={ex.link} className="block no-underline">
        {/* Exercise thumbnail image — falls back to initials on error */}
        <div className="relative flex h-36 items-center justify-center overflow-hidden border-b border-[#1E1E1E] bg-[#111111]">
          {!imgErr && ex.image ? (
            <img
              src={ex.image}
              alt={`${ex.name} exercise demonstration`}
              onError={() => setImgErr(true)}
              className="h-full w-full object-cover opacity-75"
            />
          ) : (
            <span
              aria-hidden="true"
              className="select-none text-[56px] font-black leading-none text-[#2A2A2A]"
              style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              {initials}
            </span>
          )}

          {/* Difficulty badge */}
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em]"
            style={{
              border: `1px solid ${diffColor}66`,
              color: diffColor,
              background: "rgba(0,0,0,0.7)",
            }}
          >
            {ex.difficulty}
          </span>

          {/* Caution badge for users with relevant limitations */}
          {hasWarning && (
            <span
              role="alert"
              className="absolute left-2 top-2 rounded-md bg-[#FFAA00] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#080808]"
            >
              ⚠ Caution
            </span>
          )}
        </div>

        <div className="p-4">
          {hasWarning && (
            <div
              role="alert"
              className="mb-3 rounded-lg border px-3 py-2 text-xs leading-6"
              style={{
                background: "rgba(255,170,0,0.1)",
                borderColor: "rgba(255,170,0,0.4)",
                color: "#FFAA00",
              }}
            >
              ⚠ Not suitable for your limitations. Consult your doctor first.
            </div>
          )}

          <h3
            className="mb-1 text-[20px] font-black text-[#ECECEC]"
            style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
          >
            {ex.name}
          </h3>

          <p className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-[#555555]">
            <span
              aria-hidden="true"
              className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
              style={{ background: catColor }}
            />
            {ex.category}
          </p>

          <p className="mb-3 text-xs leading-7 text-[#555555]">{ex.desc}</p>

          <span
            aria-label={`Calorie burn: ${ex.kcalRange} per 10 minutes`}
            className="mb-3 inline-block rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em]"
            style={{
              color: "#FFAA00",
              borderColor: "rgba(255,170,0,0.3)",
            }}
          >
            {ex.kcalRange} kcal / 10 min
          </span>

          <p className="mb-2 text-[10px] uppercase tracking-[0.1em] text-[#333333]">
            {ex.muscles}
          </p>

          {/* Equipment requirement label — only shown when gear is needed */}
          {equipNeeded && equipNeeded !== "none" && (
            <p
              aria-label={`Equipment needed: ${equipNeeded}`}
              className="mb-3 text-[10px] uppercase tracking-[0.1em] text-[#A855F7]"
            >
              ⚙ Needs: {equipNeeded}
            </p>
          )}

          <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-[#00E5FF]">
            Open exercise page →
          </p>
        </div>
      </Link>
    </article>
  );
}

// ─── Plan day card ────────────────────────────────────────────────────────────

/**
 * Renders one day card in the 14-day plan grid.
 *
 * Props:
 *  day                 — plan day number (1–14)
 *  isRest              — whether this is a rest day
 *  picks               — array of exercise objects for this day
 *  isDay14             — whether this is the final day (shows modal on click)
 *  onDay14Click        — callback to open the Plan Complete modal
 *  intensityBoostCount — number of +15% boosts applied so far
 *  completedPlanItems  — object of completed ticks e.g. { "1-11": true }
 *  onToggleDone        — callback when tick button is pressed
 *  todayPlanDay        — which plan day number is today
 *
 * Tick buttons are only shown on today's plan day — past and future days are
 * read-only so the user cannot fake progress.
 */
function PlanDayCard({
  day, isRest, picks, isDay14, onDay14Click,
  intensityBoostCount, completedPlanItems, onToggleDone, todayPlanDay,
}) {
  const allDone = !isRest && picks.length > 0 && picks.every((ex) => completedPlanItems[`${day}-${ex.id}`]);
  const isToday = day === todayPlanDay;

  /**
   * Applies progressive overload to the calorie range display.
   * Each boost multiplies the range by 1.15 (15% increase).
   */
  function getBoostedRange(range) {
    if (intensityBoostCount === 0) return range;
    const parts = range.split("–");
    if (parts.length !== 2) return range;
    const multiplier = Math.pow(1.15, intensityBoostCount);
    return (
      Math.round(parseInt(parts[0]) * multiplier) + "–" +
      Math.round(parseInt(parts[1]) * multiplier)
    );
  }

  return (
    <div
      role={isDay14 ? "button" : undefined}
      aria-label={isDay14 ? "Day 14 — tap to finish plan" : `Day ${day}${isRest ? ", rest day" : ""}`}
      tabIndex={isDay14 ? 0 : undefined}
      className="rounded-xl bg-[#0D0D0D] p-3 transition-transform duration-200 hover:-translate-y-1"
      style={{
        cursor: isDay14 ? "pointer" : "default",
        border: allDone
          ? "1px solid #C6F135"
          : isDay14
          ? "1px solid #C6F135"
          : isToday
          ? "1px solid #00E5FF"
          : "1px solid #1E1E1E",
      }}
      onClick={isDay14 ? onDay14Click : undefined}
      onKeyDown={isDay14 ? (e) => { if (e.key === "Enter" || e.key === " ") onDay14Click(); } : undefined}
    >
      {/* Day number — cyan when today */}
      <p
        aria-hidden="true"
        className="mb-2 text-[30px] font-black leading-none"
        style={{
          fontFamily: "'Barlow Condensed',sans-serif",
          color: isToday ? "#00E5FF" : "#2A2A2A",
        }}
      >
        {String(day).padStart(2, "0")}
      </p>

      {/* "Today" label shown on the current plan day */}
      {isToday && !allDone && (
        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#00E5FF]">
          Today
        </p>
      )}

      {/* Day complete badge — shown when every exercise is ticked */}
      {allDone && (
        <div
          aria-label="Day complete"
          className="mb-2 flex items-center gap-1.5 rounded-md border px-2 py-1"
          style={{
            background: "rgba(198,241,53,0.1)",
            borderColor: "rgba(198,241,53,0.4)",
          }}
        >
          <span aria-hidden="true" className="text-[11px] font-bold text-[#C6F135]">✓</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#C6F135]">
            Day Complete
          </span>
        </div>
      )}

      {/* Rest day label */}
      {isRest ? (
        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#333333]">
          Rest Day
        </p>
      ) : (
        picks.map((ex) => {
          const done = completedPlanItems[`${day}-${ex.id}`];
          const canTick = isToday;

          return (
            <div key={ex.id} className="mb-1.5">
              <div className="mb-0.5 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
                    style={{ background: getCatColor(ex.category) }}
                  />
                  <Link
                    to={ex.link}
                    onClick={(e) => e.stopPropagation()}
                    className="truncate whitespace-nowrap text-[11px] font-bold no-underline"
                    style={{ color: done ? "#C6F135" : "#00E5FF" }}
                    onMouseEnter={(e) => { e.target.style.color = "#C6F135"; }}
                    onMouseLeave={(e) => { e.target.style.color = done ? "#C6F135" : "#00E5FF"; }}
                  >
                    {ex.name}
                  </Link>
                </div>

                {/* Tick button — only rendered on today's plan day */}
                {canTick && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleDone(day, ex.id); }}
                    aria-label={done ? `Unmark ${ex.name} as done` : `Mark ${ex.name} as done`}
                    aria-pressed={done}
                    className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{
                      border: `1px solid ${done ? "#C6F135" : "#555555"}`,
                      background: done ? "#C6F135" : "transparent",
                      color: done ? "#080808" : "#555555",
                      cursor: "pointer",
                    }}
                  >
                    {done ? "✓" : ""}
                  </button>
                )}
              </div>

              {/* Calorie range — boosted if user applied intensity boosts */}
              <p
                className="ml-3 text-[9px]"
                style={{
                  color: intensityBoostCount > 0 ? "#FFAA00" : "#555555",
                  textDecoration: done ? "line-through" : "none",
                  opacity: done ? 0.7 : 1,
                }}
              >
                {getBoostedRange(ex.kcalRange)} kcal/10min
              </p>
            </div>
          );
        })
      )}

      {/* "Tap to Finish" prompt on Day 14 */}
      {isDay14 && !allDone && (
        <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.1em] text-[#C6F135]">
          Tap to Finish
        </p>
      )}
    </div>
  );
}

// ─── Plan complete modal ──────────────────────────────────────────────────────

/**
 * Modal shown when the user taps Day 14.
 *
 * Progression logic:
 *  1. First 3 plan completions at the same level → +15% reps each time
 *  2. After 3 boosts → advance to the next fitness level
 *  3. At Athlete level → keep adding reps indefinitely
 *
 * Props:
 *  userLevel           — current fitness level string
 *  intensityBoostCount — how many boosts applied so far
 *  onContinue          — callback for the main action button
 *  onClose             — callback to dismiss without choosing
 */
function PlanCompleteModal({ userLevel, intensityBoostCount, onContinue, onClose }) {
  const totalKcal = workoutLog.reduce((sum, entry) => sum + (entry.caloriesBurned || 0), 0);
  const levels = ["beginner", "intermediate", "advanced", "athlete"];
  const currentIndex = levels.indexOf(userLevel);

  function getBtnLabel() {
    if (intensityBoostCount < 3) return `Continue — Same Level, +15% Reps (${3 - intensityBoostCount} boosts left) →`;
    if (currentIndex < levels.length - 1) return `Advance to ${levels[currentIndex + 1].charAt(0).toUpperCase() + levels[currentIndex + 1].slice(1)} Level →`;
    return "Continue — Max Level (Athlete) →";
  }

  function getBtnColor() {
    if (intensityBoostCount < 3) return "#C6F135";
    if (currentIndex < levels.length - 1) return "#00E5FF";
    return "#A855F7";
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Plan complete — choose your next step"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
    >
      <div className="w-full max-w-[512px] rounded-2xl border border-[#1E1E1E] bg-[#0D0D0D] p-8">
        {/* Checkmark icon */}
        <div
          aria-hidden="true"
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: "rgba(198,241,53,0.1)",
            border: "2px solid #C6F135",
          }}
        >
          <span className="text-2xl font-bold text-[#C6F135]">✓</span>
        </div>

        <h2
          className="mb-2 text-center text-4xl font-black text-[#ECECEC]"
          style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
        >
          PLAN COMPLETE
        </h2>
        <p className="mb-8 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-[#555555]">
          14 days finished
        </p>

        {/* Stats grid */}
        <div className="mb-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-[#1E1E1E]">
          {[
            { label: "Workouts Logged", value: workoutLog.length, color: "#C6F135" },
            { label: "Calories Burned", value: totalKcal, color: "#FFAA00" },
            { label: "Current Level", value: userLevel.slice(0, 3).toUpperCase(), color: "#00E5FF" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#111111] px-4 py-5 text-center">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#555555]">
                {stat.label}
              </p>
              <p
                className="m-0 text-[32px] font-bold leading-none"
                style={{ fontFamily: "'Barlow Condensed',sans-serif", color: stat.color }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <p className="mb-6 text-center text-sm leading-7 text-[#555555]">
          Great work finishing your 14-day plan.
          <br />
          What would you like to do next?
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            aria-label={getBtnLabel()}
            className="w-full rounded-xl px-4 py-4 text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{
              background: getBtnColor(),
              color: getBtnColor() === "#A855F7" ? "#ECECEC" : "#080808",
              border: 0,
              cursor: "pointer",
            }}
          >
            {getBtnLabel()}
          </button>

          <Link
            to="/profile"
            aria-label="Go to profile to update your plan settings"
            className="block w-full rounded-xl border border-[#00E5FF] px-4 py-4 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-[#00E5FF] no-underline"
          >
            Update My Profile — Fresh Plan →
          </Link>

          <button
            onClick={onClose}
            aria-label="Close this dialog and decide later"
            className="w-full rounded-xl border border-[#2A2A2A] bg-transparent px-4 py-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#555555]"
            style={{ cursor: "pointer" }}
          >
            I'll Decide Later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar component ───────────────────────────────────────────────────────

/**
 * Displays a monthly calendar combining meals and completed exercises.
 *
 * Props:
 *  calendarData       — shared App.jsx state containing meal entries from Sara's diet page
 *  exerciseLogByDate  — local state object keyed by YYYY-MM-DD with ticked exercise arrays
 *
 * How it works:
 *  - Meals come from calendarData (Sara logs them on the diet page)
 *  - Exercises come from exerciseLogByDate (I log them when the user ticks a box)
 *  - These two sources are kept SEPARATE so exercises only appear on days they were done
 *  - Meal dots use the four category colours; exercise dots are always purple
 *  - Clicking a day shows a side panel with that day's meals and exercises
 */
function WorkoutCalendar({ calendarData, exerciseLogByDate }) {
  const todayKey = getTodayKey();
  const todayDate = new Date();

  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth());
  const [selected, setSelected] = useState(todayKey);

  const allCalendar = calendarData || {};

  /** Navigates the calendar forward or backward by one month. */
  function changeMonth(direction) {
    setCalMonth((prev) => {
      let newMonth = prev + direction;
      if (newMonth < 0) { setCalYear((y) => y - 1); return 11; }
      if (newMonth > 11) { setCalYear((y) => y + 1); return 0; }
      return newMonth;
    });
  }

  /**
   * Builds the complete grid of day cells for the visible month.
   * Includes leading cells from the previous month and trailing cells
   * from the next month to fill a complete 7-column grid.
   */
  function buildCells() {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();
    const total = firstDay + daysInMonth;
    const gridSize = total + ((7 - (total % 7)) % 7);
    const cells = [];

    for (let i = 0; i < gridSize; i++) {
      let day, month = calMonth, year = calYear, other = false;

      if (i < firstDay) {
        day = daysInPrevMonth - (firstDay - 1 - i);
        month = calMonth - 1;
        if (month < 0) { month = 11; year = calYear - 1; }
        other = true;
      } else if (i >= firstDay + daysInMonth) {
        day = i - firstDay - daysInMonth + 1;
        month = calMonth + 1;
        if (month > 11) { month = 0; year = calYear + 1; }
        other = true;
      } else {
        day = i - firstDay + 1;
      }

      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const entries = allCalendar[dateKey] || [];
      const meals = entries.filter((entry) => entry.type !== "workout");
      const exForDate = exerciseLogByDate[dateKey] || [];

      cells.push({
        day, dateKey, other,
        isToday: dateKey === todayKey,
        isSelected: dateKey === selected,
        meals,
        exCount: exForDate.length,
      });
    }

    return cells;
  }

  const cells = buildCells();

  // Side panel data — reads from BOTH sources for the selected date
  const selectedEntry = allCalendar[selected] || [];
  const selectedMeals = selectedEntry.filter((entry) => entry.type !== "workout");
  const selectedExercises = exerciseLogByDate[selected] || [];

  return (
    <section aria-label="Calendar showing meals and exercises" className="mb-16">
      <div className="mb-6 flex flex-wrap items-baseline gap-3">
        <h2
          className="m-0 text-[clamp(28px,5vw,36px)] font-black text-[#ECECEC]"
          style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
        >
          CALENDAR
        </h2>
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#333333]">
          exercises + meals
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        {/* ── Calendar grid ── */}
        <div className="overflow-hidden rounded-xl border border-[#1E1E1E]">
          {/* Month navigation header */}
          <div className="flex items-center justify-between border-b border-[#1E1E1E] bg-[#0D0D0D] px-5 py-3">
            <p
              className="m-0 text-[20px] font-black"
              style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              <span className="text-[#C6F135]">{MONTHS_FULL[calMonth]}</span>
              <span className="ml-2 text-base text-[#555555]">{calYear}</span>
            </p>

            <div className="flex" role="group" aria-label="Month navigation">
              {[["‹", -1, "Previous month"], ["›", 1, "Next month"]].map(([label, direction, ariaLabel]) => (
                <button
                  key={label}
                  onClick={() => changeMonth(direction)}
                  aria-label={ariaLabel}
                  className="flex h-8 w-8 items-center justify-center border border-[#1E1E1E] bg-transparent text-sm text-[#555555] hover:bg-[#C6F135] hover:text-[#080808]"
                  style={{ borderRight: direction === -1 ? "none" : "1px solid #1E1E1E" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-[#1E1E1E]" role="row">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
              <div
                key={dayName}
                role="columnheader"
                aria-label={dayName}
                className="border-r border-[#1E1E1E] py-2 text-center text-[11px] uppercase tracking-[0.1em] text-[#555555]"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 bg-[#080808]">
            {cells.map((cell) => (
              <button
                key={cell.dateKey}
                disabled={cell.other}
                onClick={() => !cell.other && setSelected(cell.dateKey)}
                aria-label={`${cell.day} ${MONTHS_SHORT[calMonth]} — ${cell.meals.length} meal${cell.meals.length !== 1 ? "s" : ""}, ${cell.exCount} exercise${cell.exCount !== 1 ? "s" : ""}`}
                aria-pressed={cell.isSelected}
                className="flex min-h-[44px] flex-col items-start border-b border-r border-[#1E1E1E] p-1"
                style={{
                  background: cell.isSelected
                    ? "rgba(198,241,53,0.1)"
                    : cell.isToday
                    ? "rgba(198,241,53,0.05)"
                    : "transparent",
                  opacity: cell.other ? 0.2 : 1,
                  cursor: cell.other ? "default" : "pointer",
                }}
              >
                <span className="mb-1 text-xs font-bold leading-none" style={{ color: cell.isToday ? "#C6F135" : "#ECECEC" }}>
                  {cell.day}
                </span>

                {/* Coloured dots — meals first (category colours), then exercises (purple) */}
                <div className="flex flex-wrap gap-[2px]" aria-hidden="true">
                  {cell.meals.slice(0, 3).map((meal, index) => (
                    <div
                      key={`m-${index}`}
                      className="h-1 w-1 rounded-full"
                      style={{ background: CAT_COLORS[meal.cat] || "#555" }}
                      title={meal.name}
                    />
                  ))}
                  {Array.from({ length: Math.min(cell.exCount, 3) }).map((_, index) => (
                    <div
                      key={`e-${index}`}
                      className="h-1 w-1 rounded-full"
                      style={{ background: EXERCISE_DOT_COLOR }}
                      title="Exercise done"
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Side panel ── */}
        <aside
          aria-label={`Details for ${MONTHS_SHORT[parseInt(selected.split("-")[1]) - 1]} ${parseInt(selected.split("-")[2])}`}
          className="flex flex-col gap-3 rounded-xl border border-[#1E1E1E] bg-[#0D0D0D] p-4"
        >
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.1em] text-[#FF2A5E]">
            {MONTHS_SHORT[parseInt(selected.split("-")[1]) - 1]}{" "}
            {parseInt(selected.split("-")[2])},{" "}
            {selected.split("-")[0]}
          </p>

          {/* Meals section */}
          {selectedMeals.length > 0 && (
            <div>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.1em] text-[#555555]">
                Meals
              </p>
              {selectedMeals.map((meal, index) => (
                <div key={index} className="flex items-center gap-2 border-b border-[#1E1E1E] py-1.5">
                  <div
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: CAT_COLORS[meal.cat] || "#555" }}
                  />
                  <div>
                    <p className="m-0 text-xs font-bold text-[#ECECEC]">{meal.name}</p>
                    <p className="m-0 text-[10px] text-[#555555]">
                      {meal.cat} · {meal.kcal} kcal
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Exercises done section — only exercises ticked on this specific date */}
          {selectedExercises.length > 0 && (
            <div>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.1em] text-[#555555]">
                Exercises Done
              </p>
              {selectedExercises.map((exercise, index) => (
                <div key={index} className="flex items-center gap-2 border-b border-[#1E1E1E] py-1.5">
                  <div
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: EXERCISE_DOT_COLOR }}
                  />
                  <p className="m-0 text-xs font-bold text-[#C6F135]">
                    ✓ {exercise.name}
                  </p>
                </div>
              ))}
            </div>
          )}

          {selectedMeals.length === 0 && selectedExercises.length === 0 && (
            <p className="text-xs text-[#333333]">Nothing logged this day.</p>
          )}

          {/* Colour legend */}
          <div className="mt-2 border-t border-[#1E1E1E] pt-3">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.1em] text-[#333333]">
              Legend
            </p>
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(CAT_COLORS).map(([category, color]) => (
                <div key={category} className="flex items-center gap-1">
                  <div aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                  <span className="text-[9px] uppercase tracking-[0.1em] text-[#555555]">{category}</span>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <div aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: EXERCISE_DOT_COLOR }} />
                <span className="text-[9px] uppercase tracking-[0.1em] text-[#555555]">exercise</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

/**
 * ExerciseLibrary — the main List View page.
 *
 * Props received from App.jsx:
 *  calendarData          — shared calendar state (contains meals from Sara's diet page)
 *  addWorkoutToCalendar  — function to add a workout entry to the shared calendar
 *  currentUser           — user profile object read from survey (via getUserProfile)
 *
 * State managed here:
 *  search / filterCat / filterDiff — controls for the ALL EXERCISES grid
 *  userLevel                       — current fitness level (can advance after plan)
 *  boostCount                      — number of +15% rep boosts applied
 *  planOpen                        — whether the Plan Complete modal is visible
 *  toastMsg                        — brief notification message shown at bottom
 *  completedPlanItems              — { "day-exerciseId": true } for tick state
 *  exerciseLogByDate               — { "YYYY-MM-DD": [{name, category}] } for calendar.
 */
export default function ExerciseLibrary({ calendarData = {}, addWorkoutToCalendar, currentUser }) {
  const mockUser = currentUser || getUserProfile();

  // ── Filter state for the ALL EXERCISES section ──
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterDiff, setFilterDiff] = useState("All");

  // ── Plan progression state ──
  const [userLevel, setUserLevel] = useState(mockUser.level);
  const [boostCount, setBoostCount] = useState(0);
  const [planOpen, setPlanOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // ── Tick tracking — pure React state, no localStorage ──
  // completedPlanItems stores which exercises the user has ticked today
  const [completedPlanItems, setCompletedPlanItems] = useState({});

  // exerciseLogByDate stores exercises per date so the calendar shows
  // exercises only on the specific date they were done
  const [exerciseLogByDate, setExerciseLogByDate] = useState({});
  const [planDays, setPlanDays] = useState(() => {
    const pool = getMatchingExercises(
      mockUser.goal, mockUser.level, mockUser.weightGoal,
      mockUser.equipment, mockUser.activityLevel
    );
    return buildPlanDays(pool);
  });

  useEffect(() => {
    const pool = getMatchingExercises(
      mockUser.goal, userLevel, mockUser.weightGoal,
      mockUser.equipment, mockUser.activityLevel
    );
    setPlanDays(buildPlanDays(pool));
    // Reset completed ticks when the plan changes so nothing is pre-ticked
    setCompletedPlanItems({});
  }, [userLevel, boostCount]);

  const todayPlanDay = 1;

  /** Shows a brief toast notification at the bottom of the screen. */
  function showToast(text, color = "#C6F135") {
    setToastMsg({ text, color });
    setTimeout(() => setToastMsg(null), 3500);
  }

  /**
   * Handles the tick button on a plan day exercise.
   */
  function toggleExerciseDone(day, exerciseId) {
    if (day !== todayPlanDay) return;

    const key = `${day}-${exerciseId}`;
    const isDone = !completedPlanItems[key];
    const exercise = exercises.find((item) => item.id === exerciseId);
    const today = getTodayKey();

    // Update the tick state using functional update
    setCompletedPlanItems((prev) => ({ ...prev, [key]: isDone }));

    if (isDone) {
      // Add to date-keyed log so calendar shows it on today only
      setExerciseLogByDate((prev) => ({
        ...prev,
        [today]: [
          ...(prev[today] || []),
          { name: exercise?.name || "Exercise", category: exercise?.category || "Cardio" },
        ],
      }));

      // Push to shared App.jsx calendarData so the dashboard also shows it
      if (addWorkoutToCalendar) {
        const rangeParts = (exercise?.kcalRange || "0").replace("–", "-").split("-");
        const kcalMid = rangeParts.length === 2
          ? Math.round((parseFloat(rangeParts[0]) + parseFloat(rangeParts[1])) / 2)
          : parseFloat(rangeParts[0]) || 0;

        addWorkoutToCalendar(today, {
          name: exercise?.name || "Exercise",
          category: exercise?.category || "Cardio",
          caloriesBurned: kcalMid,
          cat: "workout",
          type: "workout",
        });
      }
    } else {
      // Remove from date log when unticked
      setExerciseLogByDate((prev) => {
        const existing = prev[today] || [];
        const index = existing.findIndex((item) => item.name === (exercise?.name || "Exercise"));
        if (index === -1) return prev;
        const updated = [...existing];
        updated.splice(index, 1);
        return { ...prev, [today]: updated };
      });
    }
  }

  /**
   * Handles the progression logic after the user completes the 14-day plan.
   * Boosts reps up to 3 times before advancing to the next level.
   * At Athlete level keeps adding reps indefinitely.
   */
  function handlePlanContinue() {
    const levels = ["beginner", "intermediate", "advanced", "athlete"];
    const currentIndex = levels.indexOf(userLevel);

    if (boostCount < 3) {
      const nextBoost = boostCount + 1;
      setBoostCount(nextBoost);
      showToast(`Reps +${Math.round((Math.pow(1.15, nextBoost) - 1) * 100)}% · Level stays ${userLevel}`);
    } else if (currentIndex < levels.length - 1) {
      setUserLevel(levels[currentIndex + 1]);
      setBoostCount(0);
      showToast(`Level advanced to ${levels[currentIndex + 1].toUpperCase()}`, "#00E5FF");
    } else {
      const nextBoost = boostCount + 1;
      setBoostCount(nextBoost);
      showToast(`Max Level (Athlete) · Reps +${Math.round((Math.pow(1.15, nextBoost) - 1) * 100)}%`, "#A855F7");
    }

    setPlanOpen(false);
  }

  /**
   * Filters the ALL EXERCISES grid by:
   *  - search text (name)
   *  - category (Cardio / Weightlifting)
   *  - difficulty level
   *  - equipment availability (user only sees exercises they can do)
   */
  const filtered = exercises.filter((exercise) => {
    const matchSearch = exercise.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "All" || exercise.category === filterCat;
    const matchDiff = filterDiff === "All" || exercise.difficulty === filterDiff;
    const matchEquip = userHasEquipmentForExercise(exercise.id, mockUser.equipment);
    return matchSearch && matchCat && matchDiff && matchEquip;
  });

  // Activity label for the plan summary stats bar
  const timelineLabel = mockUser.timeline || "Ongoing";
  const activityLabel = mockUser.activityLevel
    ? mockUser.activityLevel.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap');

        body { font-family: 'JetBrains Mono', monospace; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .a1 { animation: fadeUp 0.5s ease 0.10s both; }
        .a2 { animation: fadeUp 0.5s ease 0.25s both; }
        .a3 { animation: fadeUp 0.5s ease 0.40s both; }

        body::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          background: repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 3px,
            rgba(0,0,0,0.06) 3px,
            rgba(0,0,0,0.06) 4px
          );
        }

        select option {
          background: #0D0D0D;
          color: #ECECEC;
        }
      `}</style>

      <div className="min-h-screen overflow-x-hidden bg-[#080808] text-[#ECECEC]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <main className="mx-auto max-w-[1200px] px-4 py-[clamp(24px,5vw,48px)] sm:px-6 lg:px-10">
          {/* ── Hero section ── */}
          <header className="relative mb-14">
            {/* Ghost text behind the title — decorative, hidden from screen readers */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-[-5px] top-[-10px] z-0 select-none font-black leading-none text-transparent"
              style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontSize: "clamp(90px,20vw,200px)",
                WebkitTextStroke: "1px #1E1E1E",
              }}
            >
              EX
            </span>

            <div className="relative z-10">
              <p className="a1 mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#FF2A5E]">
                <PulseDot /> Welcome back, {mockUser.name}
              </p>

              <h1
                className="a2 mb-4 font-black leading-[1.05]"
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontSize: "clamp(56px,10vw,100px)",
                }}
              >
                EXERCISE
                <br />
                <span style={{ color: "transparent", WebkitTextStroke: "2px #C6F135" }}>
                  LIBRARY
                </span>
              </h1>

              <p className="a3 max-w-[480px] text-sm leading-7 text-[#555555]">
                Your personalized 14-day plan is built from your profile. Only exercises you can do with your available equipment are included.
              </p>
            </div>
          </header>

          {/* ── Plan summary stats ── */}
          <section className="a3 mb-10" aria-label="Your plan summary">
            <h2
              className="mb-6 text-[clamp(28px,5vw,36px)] font-black text-[#ECECEC]"
              style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              YOUR PLAN
            </h2>

            <div className="mb-4 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-[#1E1E1E] sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Goal", value: mockUser.goal.toUpperCase(), color: "#C6F135" },
                { label: "Level", value: userLevel.toUpperCase(), color: "#00E5FF" },
                { label: "Weekly Target", value: mockUser.weeklyTarget + " kg / week", color: "#FF2A5E" },
                { label: "Activity", value: activityLabel || "Not set", color: "#FFAA00" },
              ].map((item) => (
                <div key={item.label} className="bg-[#0D0D0D] px-5 py-4">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#555555]">
                    {item.label}
                  </p>
                  <p className="m-0 text-sm font-bold" style={{ color: item.color }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Equipment tags — shows what the plan was built around */}
            {mockUser.equipment && mockUser.equipment.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#333333]">
                  Equipment:
                </span>
                {mockUser.equipment.map((equipment) => (
                  <span
                    key={equipment}
                    className="rounded-full border border-[#2A2A2A] px-2.5 py-[3px] text-[10px] font-bold text-[#A855F7]"
                  >
                    {equipment}
                  </span>
                ))}
              </div>
            )}

            <p className="mb-6 text-[11px] text-[#333333]">
              Not your info?{" "}
              <Link to="/profile" className="border-b border-[#333333] text-[#555555] no-underline">
                Update your profile →
              </Link>
            </p>
          </section>

          {/* ── 14-day plan grid ── */}
          <section aria-label="14-day workout plan" className="mb-16">
            <div className="mb-6 flex flex-wrap items-baseline gap-3">
              <h2
                className="m-0 text-[clamp(28px,5vw,36px)] font-black text-[#ECECEC]"
                style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                14-DAY PLAN
              </h2>
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#333333]">
                {mockUser.goal} · {userLevel} · {timelineLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {planDays.map(({ day, isRest, picks }) => (
                <PlanDayCard
                  key={day}
                  day={day}
                  isRest={isRest}
                  picks={picks}
                  isDay14={day === 14}
                  onDay14Click={() => setPlanOpen(true)}
                  intensityBoostCount={boostCount}
                  completedPlanItems={completedPlanItems}
                  onToggleDone={toggleExerciseDone}
                  todayPlanDay={todayPlanDay}
                />
              ))}
            </div>
          </section>

          <hr className="mb-16 border-[#1E1E1E]" />

          {/* ── Calendar ── */}
          <WorkoutCalendar
            calendarData={calendarData}
            exerciseLogByDate={exerciseLogByDate}
          />

          <hr className="mb-16 border-[#1E1E1E]" />

          {/* ── All exercises with search and filter ── */}
          <section aria-label="All available exercises" className="mb-6">
            <div className="mb-6 flex flex-wrap items-baseline gap-3">
              <h2
                className="m-0 text-[clamp(28px,5vw,36px)] font-black text-[#ECECEC]"
                style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                ALL EXERCISES
              </h2>
              <span aria-live="polite" className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#333333]">
                {filtered.length} available for your equipment
              </span>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-[#1E1E1E] bg-[#0D0D0D] p-4 sm:grid-cols-3">
              <label htmlFor="ex-search" className="hidden">Search exercises by name</label>
              <input
                id="ex-search"
                type="text"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search exercises by name"
                className="rounded-lg border border-[#2A2A2A] bg-[#080808] px-4 py-3 text-sm text-[#ECECEC] outline-none"
                style={{ fontFamily: "inherit" }}
              />

              <label htmlFor="ex-cat" className="hidden">Filter by category</label>
              <select
                id="ex-cat"
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                aria-label="Filter by category"
                className="rounded-lg border border-[#2A2A2A] bg-[#080808] px-4 py-3 text-sm text-[#ECECEC] outline-none"
                style={{ fontFamily: "inherit" }}
              >
                <option value="All">All Categories</option>
                <option value="Cardio">Cardio</option>
                <option value="Weightlifting">Weightlifting</option>
              </select>

              <label htmlFor="ex-diff" className="hidden">Filter by difficulty</label>
              <select
                id="ex-diff"
                value={filterDiff}
                onChange={(e) => setFilterDiff(e.target.value)}
                aria-label="Filter by difficulty"
                className="rounded-lg border border-[#2A2A2A] bg-[#080808] px-4 py-3 text-sm text-[#ECECEC] outline-none"
                style={{ fontFamily: "inherit" }}
              >
                <option value="All">All Difficulty</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Athlete">Athlete</option>
              </select>
            </div>
          </section>

          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#333333]">
                No exercises match your filters or available equipment
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((exercise) => (
                <ExerciseCard key={exercise.id} ex={exercise} mockUser={mockUser} />
              ))}
            </div>
          )}
        </main>

        {/* ── Plan complete modal ── */}
        {planOpen && (
          <PlanCompleteModal
            userLevel={userLevel}
            intensityBoostCount={boostCount}
            onContinue={handlePlanContinue}
            onClose={() => setPlanOpen(false)}
          />
        )}

        {/* ── Toast notification ── */}
        {toastMsg && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 left-6 z-[999] rounded-xl bg-[#0D0D0D] px-5 py-3 text-[13px] text-[#ECECEC]"
            style={{
              border: `1px solid ${toastMsg.color}`,
              fontFamily: "inherit",
            }}
          >
            {toastMsg.text}
          </div>
        )}
      </div>
    </>
  );
}


