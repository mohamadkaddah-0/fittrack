/**
 * ExerciseDetailPage.jsx
 * ----------------------
 * This is the Detail View page of the FitTrack application.
 * It is the second of my two pages.
 *
 * What this page does:
 *  - Reads the exercise ID from the URL using useParams (react-router-dom)
 *  - Finds the matching exercise object from the EXERCISES array
 *  - Displays the exercise hero image (with fallback to initials)
 *  - Embeds a YouTube tutorial video for the exercise
 *  - Shows a level-based training plan (sets/reps/rest) from the survey data
 *  - Includes an interactive countdown timer for duration and rest
 *  - Lists step-by-step instructions, tips, and common mistakes
 *  - Shows primary and secondary muscles targeted
 *  - Lists exercise variations
 *  - Displays a caution warning if the exercise conflicts with the user's limitations
 */

import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  EXERCISES,
  getExercisePlan,
  getUserProfile,
  isRiskyForUser,
} from "../data/mockData";

// ─── Colour helpers ───────────────────────────────────────────────────────────

/** Returns pink for Cardio, lime green for Weightlifting. */
function getCatColor(category) {
  return category === "Cardio" ? "#FF2A5E" : "#C6F135";
}

/** Returns a colour for the difficulty level label. */
function getDiffColor(difficulty) {
  if (difficulty === "Beginner")     return "#C6F135";
  if (difficulty === "Intermediate") return "#FFAA00";
  return "#FF2A5E";
}

/** Returns the inline style for a muscle tag pill. */
function tagStyle(color) {
  return {
    color,
    border: `1px solid ${color}55`,
    background: "#111111",
    borderRadius: 999,
    padding: "8px 10px",
    fontSize: 11,
    fontWeight: 700,
    display: "inline-block",
  };
}

// ─── Timer component ──────────────────────────────────────────────────────────

/**
 * TimerSection — an interactive countdown timer.
 *
 * Props:
 *  exercise — the exercise object (used to determine if it is duration-based)
 *
 * Behaviour:
 *  - For duration-based exercises (logType === "duration"):
 *    "Use this timer to track your set"
 *  - For reps/weighted exercises:
 *    "Optional rest timer between sets"
 *
 * State:
 *  seconds  — current countdown value
 *  running  — whether the timer is actively counting
 *  finished — whether the countdown reached zero
 *
 * I use useRef to store the interval ID because updating it does not
 * need to trigger a re-render.
 *
 * I use useEffect with a cleanup function to start and clear the interval
 * whenever the running state changes .
 */
function TimerSection({ exercise }) {
  const isDuration  = exercise.logType === "duration";
  const defaultSecs = isDuration ? 30 : 60;

  const [seconds,  setSeconds]  = useState(defaultSecs);
  const [running,  setRunning]  = useState(false);
  const [finished, setFinished] = useState(false);

  // useRef stores the interval ID without causing a re-render
  const intervalRef = useRef(null);

  /**
   * useEffect starts or clears the interval when running changes.
   * The cleanup function (return) clears the interval when:
   *  - the component unmounts
   *  - running changes from true to false
   * This prevents memory leaks.
   */
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        // Functional update reads the latest state value
        setSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    // Cleanup — called before next effect or on unmount
    return () => clearInterval(intervalRef.current);
  }, [running]);

  /** Resets the timer to its default duration. */
  function reset() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setFinished(false);
    setSeconds(defaultSecs);
  }

  const mins    = Math.floor(seconds / 60);
  const secs    = seconds % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="mb-6 rounded-[18px] border border-[#1E1E1E] bg-[#0D0D0D] p-6">
      <h2
        className="mb-[6px] text-[30px] font-black"
        style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
      >
        TIMER
      </h2>

      {/* Context-appropriate instruction text */}
      {!isDuration && (
        <p className="mb-4 text-xs text-[#555555]">
          Optional — use this as a rest timer between sets.
        </p>
      )}
      {isDuration && (
        <p className="mb-4 text-xs text-[#555555]">
          This is a duration-based exercise. Use the timer to track your set.
        </p>
      )}

      {/* Countdown display */}
      <div className="mb-5 text-center">
        <p
          aria-live="polite"
          aria-label={finished ? "Timer finished" : `Time remaining: ${display}`}
          className="text-[64px] font-black leading-none"
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            color: finished ? "#C6F135" : "#ECECEC",
          }}
        >
          {finished ? "DONE" : display}
        </p>
      </div>

      {/* Duration input — only shown when not finished */}
      {!finished && (
        <div className="mb-4">
          <label
            htmlFor="timer-duration"
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-[#555555]"
          >
            Set duration (seconds)
          </label>
          <input
            id="timer-duration"
            type="number"
            min="5"
            max="3600"
            value={seconds}
            aria-label="Set duration in seconds"
            onChange={(e) => {
              if (!running) setSeconds(parseInt(e.target.value) || 30);
            }}
            className="w-full rounded-[10px] border border-[#1E1E1E] bg-[#111111] px-[14px] py-[10px] text-sm text-[#ECECEC]"
          />
        </div>
      )}

      {/* Timer controls */}
      <div className="flex gap-[10px]">
        <button
          onClick={() => { setFinished(false); setRunning((r) => !r); }}
          aria-label={running ? "Pause timer" : finished ? "Restart timer" : "Start timer"}
          aria-pressed={running}
          className="flex-1 cursor-pointer rounded-[10px] border-0 px-3 py-3 text-xs font-bold uppercase tracking-[0.1em]"
          style={{
            background: running ? "#FF2A5E" : "#C6F135",
            color: "#080808",
          }}
        >
          {running ? "Pause" : finished ? "Restart" : "Start"}
        </button>

        <button
          onClick={reset}
          aria-label="Reset timer to default duration"
          className="cursor-pointer rounded-[10px] border border-[#2A2A2A] bg-transparent px-[18px] py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#555555]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── Main detail page ─────────────────────────────────────────────────────────

/**
 * ExerciseDetailPage — the Detail View for a specific exercise.
 *
 * How the exercise ID is read:
 *  useParams() reads the :id segment from the URL route /exercise/:id
 *  defined in App.jsx. This is part of react-router-dom used by the team.
 */
export default function ExerciseDetailPage() {
  // useParams reads :id from the URL — part of react-router-dom
  const { id }   = useParams();
  const user     = getUserProfile();
  const [imgErr, setImgErr] = useState(false);


  const exercise = EXERCISES.find((ex) => ex.id === Number(id));

  // ── Not found fallback ──
  if (!exercise) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#ECECEC]">
        <main className="p-10">
          <h1
            className="text-[42px] font-black"
            style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
          >
            Exercise not found
          </h1>
          <Link to="/exercises" className="text-[#00E5FF] no-underline">
            ← Back to library
          </Link>
        </main>
      </div>
    );
  }

  // ── Derived values from the exercise and user profile ──
  const plan    = getExercisePlan(exercise, user.level);
  const caution = isRiskyForUser(exercise, user.limitations);
  const initials = exercise.name.split(" ").map((w) => w[0]).join("").slice(0, 2);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        * { font-family: 'JetBrains Mono', monospace; box-sizing: border-box; }
      `}</style>

      <div className="min-h-screen bg-[#080808] text-[#ECECEC]">
        <main className="mx-auto max-w-[1200px] px-6 py-10">

          {/* ── Breadcrumb navigation ── */}
          <nav
            aria-label="Page breadcrumb"
            className="mb-7 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#333333]"
          >
            <span>Home</span>
            <span aria-hidden="true">/</span>
            <Link to="/exercises" className="text-[#555555] no-underline">
              Exercise Library
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-[#ECECEC]">{exercise.name}</span>
          </nav>

          {/* ── image ── */}
          <div
            className="relative mb-7 h-[280px] w-full overflow-hidden rounded-[18px] border border-[#1E1E1E] bg-[#111111]"
            role="img"
            aria-label={`Hero image for ${exercise.name}`}
          >
            {!imgErr && exercise.image ? (
              <img
                src={exercise.image}
                alt={`${exercise.name} exercise hero image`}
                onError={() => setImgErr(true)}
                className="h-full w-full object-cover opacity-60"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span
                  aria-hidden="true"
                  className="text-[100px] font-black text-[#2A2A2A]"
                  style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
                >
                  {initials}
                </span>
              </div>
            )}

            {/* Gradient overlay to make the category badge readable */}
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(8,8,8,0.9) 0%, transparent 60%)" }}
            />

            {/* Category badge */}
            <div className="absolute bottom-5 left-6">
              <span
                aria-label={`Category: ${exercise.category}`}
                className="inline-flex items-center gap-2 rounded-full px-[10px] py-[6px] text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{
                  color: getCatColor(exercise.category),
                  border: `1px solid ${getCatColor(exercise.category)}66`,
                  background: "rgba(0,0,0,0.5)",
                }}
              >
                {exercise.category}
              </span>
            </div>
          </div>

          {/* ── YouTube tutorial video ── */}
          {exercise.videoId && (
            <div className="mb-7 overflow-hidden rounded-[18px] border border-[#1E1E1E]">
              <div className="relative h-0 pb-[56.25%]">
                <iframe
                  src={`https://www.youtube.com/embed/${exercise.videoId}`}
                  title={`${exercise.name} tutorial video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute left-0 top-0 h-full w-full border-0"
                />
              </div>
            </div>
          )}

          {/* ── Two-column content grid ── */}
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.5fr_1fr]">
            {/* ── Left column — main content ── */}
            <section aria-label={`${exercise.name} details`}>

              {/* Exercise title */}
              <h1
                className="mb-4 text-[clamp(56px,9vw,100px)] font-black leading-[1.02]"
                style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
              >
                {exercise.name}
              </h1>

              {/* Description */}
              <p className="mb-[22px] max-w-[680px] text-sm leading-[1.9] text-[#555555]">
                {exercise.desc}
              </p>

              {/* Caution warning — shown when exercise conflicts with user limitations */}
              {caution && (
                <div
                  role="alert"
                  className="mb-[22px] rounded-[14px] px-4 py-[14px] leading-[1.8]"
                  style={{
                    background: "rgba(255,170,0,0.1)",
                    border: "1px solid rgba(255,170,0,0.4)",
                    color: "#FFAA00",
                  }}
                >
                  ⚠ This exercise may not be suitable for your limitations. Consult your doctor or trainer first.
                </div>
              )}

              {/* Stats grid — equipment, type, muscles, difficulty */}
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["Equipment", exercise.equipmentName || "Not specified", "#00E5FF"],
                  ["Type",      exercise.type          || "Exercise",      "#FFAA00"],
                  ["Muscles",   exercise.muscles,                          "#FF2A5E"],
                  ["Difficulty",exercise.difficulty,    getDiffColor(exercise.difficulty)],
                ].map(([label, value, color]) => (
                  <div
                    key={label}
                    className="rounded-[18px] border border-[#1E1E1E] bg-[#0D0D0D] p-5"
                  >
                    <p className="mb-[6px] text-xs font-bold uppercase tracking-[0.12em] text-[#555555]">
                      {label}
                    </p>
                    <p className="m-0 font-bold" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Level-based plan — sets / reps / rest from survey level */}
              <div className="mb-6 rounded-[18px] border border-[#1E1E1E] bg-[#0D0D0D] p-6">
                <h2
                  className="mb-4 text-[34px] font-black"
                  style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
                >
                  YOUR LEVEL-BASED PLAN
                </h2>
                <div className="rounded-[14px] border border-[#1E1E1E] bg-[#111111] p-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#555555]">
                    Recommended for {user.level}
                  </p>
                  <p className="mb-2 text-[20px] font-bold text-[#C6F135]">
                    {plan.title}
                  </p>
                  <p className="m-0 leading-[1.8] text-[#555555]">{plan.details}</p>
                </div>
              </div>

              {/* Timer — interactive countdown for sets or rest */}
              <TimerSection exercise={exercise} />

              {/* Step-by-step instructions */}
              <div className="mb-6 rounded-[18px] border border-[#1E1E1E] bg-[#0D0D0D] p-6">
                <h2
                  className="mb-4 text-[34px] font-black"
                  style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
                >
                  HOW TO DO IT
                </h2>
                <ol className="grid list-none gap-3 p-0 m-0">
                  {(exercise.steps || []).map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-[14px] border border-[#1E1E1E] bg-[#111111] p-[14px]"
                    >
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-[28px] font-black leading-none text-[#C6F135]"
                      >
                        {idx + 1}
                      </span>
                      <p className="m-0 leading-[1.8] text-[#ECECEC]">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tips and common mistakes */}
              <div className="rounded-[18px] border border-[#1E1E1E] bg-[#0D0D0D] p-6">
                <h2
                  className="mb-4 text-[34px] font-black"
                  style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
                >
                  TIPS & MISTAKES
                </h2>
                <div className="grid gap-3">
                  {(exercise.tips || []).map((tip, idx) => (
                    <div
                      key={`tip-${idx}`}
                      className="rounded-[14px] border border-[#1E1E1E] bg-[#111111] p-[14px] text-[#C6F135]"
                    >
                      ✓ {tip}
                    </div>
                  ))}
                  {(exercise.mistakes || []).map((mistake, idx) => (
                    <div
                      key={`mistake-${idx}`}
                      className="rounded-[14px] border border-[#1E1E1E] bg-[#111111] p-[14px] text-[#FF2A5E]"
                    >
                      ✕ {mistake}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Right column — sidebar ── */}
            <aside aria-label="Muscles and variations" className="flex flex-col gap-6">

              {/* Muscle groups */}
              <div className="rounded-[18px] border border-[#1E1E1E] bg-[#0D0D0D] p-6">
                <h2
                  className="mb-4 text-[30px] font-black"
                  style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
                >
                  MUSCLES
                </h2>

                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#555555]">
                  Primary
                </p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(exercise.primaryMuscles || []).map((m) => (
                    <span key={m} style={tagStyle("#C6F135")}>{m}</span>
                  ))}
                </div>

                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#555555]">
                  Secondary
                </p>
                <div className="flex flex-wrap gap-2">
                  {(exercise.secondaryMuscles || []).map((m) => (
                    <span key={m} style={tagStyle("#00E5FF")}>{m}</span>
                  ))}
                </div>
              </div>

              {/* Exercise variations */}
              <div className="rounded-[18px] border border-[#1E1E1E] bg-[#0D0D0D] p-6">
                <h2
                  className="mb-4 text-[30px] font-black"
                  style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
                >
                  VARIATIONS
                </h2>
                <ul className="m-0 grid list-none gap-[10px] p-0">
                  {(exercise.variations || []).map((v, idx) => (
                    <li
                      key={idx}
                      className="rounded-[14px] border border-[#1E1E1E] bg-[#111111] p-[14px] text-[#ECECEC]"
                    >
                      {v}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick actions */}
              <div className="rounded-[18px] border border-[#1E1E1E] bg-[#0D0D0D] p-6">
                <h2
                  className="mb-4 text-[30px] font-black"
                  style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
                >
                  QUICK ACTIONS
                </h2>
                <Link
                  to="/exercises"
                  aria-label="Return to the exercise library"
                  className="block w-full rounded-xl border border-[#00E5FF] p-[14px] text-center font-bold text-[#00E5FF] no-underline"
                >
                  Back to Library
                </Link>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}


