import { useEffect, useMemo, useState } from "react";
import { getTodayKey } from "../data/mockData";
import api from "../services/api";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const GOALS = {
  calories:  2400,
  water:     3.0,
  exercises: 6,
  steps:     10000,
};

// Maps user's survey goal to a plan name
const GOAL_TO_PLAN = {
  gain_muscle:    "Hypertrophy Block",
  gain:           "Muscle Gain Program",
  lose_weight:    "Fat Loss Program",
  lose:           "Fat Loss Program",
  improve_cardio: "Cardio Endurance Plan",
  stay_healthy:   "General Fitness Plan",
  maintain:       "Maintenance Program",
};

const PLAN_TOTAL_DAYS = 7;

// Achievements are now computed dynamically in the component

// Calendar color config
const MEAL_CAT_COLORS = {
  breakfast: "#FFAA00",
  lunch:     "#C6F135",
  dinner:    "#FF2A5E",
  snack:     "#00E5FF",
};
const WORKOUT_COLOR = "#a78bfa";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function RingProgress({ value, max, color, size = 120, stroke = 8, children }) {
  const radius        = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillAmount    = max > 0 ? Math.min(value / max, 1) * circumference : 0;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1E1E1E" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${fillAmount} ${circumference}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

// Read-only stat card — value derived automatically from logged data
function AutoStatCard({ label, value, unit, goal, color, source }) {
  const progressPct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div className="flex flex-col gap-3 p-5 border-b sm:border-b-0 sm:border-r border-[#1E1E1E] last:border-0">
      <div className="flex items-center justify-between">
        <span className="text-[8px] tracking-[0.22em] uppercase text-[#555]">{label}</span>
        <span className="text-[8px] text-[#333] uppercase tracking-widest">{source}</span>
      </div>
      <div className="font-['Barlow_Condensed'] font-black text-5xl leading-none" style={{ color }}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit && <span className="text-base text-[#555] font-['JetBrains_Mono'] ml-1">{unit}</span>}
      </div>
      {goal > 0 && (
        <>
          <div className="w-full bg-[#1E1E1E] h-[3px]">
            <div className="h-full transition-all duration-700" style={{ width: `${progressPct}%`, background: color }} />
          </div>
          <div className="text-[9px] text-[#555] tracking-widest">/ {goal} {unit}</div>
        </>
      )}
    </div>
  );
}

// Editable stat card — user sets the value manually
function EditableStatCard({ label, value, unit, goal, color, onSave }) {
  const [editing, setEditing] = useState(false);
  const [input,   setInput]   = useState("");

  const progressPct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;

  function startEditing() {
    setInput(value === 0 ? "" : String(value));
    setEditing(true);
  }

  function saveValue() {
    const parsed = parseFloat(input);
    if (!isNaN(parsed) && parsed >= 0) onSave(parsed);
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter")  saveValue();
    if (e.key === "Escape") setEditing(false);
  }

  return (
    <div
      className="flex flex-col gap-3 p-5 border-b sm:border-b-0 sm:border-r border-[#1E1E1E] last:border-0 hover:bg-[#111] transition-colors cursor-pointer"
      onClick={!editing ? startEditing : undefined}
      title="Click to update"
    >
      <div className="flex items-center justify-between">
        <span className="text-[8px] tracking-[0.22em] uppercase text-[#555]">{label}</span>
        <span className="text-[8px] text-[#333] uppercase tracking-widest">click to edit</span>
      </div>
      {editing ? (
        <input autoFocus type="number" min="0" value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={saveValue} onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent border-b border-[#C6F135] text-[#C6F135] font-['Barlow_Condensed'] font-black text-4xl w-full outline-none pb-1" />
      ) : (
        <div className="font-['Barlow_Condensed'] font-black text-5xl leading-none" style={{ color }}>
          {value}
          {unit && <span className="text-base text-[#555] font-['JetBrains_Mono'] ml-1">{unit}</span>}
        </div>
      )}
      {goal > 0 && (
        <>
          <div className="w-full bg-[#1E1E1E] h-[3px]">
            <div className="h-full transition-all duration-700" style={{ width: `${progressPct}%`, background: color }} />
          </div>
          <div className="text-[9px] text-[#555] tracking-widest">/ {goal} {unit}</div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage({ calendarData = {}, currentUser, deleteMealFromDay, deleteWorkoutFromDay, togglePlanMeal, loggedMeals = {} }) {
  const useBackend = api.hasActivityIdentity();
  const [backendCalendarData, setBackendCalendarData] = useState({});
  const [waterIntake, setWaterIntake] = useState(0);
  const [stepsTaken, setStepsTaken] = useState(0);
  const [daysCompleted, setDaysCompleted] = useState(0);
  const [planTotalDays, setPlanTotalDays] = useState(PLAN_TOTAL_DAYS);

  // Derive plan name from user's survey goal — falls back to default if no user
  const planName = GOAL_TO_PLAN[currentUser?.goal] || "Your Fitness Plan";

  useEffect(() => {
    if (!useBackend) {
      return undefined;
    }

    let cancelled = false;

    async function loadHomepageData() {
      try {
        const response = await api.getHomepageData(getTodayKey());
        if (cancelled) {
          return;
        }

        setBackendCalendarData(response.homepage?.calendarData || {});
        setWaterIntake(Number(response.homepage?.waterIntake || 0));
        setStepsTaken(Number(response.homepage?.stepsTaken || 0));
        setDaysCompleted(Number(response.homepage?.daysCompleted || 0));
        setPlanTotalDays(Number(response.homepage?.planTotalDays || PLAN_TOTAL_DAYS));
      } catch {
        if (!cancelled) {
          setBackendCalendarData({});
        }
      }
    }

    loadHomepageData();

    return () => {
      cancelled = true;
    };
  }, [useBackend]);

  const mergedCalendarData = useMemo(() => {
    if (!useBackend) {
      return calendarData;
    }

    return backendCalendarData;
  }, [backendCalendarData, calendarData, useBackend]);

  // Calories intake — auto-derived from today's meal entries in calendarData
  const todayEntries    = mergedCalendarData[getTodayKey()] || [];
  const caloriesIntake  = todayEntries
    .filter(e => e.type === "meal")
    .reduce((sum, e) => sum + (e.kcal || 0), 0);

  // Calories burnt — auto-derived from today's logged workouts in calendarData
  const caloriesBurnt   = todayEntries
    .filter(e => e.type === "workout")
    .reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);

  // Exercises done — auto count of today's logged workouts
  const exercisesDone   = todayEntries.filter(e => e.type === "workout").length;

  // ── Achievement calculations — derived from all calendarData ──
  // Total workouts ever logged across all days
  const totalWorkoutsAllTime = Object.values(mergedCalendarData)
    .flat()
    .filter(e => e.type === "workout").length;

  // Streak — count consecutive days (ending today) that have at least 1 workout
  const streakDays = (() => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const hasWorkout = (mergedCalendarData[key] || []).some(e => e.type === "workout");
      if (hasWorkout) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  })();

  // Total meals ever logged
  const totalMealsAllTime = Object.values(mergedCalendarData)
    .flat()
    .filter(e => e.type === "meal").length;

  // Dynamic achievements list
  const achievements = [
    {
      emoji: "🏆",
      name: "First Workout Logged",
      sub: totalWorkoutsAllTime >= 1 ? "Your journey begins — Unlocked!" : "Log your first workout to unlock",
      color: "#C6F135",
      unlocked: totalWorkoutsAllTime >= 1,
    },
    {
      emoji: "🍽️",
      name: "First Meal Logged",
      sub: totalMealsAllTime >= 1 ? "Nutrition tracking started — Unlocked!" : "Log your first meal to unlock",
      color: "#FFAA00",
      unlocked: totalMealsAllTime >= 1,
    },
    {
      emoji: "⚡",
      name: "10 Workouts Milestone",
      sub: totalWorkoutsAllTime >= 10
        ? "Consistent performer — Unlocked!"
        : `${totalWorkoutsAllTime}/10 workouts logged`,
      color: "#00E5FF",
      unlocked: totalWorkoutsAllTime >= 10,
    },
    {
      emoji: "🔥",
      name: "3-Day Workout Streak",
      sub: streakDays >= 3
        ? `${streakDays}-day streak — Active!`
        : `${streakDays}/3 days in a row`,
      color: "#FF2A5E",
      unlocked: streakDays >= 3,
    },
    {
      emoji: "💧",
      name: "Hydration Goal Hit",
      sub: waterIntake >= GOALS.water
        ? "Daily water goal reached — Unlocked!"
        : `${waterIntake.toFixed(1)}/${GOALS.water}L today`,
      color: "#00E5FF",
      unlocked: waterIntake >= GOALS.water,
    },
    {
      emoji: "🎯",
      name: "25 Workouts",
      sub: totalWorkoutsAllTime >= 25
        ? "Dedicated athlete — Unlocked!"
        : `${totalWorkoutsAllTime}/25 workouts logged`,
      color: "#a78bfa",
      unlocked: totalWorkoutsAllTime >= 25,
    },
  ];

  // Calendar state
  const today      = getTodayKey();
  const todayDate  = new Date();
  const [calYear,     setCalYear]     = useState(todayDate.getFullYear());
  const [calMonth,    setCalMonth]    = useState(todayDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(today);

  const planProgress = Math.round((daysCompleted / planTotalDays) * 100);

  // Calendar helpers
  function changeMonth(direction) {
    let newMonth = calMonth + direction;
    if (newMonth < 0)  { setCalYear(calYear - 1); newMonth = 11; }
    if (newMonth > 11) { setCalYear(calYear + 1); newMonth = 0;  }
    setCalMonth(newMonth);
  }

  function buildCalendarCells() {
    const firstWeekday = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrev   = new Date(calYear, calMonth, 0).getDate();
    const totalCells   = firstWeekday + daysInMonth;
    const gridSize     = totalCells + (7 - (totalCells % 7)) % 7;
    const cells        = [];

    for (let i = 0; i < gridSize; i++) {
      let day, month = calMonth, year = calYear, isOtherMonth = false;

      if (i < firstWeekday) {
        day = daysInPrev - (firstWeekday - 1 - i);
        month = calMonth - 1;
        if (month < 0) { month = 11; year = calYear - 1; }
        isOtherMonth = true;
      } else if (i >= firstWeekday + daysInMonth) {
        day = i - firstWeekday - daysInMonth + 1;
        month = calMonth + 1;
        if (month > 11) { month = 0; year = calYear + 1; }
        isOtherMonth = true;
      } else {
        day = i - firstWeekday + 1;
      }

      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        day, dateKey, isOtherMonth,
        isToday:    dateKey === today,
        isSelected: dateKey === selectedDay,
        logs:       mergedCalendarData[dateKey] || [],
      });
    }
    return cells;
  }

  async function handleWaterSave(nextValue) {
    setWaterIntake(nextValue);

    if (!useBackend) {
      return;
    }

    try {
      await api.updateHomepageData({ date: getTodayKey(), waterIntake: nextValue });
    } catch {
      // Keep the optimistic value in place so the UI still feels responsive.
    }
  }

  async function handleDaysCompletedChange(nextValue) {
    setDaysCompleted(nextValue);

    if (!useBackend) {
      return;
    }

    try {
      await api.updateHomepageData({ daysCompleted: nextValue, planTotalDays });
    } catch {
      // Keep the optimistic value in place so the progress UI remains usable.
    }
  }

  async function handleStepsSave(nextValue) {
    setStepsTaken(nextValue);

    if (!useBackend) {
      return;
    }

    try {
      await api.updateHomepageData({ date: getTodayKey(), stepsTaken: nextValue });
    } catch {
      // Keep the optimistic value in place so the UI remains usable.
    }
  }

  async function handleWorkoutDelete(entryId, index) {
    if (useBackend && entryId) {
      try {
        await api.deleteCalendarEntry(entryId, selectedDay);
        setBackendCalendarData((prev) => {
          const next = { ...prev };
          const dayEntries = (next[selectedDay] || []).filter((entry) => String(entry.id) !== String(entryId));
          if (dayEntries.length === 0) {
            delete next[selectedDay];
          } else {
            next[selectedDay] = dayEntries;
          }
          return next;
        });
        return;
      } catch {
        // Fall through to the existing prop callback if the API is unavailable.
      }
    }

    if (deleteWorkoutFromDay) {
      deleteWorkoutFromDay(selectedDay, index);
    }
  }

  async function handleMealDelete(entry) {
    if (useBackend && entry?.id) {
      try {
        await api.deleteCalendarEntry(entry.id, selectedDay);
        setBackendCalendarData((prev) => {
          const next = { ...prev };
          const dayEntries = (next[selectedDay] || []).filter((item) => String(item.id) !== String(entry.id));
          if (dayEntries.length === 0) {
            delete next[selectedDay];
          } else {
            next[selectedDay] = dayEntries;
          }
          return next;
        });
        return;
      } catch {
        // Fall through to the local callback if the API is unavailable.
      }
    }

    const entryIndex = selectedDayEntries.findIndex((item) =>
      item === entry || (entry?.id && String(item.id) === String(entry.id))
    );

    if (entryIndex >= 0 && deleteMealFromDay) {
      deleteMealFromDay(selectedDay, entryIndex);
      const checkedSet = loggedMeals?.[today] || new Set();
      if (togglePlanMeal && checkedSet.has?.(entry.name)) togglePlanMeal(entry);
    }
  }

  const selectedDayEntries = mergedCalendarData[selectedDay] || [];
  const selectedMeals      = selectedDayEntries.filter((e) => e.type === "meal");
  const selectedWorkouts   = selectedDayEntries.filter((e) => e.type === "workout");
  const stepsProgressPct   = Math.min((stepsTaken / GOALS.steps) * 100, 100);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* SECTION 1 — Today's Stats */}
      <div className="border-b border-[#1E1E1E]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between px-6 md:px-14 pt-10 pb-8 border-b border-[#1E1E1E] gap-4">
          <div>
            <h1 className="font-['Barlow_Condensed'] font-black text-5xl md:text-6xl uppercase leading-none tracking-tight">
              Today's <em className="not-italic text-[#C6F135]">Stats</em>
            </h1>
            {currentUser?.name && (
              <div className="text-[9px] tracking-[0.2em] uppercase text-[#555] mt-2">
                Welcome back, {currentUser.name}
              </div>
            )}
          </div>
          <div className="text-[9px] tracking-[0.2em] uppercase text-[#555]">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#1E1E1E]">
          <AutoStatCard label="Calories Intake" value={caloriesIntake} unit="kcal" goal={GOALS.calories}  color="#C6F135" source="from meals" />
          <AutoStatCard label="Calories Burnt"  value={caloriesBurnt}  unit="kcal" goal={0}               color="#FF2A5E" source="from workouts" />
          <EditableStatCard label="Water Intake"    value={waterIntake}    unit="L"    goal={GOALS.water}     color="#00E5FF" onSave={handleWaterSave}     />
          <AutoStatCard label="Exercises Done"  value={exercisesDone}  unit=""     goal={GOALS.exercises} color="#FFAA00" source="from workouts" />
        </div>

        {/* Steps Taken — Phase 2 */}
        <div className="px-6 md:px-14 py-5 border-b border-[#1E1E1E] flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ background: "repeating-linear-gradient(135deg, transparent, transparent 6px, rgba(255,255,255,0.015) 6px, rgba(255,255,255,0.015) 12px)" }}
        >
          {/* Label + Phase 2 badge */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[8px] tracking-[0.22em] uppercase text-[#444]">Steps Taken</span>
            <span
              className="text-[8px] font-bold tracking-[0.18em] uppercase px-2 py-1 border"
              style={{ borderColor: "#00E5FF", color: "#00E5FF", background: "rgba(0,229,255,0.08)" }}
            >
              Manual Sync
            </span>
          </div>

          <div className="flex-1 bg-[#1A1A1A] h-[6px] overflow-hidden border border-[#222]">
            <div className="h-full transition-all duration-700" style={{ width: `${stepsProgressPct}%`, background: "#00E5FF" }} />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <input
              type="number"
              min="0"
              step="1"
              value={stepsTaken}
              onChange={(e) => handleStepsSave(parseInt(e.target.value || "0", 10))}
              className="w-28 bg-transparent border-b border-[#00E5FF] text-[#00E5FF] font-['Barlow_Condensed'] font-black text-3xl outline-none text-right"
            />
            <span className="text-[9px] shrink-0 text-[#555]">/ {GOALS.steps.toLocaleString()} steps</span>
          </div>

          <span className="text-[8px] tracking-wide shrink-0" style={{ color: "#555" }}>
            Manual step entry is live. Pedometer sync can be added later.
          </span>

          <div className="hidden">
          {/* Value placeholder */}
          <span className="font-['Barlow_Condensed'] font-black text-3xl shrink-0" style={{ color: "#333" }}>—</span>
          <span className="text-[9px] shrink-0" style={{ color: "#333" }}>/ {GOALS.steps.toLocaleString()} steps</span>

          {/* Explanation note */}
          <span className="text-[8px] tracking-wide shrink-0" style={{ color: "#555" }}>
            🔒 Needs pedometer API — coming in Phase 2
          </span>
          </div>
        </div>
      </div>

      {/* SECTION 2 — Plan Progress + Achievements */}
      <div className="border-b border-[#1E1E1E]">
        <div className="flex items-end justify-between px-6 md:px-14 pt-10 pb-8 border-b border-[#1E1E1E]">
          <div>
            <h2 className="font-['Barlow_Condensed'] font-black text-4xl md:text-5xl uppercase leading-none tracking-tight">
              Your <em className="not-italic text-[#C6F135]">Progress</em>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="px-6 md:px-14 py-10 border-b lg:border-b-0 lg:border-r border-[#1E1E1E]">
            <div className="text-[8px] tracking-[0.2em] uppercase text-[#555] mb-2">Current Plan</div>

            {/* Plan name derived from user's survey goal */}
            <div className="font-['Barlow_Condensed'] font-bold text-2xl uppercase mb-8">{planName}</div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-8">
              <RingProgress value={daysCompleted} max={PLAN_TOTAL_DAYS} color="#C6F135" size={120} stroke={8}>
                <span className="font-['Barlow_Condensed'] font-black text-3xl text-[#C6F135] leading-none">{planProgress}%</span>
              </RingProgress>
              <div className="flex flex-col gap-3">
                <div className="text-[9px] tracking-[0.15em] uppercase text-[#555]">Click a day to mark it done</div>
                <div className="flex gap-2 flex-wrap mt-1">
                  {Array.from({ length: planTotalDays }).map((_, i) => (
                    <button key={i}
                      onClick={() => handleDaysCompletedChange(i < daysCompleted ? i : i + 1)}
                      className="w-9 h-9 border flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                      style={i < daysCompleted
                        ? { borderColor: "#C6F135", background: "rgba(198,241,53,0.1)", color: "#C6F135" }
                        : { borderColor: "#1E1E1E", color: "#333" }}
                    >
                      {i < daysCompleted ? "OK" : i + 1}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] tracking-widest text-[#555]">{daysCompleted} / {planTotalDays} Days Completed</div>
              </div>
            </div>

            <div className="border border-[#1E1E1E] p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[8px] tracking-[0.2em] uppercase text-[#555]">Completion</span>
                <span className="text-[9px] text-[#C6F135]">{planProgress}%</span>
              </div>
              <div className="bg-[#1E1E1E] h-2 w-full">
                <div className="h-full bg-[#C6F135] transition-all duration-700" style={{ width: `${planProgress}%` }} />
              </div>
            </div>
          </div>

          <div className="px-6 md:px-14 py-10">
            <div className="font-['Barlow_Condensed'] font-black text-4xl uppercase mb-6">
              Achieve<em className="not-italic text-[#C6F135]">ments</em>
            </div>
            <div className="border border-[#1E1E1E]">
              {achievements.map((a, i) => (
                <div key={i}
                  className={`flex items-center gap-5 px-6 py-5 border-b border-[#1E1E1E] last:border-b-0 transition-all duration-200 cursor-default ${ a.unlocked ? "hover:bg-[#111] hover:pl-8" : "opacity-40" }`}>
                  <div className="w-10 h-10 border flex items-center justify-center text-lg flex-shrink-0"
                    style={{ borderColor: a.unlocked ? a.color : "#333" }}>
                    {a.unlocked ? a.emoji : "🔒"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold tracking-wide">{a.name}</div>
                    <div className="text-[9px] text-[#555] tracking-widest mt-1">{a.sub}</div>
                  </div>
                  {a.unlocked && (
                    <div className="ml-auto flex-shrink-0 flex items-center gap-1 text-[8px] tracking-widest uppercase" style={{ color: a.color }}>
                      <span>✓</span> Done
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3 — Activity Calendar */}
      <div className="border-b border-[#1E1E1E]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between px-6 md:px-14 pt-10 pb-8 border-b border-[#1E1E1E] gap-4">
          <div>
            <h2 className="font-['Barlow_Condensed'] font-black text-4xl md:text-5xl uppercase leading-none tracking-tight">
              Activity <em className="not-italic text-[#C6F135]">Calendar</em>
            </h2>
          </div>
          <div className="flex flex-wrap gap-4 text-[8px] tracking-widest uppercase text-[#555]">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: "#FFAA00" }} /> Breakfast</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: "#C6F135" }} /> Lunch</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: "#FF2A5E" }} /> Dinner</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: "#00E5FF" }} /> Snack</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm" style={{ background: WORKOUT_COLOR }} /> Workout</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
          <div className="border-r border-[#1E1E1E]">
            <div className="flex items-center justify-between px-6 py-3 border-b border-[#1E1E1E]">
              <p className="font-['Barlow_Condensed'] font-black text-xl uppercase tracking-tight">
                <span className="text-[#C6F135]">{MONTHS[calMonth]}</span>
                <span className="text-base text-[#555] ml-2">{calYear}</span>
              </p>
              <div className="flex">
                <button onClick={() => changeMonth(-1)} className="w-8 h-8 border border-r-0 border-[#222] text-sm text-[#555] flex items-center justify-center hover:bg-[#C6F135] hover:text-black transition-colors">
                  &lsaquo;
                </button>
                <button onClick={() => changeMonth(1)} className="w-8 h-8 border border-[#222] text-sm text-[#555] flex items-center justify-center hover:bg-[#C6F135] hover:text-black transition-colors">
                  &rsaquo;
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-[#1E1E1E]">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                <div key={d} className="py-2 text-center text-[8px] tracking-widest uppercase text-[#555] border-r last:border-r-0 border-[#1E1E1E]">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {buildCalendarCells().map((cell) => {
                let cellClass = "border-r border-b last:border-r-0 border-[#1E1E1E] min-h-[52px] p-1 flex flex-col text-left transition-colors";
                if (cell.isOtherMonth)  cellClass += " opacity-20 cursor-default";
                else                    cellClass += " cursor-pointer";
                if (cell.isToday)       cellClass += " bg-[#C6F135]/5";
                if (cell.isSelected)    cellClass += " bg-[#C6F135]/10 outline outline-1 outline-[#C6F135]/50";
                if (!cell.isOtherMonth && !cell.isSelected) cellClass += " hover:bg-[#111]";
                const mealLogs    = cell.logs.filter((l) => l.type === "meal");
                const workoutLogs = cell.logs.filter((l) => l.type === "workout");
                return (
                  <button key={cell.dateKey}
                    onClick={() => !cell.isOtherMonth && setSelectedDay(cell.dateKey)}
                    disabled={cell.isOtherMonth}
                    className={cellClass}>
                    <span className={`text-xs font-bold leading-none mb-1 ${cell.isToday ? "text-[#C6F135]" : "text-[#e8e8e8]"}`}>{cell.day}</span>
                    <div className="flex flex-wrap gap-[2px]">
                      {mealLogs.slice(0, 3).map((log, i) => (
                        <div key={`m${i}`} className="w-[4px] h-[4px] rounded-full" style={{ background: MEAL_CAT_COLORS[log.cat] || "#555" }} />
                      ))}
                      {workoutLogs.slice(0, 2).map((log, i) => (
                        <div key={`w${i}`} className="w-[4px] h-[4px] rounded-sm" style={{ background: WORKOUT_COLOR }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col p-4" aria-live="polite">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E1E1E]">
              <p className="text-xs tracking-widest uppercase text-[#FF2A5E]">
                {MONTHS_SHORT[parseInt(selectedDay.split("-")[1]) - 1]}{" "}
                {parseInt(selectedDay.split("-")[2])},{" "}
                {selectedDay.split("-")[0]}
              </p>
              <div className="text-right">
                <p className="font-['Barlow_Condensed'] font-black text-lg text-[#C6F135]">
                  {selectedMeals.reduce((sum, e) => sum + (e.kcal || 0), 0).toLocaleString()}
                  <span className="text-xs font-normal text-[#555] ml-1">kcal eaten</span>
                </p>
                {selectedWorkouts.length > 0 && (
                  <p className="font-['Barlow_Condensed'] font-black text-lg" style={{ color: WORKOUT_COLOR }}>
                    {selectedWorkouts.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0).toLocaleString()}
                    <span className="text-xs font-normal text-[#555] ml-1">kcal burned</span>
                  </p>
                )}
              </div>
            </div>

            {selectedDayEntries.length === 0 ? (
              <p className="text-xs text-[#555]">No activity logged this day.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {selectedMeals.length > 0 && (
                  <div>
                    <p className="text-[8px] tracking-widest uppercase text-[#555] mb-2">Meals</p>
                    <ul>
                      {selectedDay !== today && selectedDayEntries.length > 0 && (
  <p className="text-xs text-[#555] mb-2 italic">Past day — read only</p>
)}
{selectedMeals.map((entry, i) => (
  <li key={entry.id || `${entry.name}-${i}`} className="flex items-center justify-between py-2 border-b last:border-b-0 border-[#1E1E1E]">
    <div className="flex items-center gap-2">
      <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: MEAL_CAT_COLORS[entry.cat] || "#555" }} />
      <div>
        <p className="text-xs font-bold text-[#e8e8e8]">{entry.name}</p>
        <p className="text-xs text-[#555] capitalize">{entry.cat}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <p className="text-xs font-bold text-[#C6F135]">{entry.kcal} kcal</p>
      {selectedDay === today && (deleteMealFromDay || entry.id) && (
        <button
          onClick={() => handleMealDelete(entry)}
          className="w-6 h-6 border border-[#222] text-[#555] hover:border-[#FF2A5E] hover:text-[#FF2A5E] flex items-center justify-center text-xs transition-colors">
          ✕
        </button>
      )}
    </div>
  </li>
))}
                    </ul>
                  </div>
                )}
                {selectedWorkouts.length > 0 && (
                  <div>
                    <p className="text-[8px] tracking-widest uppercase text-[#555] mb-2">Workouts</p>
                    <ul>
                      {selectedWorkouts.map((entry, i) => (
  <li key={entry.id || i} className="flex items-center justify-between py-2 border-b last:border-b-0 border-[#1E1E1E]">
    <div className="flex items-center gap-2">
      <div className="w-[6px] h-[6px] rounded-sm flex-shrink-0" style={{ background: WORKOUT_COLOR }} />
      <div>
        <p className="text-xs font-bold text-[#e8e8e8]">{entry.name}</p>
        <p className="text-xs text-[#555] capitalize">{entry.cat || "workout"}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <p className="text-xs font-bold" style={{ color: WORKOUT_COLOR }}>{entry.caloriesBurned || 0} kcal burned</p>
      {selectedDay === today && (deleteWorkoutFromDay || entry.id) && (
        <button
          onClick={() => handleWorkoutDelete(entry.id, i)}
          className="w-6 h-6 border border-[#222] text-[#555] hover:border-[#FF2A5E] hover:text-[#FF2A5E] flex items-center justify-center text-xs transition-colors">
          ✕
        </button>
      )}
    </div>
  </li>
))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
