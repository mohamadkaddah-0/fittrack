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

const exercises = EXERCISES;

function getCatColor(category) {
  return category === "Cardio" ? "#FF2A5E" : "#C6F135";
}

function getDiffColor(d) {
  if (d === "Beginner")     return "#C6F135";
  if (d === "Intermediate") return "#FFAA00";
  return "#FF2A5E";
}

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

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CAT_COLORS   = { breakfast: "#FFAA00", lunch: "#C6F135", snack: "#00E5FF", dinner: "#FF2A5E" };

function PulseDot() {
  return (
    <span className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: "#C6F135", animation: "pulse 2s ease-in-out infinite" }} />
  );
}

function ExerciseCard({ ex }) {
  const catColor   = getCatColor(ex.category);
  const diffColor  = getDiffColor(ex.difficulty);
  const hasWarning = isRiskyForUser(ex, mockUser.limitations);
  const [imgErr,   setImgErr]   = useState(false);
  const initials = ex.name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <article
      className="rounded-xl overflow-hidden transition-all duration-300 cursor-pointer"
      style={{ background: "#0D0D0D", border: `1px solid ${hasWarning ? "#FFAA00" : "#1E1E1E"}` }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = hasWarning ? "#FF2A5E" : "#C6F135"; e.currentTarget.style.transform = "scale(1.02)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = hasWarning ? "#FFAA00" : "#1E1E1E"; e.currentTarget.style.transform = "scale(1)"; }}
    >
      <Link to={ex.link} className="block no-underline">
        <div className="h-36 flex items-center justify-center relative overflow-hidden"
          style={{ background: "#111111", borderBottom: "1px solid #1E1E1E" }}>
          {!imgErr && ex.image ? (
            <img src={ex.image} alt={ex.name} onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
          ) : (
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "56px", color: "#2A2A2A", userSelect: "none" }}>
              {initials}
            </span>
          )}
          <span className="absolute top-2 right-2 text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded border"
            style={{ color: diffColor, borderColor: diffColor + "66", background: "rgba(0,0,0,0.7)" }}>
            {ex.difficulty}
          </span>
          {hasWarning && (
            <span className="absolute top-2 left-2 text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded"
              style={{ background: "#FFAA00", color: "#080808" }}>
              ⚠ Caution
            </span>
          )}
        </div>
        <div className="p-4">
          {hasWarning && (
            <div className="rounded-lg px-3 py-2 mb-3 text-xs leading-5"
              style={{ background: "rgba(255,170,0,0.1)", border: "1px solid rgba(255,170,0,0.4)", color: "#FFAA00" }}>
              ⚠ Not suitable for your limitations. Consult your doctor first.
            </div>
          )}
          <h3 className="text-xl mb-1" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, color: "#ECECEC" }}>
            {ex.name}
          </h3>
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest mb-2" style={{ color: "#555555" }}>
            <span className="w-[7px] h-[7px] rounded-full flex-shrink-0 inline-block" style={{ background: catColor }} />
            {ex.category}
          </p>
          <p className="text-xs leading-6 mb-3" style={{ color: "#555555" }}>{ex.desc}</p>
          <span className="inline-block text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded mb-3"
            style={{ color: "#FFAA00", border: "1px solid rgba(255,170,0,0.3)" }}>
            {ex.kcalRange} kcal / 10 min
          </span>
          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "#333333" }}>{ex.muscles}</p>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#00E5FF" }}>Open exercise page →</p>
        </div>
      </Link>
    </article>
  );
}

function PlanDayCard({ day, isRest, picks, isDay14, onDay14Click, intensityBoostCount, completedPlanItems, onToggleDone }) {
  const allDone = !isRest && picks.length > 0 && picks.every(ex => completedPlanItems[`${day}-${ex.id}`]);

  function getBoostedRange(r) {
    if (intensityBoostCount === 0) return r;
    const p = r.split("–");
    if (p.length !== 2) return r;
    const m = Math.pow(1.15, intensityBoostCount);
    return Math.round(parseInt(p[0]) * m) + "–" + Math.round(parseInt(p[1]) * m);
  }

  return (
    <div className="rounded-xl p-3 transition-all duration-200"
      style={{ background: "#0D0D0D", border: allDone || isDay14 ? "1px solid #C6F135" : "1px solid #1E1E1E", cursor: isDay14 ? "pointer" : "default" }}
      onClick={isDay14 ? onDay14Click : undefined}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
      <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "30px", lineHeight: 1, color: "#2A2A2A", marginBottom: "8px" }}>
        {String(day).padStart(2, "0")}
      </p>
      {allDone && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", padding: "4px 8px", background: "rgba(198,241,53,0.1)", border: "1px solid rgba(198,241,53,0.4)", borderRadius: "6px" }}>
          <span style={{ color: "#C6F135", fontSize: "11px", fontWeight: 700 }}>✓</span>
          <span style={{ color: "#C6F135", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Day Complete</span>
        </div>
      )}
      {isRest ? (
        <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#333333" }}>Rest Day</p>
      ) : (
        picks.map(ex => {
          const done = completedPlanItems[`${day}-${ex.id}`];
          return (
            <div key={ex.id} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
                  <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, background: getCatColor(ex.category) }} />
                  <Link to={ex.link} onClick={e => e.stopPropagation()}
                    style={{ fontSize: "11px", fontWeight: 700, color: done ? "#C6F135" : "#00E5FF", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    onMouseEnter={e => { e.target.style.color = "#C6F135"; }}
                    onMouseLeave={e => { e.target.style.color = done ? "#C6F135" : "#00E5FF"; }}>
                    {ex.name}
                  </Link>
                </div>
                <button onClick={e => { e.stopPropagation(); onToggleDone(day, ex.id); }}
                  style={{ width: "18px", height: "18px", borderRadius: "50%", border: `1px solid ${done ? "#C6F135" : "#555555"}`, background: done ? "#C6F135" : "transparent", color: done ? "#080808" : "#555555", fontSize: "11px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                  {done ? "✓" : ""}
                </button>
              </div>
              <p style={{ fontSize: "9px", color: intensityBoostCount > 0 ? "#FFAA00" : "#555555", marginLeft: "11px", textDecoration: done ? "line-through" : "none", opacity: done ? 0.7 : 1 }}>
                {getBoostedRange(ex.kcalRange)} kcal/10min
              </p>
            </div>
          );
        })
      )}
      {isDay14 && !allDone && (
        <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C6F135", marginTop: "8px" }}>
          Tap to Finish
        </p>
      )}
    </div>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="rounded-2xl w-full max-w-lg p-8" style={{ background: "#0D0D0D", border: "1px solid #1E1E1E" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(198,241,53,0.1)", border: "2px solid #C6F135" }}>
          <span className="text-2xl font-bold" style={{ color: "#C6F135" }}>✓</span>
        </div>
        <h2 className="text-4xl text-center mb-2" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, color: "#ECECEC" }}>PLAN COMPLETE</h2>
        <p className="text-xs font-bold tracking-widest uppercase text-center mb-8" style={{ color: "#555555" }}>14 days finished</p>
        <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden mb-8" style={{ background: "#1E1E1E" }}>
          {[
            { label: "Workouts Logged", value: workoutLog.length,                  color: "#C6F135" },
            { label: "Calories Burned", value: totalKcal,                          color: "#FFAA00" },
            { label: "Current Level",   value: userLevel.slice(0,3).toUpperCase(), color: "#00E5FF" },
          ].map(stat => (
            <div key={stat.label} className="px-4 py-5 text-center" style={{ background: "#111111" }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#555555" }}>{stat.label}</p>
              <p className="font-bold" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "32px", lineHeight: 1, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-center leading-7 mb-6" style={{ color: "#555555" }}>Great work finishing your 14-day plan.<br />What would you like to do next?</p>
        <div className="flex flex-col gap-3">
          <button onClick={onContinue} className="w-full text-xs font-bold tracking-widest uppercase py-4 rounded-xl"
            style={{ background: getBtnColor(), color: getBtnColor() === "#FF2A5E" ? "#ECECEC" : "#080808", border: 0 }}>
            {getBtnLabel()}
          </button>
          <Link to="/profile" className="block w-full text-center text-xs font-bold tracking-widest uppercase py-4 rounded-xl no-underline"
            style={{ border: "1px solid #00E5FF", color: "#00E5FF" }}>
            Update My Profile — Fresh Plan →
          </Link>
          <button onClick={onClose} className="w-full text-xs font-bold tracking-widest uppercase py-4 rounded-xl"
            style={{ border: "1px solid #2A2A2A", color: "#555555", background: "transparent" }}>
            I'll Decide Later
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkoutCalendar({ completedPlanItems, planDays }) {
  const todayKey  = getTodayKey();
  const todayDate = new Date();
  const [calYear,  setCalYear]  = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth());
  const [selected, setSelected] = useState(todayKey);
  const mealCalendar = INITIAL_CALENDAR || {};

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
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const meals   = mealCalendar[dateKey] || [];
      cells.push({ day, dateKey, other, isToday: dateKey === todayKey, isSelected: dateKey === selected, meals });
    }
    return cells;
  }

  const cells         = buildCells();
  const selectedMeals = mealCalendar[selected] || [];
  const doneToday     = planDays
    .filter(pd => !pd.isRest)
    .flatMap(pd => pd.picks.filter(ex => completedPlanItems[`${pd.day}-${ex.id}`]).map(ex => ({ name: ex.name, category: ex.category })));

  return (
    <section className="mb-16">
      <div className="flex flex-wrap items-baseline gap-3 mb-6">
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "36px", color: "#ECECEC" }}>CALENDAR</h2>
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#333333" }}>exercises + meals</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1E1E1E" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#1E1E1E", background: "#0D0D0D" }}>
            <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "20px" }}>
              <span style={{ color: "#C6F135" }}>{MONTHS_FULL[calMonth]}</span>
              <span style={{ color: "#555555", fontSize: "16px", marginLeft: "8px" }}>{calYear}</span>
            </p>
            <div className="flex">
              {[["‹", -1], ["›", 1]].map(([lbl, dir]) => (
                <button key={lbl} onClick={() => changeMonth(dir)}
                  className="w-8 h-8 text-sm flex items-center justify-center transition-colors"
                  style={{ border: "1px solid #1E1E1E", borderRight: dir === -1 ? "none" : "1px solid #1E1E1E", color: "#555555" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#C6F135"; e.currentTarget.style.color = "#080808"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#555555"; }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-7 border-b" style={{ borderColor: "#1E1E1E" }}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} className="py-2 text-center text-xs tracking-widest uppercase border-r last:border-r-0"
                style={{ color: "#555555", borderColor: "#1E1E1E" }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7" style={{ background: "#080808" }}>
            {cells.map(cell => (
              <button key={cell.dateKey}
                disabled={cell.other}
                onClick={() => !cell.other && setSelected(cell.dateKey)}
                className="border-r border-b last:border-r-0 min-h-[44px] p-1 flex flex-col text-left transition-colors"
                style={{ borderColor: "#1E1E1E", background: cell.isSelected ? "rgba(198,241,53,0.1)" : cell.isToday ? "rgba(198,241,53,0.05)" : "transparent", opacity: cell.other ? 0.2 : 1, cursor: cell.other ? "default" : "pointer" }}>
                <span className="text-xs font-bold leading-none mb-1" style={{ color: cell.isToday ? "#C6F135" : "#ECECEC" }}>{cell.day}</span>
                <div className="flex flex-wrap gap-[2px]">
                  {cell.meals.slice(0, 4).map((m, i) => (
                    <div key={i} className="w-[4px] h-[4px] rounded-full" style={{ background: CAT_COLORS[m.cat] || "#555" }} title={m.name} />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#0D0D0D", border: "1px solid #1E1E1E" }}>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#FF2A5E" }}>
            {MONTHS_SHORT[parseInt(selected.split("-")[1]) - 1]} {parseInt(selected.split("-")[2])}, {selected.split("-")[0]}
          </p>
          {selectedMeals.length > 0 && (
            <div>
              <p className="text-[9px] font-bold tracking-widest uppercase mb-2" style={{ color: "#555555" }}>Meals</p>
              {selectedMeals.map((m, i) => (
                <div key={i} className="flex items-center gap-2 py-1 border-b last:border-b-0" style={{ borderColor: "#1E1E1E" }}>
                  <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: CAT_COLORS[m.cat] || "#555" }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: "#ECECEC" }}>{m.name}</p>
                    <p className="text-[10px]" style={{ color: "#555555" }}>{m.cat} · {m.kcal} kcal</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selected === todayKey && doneToday.length > 0 && (
            <div>
              <p className="text-[9px] font-bold tracking-widest uppercase mb-2" style={{ color: "#555555" }}>Exercises Done Today</p>
              {doneToday.map((ex, i) => (
                <div key={i} className="flex items-center gap-2 py-1 border-b last:border-b-0" style={{ borderColor: "#1E1E1E" }}>
                  <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: getCatColor(ex.category) }} />
                  <p className="text-xs font-bold" style={{ color: "#C6F135" }}>✓ {ex.name}</p>
                </div>
              ))}
            </div>
          )}
          {selectedMeals.length === 0 && !(selected === todayKey && doneToday.length > 0) && (
            <p className="text-xs" style={{ color: "#333333" }}>Nothing logged this day.</p>
          )}
          <div className="mt-2 pt-3 border-t" style={{ borderColor: "#1E1E1E" }}>
            <div className="flex flex-wrap gap-3">
              {Object.entries(CAT_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1">
                  <div className="w-[6px] h-[6px] rounded-full" style={{ background: color }} />
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: "#555555" }}>{cat}</span>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <div className="w-[6px] h-[6px] rounded-full" style={{ background: "#C6F135" }} />
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "#555555" }}>exercise</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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

  useEffect(() => {
    localStorage.setItem("completedPlanItems", JSON.stringify(completedPlanItems));
  }, [completedPlanItems]);

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

  function showToast(text, color = "#C6F135") {
    setToastMsg({ text, color });
    setTimeout(() => setToastMsg(null), 3500);
  }

  function toggleExerciseDone(day, exerciseId) {
    const key = `${day}-${exerciseId}`;
    setCompletedPlanItems(prev => ({ ...prev, [key]: !prev[key] }));
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

  const weeks = Math.ceil(mockUser.totalGoal / mockUser.weeklyTarget);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        * { font-family: 'JetBrains Mono', monospace; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse  { 0%,100% { box-shadow: 0 0 0 0 rgba(198,241,53,0.5); } 50% { box-shadow: 0 0 0 6px rgba(198,241,53,0); } }
        .a1 { animation: fadeUp 0.5s ease 0.10s both; }
        .a2 { animation: fadeUp 0.5s ease 0.25s both; }
        .a3 { animation: fadeUp 0.5s ease 0.40s both; }
        body::before { content: ''; position: fixed; inset: 0; background: repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px); pointer-events: none; z-index: 9999; }
        select option { background: #0D0D0D; color: #ECECEC; }
      `}</style>

      <div style={{ background: "#080808", color: "#ECECEC", minHeight: "100vh", overflowX: "hidden" }}>
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 md:px-10 py-12">

          <header className="relative mb-14">
            <span aria-hidden="true" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(90px,20vw,200px)", color: "transparent", WebkitTextStroke: "1px #1E1E1E", lineHeight: 1, userSelect: "none", pointerEvents: "none", position: "absolute", top: "-10px", left: "-5px", zIndex: 0 }}>EX</span>
            <div className="relative z-10">
              <p className="a1 flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#FF2A5E" }}>
                <PulseDot /> Welcome back, {mockUser.name}
              </p>
              <h1 className="a2 mb-4" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(56px,10vw,100px)", lineHeight: 1.05 }}>
                EXERCISE<br />
                <span style={{ color: "transparent", WebkitTextStroke: "2px #C6F135" }}>LIBRARY</span>
              </h1>
              <p className="a3 text-sm leading-7 max-w-lg" style={{ color: "#555555" }}>
                Your personalized 14-day plan is built from your profile. Each card opens its own full training page.
              </p>
            </div>
          </header>

          <section className="a3 mb-10">
            <h2 className="mb-6" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "36px", color: "#ECECEC" }}>YOUR PLAN</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-xl overflow-hidden mb-4" style={{ background: "#1E1E1E" }}>
              {[
                { label: "Goal",          value: mockUser.goal.toUpperCase(),          color: "#C6F135" },
                { label: "Level",         value: userLevel.toUpperCase(),              color: "#00E5FF" },
                { label: "Weekly Target", value: mockUser.weeklyTarget + " kg / week", color: "#FF2A5E" },
              ].map(item => (
                <div key={item.label} className="px-5 py-4" style={{ background: "#0D0D0D" }}>
                  <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#555555" }}>{item.label}</p>
                  <p className="font-bold text-sm" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs mb-6" style={{ color: "#333333" }}>
              Not your info?{" "}
              <Link to="/profile" className="no-underline border-b" style={{ color: "#555555", borderColor: "#333333" }}>Update your profile →</Link>
            </p>
          </section>

          <section className="mb-16">
            <div className="flex flex-wrap items-baseline gap-3 mb-6">
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "36px", color: "#ECECEC" }}>14-DAY PLAN</h2>
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#333333" }}>
                {mockUser.goal} · {userLevel} · {weeks} weeks total
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {planDaysRef.current.map(({ day, isRest, picks }) => (
                <PlanDayCard key={day} day={day} isRest={isRest} picks={picks}
                  isDay14={day === 14} onDay14Click={() => setPlanOpen(true)}
                  intensityBoostCount={boostCount}
                  completedPlanItems={completedPlanItems}
                  onToggleDone={toggleExerciseDone} />
              ))}
            </div>
          </section>

          <hr style={{ borderColor: "#1E1E1E", marginBottom: "64px" }} />

          <WorkoutCalendar completedPlanItems={completedPlanItems} planDays={planDaysRef.current} />

          <hr style={{ borderColor: "#1E1E1E", marginBottom: "64px" }} />

          <section className="mb-6">
            <div className="flex flex-wrap items-baseline gap-3 mb-6">
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "36px", color: "#ECECEC" }}>ALL EXERCISES</h2>
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#333333" }}>
                {filtered.length} exercise{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6" style={{ background: "#0D0D0D", border: "1px solid #1E1E1E" }}>
              <input type="text" placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)}
                className="rounded-lg px-4 py-3 text-sm focus:outline-none font-mono"
                style={{ background: "#080808", border: "1px solid #2A2A2A", color: "#ECECEC" }} />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="rounded-lg px-4 py-3 text-sm focus:outline-none font-mono"
                style={{ background: "#080808", border: "1px solid #2A2A2A", color: "#ECECEC" }}>
                <option value="All">All Categories</option>
                <option value="Cardio">Cardio</option>
                <option value="Weightlifting">Weightlifting</option>
              </select>
              <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
                className="rounded-lg px-4 py-3 text-sm focus:outline-none font-mono"
                style={{ background: "#080808", border: "1px solid #2A2A2A", color: "#ECECEC" }}>
                <option value="All">All Difficulty</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </section>

          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#333333" }}>No exercises match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(ex => <ExerciseCard key={ex.id} ex={ex} />)}
            </div>
          )}

        </main>

        {planOpen && (
          <PlanCompleteModal userLevel={userLevel} intensityBoostCount={boostCount}
            onContinue={handlePlanContinue} onClose={() => setPlanOpen(false)} />
        )}

        {toastMsg && (
          <div className="fixed bottom-6 left-6 z-[999] rounded-xl px-5 py-3 text-sm font-mono"
            style={{ background: "#0D0D0D", border: `1px solid ${toastMsg.color}`, color: "#ECECEC" }}>
            {toastMsg.text}
          </div>
        )}
      </div>
    </>
  );
}
