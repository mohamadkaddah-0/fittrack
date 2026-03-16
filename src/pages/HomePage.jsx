import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION — change goals, plans, achievements here
// ─────────────────────────────────────────────────────────────────────────────

const GOALS = {
  calories:  2400,   // kcal
  water:     3.0,    // liters
  exercises: 6,      // count
  steps:     10000,  // count
};

const CURRENT_PLAN = {
  name:      "Hypertrophy Block - Week 3",
  totalDays: 7,
};

const ACHIEVEMENTS = [
  { emoji: "🏆", name: "First Workout Completed", sub: "Your journey begins - Unlocked", color: "#C6F135", locked: false },
  { emoji: "⚡", name: "10 Workouts Milestone",   sub: "Consistent performer - Unlocked", color: "#00E5FF", locked: false },
  { emoji: "🔥", name: "Weekly Streak",            sub: "5 Days in a Row - Active",       color: "#FF2A5E", locked: false },
  { emoji: "🎯", name: "25 Workouts",              sub: "1 more session to go - Locked",  color: "#555",    locked: true  },
];

const EXPLORE_PLANS = [
  { id: 1, name: "5x5 Strength",     level: "Intermediate", duration: "6 wks",  tag: "Strength",   tagColor: "lime"  },
  { id: 2, name: "Fat-Loss HIIT",    level: "Beginner",     duration: "4 wks",  tag: "Cardio",     tagColor: "hot"   },
  { id: 3, name: "Mobility Flow",    level: "All Levels",   duration: "3 wks",  tag: "Mobility",   tagColor: "cyan"  },
  { id: 4, name: "Powerlifting Prep",level: "Advanced",     duration: "8 wks",  tag: "Strength",   tagColor: "lime"  },
  { id: 5, name: "Calisthenics Base",level: "Beginner",     duration: "5 wks",  tag: "Bodyweight", tagColor: "amber" },
  { id: 6, name: "Marathon Ready",   level: "Intermediate", duration: "12 wks", tag: "Endurance",  tagColor: "cyan"  },
];

const EXPLORE_FILTERS = ["All", "Strength", "Cardio", "Mobility", "Endurance", "Bodyweight"];

const NAV_LINKS = [
  { label: "User Progress",    to: "/progress"  },
  { label: "Diet Program",     to: "/diet"      },
  { label: "Exercise Library", to: "/exercises" },
  { label: "Log Workout",      to: "/log"       },
  { label: "Settings",         to: "/settings"  },
];

const TAG_COLORS = {
  lime:  { border: "#C6F135", text: "#C6F135" },
  hot:   { border: "#FF2A5E", text: "#FF2A5E" },
  cyan:  { border: "#00E5FF", text: "#00E5FF" },
  amber: { border: "#FFAA00", text: "#FFAA00" },
};


function Tag({ label, color }) {
  const c = TAG_COLORS[color] || TAG_COLORS.lime;
  return (
    <span
      className="inline-block text-[8px] tracking-[0.15em] uppercase px-2.5 py-1 border"
      style={{ borderColor: c.border, color: c.text }}
    >
      {label}
    </span>
  );
}


function RingProgress({ value, max, color, size = 120, stroke = 8, children }) {
  const radius      = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillAmount  = max > 0 ? Math.min(value / max, 1) * circumference : 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: "absolute" }}>
   
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1E1E1E" strokeWidth={stroke} />
       
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${fillAmount} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Stat card where the user can click and type a new value
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
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-[8px] tracking-[0.22em] uppercase text-[#555]">{label}</span>
        <span className="text-[8px] text-[#333] uppercase tracking-widest">click to edit</span>
      </div>

      {/* Value — shows input when editing, number when not */}
      {editing ? (
        <input
          autoFocus
          type="number"
          min="0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={saveValue}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent border-b border-[#C6F135] text-[#C6F135] font-['Barlow_Condensed'] font-black text-4xl w-full outline-none pb-1"
        />
      ) : (
        <div className="font-['Barlow_Condensed'] font-black text-5xl leading-none" style={{ color }}>
          {value}
          {unit && <span className="text-base text-[#555] font-['JetBrains_Mono'] ml-1">{unit}</span>}
        </div>
      )}

      {/* Progress bar (only shown when a goal exists) */}
      {goal > 0 && (
        <>
          <div className="w-full bg-[#1E1E1E] h-[3px]">
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${progressPct}%`, background: color }}
            />
          </div>
          <div className="text-[9px] text-[#555] tracking-widest">
            / {goal} {unit}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();

  // ── Stats state — all start at 0 ──
  const [caloriesIntake, setCaloriesIntake] = useState(0);
  const [caloriesBurnt,  setCaloriesBurnt]  = useState(0);
  const [waterIntake,    setWaterIntake]     = useState(0);
  const [exercisesDone,  setExercisesDone]   = useState(0);
  const [steps,          setSteps]           = useState(0);
  const [daysCompleted,  setDaysCompleted]   = useState(0);

  // ── UI state ──
  const [exploreFilter, setExploreFilter] = useState("All");
  const [menuOpen,      setMenuOpen]      = useState(false);

  // ── Derived values ──
  const planProgress    = Math.round((daysCompleted / CURRENT_PLAN.totalDays) * 100);
  const filteredPlans   = exploreFilter === "All"
    ? EXPLORE_PLANS
    : EXPLORE_PLANS.filter((plan) => plan.tag === exploreFilter);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080808] text-[#ECECEC] font-['JetBrains_Mono']">

      {/* ── Ticker bar ──────────────────────────────────────────── */}
      <div className="bg-[#C6F135] text-black text-[10px] font-bold tracking-[0.2em] uppercase py-2 overflow-hidden whitespace-nowrap">
        <div className="inline-flex animate-[ticker_22s_linear_infinite]">
          {[...Array(2)].flatMap((_, ai) =>
            ["Today's Workout Ready", "* * *", "Calories Tracked", "* * *", "Stay Consistent", "* * *", "FitTrack v3.0", "* * *"].map(
              (t, i) => <span key={`${ai}-${i}`} className="px-8">{t}</span>
            )
          )}
        </div>
      </div>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[#1E1E1E] bg-[rgba(8,8,8,0.92)] backdrop-blur-xl">
        <div className="h-[60px] flex items-center justify-between px-6">

          {/* Logo */}
          <div className="font-['Barlow_Condensed'] text-2xl font-black tracking-wider uppercase text-[#C6F135]">
            FitTrack
          </div>

          {/* Desktop nav links — hidden on mobile */}
          <ul className="hidden md:flex items-center gap-8 list-none">
            {NAV_LINKS.map(({ label, to }) => (
              <li key={to}>
                <button
                  onClick={() => navigate(to)}
                  className="text-[10px] tracking-[0.18em] uppercase text-[#555] hover:text-[#ECECEC] transition-colors relative group bg-transparent border-none cursor-pointer"
                >
                  {label}
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-[#C6F135] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </button>
              </li>
            ))}
          </ul>

          {/* Right side — live dot + account + burger */}
          <div className="flex items-center gap-4">

            {/* Live indicator */}
            <div className="hidden md:flex items-center gap-2 text-[9px] tracking-[0.15em] uppercase text-[#555]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6F135] animate-pulse" />
              Live
            </div>

            {/* Account button */}
            <button
              onClick={() => navigate("/profile")}
              className="bg-[#C6F135] text-black font-bold text-[10px] tracking-[0.18em] uppercase px-4 py-2 hover:bg-[#FF2A5E] hover:text-white transition-colors cursor-pointer"
            >
              Account
            </button>

            {/* Burger menu button — visible on mobile only */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex flex-col gap-1.5 p-1 cursor-pointer bg-transparent border-none"
              aria-label="Toggle menu"
            >
              <span className={`block w-6 h-0.5 bg-[#ECECEC] transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-6 h-0.5 bg-[#ECECEC] transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-6 h-0.5 bg-[#ECECEC] transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#1E1E1E] bg-[#0D0D0D]">
            {NAV_LINKS.map(({ label, to }) => (
              <button
                key={to}
                onClick={() => { navigate(to); setMenuOpen(false); }}
                className="w-full text-left px-6 py-4 text-[10px] tracking-[0.18em] uppercase text-[#555] hover:text-[#ECECEC] hover:bg-[#111] border-b border-[#1E1E1E] last:border-b-0 transition-colors cursor-pointer bg-transparent"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — Today's Stats                                 */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="border-b border-[#1E1E1E]">

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between px-6 md:px-14 pt-10 pb-8 border-b border-[#1E1E1E] gap-4">
          <div>
            <div className="text-[8px] tracking-[0.25em] uppercase text-[#FF2A5E] mb-2">
              // 001 - Workout Dashboard
            </div>
            <h1 className="font-['Barlow_Condensed'] font-black text-5xl md:text-6xl uppercase leading-none tracking-tight">
              Today's <em className="not-italic text-[#C6F135]">Stats</em>
            </h1>
          </div>
          <div className="text-[9px] tracking-[0.2em] uppercase text-[#555]">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {/* Editable stat cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#1E1E1E]">
          <EditableStatCard
            label="Calories Intake"
            value={caloriesIntake}
            unit="kcal"
            goal={GOALS.calories}
            color="#C6F135"
            onSave={setCaloriesIntake}
          />
          <EditableStatCard
            label="Calories Burnt"
            value={caloriesBurnt}
            unit="kcal"
            goal={0}
            color="#FF2A5E"
            onSave={setCaloriesBurnt}
          />
          <EditableStatCard
            label="Water Intake"
            value={waterIntake}
            unit="L"
            goal={GOALS.water}
            color="#00E5FF"
            onSave={setWaterIntake}
          />
          <EditableStatCard
            label="Exercises Done"
            value={exercisesDone}
            unit=""
            goal={GOALS.exercises}
            color="#FFAA00"
            onSave={setExercisesDone}
          />
        </div>

        {/* Steps row — also editable */}
        <div
          className="px-6 md:px-14 py-5 border-b border-[#1E1E1E] flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:bg-[#111] transition-colors group"
          onClick={() => {
            const val = prompt("Enter steps taken:");
            const parsed = parseInt(val);
            if (!isNaN(parsed) && parsed >= 0) setSteps(parsed);
          }}
          title="Click to update steps"
        >
          <span className="text-[8px] tracking-[0.22em] uppercase text-[#555] shrink-0">
            Steps Taken
          </span>
          <div className="flex-1 bg-[#1E1E1E] h-[6px] relative overflow-hidden">
            <div
              className="h-full bg-[#C6F135] transition-all duration-700"
              style={{ width: `${Math.min((steps / GOALS.steps) * 100, 100)}%` }}
            />
          </div>
          <span className="font-['Barlow_Condensed'] font-black text-3xl text-[#C6F135] shrink-0">
            {steps.toLocaleString()}
          </span>
          <span className="text-[9px] text-[#555] shrink-0">
            / {GOALS.steps.toLocaleString()} steps
          </span>
          <span className="text-[8px] text-[#333] uppercase tracking-widest shrink-0">
            click to edit
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 2 — Plan Progress + Achievements                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="border-b border-[#1E1E1E]">

        {/* Section header */}
        <div className="flex items-end justify-between px-6 md:px-14 pt-10 pb-8 border-b border-[#1E1E1E]">
          <div>
            <div className="text-[8px] tracking-[0.25em] uppercase text-[#FF2A5E] mb-2">
              // 002 - Plan and Achievements
            </div>
            <h2 className="font-['Barlow_Condensed'] font-black text-4xl md:text-5xl uppercase leading-none tracking-tight">
              Your <em className="not-italic text-[#C6F135]">Progress</em>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* Plan progress */}
          <div className="px-6 md:px-14 py-10 border-b lg:border-b-0 lg:border-r border-[#1E1E1E]">
            <div className="text-[8px] tracking-[0.2em] uppercase text-[#555] mb-2">Current Plan</div>
            <div className="font-['Barlow_Condensed'] font-bold text-2xl uppercase mb-8">
              {CURRENT_PLAN.name}
            </div>

            {/* Ring + day tracker */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-8">
              <RingProgress value={daysCompleted} max={CURRENT_PLAN.totalDays} color="#C6F135" size={120} stroke={8}>
                <span className="font-['Barlow_Condensed'] font-black text-3xl text-[#C6F135] leading-none">
                  {planProgress}%
                </span>
              </RingProgress>

              <div className="flex flex-col gap-3">
                <div className="text-[9px] tracking-[0.15em] uppercase text-[#555]">
                  Days Completed — click a day to mark it
                </div>
                <div className="flex gap-2 flex-wrap mt-1">
                  {Array.from({ length: CURRENT_PLAN.totalDays }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setDaysCompleted(i < daysCompleted ? i : i + 1)}
                      className="w-9 h-9 border flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                      style={
                        i < daysCompleted
                          ? { borderColor: "#C6F135", background: "rgba(198,241,53,0.1)", color: "#C6F135" }
                          : { borderColor: "#1E1E1E", color: "#333" }
                      }
                    >
                      {i < daysCompleted ? "✓" : i + 1}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] tracking-widest text-[#555]">
                  {daysCompleted} / {CURRENT_PLAN.totalDays} Days Completed
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="border border-[#1E1E1E] p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[8px] tracking-[0.2em] uppercase text-[#555]">Completion</span>
                <span className="text-[9px] text-[#C6F135]">{planProgress}%</span>
              </div>
              <div className="bg-[#1E1E1E] h-2 w-full">
                <div
                  className="h-full bg-[#C6F135] transition-all duration-700"
                  style={{ width: `${planProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="px-6 md:px-14 py-10">
            <div className="font-['Barlow_Condensed'] font-black text-4xl uppercase mb-6">
              Achieve<em className="not-italic text-[#C6F135]">ments</em>
            </div>
            <div className="border border-[#1E1E1E]">
              {ACHIEVEMENTS.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-5 px-6 py-5 border-b border-[#1E1E1E] last:border-b-0 transition-all duration-200 cursor-default hover:bg-[#111] hover:pl-8 ${a.locked ? "opacity-40" : ""}`}
                >
                  <div
                    className="w-10 h-10 border flex items-center justify-center text-lg flex-shrink-0 transition-colors"
                    style={{ borderColor: a.locked ? "#333" : a.color }}
                  >
                    {a.emoji}
                  </div>
                  <div>
                    <div className="text-sm font-bold tracking-wide">{a.name}</div>
                    <div className="text-[9px] text-[#555] tracking-widest mt-1">{a.sub}</div>
                  </div>
                  {!a.locked && (
                    <div className="ml-auto text-[8px] tracking-widest uppercase" style={{ color: a.color }}>
                      OK
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 3 — Explore Workout Plans                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="border-b border-[#1E1E1E]">

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between px-6 md:px-14 pt-10 pb-8 border-b border-[#1E1E1E] gap-4">
          <div>
            <div className="text-[8px] tracking-[0.25em] uppercase text-[#FF2A5E] mb-2">
              // 003 - Explore
            </div>
            <h2 className="font-['Barlow_Condensed'] font-black text-4xl md:text-5xl uppercase leading-none tracking-tight">
              Workout <em className="not-italic text-[#C6F135]">Plans</em>
            </h2>
          </div>
          <button
            onClick={() => navigate("/exercises")}
            className="text-[9px] tracking-[0.2em] uppercase text-[#555] border-b border-[#2A2A2A] pb-1 hover:text-[#C6F135] hover:border-[#C6F135] transition-colors bg-transparent cursor-pointer self-start sm:self-auto"
          >
            View All
          </button>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center border-b border-[#1E1E1E] overflow-x-auto">
          {EXPLORE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setExploreFilter(f)}
              className={`px-5 py-3 text-[9px] tracking-[0.18em] uppercase border-r border-[#1E1E1E] whitespace-nowrap transition-colors first:border-l first:border-[#1E1E1E] cursor-pointer ${
                exploreFilter === f
                  ? "bg-[#C6F135] text-black font-bold"
                  : "bg-transparent text-[#555] hover:bg-[#C6F135] hover:text-black"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-6 md:px-14 py-10 gap-0">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="border border-[#1E1E1E] -mt-px -ml-px p-8 hover:bg-[#111] hover:border-[#C6F135] transition-all duration-200 cursor-pointer group relative overflow-hidden"
              onClick={() => navigate(`/plan/${plan.id}`)}
            >
              {/* Ghost number background */}
              <div className="absolute top-0 right-2 font-['Barlow_Condensed'] font-black text-[100px] leading-none text-[#1E1E1E] select-none pointer-events-none group-hover:text-[#111] transition-colors">
                {String(plan.id).padStart(2, "0")}
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <Tag label={plan.tag} color={plan.tagColor} />
                  <span className="text-[8px] tracking-widest text-[#555] uppercase">{plan.duration}</span>
                </div>
                <div className="font-['Barlow_Condensed'] font-black text-3xl uppercase mb-2 tracking-wide">
                  {plan.name}
                </div>
                <div className="text-[9px] text-[#555] tracking-[0.15em] uppercase mb-6">
                  {plan.level}
                </div>
                <button className="w-full border border-[#C6F135] text-[#C6F135] text-[9px] tracking-[0.18em] uppercase py-2.5 hover:bg-[#C6F135] hover:text-black transition-colors cursor-pointer">
                  View Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="px-6 md:px-14 py-8 flex items-center justify-between border-t border-[#1E1E1E]">
        <div className="font-['Barlow_Condensed'] font-black text-xl text-[#C6F135] uppercase">
          FitTrack
        </div>
        <div className="text-[8px] tracking-[0.2em] uppercase text-[#555]">
          2026 FitTrack v3.0.0
        </div>
      </footer>

      {/* Tailwind ticker keyframe */}
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
