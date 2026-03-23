import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  getUserProfile,
  workoutLog,
  EXERCISES,
  getCardioRatio,
  isRiskyForUser,
} from "../data/mockData";



const exercises = EXERCISES;

// ─── Colour helpers ───────────────────────────────────────────

function getCatColor(category) {
  return category === "Cardio" ? "#FF2A5E" : "#C6F135";
}

function getDiffColor(d) {
  if (d === "Beginner")     return "#C6F135";
  if (d === "Intermediate") return "#FFAA00";
  return "#FF2A5E";
}

// ─── Utility functions ────────────────────────────────────────

function pickRandom(array, n) {
  const copy   = [...array];
  const result = [];
  while (result.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    result.push(copy[i]);
    copy.splice(i, 1);
  }
  return result;
}

// My exercise matching algorithm — filters by level then applies
// a cardio-to-strength ratio based on the user's weight goal
function getMatchingExercises(goal, level, weightGoal) {
  const levelLower = (level || "beginner").toLowerCase();
  const byLevel = exercises.filter((ex) => {
    if (levelLower === "beginner")     return ex.difficulty === "Beginner";
    if (levelLower === "intermediate") return ex.difficulty !== "Advanced";
    if (levelLower === "advanced")     return true;
    if (levelLower === "athlete")      return true;
    return true;
  });
  const cardioPool    = byLevel.filter((ex) => ex.category === "Cardio");
  const strengthPool  = byLevel.filter((ex) => ex.category === "Weightlifting");
  const ratio         = getCardioRatio(weightGoal || "maintain");
  const cardioCount   = Math.round(byLevel.length * ratio);
  const strengthCount = byLevel.length - cardioCount;
  return [
    ...cardioPool.slice(0, cardioCount),
    ...strengthPool.slice(0, strengthCount),
  ];
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

// ─── Constants ────────────────────────────────────────────────

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// These colours match Sara's diet page exactly
const CAT_COLORS = {
  breakfast: "#FFAA00",
  lunch:     "#C6F135",
  snack:     "#00E5FF",
  dinner:    "#FF2A5E",
};

// I use purple for exercise dots — it is completely different from
// all meal dot colours so the user can always tell them apart
const EXERCISE_DOT_COLOR = "#A855F7";

// ─── Pulse dot ────────────────────────────────────────────────

function PulseDot() {
  return (
    <span style={{
      display: "inline-block", width: "8px", height: "8px",
      borderRadius: "50%", flexShrink: 0,
      background: "#C6F135", animation: "pulse 2s ease-in-out infinite",
    }} />
  );
}

// ─── Exercise card ────────────────────────────────────────────

function ExerciseCard({ ex, mockUser }) {
  const catColor   = getCatColor(ex.category);
  const diffColor  = getDiffColor(ex.difficulty);
  const hasWarning = isRiskyForUser(ex, mockUser.limitations);
  const [imgErr, setImgErr] = useState(false);
  const initials   = ex.name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <article
      style={{
        background: "#0D0D0D",
        border: `1px solid ${hasWarning ? "#FFAA00" : "#1E1E1E"}`,
        borderRadius: "12px", overflow: "hidden",
        transition: "all 0.3s", cursor: "pointer",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = hasWarning ? "#FF2A5E" : "#C6F135";
        e.currentTarget.style.transform = "scale(1.02)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = hasWarning ? "#FFAA00" : "#1E1E1E";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <Link to={ex.link} style={{ display: "block", textDecoration: "none" }}>
        <div style={{
          height: "144px", display: "flex", alignItems: "center",
          justifyContent: "center", position: "relative", overflow: "hidden",
          background: "#111111", borderBottom: "1px solid #1E1E1E",
        }}>
          {!imgErr && ex.image ? (
            <img src={ex.image} alt={ex.name} onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
          ) : (
            <span style={{
              fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900,
              fontSize: "56px", color: "#2A2A2A", userSelect: "none",
            }}>
              {initials}
            </span>
          )}
          <span style={{
            position: "absolute", top: "8px", right: "8px",
            fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "4px 8px", borderRadius: "6px",
            border: `1px solid ${diffColor}66`, color: diffColor,
            background: "rgba(0,0,0,0.7)",
          }}>
            {ex.difficulty}
          </span>
          {hasWarning && (
            <span style={{
              position: "absolute", top: "8px", left: "8px",
              fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", padding: "4px 8px", borderRadius: "6px",
              background: "#FFAA00", color: "#080808",
            }}>
              ⚠ Caution
            </span>
          )}
        </div>
        <div style={{ padding: "16px" }}>
          {hasWarning && (
            <div style={{
              borderRadius: "8px", padding: "8px 12px", marginBottom: "12px",
              fontSize: "12px", lineHeight: 1.6,
              background: "rgba(255,170,0,0.1)",
              border: "1px solid rgba(255,170,0,0.4)", color: "#FFAA00",
            }}>
              ⚠ Not suitable for your limitations. Consult your doctor first.
            </div>
          )}
          <h3 style={{
            fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900,
            fontSize: "20px", color: "#ECECEC", margin: "0 0 4px",
          }}>
            {ex.name}
          </h3>
          <p style={{
            display: "flex", alignItems: "center", gap: "8px",
            fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em",
            color: "#555555", margin: "0 0 8px",
          }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, display: "inline-block", background: catColor }} />
            {ex.category}
          </p>
          <p style={{ fontSize: "12px", lineHeight: 1.7, color: "#555555", margin: "0 0 12px" }}>{ex.desc}</p>
          <span style={{
            display: "inline-block", fontSize: "9px", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "4px 8px", borderRadius: "6px", marginBottom: "12px",
            color: "#FFAA00", border: "1px solid rgba(255,170,0,0.3)",
          }}>
            {ex.kcalRange} kcal / 10 min
          </span>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#333333", margin: "0 0 12px" }}>{ex.muscles}</p>
          <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#00E5FF", margin: 0 }}>
            Open exercise page →
          </p>
        </div>
      </Link>
    </article>
  );
}

// ─── Plan day card ────────────────────────────────────────────

// The tick button only appears on today's plan day.
// Past and future days are read-only — the user cannot fake progress.
function PlanDayCard({ day, isRest, picks, isDay14, onDay14Click, intensityBoostCount, completedPlanItems, onToggleDone, todayPlanDay }) {
  const allDone = !isRest && picks.length > 0 && picks.every(ex => completedPlanItems[`${day}-${ex.id}`]);
  const isToday = day === todayPlanDay;

  function getBoostedRange(r) {
    if (intensityBoostCount === 0) return r;
    const p = r.split("–");
    if (p.length !== 2) return r;
    const m = Math.pow(1.15, intensityBoostCount);
    return Math.round(parseInt(p[0]) * m) + "–" + Math.round(parseInt(p[1]) * m);
  }

  return (
    <div
      style={{
        background: "#0D0D0D", borderRadius: "12px", padding: "12px",
        transition: "transform 0.2s", cursor: isDay14 ? "pointer" : "default",
        border: allDone ? "1px solid #C6F135"
          : isDay14  ? "1px solid #C6F135"
          : isToday  ? "1px solid #00E5FF"
          : "1px solid #1E1E1E",
      }}
      onClick={isDay14 ? onDay14Click : undefined}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <p style={{
        fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900,
        fontSize: "30px", lineHeight: 1,
        color: isToday ? "#00E5FF" : "#2A2A2A", marginBottom: "8px",
      }}>
        {String(day).padStart(2, "0")}
      </p>

      {isToday && !allDone && (
        <p style={{
          fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "#00E5FF", marginBottom: "6px",
        }}>
          Today
        </p>
      )}

      {allDone && (
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          marginBottom: "8px", padding: "4px 8px",
          background: "rgba(198,241,53,0.1)",
          border: "1px solid rgba(198,241,53,0.4)", borderRadius: "6px",
        }}>
          <span style={{ color: "#C6F135", fontSize: "11px", fontWeight: 700 }}>✓</span>
          <span style={{ color: "#C6F135", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Day Complete
          </span>
        </div>
      )}

      {isRest ? (
        <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#333333" }}>
          Rest Day
        </p>
      ) : (
        picks.map(ex => {
          const done    = completedPlanItems[`${day}-${ex.id}`];
          const canTick = isToday;
          return (
            <div key={ex.id} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
                  <span style={{
                    display: "inline-block", width: "7px", height: "7px",
                    borderRadius: "50%", flexShrink: 0,
                    background: getCatColor(ex.category),
                  }} />
                  <Link to={ex.link}
                    onClick={e => e.stopPropagation()}
                    style={{
                      fontSize: "11px", fontWeight: 700,
                      color: done ? "#C6F135" : "#00E5FF",
                      textDecoration: "none", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => { e.target.style.color = "#C6F135"; }}
                    onMouseLeave={e => { e.target.style.color = done ? "#C6F135" : "#00E5FF"; }}
                  >
                    {ex.name}
                  </Link>
                </div>
                {canTick && (
                  <button
                    onClick={e => { e.stopPropagation(); onToggleDone(day, ex.id); }}
                    aria-label={done ? `Mark ${ex.name} as not done` : `Mark ${ex.name} as done`}
                    style={{
                      width: "18px", height: "18px", borderRadius: "50%",
                      border: `1px solid ${done ? "#C6F135" : "#555555"}`,
                      background: done ? "#C6F135" : "transparent",
                      color: done ? "#080808" : "#555555",
                      fontSize: "11px", fontWeight: "bold",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, cursor: "pointer",
                    }}
                  >
                    {done ? "✓" : ""}
                  </button>
                )}
              </div>
              <p style={{
                fontSize: "9px",
                color: intensityBoostCount > 0 ? "#FFAA00" : "#555555",
                marginLeft: "12px",
                textDecoration: done ? "line-through" : "none",
                opacity: done ? 0.7 : 1,
              }}>
                {getBoostedRange(ex.kcalRange)} kcal/10min
              </p>
            </div>
          );
        })
      )}

      {isDay14 && !allDone && (
        <p style={{
          fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "#C6F135", marginTop: "8px",
        }}>
          Tap to Finish
        </p>
      )}
    </div>
  );
}

// ─── Plan complete modal ──────────────────────────────────────

function PlanCompleteModal({ userLevel, intensityBoostCount, onContinue, onClose }) {
  const totalKcal = workoutLog.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);
  const levels    = ["beginner", "intermediate", "advanced", "athlete"];
  const idx       = levels.indexOf(userLevel);
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
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", background: "rgba(0,0,0,0.85)",
    }}>
      <div style={{
        borderRadius: "16px", width: "100%", maxWidth: "512px",
        padding: "32px", background: "#0D0D0D", border: "1px solid #1E1E1E",
      }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          background: "rgba(198,241,53,0.1)", border: "2px solid #C6F135",
        }}>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "#C6F135" }}>✓</span>
        </div>
        <h2 style={{
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900,
          fontSize: "36px", textAlign: "center", color: "#ECECEC",
          margin: "0 0 8px",
        }}>
          PLAN COMPLETE
        </h2>
        <p style={{
          fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", textAlign: "center",
          color: "#555555", margin: "0 0 32px",
        }}>
          14 days finished
        </p>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)",
          gap: "1px", borderRadius: "12px", overflow: "hidden",
          background: "#1E1E1E", marginBottom: "32px",
        }}>
          {[
            { label: "Workouts Logged", value: workoutLog.length,                  color: "#C6F135" },
            { label: "Calories Burned", value: totalKcal,                          color: "#FFAA00" },
            { label: "Current Level",   value: userLevel.slice(0,3).toUpperCase(), color: "#00E5FF" },
          ].map(stat => (
            <div key={stat.label} style={{ padding: "20px 16px", textAlign: "center", background: "#111111" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555555", margin: "0 0 8px" }}>{stat.label}</p>
              <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "32px", fontWeight: 700, lineHeight: 1, color: stat.color, margin: 0 }}>{stat.value}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "14px", textAlign: "center", lineHeight: 1.7, color: "#555555", margin: "0 0 24px" }}>
          Great work finishing your 14-day plan.<br />What would you like to do next?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button onClick={onContinue} style={{
            width: "100%", padding: "16px",
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", borderRadius: "12px", border: 0,
            cursor: "pointer",
            background: getBtnColor(),
            color: getBtnColor() === "#FF2A5E" ? "#ECECEC" : "#080808",
          }}>
            {getBtnLabel()}
          </button>
          <Link to="/profile" style={{
            display: "block", width: "100%", textAlign: "center",
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "16px", borderRadius: "12px",
            textDecoration: "none",
            border: "1px solid #00E5FF", color: "#00E5FF",
          }}>
            Update My Profile — Fresh Plan →
          </Link>
          <button onClick={onClose} style={{
            width: "100%", padding: "16px",
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", borderRadius: "12px",
            border: "1px solid #2A2A2A", color: "#555555",
            background: "transparent", cursor: "pointer",
          }}>
            I'll Decide Later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Workout calendar ─────────────────────────────────────────

// I fixed two bugs here:
// 1. Exercises were showing on every day — now I use exerciseLogByDate
//    which stores exercises per specific date key (YYYY-MM-DD)
// 2. Exercise dots were red/amber which clashed with meal dots —
//    now exercise dots are always purple (#A855F7)
//
// The calendar reads calendarData from App.jsx (Sara's meals)
// and exerciseLogByDate from my own localStorage (my exercise ticks)
function WorkoutCalendar({ planDays, calendarData, exerciseLogByDate }) {
  const todayKey  = getTodayKey();
  const todayDate = new Date();
  const [calYear,  setCalYear]  = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth());
  const [selected, setSelected] = useState(todayKey);
  const allCalendar = calendarData || {};

  function changeMonth(dir) {
    setCalMonth(prev => {
      let m = prev + dir;
      if (m < 0)  { setCalYear(y => y - 1); return 11; }
      if (m > 11) { setCalYear(y => y + 1); return 0;  }
      return m;
    });
  }

  function buildCells() {
    const firstDay   = new Date(calYear, calMonth, 1).getDay();
    const daysInMon  = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrev = new Date(calYear, calMonth, 0).getDate();
    const total      = firstDay + daysInMon;
    const gridSize   = total + (7 - (total % 7)) % 7;
    const cells      = [];

    for (let i = 0; i < gridSize; i++) {
      let day, month = calMonth, year = calYear, other = false;
      if (i < firstDay) {
        day = daysInPrev - (firstDay - 1 - i);
        month = calMonth - 1;
        if (month < 0) { month = 11; year = calYear - 1; }
        other = true;
      } else if (i >= firstDay + daysInMon) {
        day = i - firstDay - daysInMon + 1;
        month = calMonth + 1;
        if (month > 11) { month = 0; year = calYear + 1; }
        other = true;
      } else {
        day = i - firstDay + 1;
      }

      const dateKey  = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const entries  = allCalendar[dateKey] || [];
      const meals    = entries.filter(e => e.type !== "workout");

      // I read exercises per date from exerciseLogByDate
      // so only exercises logged on this specific date appear as dots
      const exForDate = exerciseLogByDate[dateKey] || [];

      cells.push({
        day, dateKey, other,
        isToday:    dateKey === todayKey,
        isSelected: dateKey === selected,
        meals,
        exCount: exForDate.length,
      });
    }
    return cells;
  }

  const cells         = buildCells();
  const selectedEntry = allCalendar[selected] || [];
  const selectedMeals = selectedEntry.filter(e => e.type !== "workout");

  // Only show exercises that were actually logged on the selected date
  const selectedExercises = exerciseLogByDate[selected] || [];

  return (
    <section style={{ marginBottom: "64px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "12px", marginBottom: "24px" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(28px,5vw,36px)", color: "#ECECEC", margin: 0 }}>
          CALENDAR
        </h2>
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#333333" }}>
          exercises + meals
        </span>
      </div>

      <div className="cal-grid">
        {/* Calendar grid */}
        <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #1E1E1E" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 20px", borderBottom: "1px solid #1E1E1E", background: "#0D0D0D",
          }}>
            <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "20px", margin: 0 }}>
              <span style={{ color: "#C6F135" }}>{MONTHS_FULL[calMonth]}</span>
              <span style={{ color: "#555555", fontSize: "16px", marginLeft: "8px" }}>{calYear}</span>
            </p>
            <div style={{ display: "flex" }}>
              {[["‹", -1], ["›", 1]].map(([lbl, dir]) => (
                <button key={lbl} onClick={() => changeMonth(dir)}
                  style={{
                    width: "32px", height: "32px",
                    border: "1px solid #1E1E1E",
                    borderRight: dir === -1 ? "none" : "1px solid #1E1E1E",
                    color: "#555555", background: "transparent",
                    cursor: "pointer", fontSize: "14px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#C6F135"; e.currentTarget.style.color = "#080808"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#555555"; }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid #1E1E1E" }}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} style={{
                padding: "8px 0", textAlign: "center",
                fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase",
                color: "#555555", borderRight: "1px solid #1E1E1E",
              }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "#080808" }}>
            {cells.map(cell => (
              <button key={cell.dateKey}
                disabled={cell.other}
                onClick={() => !cell.other && setSelected(cell.dateKey)}
                style={{
                  borderRight: "1px solid #1E1E1E",
                  borderBottom: "1px solid #1E1E1E",
                  borderTop: "none", borderLeft: "none",
                  minHeight: "44px", padding: "4px",
                  display: "flex", flexDirection: "column", alignItems: "flex-start",
                  background: cell.isSelected
                    ? "rgba(198,241,53,0.1)"
                    : cell.isToday
                    ? "rgba(198,241,53,0.05)"
                    : "transparent",
                  opacity: cell.other ? 0.2 : 1,
                  cursor: cell.other ? "default" : "pointer",
                }}>
                <span style={{
                  fontSize: "12px", fontWeight: 700, lineHeight: 1,
                  marginBottom: "4px",
                  color: cell.isToday ? "#C6F135" : "#ECECEC",
                }}>
                  {cell.day}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                  {/* Meal dots from Sara's diet page */}
                  {cell.meals.slice(0, 3).map((m, i) => (
                    <div key={`m-${i}`} style={{
                      width: "4px", height: "4px", borderRadius: "50%",
                      background: CAT_COLORS[m.cat] || "#555",
                    }} title={m.name} />
                  ))}
                  {/* Exercise dots — always purple, never clash with meal colours */}
                  {Array.from({ length: Math.min(cell.exCount, 3) }).map((_, i) => (
                    <div key={`e-${i}`} style={{
                      width: "4px", height: "4px", borderRadius: "50%",
                      background: EXERCISE_DOT_COLOR,
                    }} title="Exercise done" />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div style={{
          borderRadius: "12px", padding: "16px",
          display: "flex", flexDirection: "column", gap: "12px",
          background: "#0D0D0D", border: "1px solid #1E1E1E",
        }}>
          <p style={{
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#FF2A5E", margin: 0,
          }}>
            {MONTHS_SHORT[parseInt(selected.split("-")[1]) - 1]}{" "}
            {parseInt(selected.split("-")[2])},{" "}
            {selected.split("-")[0]}
          </p>

          {/* Meals — from Sara's diet page */}
          {selectedMeals.length > 0 && (
            <div>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555555", margin: "0 0 8px" }}>
                Meals
              </p>
              {selectedMeals.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid #1E1E1E" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, background: CAT_COLORS[m.cat] || "#555" }} />
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "#ECECEC", margin: 0 }}>{m.name}</p>
                    <p style={{ fontSize: "10px", color: "#555555", margin: 0 }}>{m.cat} · {m.kcal} kcal</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Exercises done — only the ones ticked on this specific date */}
          {selectedExercises.length > 0 && (
            <div>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555555", margin: "0 0 8px" }}>
                Exercises Done
              </p>
              {selectedExercises.map((ex, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid #1E1E1E" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, background: EXERCISE_DOT_COLOR }} />
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#C6F135", margin: 0 }}>✓ {ex.name}</p>
                </div>
              ))}
            </div>
          )}

          {selectedMeals.length === 0 && selectedExercises.length === 0 && (
            <p style={{ fontSize: "12px", color: "#333333" }}>Nothing logged this day.</p>
          )}

          {/* Legend */}
          <div style={{ marginTop: "8px", paddingTop: "12px", borderTop: "1px solid #1E1E1E" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {Object.entries(CAT_COLORS).map(([cat, color]) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#555555" }}>{cat}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: EXERCISE_DOT_COLOR }} />
                <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#555555" }}>exercise</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────

export default function ExerciseLibrary({ calendarData = {}, addWorkoutToCalendar, currentUser }) {
  const mockUser = currentUser || getUserProfile();

  const [search,     setSearch]     = useState("");
  const [filterCat,  setFilterCat]  = useState("All");
  const [filterDiff, setFilterDiff] = useState("All");
  const [userLevel,  setUserLevel]  = useState(mockUser.level);
  const [boostCount, setBoostCount] = useState(0);
  const [planOpen,   setPlanOpen]   = useState(false);
  const [toastMsg,   setToastMsg]   = useState(null);

  const [completedPlanItems, setCompletedPlanItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("completedPlanItems")) || {}; }
    catch { return {}; }
  });

  // I store exercises per date so the calendar shows exactly which
  // exercises were ticked on which specific date — not all at once
  const [exerciseLogByDate, setExerciseLogByDate] = useState(() => {
    try { return JSON.parse(localStorage.getItem("exerciseLogByDate")) || {}; }
    catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem("completedPlanItems", JSON.stringify(completedPlanItems));
  }, [completedPlanItems]);

  useEffect(() => {
    localStorage.setItem("exerciseLogByDate", JSON.stringify(exerciseLogByDate));
  }, [exerciseLogByDate]);

  const planDaysRef = useRef(null);
  if (!planDaysRef.current) planDaysRef.current = buildPlanDays(userLevel);
  useEffect(() => { planDaysRef.current = buildPlanDays(userLevel); }, [userLevel, boostCount]);

  function buildPlanDays(level) {
    const pool = getMatchingExercises(mockUser.goal, level, mockUser.weightGoal);
    const lastUsed = {};
    const days = [];
    for (let day = 1; day <= 14; day++) {
      const isRest = day % 4 === 0 && day !== 14;
      const count  = day % 3 === 0 ? 3 : 2;
      let picks    = [];
      if (!isRest) {
        const available = pool.filter(ex => !lastUsed[ex.id] || day - lastUsed[ex.id] >= 3);
        const source    = available.length >= count ? available : pool;
        picks           = pickRandom(source, count);
        picks.forEach(ex => { lastUsed[ex.id] = day; });
      }
      days.push({ day, isRest, picks });
    }
    return days;
  }

  // Figures out which plan day is today by checking how many days
  // have passed since the plan start date stored in localStorage
  function getTodayPlanDay() {
    try {
      const startStr = localStorage.getItem("planStartDate");
      if (!startStr) {
        localStorage.setItem("planStartDate", getTodayKey());
        return 1;
      }
      const start    = new Date(startStr);
      const today    = new Date(getTodayKey());
      const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
      const dayNum   = diffDays + 1;
      return dayNum >= 1 && dayNum <= 14 ? dayNum : null;
    } catch { return null; }
  }

  const todayPlanDay = getTodayPlanDay();

  function showToast(text, color = "#C6F135") {
    setToastMsg({ text, color });
    setTimeout(() => setToastMsg(null), 3500);
  }

  // When the user ticks an exercise I save it to two places:
  // 1. completedPlanItems — drives the tick UI in the plan grid
  // 2. exerciseLogByDate  — drives the calendar dots per date
  // When unticked I remove it from both
  function toggleExerciseDone(day, exerciseId) {
    if (day !== todayPlanDay) return;
    const key    = `${day}-${exerciseId}`;
    const isDone = !completedPlanItems[key];
    const ex     = exercises.find(e => e.id === exerciseId);
    const today  = getTodayKey();

    setCompletedPlanItems(prev => ({ ...prev, [key]: isDone }));

    if (isDone) {
      // Add to date log so only today's exercises show on today's calendar cell
      setExerciseLogByDate(prev => ({
        ...prev,
        [today]: [...(prev[today] || []), { name: ex?.name || "Exercise", category: ex?.category || "Cardio" }],
      }));
      // Also push to shared App.jsx calendar for the dashboard
      if (addWorkoutToCalendar) {
        addWorkoutToCalendar(today, {
          name: ex?.name || "Exercise", category: ex?.category || "Cardio",
          kcal: 0, cat: "workout", type: "workout",
        });
      }
    } else {
      // Remove from date log when unticked
      setExerciseLogByDate(prev => {
        const existing = prev[today] || [];
        const idx      = existing.findIndex(e => e.name === (ex?.name || "Exercise"));
        if (idx === -1) return prev;
        const updated  = [...existing];
        updated.splice(idx, 1);
        return { ...prev, [today]: updated };
      });
    }
  }

  function handlePlanContinue() {
    const levels = ["beginner", "intermediate", "advanced", "athlete"];
    const idx    = levels.indexOf(userLevel);
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

  const filtered = exercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase()) &&
    (filterCat  === "All" || ex.category   === filterCat) &&
    (filterDiff === "All" || ex.difficulty === filterDiff)
  );

  const timelineLabel = mockUser.timeline || "Ongoing";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'JetBrains Mono', monospace; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100%{ box-shadow:0 0 0 0 rgba(198,241,53,0.5); } 50%{ box-shadow:0 0 0 6px rgba(198,241,53,0); } }
        .a1 { animation: fadeUp 0.5s ease 0.10s both; }
        .a2 { animation: fadeUp 0.5s ease 0.25s both; }
        .a3 { animation: fadeUp 0.5s ease 0.40s both; }
        body::before {
          content:''; position:fixed; inset:0; pointer-events:none; z-index:9999;
          background: repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px);
        }
        select option { background:#0D0D0D; color:#ECECEC; }

        /* Responsive plan grid — 2 cols mobile, 4 tablet, 7 desktop */
        .plan-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        @media (min-width: 640px)  { .plan-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1024px) { .plan-grid { grid-template-columns: repeat(7, 1fr); } }

        /* Responsive exercise cards — 1 col mobile, 2 tablet, 3 laptop, 4 desktop */
        .exercise-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 640px)  { .exercise-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .exercise-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1280px) { .exercise-grid { grid-template-columns: repeat(4, 1fr); } }

        /* Responsive plan summary stats */
        .plan-summary {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1px;
          border-radius: 12px;
          overflow: hidden;
          background: #1E1E1E;
          margin-bottom: 16px;
        }
        @media (min-width: 640px) { .plan-summary { grid-template-columns: repeat(3, 1fr); } }

        /* Responsive calendar — stacked mobile, side by side desktop */
        .cal-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 1024px) { .cal-grid { grid-template-columns: 1fr 300px; } }

        /* Responsive filter bar */
        .filter-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          background: #0D0D0D;
          border: 1px solid #1E1E1E;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        @media (min-width: 640px) { .filter-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>

      <div style={{ background: "#080808", color: "#ECECEC", minHeight: "100vh", overflowX: "hidden", fontFamily: "'JetBrains Mono', monospace" }}>
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "clamp(24px,5vw,48px) clamp(16px,4vw,40px)" }}>

          {/* Hero */}
          <header style={{ position: "relative", marginBottom: "56px" }}>
            <span aria-hidden="true" style={{
              fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900,
              fontSize: "clamp(90px,20vw,200px)", color: "transparent",
              WebkitTextStroke: "1px #1E1E1E", lineHeight: 1,
              userSelect: "none", pointerEvents: "none",
              position: "absolute", top: "-10px", left: "-5px", zIndex: 0,
            }}>EX</span>
            <div style={{ position: "relative", zIndex: 10 }}>
              <p className="a1" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#FF2A5E", marginBottom: "12px" }}>
                <PulseDot /> Welcome back, {mockUser.name}
              </p>
              <h1 className="a2" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(56px,10vw,100px)", lineHeight: 1.05, marginBottom: "16px" }}>
                EXERCISE<br />
                <span style={{ color: "transparent", WebkitTextStroke: "2px #C6F135" }}>LIBRARY</span>
              </h1>
              <p className="a3" style={{ fontSize: "14px", lineHeight: 1.7, maxWidth: "480px", color: "#555555" }}>
                Your personalized 14-day plan is built from your profile. Each card opens its own full training page.
              </p>
            </div>
          </header>

          {/* Plan summary */}
          <section className="a3" style={{ marginBottom: "40px" }}>
            <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(28px,5vw,36px)", color: "#ECECEC", marginBottom: "24px" }}>
              YOUR PLAN
            </h2>
            <div className="plan-summary">
              {[
                { label: "Goal",          value: mockUser.goal.toUpperCase(),          color: "#C6F135" },
                { label: "Level",         value: userLevel.toUpperCase(),              color: "#00E5FF" },
                { label: "Weekly Target", value: mockUser.weeklyTarget + " kg / week", color: "#FF2A5E" },
              ].map(item => (
                <div key={item.label} style={{ padding: "16px 20px", background: "#0D0D0D" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555555", margin: "0 0 4px" }}>{item.label}</p>
                  <p style={{ fontWeight: 700, fontSize: "14px", color: item.color, margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "11px", color: "#333333", marginBottom: "24px" }}>
              Not your info?{" "}
              <Link to="/profile" style={{ color: "#555555", textDecoration: "none", borderBottom: "1px solid #333333" }}>
                Update your profile →
              </Link>
            </p>
          </section>

          {/* 14-day plan */}
          <section style={{ marginBottom: "64px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "12px", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(28px,5vw,36px)", color: "#ECECEC", margin: 0 }}>
                14-DAY PLAN
              </h2>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#333333" }}>
                {mockUser.goal} · {userLevel} · {timelineLabel}
              </span>
            </div>
            <div className="plan-grid">
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
                  todayPlanDay={todayPlanDay}
                />
              ))}
            </div>
          </section>

          <hr style={{ borderColor: "#1E1E1E", marginBottom: "64px" }} />

          {/* Calendar */}
          <WorkoutCalendar
            planDays={planDaysRef.current}
            calendarData={calendarData}
            exerciseLogByDate={exerciseLogByDate}
          />

          <hr style={{ borderColor: "#1E1E1E", marginBottom: "64px" }} />

          {/* All exercises */}
          <section style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "12px", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(28px,5vw,36px)", color: "#ECECEC", margin: 0 }}>
                ALL EXERCISES
              </h2>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#333333" }}>
                {filtered.length} exercise{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="filter-grid">
              <input type="text" placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: "#080808", border: "1px solid #2A2A2A", borderRadius: "8px", padding: "12px 16px", fontSize: "14px", color: "#ECECEC", outline: "none", fontFamily: "inherit" }} />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                style={{ background: "#080808", border: "1px solid #2A2A2A", borderRadius: "8px", padding: "12px 16px", fontSize: "14px", color: "#ECECEC", outline: "none", fontFamily: "inherit" }}>
                <option value="All">All Categories</option>
                <option value="Cardio">Cardio</option>
                <option value="Weightlifting">Weightlifting</option>
              </select>
              <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
                style={{ background: "#080808", border: "1px solid #2A2A2A", borderRadius: "8px", padding: "12px 16px", fontSize: "14px", color: "#ECECEC", outline: "none", fontFamily: "inherit" }}>
                <option value="All">All Difficulty</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </section>

          {filtered.length === 0 ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#333333" }}>
                No exercises match your filters
              </p>
            </div>
          ) : (
            <div className="exercise-grid">
              {filtered.map(ex => <ExerciseCard key={ex.id} ex={ex} mockUser={mockUser} />)}
            </div>
          )}

        </main>

        {planOpen && (
          <PlanCompleteModal
            userLevel={userLevel}
            intensityBoostCount={boostCount}
            onContinue={handlePlanContinue}
            onClose={() => setPlanOpen(false)}
          />
        )}

        {toastMsg && (
          <div style={{
            position: "fixed", bottom: "24px", left: "24px", zIndex: 999,
            background: "#0D0D0D", border: `1px solid ${toastMsg.color}`,
            borderRadius: "12px", padding: "12px 20px",
            fontSize: "13px", color: "#ECECEC", fontFamily: "inherit",
          }}>
            {toastMsg.text}
          </div>
        )}
      </div>
    </>
  );
}

