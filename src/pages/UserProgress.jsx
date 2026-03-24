// UserProgress.jsx
// Page: User Progress
//
// Sections:
//   1. Daily snapshot  — circular ring charts for calories, protein, workouts, streak
//   2. Weekly progress — calorie balance bar chart (eaten vs burned)
//   3. Weight trend    — arc progress + start/current/target
//   4. Activity calendar — color coded by goal achievement
//   5. Custom goals    — user-managed to-do style goals
//
// Props:
//   currentUser   (object)
//   calendarData  (object)
//
// Hooks used: useState

import { useState } from "react";
import { calcNutritionTargets, getTodayKey } from "../data/mockData";

// ── Constants ──────────────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_SHORT   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const bg    = "bg-[#0a0a0a]";
const bg2   = "bg-[#111]";
const bdr   = "border-[#222]";
const txt   = "text-[#e8e8e8]";
const muted = "text-[#555]";

// ── Ring progress component ────────────────────────────────────────────────────
function Ring({ value, max, color, size = 120, stroke = 10, children }) {
  const radius        = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct           = max > 0 ? Math.min(value / max, 1) : 0;
  const filled        = pct * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="#1E1E1E" strokeWidth={stroke} />
        {/* Fill */}
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getDateKey(date) {
  return date.toISOString().split("T")[0];
}

function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(getDateKey(d));
  }
  return days;
}

function getMealKcal(entries) {
  let t = 0;
  for (const e of entries) { if (e.type === "meal") t += e.kcal || 0; }
  return t;
}

function getWorkoutKcal(entries) {
  let t = 0;
  for (const e of entries) { if (e.type === "workout") t += e.caloriesBurned || 0; }
  return t;
}

function getWorkoutCount(entries) {
  return entries.filter(e => e.type === "workout").length;
}

function getMealProtein(entries) {
  let t = 0;
  for (const e of entries) { if (e.type === "meal") t += e.protein || 0; }
  return t;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function UserProgress({ currentUser, calendarData = {} }) {

  const today     = getTodayKey();
  const todayDate = new Date();
  const targets   = calcNutritionTargets(currentUser);

  // ── Calendar state ─────────────────────────────────────────────────────────
  const [calYear,     setCalYear]     = useState(todayDate.getFullYear());
  const [calMonth,    setCalMonth]    = useState(todayDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(today);

  // ── Custom goals ───────────────────────────────────────────────────────────
  const [goals,       setGoals]       = useState([
    { id: 1, text: "Drink 3L water daily",         done: false },
    { id: 2, text: "Log meals every day",           done: false },
    { id: 3, text: "Complete 4 workouts this week", done: false },
  ]);
  const [newGoalText, setNewGoalText] = useState("");

  // ── Weight tracking ────────────────────────────────────────────────────────
  const [currentWeight, setCurrentWeight] = useState(
    currentUser?.currentWeight || currentUser?.weight || 0
  );
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput,   setWeightInput]   = useState("");

  // ── Today's data ───────────────────────────────────────────────────────────
  const todayEntries    = calendarData[today] || [];
  const todayMealKcal   = getMealKcal(todayEntries);
  const todayBurnedKcal = getWorkoutKcal(todayEntries);
  const todayProtein    = getMealProtein(todayEntries);
  const todayWorkouts   = getWorkoutCount(todayEntries);
  const adjustedTarget  = targets.kcal + todayBurnedKcal;

  // ── Streak ─────────────────────────────────────────────────────────────────
  let currentStreak = 0;
  let bestStreak    = 0;
  let tempStreak    = 0;
  for (const dateKey of getLastNDays(60)) {
    const hasActivity = (calendarData[dateKey] || []).length > 0;
    if (hasActivity) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
      if (dateKey <= today) currentStreak = tempStreak;
    } else {
      if (dateKey < today) tempStreak = 0;
    }
  }

  // ── Weekly data ────────────────────────────────────────────────────────────
  const last7Days  = getLastNDays(7);
  const weeklyData = last7Days.map(dateKey => {
    const entries  = calendarData[dateKey] || [];
    const eaten    = getMealKcal(entries);
    const burned   = getWorkoutKcal(entries);
    const date     = new Date(dateKey + "T12:00:00");
    return { dateKey, label: DAYS_SHORT[date.getDay()], eaten, burned, isToday: dateKey === today };
  });
  const weekCalorieGoalDays = weeklyData.filter(d =>
    d.eaten > 0 && Math.abs(d.eaten - targets.kcal) / targets.kcal <= 0.15
  ).length;
  const weekWorkoutDays = weeklyData.filter(d => d.burned > 0).length;
  const maxBar = Math.max(...weeklyData.map(d => Math.max(d.eaten, d.burned)), targets.kcal, 1);

  // ── Weight trend ───────────────────────────────────────────────────────────
  const startWeight  = currentUser?.currentWeight || currentUser?.weight || 0;
  const targetWeight = currentUser?.targetWeight || startWeight;
  const totalDiff    = Math.abs(targetWeight - startWeight);
  const achievedDiff = Math.abs(currentWeight - startWeight);
  const weightPct    = totalDiff > 0 ? Math.min(100, Math.round((achievedDiff / totalDiff) * 100)) : 0;
  const isGaining    = targetWeight >= startWeight;

  // ── Calendar ───────────────────────────────────────────────────────────────
  function changeMonth(dir) {
    let m = calMonth + dir;
    if (m < 0)  { setCalYear(calYear - 1); m = 11; }
    if (m > 11) { setCalYear(calYear + 1); m = 0;  }
    setCalMonth(m);
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

      const dateKey  = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const entries  = calendarData[dateKey] || [];
      const eaten    = getMealKcal(entries);
      const burned   = getWorkoutKcal(entries);
      const isFuture = dateKey > today;

      let status = "empty";
      if (!isFuture && !isOtherMonth && entries.length > 0) {
        const hitCal     = eaten > 0 && Math.abs(eaten - (targets.kcal + burned)) / targets.kcal <= 0.15;
        const hasWorkout = burned > 0;
        if (hitCal && hasWorkout)   status = "great";
        else if (hitCal || hasWorkout) status = "partial";
        else status = "logged";
      }

      cells.push({ day, dateKey, isOtherMonth, isFuture,
        isToday: dateKey === today, isSelected: dateKey === selectedDay,
        status, entries });
    }
    return cells;
  }

  const statusColors = { great: "#C6F135", partial: "#FFAA00", logged: "#FF2A5E", empty: "transparent" };
  const selectedEntries  = calendarData[selectedDay] || [];
  const selectedMeals    = selectedEntries.filter(e => e.type === "meal");
  const selectedWorkouts = selectedEntries.filter(e => e.type === "workout");

  // ── Goals ──────────────────────────────────────────────────────────────────
  function toggleGoal(id) { setGoals(goals.map(g => g.id === id ? { ...g, done: !g.done } : g)); }
  function addGoal() {
    if (!newGoalText.trim()) return;
    setGoals([...goals, { id: Date.now(), text: newGoalText.trim(), done: false }]);
    setNewGoalText("");
  }
  function deleteGoal(id) { setGoals(goals.filter(g => g.id !== id)); }

  const firstName = currentUser?.name?.split(" ")[0] || "You";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className={`${bg} ${txt} min-h-screen font-sans`}>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <header className={`flex flex-wrap items-end justify-between gap-4 px-6 md:px-8 pt-6 pb-5 border-b ${bdr}`}>
        <div>
          <p className={`text-xs tracking-widest uppercase ${muted} mb-2`}>
            {todayDate.toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric"
            })}
          </p>
          <h1 className="font-['Barlow_Condensed'] font-black text-4xl md:text-6xl uppercase tracking-tight leading-none">
            {firstName}'s <span className="text-[#C6F135]">Progress</span>
          </h1>
        </div>
        {/* Streak badge */}
        <div className="flex flex-col items-center justify-center w-24 h-24 border border-[#C6F135] relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#0a0a0a] px-2">
            <p className={`text-[8px] tracking-widest uppercase ${muted}`}>Streak</p>
          </div>
          <p className="font-['Barlow_Condensed'] font-black text-4xl text-[#C6F135] leading-none">{currentStreak}</p>
          <p className={`text-[9px] tracking-widest uppercase ${muted}`}>days</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0a0a0a] px-2">
            <p className={`text-[8px] tracking-widest ${muted}`}>best {bestStreak}</p>
          </div>
        </div>
      </header>

      {/* ── Section 1: Daily Rings ───────────────────────────────────────── */}
      <section className={`border-b ${bdr}`}>
        <div className={`px-6 py-3 bg-[#111] border-b ${bdr} flex items-center justify-between`}>
          <p className={`text-xs tracking-widest uppercase ${muted}`}>01 — today's snapshot</p>
          {todayBurnedKcal > 0 && (
            <p className="text-[9px] tracking-widest uppercase text-[#a78bfa]">
              +{todayBurnedKcal} kcal burned · target adjusted
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1E1E1E]">

          {/* Calories ring */}
          <div className={`bg-[#0a0a0a] flex flex-col items-center justify-center py-8 gap-4`}>
            <Ring value={todayMealKcal} max={adjustedTarget} color="#C6F135" size={130} stroke={10}>
              <p className="font-['Barlow_Condensed'] font-black text-2xl leading-none text-[#C6F135]">
                {Math.round((todayMealKcal / (adjustedTarget || 1)) * 100)}%
              </p>
              <p className={`text-[8px] tracking-widest uppercase ${muted}`}>eaten</p>
            </Ring>
            <div className="text-center">
              <p className={`text-xs tracking-widest uppercase ${muted}`}>Calories</p>
              <p className="font-['Barlow_Condensed'] font-black text-xl text-[#C6F135]">
                {todayMealKcal.toLocaleString()}
                <span className={`text-xs font-normal ${muted} ml-1`}>/ {adjustedTarget.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Protein ring */}
          <div className="bg-[#0a0a0a] flex flex-col items-center justify-center py-8 gap-4">
            <Ring value={todayProtein} max={targets.protein} color="#FF2A5E" size={130} stroke={10}>
              <p className="font-['Barlow_Condensed'] font-black text-2xl leading-none text-[#FF2A5E]">
                {Math.round((todayProtein / (targets.protein || 1)) * 100)}%
              </p>
              <p className={`text-[8px] tracking-widest uppercase ${muted}`}>protein</p>
            </Ring>
            <div className="text-center">
              <p className={`text-xs tracking-widest uppercase ${muted}`}>Protein</p>
              <p className="font-['Barlow_Condensed'] font-black text-xl text-[#FF2A5E]">
                {todayProtein}g
                <span className={`text-xs font-normal ${muted} ml-1`}>/ {targets.protein}g</span>
              </p>
            </div>
          </div>

          {/* Calories burned ring */}
          <div className="bg-[#0a0a0a] flex flex-col items-center justify-center py-8 gap-4">
            <Ring value={todayBurnedKcal} max={500} color="#a78bfa" size={130} stroke={10}>
              <p className="font-['Barlow_Condensed'] font-black text-2xl leading-none text-[#a78bfa]">
                {todayBurnedKcal}
              </p>
              <p className={`text-[8px] tracking-widest uppercase ${muted}`}>burned</p>
            </Ring>
            <div className="text-center">
              <p className={`text-xs tracking-widest uppercase ${muted}`}>Burned</p>
              <p className="font-['Barlow_Condensed'] font-black text-xl text-[#a78bfa]">
                {todayBurnedKcal}
                <span className={`text-xs font-normal ${muted} ml-1`}>kcal</span>
              </p>
            </div>
          </div>

          {/* Net calories ring */}
          <div className="bg-[#0a0a0a] flex flex-col items-center justify-center py-8 gap-4">
            {(() => {
              const net      = todayMealKcal - todayBurnedKcal;
              const netColor = net > adjustedTarget ? "#FF2A5E" : "#00E5FF";
              return (
                <>
                  <Ring value={Math.abs(net)} max={adjustedTarget} color={netColor} size={130} stroke={10}>
                    <p className="font-['Barlow_Condensed'] font-black text-xl leading-none" style={{ color: netColor }}>
                      {net > 0 ? "+" : ""}{net}
                    </p>
                    <p className={`text-[8px] tracking-widest uppercase ${muted}`}>net</p>
                  </Ring>
                  <div className="text-center">
                    <p className={`text-xs tracking-widest uppercase ${muted}`}>Net Calories</p>
                    <p className="font-['Barlow_Condensed'] font-black text-xl" style={{ color: netColor }}>
                      {net.toLocaleString()}
                      <span className={`text-xs font-normal ${muted} ml-1`}>kcal</span>
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Macro bars */}
        <div className={`px-6 py-5 bg-[#111] border-t ${bdr}`}>
          <p className={`text-xs tracking-widest uppercase ${muted} mb-4`}>Macro breakdown</p>
          <div className="flex flex-col gap-4">
            {[
              { label: "Protein", consumed: todayProtein,                                                  target: targets.protein, color: "#FF2A5E" },
              { label: "Carbs",   consumed: todayEntries.filter(e=>e.type==="meal").reduce((s,e)=>s+(e.carbs||0),0), target: targets.carbs,   color: "#00E5FF" },
              { label: "Fat",     consumed: todayEntries.filter(e=>e.type==="meal").reduce((s,e)=>s+(e.fat||0),0),   target: targets.fat,     color: "#FFAA00" },
            ].map(macro => {
              const pctVal = macro.target > 0 ? Math.min(100, Math.round((macro.consumed / macro.target) * 100)) : 0;
              return (
                <div key={macro.label} className="flex items-center gap-4">
                  <p className="text-xs w-14 uppercase tracking-widest" style={{ color: macro.color }}>{macro.label}</p>
                  <div className="flex-1 h-[3px]" style={{ background: `${macro.color}20` }}>
                    <div className="h-full transition-all duration-700"
                      style={{ width: `${pctVal}%`, background: macro.color }} />
                  </div>
                  <p className={`text-xs ${muted} w-28 text-right`}>{macro.consumed}g / {macro.target}g</p>
                  <p className="text-xs font-bold w-10 text-right" style={{ color: macro.color }}>{pctVal}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section 2: Weekly Chart ──────────────────────────────────────── */}
      <section className={`border-b ${bdr}`}>
        <div className={`px-6 py-3 bg-[#111] border-b ${bdr}`}>
          <p className={`text-xs tracking-widest uppercase ${muted}`}>02 — weekly overview</p>
        </div>

        <div className={`px-6 py-6 border-b ${bdr}`}>
          <p className={`text-xs tracking-widest uppercase ${muted} mb-6`}>Calorie balance — eaten vs burned</p>

          {/* Bar chart */}
          <div className="flex items-end gap-3" style={{ height: "120px" }}>
            {weeklyData.map(day => {
              const eatenH  = Math.round((day.eaten  / maxBar) * 100);
              const burnedH = Math.round((day.burned / maxBar) * 100);
              const targetH = Math.round((targets.kcal / maxBar) * 100);
              return (
                <div key={day.dateKey} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end gap-[3px] relative" style={{ height: "100px" }}>
                    {/* Target line */}
                    <div className="absolute left-0 right-0 border-t border-dashed border-[#333]"
                      style={{ bottom: `${targetH}%` }} />
                    {/* Eaten bar */}
                    <div className="flex-1 transition-all duration-700 rounded-sm"
                      style={{
                        height: `${eatenH}%`,
                        background: day.isToday ? "#C6F135" : "#C6F13540",
                        minHeight: day.eaten > 0 ? "3px" : "0"
                      }} />
                    {/* Burned bar */}
                    <div className="flex-1 transition-all duration-700 rounded-sm"
                      style={{
                        height: `${burnedH}%`,
                        background: "#a78bfa60",
                        minHeight: day.burned > 0 ? "3px" : "0"
                      }} />
                  </div>
                  <p className={`text-[9px] tracking-widest uppercase ${day.isToday ? "text-[#C6F135]" : muted}`}>
                    {day.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-[3px] bg-[#C6F135]" />
              <p className={`text-[9px] tracking-widest uppercase ${muted}`}>Eaten</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-[3px] bg-[#a78bfa]" />
              <p className={`text-[9px] tracking-widest uppercase ${muted}`}>Burned</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 border-t border-dashed border-[#555]" />
              <p className={`text-[9px] tracking-widest uppercase ${muted}`}>Target</p>
            </div>
          </div>
        </div>

        {/* Weekly summary rings */}
        <div className="grid grid-cols-2 gap-px bg-[#1E1E1E]">
          <div className="bg-[#0a0a0a] flex flex-col items-center py-6 gap-3">
            <Ring value={weekCalorieGoalDays} max={7} color="#C6F135" size={100} stroke={8}>
              <p className="font-['Barlow_Condensed'] font-black text-2xl text-[#C6F135]">{weekCalorieGoalDays}</p>
              <p className={`text-[8px] tracking-widest uppercase ${muted}`}>/ 7</p>
            </Ring>
            <p className={`text-xs tracking-widest uppercase ${muted}`}>Calorie goal days</p>
          </div>
          <div className="bg-[#0a0a0a] flex flex-col items-center py-6 gap-3">
            <Ring value={weekWorkoutDays} max={7} color="#FFAA00" size={100} stroke={8}>
              <p className="font-['Barlow_Condensed'] font-black text-2xl text-[#FFAA00]">{weekWorkoutDays}</p>
              <p className={`text-[8px] tracking-widest uppercase ${muted}`}>/ 7</p>
            </Ring>
            <p className={`text-xs tracking-widest uppercase ${muted}`}>Workout days</p>
          </div>
        </div>
      </section>

      {/* ── Section 3: Weight Trend ──────────────────────────────────────── */}
      <section className={`border-b ${bdr}`}>
        <div className={`px-6 py-3 bg-[#111] border-b ${bdr}`}>
          <p className={`text-xs tracking-widest uppercase ${muted}`}>03 — weight trend</p>
        </div>

        <div className="px-6 py-8 flex flex-col items-center gap-6">
          {/* Large arc ring */}
          <Ring value={weightPct} max={100} color="#C6F135" size={180} stroke={12}>
            <p className="font-['Barlow_Condensed'] font-black text-4xl text-[#C6F135] leading-none">
              {weightPct}%
            </p>
            <p className={`text-[9px] tracking-widest uppercase ${muted}`}>to goal</p>
          </Ring>

          {/* Start / Current / Target */}
          <div className="w-full grid grid-cols-3 gap-px bg-[#1E1E1E]">
            <div className="bg-[#0a0a0a] px-4 py-4 text-center">
              <p className={`text-[9px] tracking-widest uppercase ${muted} mb-1`}>Start</p>
              <p className={`font-['Barlow_Condensed'] font-black text-2xl ${muted}`}>{startWeight}<span className={`text-xs ml-1 ${muted}`}>kg</span></p>
            </div>
            <div className="bg-[#0a0a0a] px-4 py-4 text-center border-x-2 border-[#C6F135]">
              <p className={`text-[9px] tracking-widest uppercase ${muted} mb-1`}>Current</p>
              {editingWeight ? (
                <input autoFocus type="number" min="0" step="0.1" value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  onBlur={() => {
                    const v = parseFloat(weightInput);
                    if (!isNaN(v) && v > 0) setCurrentWeight(v);
                    setEditingWeight(false);
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter") { const v = parseFloat(weightInput); if (!isNaN(v) && v > 0) setCurrentWeight(v); setEditingWeight(false); }
                    if (e.key === "Escape") setEditingWeight(false);
                  }}
                  className="w-20 bg-transparent border-b border-[#C6F135] text-[#C6F135] font-['Barlow_Condensed'] font-black text-2xl outline-none text-center"
                />
              ) : (
                <p className="font-['Barlow_Condensed'] font-black text-2xl text-[#C6F135] cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => { setWeightInput(String(currentWeight)); setEditingWeight(true); }}
                  title="Click to update">
                  {currentWeight}<span className={`text-xs ml-1 ${muted}`}>kg</span>
                </p>
              )}
              <p className={`text-[8px] ${muted} mt-1`}>tap to update</p>
            </div>
            <div className="bg-[#0a0a0a] px-4 py-4 text-center">
              <p className={`text-[9px] tracking-widest uppercase ${muted} mb-1`}>Target</p>
              <p className={`font-['Barlow_Condensed'] font-black text-2xl ${muted}`}>{targetWeight}<span className={`text-xs ml-1 ${muted}`}>kg</span></p>
            </div>
          </div>

          <div className="w-full flex justify-between text-xs">
            <p className={muted}>{Math.abs(currentWeight - startWeight).toFixed(1)} kg {isGaining ? "gained" : "lost"}</p>
            <p className="text-[#C6F135]">{Math.abs(targetWeight - currentWeight).toFixed(1)} kg to go</p>
          </div>
        </div>
      </section>

      {/* ── Section 4: Activity Calendar ─────────────────────────────────── */}
      <section className={`border-b ${bdr}`}>
        <div className={`px-6 py-3 bg-[#111] border-b ${bdr}`}>
          <p className={`text-xs tracking-widest uppercase ${muted}`}>04 — activity calendar</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
          <div className={`border-r ${bdr}`}>
            {/* Month nav */}
            <div className={`flex items-center justify-between px-5 py-3 border-b ${bdr}`}>
              <p className="font-['Barlow_Condensed'] font-black text-xl uppercase">
                <span className="text-[#C6F135]">{MONTHS[calMonth]}</span>
                <span className={`text-base ${muted} ml-2`}>{calYear}</span>
              </p>
              <div className="flex">
                <button onClick={() => changeMonth(-1)}
                  className={`w-8 h-8 border border-r-0 ${bdr} ${muted} text-sm flex items-center justify-center hover:bg-[#C6F135] hover:text-black transition-colors`}>‹</button>
                <button onClick={() => changeMonth(1)}
                  className={`w-8 h-8 border ${bdr} ${muted} text-sm flex items-center justify-center hover:bg-[#C6F135] hover:text-black transition-colors`}>›</button>
              </div>
            </div>

            {/* Day headers */}
            <div className={`grid grid-cols-7 border-b ${bdr}`}>
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                <div key={d} className={`py-2 text-center text-xs tracking-widest uppercase ${muted} border-r last:border-r-0 ${bdr}`}>{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7">
              {buildCalendarCells().map(cell => {
                const dotColor = statusColors[cell.status];
                return (
                  <button key={cell.dateKey}
                    onClick={() => !cell.isOtherMonth && setSelectedDay(cell.dateKey)}
                    disabled={cell.isOtherMonth}
                    className={`border-r border-b last:border-r-0 ${bdr} min-h-[52px] p-1 flex flex-col items-center justify-start pt-2 transition-colors ${
                      cell.isOtherMonth ? "opacity-20 cursor-default" : "cursor-pointer hover:bg-[#111]"
                    } ${cell.isSelected ? "bg-[#C6F135]/10 outline outline-1 outline-[#C6F135]/50" : ""}
                    ${cell.isToday ? "bg-[#C6F135]/5" : ""}`}>
                    <span className={`text-xs font-bold leading-none ${cell.isToday ? "text-[#C6F135]" : ""}`}>
                      {cell.day}
                    </span>
                    {cell.status !== "empty" && !cell.isOtherMonth && !cell.isFuture && (
                      <div className="w-4 h-[3px] mt-1 rounded-sm" style={{ background: dotColor }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className={`flex flex-wrap gap-4 px-5 py-3 border-t ${bdr} bg-[#111]`}>
              {[
                { label: "Goals hit", color: "#C6F135" },
                { label: "Partial",   color: "#FFAA00" },
                { label: "Active",    color: "#FF2A5E" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className="w-4 h-[3px] rounded-sm" style={{ background: l.color }} />
                  <p className={`text-[9px] tracking-widest uppercase ${muted}`}>{l.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Day detail */}
          <div className="p-4" aria-live="polite">
            <div className={`flex items-center justify-between mb-4 pb-3 border-b ${bdr}`}>
              <p className="text-xs tracking-widest uppercase text-[#FF2A5E]">
                {MONTHS_SHORT[parseInt(selectedDay.split("-")[1]) - 1]}{" "}
                {parseInt(selectedDay.split("-")[2])}, {selectedDay.split("-")[0]}
              </p>
              <div className="text-right">
                <p className="font-['Barlow_Condensed'] font-black text-lg text-[#C6F135]">
                  {getMealKcal(selectedEntries).toLocaleString()}
                  <span className={`text-xs font-normal ${muted} ml-1`}>eaten</span>
                </p>
                {getWorkoutKcal(selectedEntries) > 0 && (
                  <p className="font-['Barlow_Condensed'] font-black text-lg text-[#a78bfa]">
                    {getWorkoutKcal(selectedEntries).toLocaleString()}
                    <span className={`text-xs font-normal ${muted} ml-1`}>burned</span>
                  </p>
                )}
              </div>
            </div>

            {selectedEntries.length === 0 ? (
              <p className={`text-xs ${muted}`}>No activity logged this day.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {selectedMeals.length > 0 && (
                  <div>
                    <p className={`text-[9px] tracking-widest uppercase ${muted} mb-2`}>Meals</p>
                    <ul>
                      {selectedMeals.map((entry, i) => (
                        <li key={i} className={`flex justify-between py-2 border-b last:border-b-0 ${bdr}`}>
                          <p className="text-xs font-bold">{entry.name}</p>
                          <p className="text-xs text-[#C6F135]">{entry.kcal} kcal</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedWorkouts.length > 0 && (
                  <div>
                    <p className={`text-[9px] tracking-widest uppercase ${muted} mb-2`}>Workouts</p>
                    <ul>
                      {selectedWorkouts.map((entry, i) => (
                        <li key={i} className={`flex justify-between py-2 border-b last:border-b-0 ${bdr}`}>
                          <p className="text-xs font-bold">{entry.name}</p>
                          <p className="text-xs text-[#a78bfa]">{entry.caloriesBurned || 0} kcal burned</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 5: Custom Goals ──────────────────────────────────────── */}
      <section>
        <div className={`px-6 py-3 bg-[#111] border-b ${bdr}`}>
          <p className={`text-xs tracking-widest uppercase ${muted}`}>05 — my goals</p>
        </div>
        <div className="px-6 py-5">
          <ul className="flex flex-col gap-2 mb-4">
            {goals.map(goal => (
              <li key={goal.id} className={`flex items-center gap-3 px-4 py-3 border ${bdr} bg-[#111]`}>
                <button onClick={() => toggleGoal(goal.id)}
                  className={`w-5 h-5 border flex items-center justify-center text-xs flex-shrink-0 transition-all ${
                    goal.done ? "border-[#C6F135] bg-[#C6F135] text-black" : `${bdr} text-transparent hover:border-[#C6F135]`
                  }`}>✓</button>
                <p className={`text-xs flex-1 ${goal.done ? `${muted} line-through` : ""}`}>{goal.text}</p>
                <span className={`text-[9px] tracking-widest uppercase px-2 py-1 border ${
                  goal.done ? "border-[#C6F135] text-[#C6F135]" : `${bdr} ${muted}`
                }`}>{goal.done ? "done" : "in progress"}</span>
                <button onClick={() => deleteGoal(goal.id)}
                  className={`w-5 h-5 border ${bdr} ${muted} hover:border-[#FF2A5E] hover:text-[#FF2A5E] flex items-center justify-center text-xs transition-colors flex-shrink-0`}>✕</button>
              </li>
            ))}
          </ul>
          <div className={`flex gap-0 border ${bdr}`}>
            <input type="text" value={newGoalText}
              onChange={e => setNewGoalText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addGoal()}
              placeholder="Add a new goal..."
              className="flex-1 bg-transparent px-4 py-3 text-xs outline-none placeholder:text-[#333] text-[#e8e8e8]"
            />
            <button onClick={addGoal}
              className="px-5 py-3 bg-[#C6F135] text-black text-xs font-bold tracking-widest uppercase hover:bg-[#FF2A5E] hover:text-white transition-colors">
              + Add
            </button>
          </div>
        </div>
      </section>

    </main>
  );
}
