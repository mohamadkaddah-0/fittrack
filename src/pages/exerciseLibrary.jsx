import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  getUserProfile,
  dailyCalorieLog,
  workoutLog,
  EXERCISES,
  getCardioRatio,
  isRiskyForUser,
} from "../data/mockData";

// ── Load real user from survey ──────────────────────────────
const mockUser = getUserProfile();
const exercises = EXERCISES;

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────
function getCatColor(category) {
  return category === "Cardio" ? "#FF2A5E" : "#C6F135";
}

function getDiffColor(d) {
  if (d === "Beginner") return "#C6F135";
  if (d === "Intermediate") return "#FFAA00";
  return "#FF2A5E";
}

function pickRandom(array, n) {
  const copy = [...array];
  const result = [];
  while (result.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    result.push(copy[i]);
    copy.splice(i, 1);
  }
  return result;
}

function getMatchingExercises(goal, level, weightGoal) {
  const levelLower = (level || "beginner").toLowerCase();

  const byLevel = exercises.filter((ex) => {
    if (levelLower === "beginner") return ex.difficulty === "Beginner";
    if (levelLower === "intermediate") return ex.difficulty !== "Advanced";
    if (levelLower === "advanced") return true;
    if (levelLower === "athlete") return true;
    return true;
  });

  const cardioPool = byLevel.filter((ex) => ex.category === "Cardio");
  const strengthPool = byLevel.filter((ex) => ex.category === "Weightlifting");
  const ratio = getCardioRatio(weightGoal || "maintain");
  const cardioCount = Math.round(byLevel.length * ratio);
  const strengthCount = byLevel.length - cardioCount;

  return [
    ...cardioPool.slice(0, cardioCount),
    ...strengthPool.slice(0, strengthCount),
  ];
}

function getTodayCalories() {
  const today = new Date().toLocaleDateString();
  return dailyCalorieLog
    .filter((e) => e.date === today)
    .reduce((sum, e) => sum + e.caloriesBurned, 0);
}

// ─────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────
function PulseDot() {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: "#C6F135", animation: "pulse 2s ease-in-out infinite" }}
    />
  );
}

function ExerciseCard({ ex }) {
  const catColor = getCatColor(ex.category);
  const diffColor = getDiffColor(ex.difficulty);
  const initials = ex.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const hasWarning = isRiskyForUser(ex, mockUser.limitations);

  return (
    <article
      className="rounded-xl overflow-hidden transition-all duration-300 cursor-pointer"
      style={{ background: "#0D0D0D", border: `1px solid ${hasWarning ? "#FFAA00" : "#1E1E1E"}` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hasWarning ? "#FF2A5E" : "#C6F135";
        e.currentTarget.style.transform = "scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = hasWarning ? "#FFAA00" : "#1E1E1E";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <Link to={ex.link} className="block no-underline">
        <div
          className="h-32 flex items-center justify-center relative"
          style={{ background: "#111111", borderBottom: "1px solid #1E1E1E" }}
        >
          <span
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 900,
              fontSize: "56px",
              color: "#2A2A2A",
              userSelect: "none",
            }}
          >
            {initials}
          </span>

          <span
            className="absolute top-2 right-2 text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded border"
            style={{ color: diffColor, borderColor: diffColor + "66" }}
          >
            {ex.difficulty}
          </span>

          {hasWarning && (
            <span
              className="absolute top-2 left-2 text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded"
              style={{ background: "#FFAA00", color: "#080808" }}
            >
              ⚠ Caution
            </span>
          )}
        </div>

        <div className="p-4">
          {hasWarning && (
            <div
              className="rounded-lg px-3 py-2 mb-3 text-xs leading-5"
              style={{
                background: "rgba(255,170,0,0.1)",
                border: "1px solid rgba(255,170,0,0.4)",
                color: "#FFAA00",
              }}
            >
              ⚠ Not suitable for your limitations. Consult your doctor first.
            </div>
          )}

          <h3
            className="text-xl mb-1"
            style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, color: "#ECECEC" }}
          >
            {ex.name}
          </h3>

          <p className="flex items-center gap-2 text-xs uppercase tracking-widest mb-2" style={{ color: "#555555" }}>
            <span className="w-[7px] h-[7px] rounded-full flex-shrink-0 inline-block" style={{ background: catColor }} />
            {ex.category}
          </p>

          <p className="text-xs leading-6 mb-3" style={{ color: "#555555" }}>
            {ex.desc}
          </p>

          <span
            className="inline-block text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded mb-3"
            style={{ color: "#FFAA00", border: "1px solid rgba(255,170,0,0.3)" }}
          >
            {ex.kcalRange} kcal / 10 min
          </span>

          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "#333333" }}>
            {ex.muscles}
          </p>

          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#00E5FF" }}>
            Open exercise page →
          </p>
        </div>
      </Link>
    </article>
  );
}

function PlanDayCard({
  day,
  isRest,
  picks,
  isDay14,
  onDay14Click,
  intensityBoostCount,
  completedPlanItems,
  onToggleDone,
}) {
  function getBoostedRange(rangeString) {
    if (intensityBoostCount === 0) return rangeString;
    const parts = rangeString.split("–");
    if (parts.length !== 2) return rangeString;
    const mult = Math.pow(1.15, intensityBoostCount);
    return Math.round(parseInt(parts[0]) * mult) + "–" + Math.round(parseInt(parts[1]) * mult);
  }

  return (
    <div
      className="rounded-xl p-3 transition-all duration-200"
      style={{
        background: "#0D0D0D",
        border: isDay14 ? "1px solid #C6F135" : "1px solid #1E1E1E",
        cursor: isDay14 ? "pointer" : "default",
      }}
      onClick={isDay14 ? onDay14Click : undefined}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <p
        style={{
          fontFamily: "'Barlow Condensed',sans-serif",
          fontWeight: 900,
          fontSize: "30px",
          lineHeight: 1,
          color: "#2A2A2A",
          marginBottom: "8px",
        }}
      >
        {String(day).padStart(2, "0")}
      </p>

      {isRest ? (
        <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#333333" }}>
          Rest Day
        </p>
      ) : (
        picks.map((ex) => {
          const done = completedPlanItems[`${day}-${ex.id}`];

          return (
            <div key={ex.id} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: getCatColor(ex.category),
                    }}
                  />
                  <Link
                    to={ex.link}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: done ? "#C6F135" : "#00E5FF",
                      textDecoration: "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => { e.target.style.color = "#C6F135"; }}
                    onMouseLeave={(e) => { e.target.style.color = done ? "#C6F135" : "#00E5FF"; }}
                  >
                    {ex.name}
                  </Link>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleDone(day, ex.id);
                  }}
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: `1px solid ${done ? "#C6F135" : "#555555"}`,
                    background: done ? "#C6F135" : "transparent",
                    color: done ? "#080808" : "#555555",
                    fontSize: "11px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    cursor: "pointer",
                  }}
                >
                  {done ? "✓" : ""}
                </button>
              </div>

              <p
                style={{
                  fontSize: "9px",
                  color: intensityBoostCount > 0 ? "#FFAA00" : "#555555",
                  marginLeft: "11px",
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

      {isDay14 && (
        <p
          style={{
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#C6F135",
            marginTop: "8px",
          }}
        >
          Tap to Finish
        </p>
      )}
    </div>
  );
}

function LogModal({ onClose, onSave }) {
  const [selectedId, setSelectedId] = useState(exercises[0].id);
  const [intensity, setIntensity] = useState(1.0);
  const [duration, setDuration] = useState(20);
  const [setsRc, setSetsRc] = useState(3);
  const [repsRc, setRepsRc] = useState(15);
  const [setsBw, setSetsBw] = useState(3);
  const [repsBw, setRepsBw] = useState(10);
  const [setsW, setSetsW] = useState(3);
  const [repsW, setRepsW] = useState(8);
  const [weightKg, setWeightKg] = useState(20);

  const ex = exercises.find((e) => e.id === selectedId);

  function calcBurned() {
    if (!ex) return 0;
    if (ex.logType === "duration") return Math.round(ex.met * mockUser.weight * (duration / 60) * intensity);
    if (ex.logType === "reps-cardio") return Math.round(setsRc * repsRc * ex.kcalPerRep);
    if (ex.logType === "bodyweight") return Math.round(setsBw * repsBw * ex.kcalPerRep);
    if (ex.logType === "weighted") return Math.round(setsW * repsW * weightKg * 0.1);
    return 0;
  }

  function getFormula() {
    if (!ex) return "";
    if (ex.logType === "duration") return `MET ${ex.met} × ${mockUser.weight}kg × ${duration}min × ${intensity}`;
    if (ex.logType === "reps-cardio") return `${setsRc} sets × ${repsRc} reps × ${ex.kcalPerRep} kcal/rep`;
    if (ex.logType === "bodyweight") return `${setsBw} sets × ${repsBw} reps × ${ex.kcalPerRep} kcal/rep`;
    if (ex.logType === "weighted") return `${setsW} sets × ${repsW} reps × ${weightKg}kg × 0.1`;
    return "";
  }

  function getBadge() {
    if (!ex) return { label: "Select an exercise", color: "#555555" };
    if (ex.logType === "duration") return { label: "Cardio — Duration + Intensity", color: "#FF2A5E" };
    if (ex.logType === "reps-cardio") return { label: "Cardio — Sets + Reps", color: "#FF2A5E" };
    if (ex.logType === "bodyweight") return { label: "Bodyweight — Sets + Reps", color: "#C6F135" };
    if (ex.logType === "weighted") return { label: "Weighted — Sets + Reps + kg", color: "#FFAA00" };
  }

  function handleSave() {
    if (!ex) return;
    const today = new Date().toLocaleDateString();
    const burned = calcBurned();
    const entry = { date: today, exerciseId: ex.id, exerciseName: ex.name, logType: ex.logType, caloriesBurned: burned };

    if (ex.logType === "duration") {
      entry.minutesDone = duration;
      entry.intensity = intensity;
    }
    if (ex.logType === "reps-cardio") {
      entry.sets = setsRc;
      entry.reps = repsRc;
    }
    if (ex.logType === "bodyweight") {
      entry.sets = setsBw;
      entry.reps = repsBw;
    }
    if (ex.logType === "weighted") {
      entry.sets = setsW;
      entry.reps = repsW;
      entry.weightKg = weightKg;
    }

    workoutLog.push(entry);
    dailyCalorieLog.push({
      date: today,
      exerciseId: ex.id,
      exerciseName: ex.name,
      caloriesBurned: burned,
    });

    onSave(burned, ex);
  }

  const badge = getBadge();
  const burned = calcBurned();
  const inputCls = "w-full rounded-lg px-4 py-3 text-sm font-mono focus:outline-none transition-colors";
  const inputStyle = { background: "#111111", border: "1px solid #1E1E1E", color: "#ECECEC" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl w-full max-w-md p-6"
        style={{ background: "#0D0D0D", border: "1px solid #1E1E1E", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "30px", color: "#ECECEC" }}>
            LOG WORKOUT
          </h2>
          <button
            onClick={onClose}
            className="text-xl font-bold"
            style={{ color: "#555555", background: "transparent", border: 0 }}
            onMouseEnter={(e) => (e.target.style.color = "#ECECEC")}
            onMouseLeave={(e) => (e.target.style.color = "#555555")}
          >
            ✕
          </button>
        </div>

        <span
          className="inline-block text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded mb-5"
          style={{ border: `1px solid ${badge.color}66`, color: badge.color }}
        >
          {badge.label}
        </span>

        <div className="flex flex-col gap-2 mb-5">
          <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#555555" }}>
            Exercise
          </label>
          <select value={selectedId} onChange={(e) => setSelectedId(parseInt(e.target.value))} className={inputCls} style={inputStyle}>
            {exercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        {ex?.logType === "duration" && (
          <div className="flex flex-col gap-4 mb-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#555555" }}>
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                className={inputCls}
                style={inputStyle}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#555555" }}>
                Intensity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[["Low", 0.8], ["Moderate", 1.0], ["High", 1.3]].map(([label, val]) => (
                  <button
                    key={label}
                    onClick={() => setIntensity(val)}
                    className="py-3 text-xs font-bold tracking-widest uppercase rounded-lg"
                    style={{
                      border: `1px solid ${intensity === val ? "#C6F135" : "#2A2A2A"}`,
                      color: intensity === val ? "#C6F135" : "#555555",
                      background: "transparent",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {ex?.logType === "reps-cardio" && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#555555" }}>
                Sets
              </label>
              <input type="number" min="1" value={setsRc} onChange={(e) => setSetsRc(parseInt(e.target.value) || 0)} className={inputCls} style={inputStyle} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#555555" }}>
                Reps per Set
              </label>
              <input type="number" min="1" value={repsRc} onChange={(e) => setRepsRc(parseInt(e.target.value) || 0)} className={inputCls} style={inputStyle} />
            </div>
          </div>
        )}

        {ex?.logType === "bodyweight" && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#555555" }}>
                Sets
              </label>
              <input type="number" min="1" value={setsBw} onChange={(e) => setSetsBw(parseInt(e.target.value) || 0)} className={inputCls} style={inputStyle} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#555555" }}>
                Reps per Set
              </label>
              <input type="number" min="1" value={repsBw} onChange={(e) => setRepsBw(parseInt(e.target.value) || 0)} className={inputCls} style={inputStyle} />
            </div>
          </div>
        )}

        {ex?.logType === "weighted" && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#555555" }}>
                Sets
              </label>
              <input type="number" min="1" value={setsW} onChange={(e) => setSetsW(parseInt(e.target.value) || 0)} className={inputCls} style={inputStyle} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#555555" }}>
                Reps
              </label>
              <input type="number" min="1" value={repsW} onChange={(e) => setRepsW(parseInt(e.target.value) || 0)} className={inputCls} style={inputStyle} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold tracking-widest uppercase" style={{ color: "#555555" }}>
                Weight kg
              </label>
              <input type="number" min="0" step="2.5" value={weightKg} onChange={(e) => setWeightKg(parseInt(e.target.value) || 0)} className={inputCls} style={inputStyle} />
            </div>
          </div>
        )}

        <div className="rounded-xl px-5 py-4 mb-5" style={{ background: "#111111", border: "1px solid #1E1E1E" }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#555555" }}>
              Estimated Calories Burned
            </p>
            <p className="font-bold" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "32px", lineHeight: 1, color: "#FFAA00" }}>
              {burned} kcal
            </p>
          </div>
          <p className="text-[10px]" style={{ color: "#333333" }}>
            {getFormula()}
          </p>
        </div>

        <button
          onClick={handleSave}
          className="w-full text-xs font-bold tracking-widest uppercase py-3 rounded-lg transition-colors"
          style={{ background: "#C6F135", color: "#080808" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#FF2A5E")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#C6F135")}
        >
          Save Workout →
        </button>
      </div>
    </div>
  );
}

function PlanCompleteModal({ userLevel, intensityBoostCount, onContinue, onClose }) {
  const totalKcal = workoutLog.reduce((sum, e) => sum + e.caloriesBurned, 0);
  const levels = ["beginner", "intermediate", "advanced", "athlete"];
  const idx = levels.indexOf(userLevel);

  function getBtnLabel() {
    if (intensityBoostCount < 3) return `Continue — Same Level, +15% Reps (${3 - intensityBoostCount} boosts left) →`;
    if (idx < levels.length - 1) return `Advance to ${levels[idx + 1].charAt(0).toUpperCase() + levels[idx + 1].slice(1)} Level →`;
    return "Continue — Max Level (+15% More Reps) →";
  }

  function getBtnColor() {
    if (intensityBoostCount < 3) return "#C6F135";
    if (idx < levels.length - 1) return "#00E5FF";
    return "#FF2A5E";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="rounded-2xl w-full max-w-lg p-8" style={{ background: "#0D0D0D", border: "1px solid #1E1E1E" }}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(198,241,53,0.1)", border: "2px solid #C6F135" }}
        >
          <span className="text-2xl font-bold" style={{ color: "#C6F135" }}>
            ✓
          </span>
        </div>

        <h2 className="text-4xl text-center mb-2" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, color: "#ECECEC" }}>
          PLAN COMPLETE
        </h2>
        <p className="text-xs font-bold tracking-widest uppercase text-center mb-8" style={{ color: "#555555" }}>
          14 days finished
        </p>

        <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden mb-8" style={{ background: "#1E1E1E" }}>
          {[
            { label: "Workouts Logged", value: workoutLog.length, color: "#C6F135" },
            { label: "Calories Burned", value: totalKcal, color: "#FFAA00" },
            { label: "Current Level", value: userLevel.slice(0, 3).toUpperCase(), color: "#00E5FF" },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-5 text-center" style={{ background: "#111111" }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#555555" }}>
                {stat.label}
              </p>
              <p className="font-bold" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "32px", lineHeight: 1, color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <p className="text-sm text-center leading-7 mb-6" style={{ color: "#555555" }}>
          Great work finishing your 14-day plan.
          <br />
          What would you like to do next?
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="w-full text-xs font-bold tracking-widest uppercase py-4 rounded-xl transition-colors"
            style={{ background: getBtnColor(), color: getBtnColor() === "#FF2A5E" ? "#ECECEC" : "#080808", border: 0 }}
          >
            {getBtnLabel()}
          </button>

          <Link
            to="/profile"
            className="block w-full text-center text-xs font-bold tracking-widest uppercase py-4 rounded-xl no-underline"
            style={{ border: "1px solid #00E5FF", color: "#00E5FF" }}
          >
            Update My Profile — Fresh Plan →
          </Link>

          <button
            onClick={onClose}
            className="w-full text-xs font-bold tracking-widest uppercase py-4 rounded-xl transition-colors"
            style={{ border: "1px solid #2A2A2A", color: "#555555", background: "transparent" }}
          >
            I'll Decide Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExerciseLibrary() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterDiff, setFilterDiff] = useState("All");
  const [userLevel, setUserLevel] = useState(mockUser.level);
  const [boostCount, setBoostCount] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [todayKcal, setTodayKcal] = useState(0);
  const [toastMsg, setToastMsg] = useState(null);
  const [completedPlanItems, setCompletedPlanItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("completedPlanItems")) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("completedPlanItems", JSON.stringify(completedPlanItems));
  }, [completedPlanItems]);

  const planDaysRef = useRef(null);
  if (!planDaysRef.current) {
    planDaysRef.current = buildPlanDays(userLevel);
  }

  useEffect(() => {
    planDaysRef.current = buildPlanDays(userLevel);
  }, [userLevel, boostCount]);

  function buildPlanDays(level) {
    const pool = getMatchingExercises(mockUser.goal, level, mockUser.weightGoal);
    const lastUsed = {};
    const days = [];

    for (let day = 1; day <= 14; day++) {
      const isRest = day % 4 === 0 && day !== 14;
      const count = day % 3 === 0 ? 3 : 2;
      let picks = [];

      if (!isRest) {
        const available = pool.filter((ex) => !lastUsed[ex.id] || day - lastUsed[ex.id] >= 3);
        const source = available.length >= count ? available : pool;
        picks = pickRandom(source, count);
        picks.forEach((ex) => {
          lastUsed[ex.id] = day;
        });
      }

      days.push({ day, isRest, picks });
    }

    return days;
  }

  function showToast(text, color = "#C6F135") {
    setToastMsg({ text, color });
    setTimeout(() => setToastMsg(null), 3500);
  }

  function toggleExerciseDone(day, exerciseId) {
    const key = `${day}-${exerciseId}`;
    setCompletedPlanItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function handleLogSave(burned, ex) {
    setLogOpen(false);
    setTodayKcal(getTodayCalories());

    const matchDay = planDaysRef.current.find((d) => d.picks.some((p) => p.id === ex.id));
    if (matchDay) {
      const key = `${matchDay.day}-${ex.id}`;
      setCompletedPlanItems((prev) => ({
        ...prev,
        [key]: true,
      }));
    }

    showToast(`${ex.name} logged · ${burned} kcal burned`);
  }

  function handlePlanContinue() {
    const levels = ["beginner", "intermediate", "advanced", "athlete"];
    const idx = levels.indexOf(userLevel);

    if (boostCount < 3) {
      const next = boostCount + 1;
      setBoostCount(next);
      showToast(`Reps +${Math.round((Math.pow(1.15, next) - 1) * 100)}% · Level stays ${userLevel}`);
    } else if (idx < levels.length - 1) {
      setUserLevel(levels[idx + 1]);
      setBoostCount(0);
      showToast(`Level advanced to ${levels[idx + 1].toUpperCase()}`, "#00E5FF");
    } else {
      const next = boostCount + 1;
      setBoostCount(next);
      showToast(`Already Max Level · Reps +${Math.round((Math.pow(1.15, next) - 1) * 100)}%`, "#FF2A5E");
    }

    setPlanOpen(false);
  }

  const filtered = exercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterCat === "All" || ex.category === filterCat) &&
      (filterDiff === "All" || ex.difficulty === filterDiff)
  );

  const weeks = Math.ceil(mockUser.totalGoal / mockUser.weeklyTarget);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        * { font-family: 'JetBrains Mono', monospace; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(198,241,53,0.5); } 50% { box-shadow: 0 0 0 6px rgba(198,241,53,0); } }
        @keyframes popIn { from { opacity:0; transform: scale(0.95) translateY(10px); } to { opacity:1; transform: scale(1) translateY(0); } }
        .a1 { animation: fadeUp 0.5s ease 0.10s both; }
        .a2 { animation: fadeUp 0.5s ease 0.25s both; }
        .a3 { animation: fadeUp 0.5s ease 0.40s both; }
        .a4 { animation: fadeUp 0.5s ease 0.55s both; }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px);
          pointer-events: none;
          z-index: 9999;
        }
        select option { background: #0D0D0D; color: #ECECEC; }
      `}</style>

      <div style={{ background: "#080808", color: "#ECECEC", minHeight: "100vh", overflowX: "hidden" }}>
        <Navbar />

        <main className="max-w-6xl mx-auto px-6 md:px-10 py-12">
          <header className="relative mb-14">
            <span
              aria-hidden="true"
              style={{
                fontFamily: "'Barlow Condensed',sans-serif",
                fontWeight: 900,
                fontSize: "clamp(90px,20vw,200px)",
                color: "transparent",
                WebkitTextStroke: "1px #1E1E1E",
                lineHeight: 1,
                userSelect: "none",
                pointerEvents: "none",
                position: "absolute",
                top: "-10px",
                left: "-5px",
                zIndex: 0,
              }}
            >
              EX
            </span>

            <div className="relative z-10">
              <p className="a1 flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#FF2A5E" }}>
                <PulseDot /> Welcome back, {mockUser.name}
              </p>

              <h1
                className="a2 mb-4"
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(56px,10vw,100px)",
                  lineHeight: 1.05,
                }}
              >
                EXERCISE
                <br />
                <span style={{ color: "transparent", WebkitTextStroke: "2px #C6F135" }}>LIBRARY</span>
              </h1>

              <p className="a3 text-sm leading-7 max-w-lg" style={{ color: "#555555" }}>
                Your personalized 14-day plan is built from your profile. Each card opens its own full training page.
              </p>
            </div>
          </header>

          <section className="a3 mb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "36px", color: "#ECECEC" }}>
                YOUR PLAN
              </h2>

              <button
                onClick={() => setLogOpen(true)}
                className="text-xs font-bold tracking-widest uppercase px-6 py-3 rounded-lg transition-colors"
                style={{ background: "#C6F135", color: "#080808" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FF2A5E")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#C6F135")}
              >
                + Log Workout
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-xl overflow-hidden mb-4" style={{ background: "#1E1E1E" }}>
              {[
                { label: "Goal", value: mockUser.goal.toUpperCase(), color: "#C6F135" },
                { label: "Level", value: userLevel.toUpperCase(), color: "#00E5FF" },
                { label: "Weekly Target", value: mockUser.weeklyTarget + " kg / week", color: "#FF2A5E" },
              ].map((item) => (
                <div key={item.label} className="px-5 py-4" style={{ background: "#0D0D0D" }}>
                  <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#555555" }}>
                    {item.label}
                  </p>
                  <p className="font-bold text-sm" style={{ color: item.color }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-xs mb-6" style={{ color: "#333333" }}>
              Not your info?{" "}
              <Link to="/profile" className="no-underline border-b" style={{ color: "#555555", borderColor: "#333333" }}>
                Update your profile →
              </Link>
            </p>
          </section>

          <div
            className="a3 rounded-xl px-6 py-5 mb-6 flex flex-wrap items-center justify-between gap-4"
            style={{ background: "#0D0D0D", border: "1px solid #1E1E1E" }}
          >
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#555555" }}>
                Today's Calories Burned
              </p>
              <p
                className="font-bold"
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontSize: "36px",
                  lineHeight: 1,
                  color: "#FFAA00",
                }}
              >
                {todayKcal} kcal
              </p>
              <p className="text-xs mt-1" style={{ color: "#333333" }}>
                from workouts logged today
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#555555" }}>
                Shared With
              </p>
              <p className="text-xs font-bold" style={{ color: "#00E5FF" }}>
                Meal Planner ✓
              </p>
              <p className="text-[10px] mt-1" style={{ color: "#333333" }}>
                via dailyCalorieLog in mockData.js
              </p>
            </div>
          </div>

          <div className="a4 mb-16">
            <Link
              to="/tracker"
              className="inline-flex items-center gap-3 rounded-lg px-5 py-3 text-xs font-bold tracking-widest uppercase no-underline transition-colors"
              style={{ border: "1px solid #2A2A2A", color: "#555555" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#00E5FF";
                e.currentTarget.style.color = "#00E5FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#2A2A2A";
                e.currentTarget.style.color = "#555555";
              }}
            >
              <PulseDot /> Open Personal Tracker →
            </Link>
          </div>

          <section className="mb-16">
            <div className="flex flex-wrap items-baseline gap-3 mb-6">
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "36px", color: "#ECECEC" }}>
                14-DAY PLAN
              </h2>
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#333333" }}>
                {mockUser.goal} · {userLevel} · {weeks} weeks total
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {planDaysRef.current.map(({ day, isRest, picks }) => (
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
                />
              ))}
            </div>
          </section>

          <hr style={{ borderColor: "#1E1E1E", marginBottom: "64px" }} />

          <section className="mb-6">
            <div className="flex flex-wrap items-baseline gap-3 mb-6">
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "36px", color: "#ECECEC" }}>
                ALL EXERCISES
              </h2>
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#333333" }}>
                {filtered.length} exercise{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6" style={{ background: "#0D0D0D", border: "1px solid #1E1E1E" }}>
              <input
                type="text"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg px-4 py-3 text-sm focus:outline-none font-mono"
                style={{ background: "#080808", border: "1px solid #2A2A2A", color: "#ECECEC" }}
              />

              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                className="rounded-lg px-4 py-3 text-sm focus:outline-none font-mono"
                style={{ background: "#080808", border: "1px solid #2A2A2A", color: "#ECECEC" }}
              >
                <option value="All">All Categories</option>
                <option value="Cardio">Cardio</option>
                <option value="Weightlifting">Weightlifting</option>
              </select>

              <select
                value={filterDiff}
                onChange={(e) => setFilterDiff(e.target.value)}
                className="rounded-lg px-4 py-3 text-sm focus:outline-none font-mono"
                style={{ background: "#080808", border: "1px solid #2A2A2A", color: "#ECECEC" }}
              >
                <option value="All">All Difficulty</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </section>

          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#333333" }}>
                No exercises match your filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((ex) => (
                <ExerciseCard key={ex.id} ex={ex} />
              ))}
            </div>
          )}
        </main>

        {logOpen && <LogModal onClose={() => setLogOpen(false)} onSave={handleLogSave} />}
        {planOpen && (
          <PlanCompleteModal
            userLevel={userLevel}
            intensityBoostCount={boostCount}
            onContinue={handlePlanContinue}
            onClose={() => setPlanOpen(false)}
          />
        )}

        {toastMsg && (
          <div
            className="fixed bottom-6 left-6 z-[999] rounded-xl px-5 py-3 text-sm font-mono"
            style={{ background: "#0D0D0D", border: `1px solid ${toastMsg.color}`, color: "#ECECEC" }}
          >
            {toastMsg.text}
          </div>
        )}
      </div>
    </>
  );
}
