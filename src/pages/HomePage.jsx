import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Mock Data ──────────────────────────────────────────────────────────────────
const todayStats = {
  caloriesIntake: 1840,
  caloriesGoal: 2400,
  caloriesBurnt: 620,
  waterIntake: 1.8,
  waterGoal: 3.0,
  exercisesDone: 4,
  exercisesGoal: 6,
  steps: 7430,
  stepsGoal: 10000,
};

const weeklyPlan = {
  name: "Hypertrophy Block — Week 3",
  progress: 71, // percent
  daysCompleted: 5,
  totalDays: 7,
};

const achievements = [
  { emoji: "🏆", name: "First Workout Completed", sub: "Your journey begins · Unlocked", color: "#C6F135", locked: false },
  { emoji: "⚡", name: "10 Workouts Milestone",   sub: "Consistent performer · Unlocked", color: "#00E5FF", locked: false },
  { emoji: "🔥", name: "Weekly Streak",            sub: "5 Days in a Row · Active",       color: "#FF2A5E", locked: false },
  { emoji: "🎯", name: "25 Workouts",              sub: "1 more session to go · Locked",  color: "#555",    locked: true  },
];

const explorePlans = [
  { id: 1, name: "5×5 Strength",       level: "Intermediate", duration: "6 wks", tag: "Strength",  tagColor: "lime"  },
  { id: 2, name: "Fat-Loss HIIT",       level: "Beginner",     duration: "4 wks", tag: "Cardio",    tagColor: "hot"   },
  { id: 3, name: "Mobility Flow",       level: "All Levels",   duration: "3 wks", tag: "Mobility",  tagColor: "cyan"  },
  { id: 4, name: "Powerlifting Prep",   level: "Advanced",     duration: "8 wks", tag: "Strength",  tagColor: "lime"  },
  { id: 5, name: "Calisthenics Base",   level: "Beginner",     duration: "5 wks", tag: "Bodyweight",tagColor: "amber" },
  { id: 6, name: "Marathon Ready",      level: "Intermediate", duration: "12 wks",tag: "Endurance", tagColor: "cyan"  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Circular ring progress indicator */
function RingProgress({ value, max, color, size = 80, stroke = 6, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: "absolute" }}>
        {/* track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E1E1E" strokeWidth={stroke} />
        {/* fill */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/** A KPI stat card with ring or bar progress */
function KpiCard({ label, value, unit, max, color, ring, barPct }) {
  return (
    <div
      className="flex flex-col gap-3 p-6 border-r border-[#1E1E1E] last:border-r-0 hover:bg-[#111] transition-colors cursor-default"
    >
      <span className="text-[8px] tracking-[0.22em] uppercase text-[#555]">{label}</span>
      {ring ? (
        <div className="flex items-center gap-4">
          <RingProgress value={value} max={max} color={color} size={72} stroke={5}>
            <span className="font-['Barlow_Condensed'] font-black text-xl leading-none" style={{ color }}>
              {value}
            </span>
          </RingProgress>
          <div>
            <div className="font-['Barlow_Condensed'] font-black text-4xl leading-none" style={{ color }}>
              {value}
              <span className="text-sm text-[#555] font-['JetBrains_Mono'] ml-1">{unit}</span>
            </div>
            <div className="text-[9px] text-[#555] tracking-widest mt-1">
              / {max} {unit}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="font-['Barlow_Condensed'] font-black text-5xl leading-none" style={{ color }}>
            {value}
            {unit && <span className="text-base text-[#555] font-['JetBrains_Mono'] ml-1">{unit}</span>}
          </div>
          {barPct !== undefined && (
            <div className="w-full bg-[#1E1E1E] h-[3px] mt-1">
              <div
                className="h-full transition-all duration-700"
                style={{ width: `${barPct}%`, background: color }}
              />
            </div>
          )}
          {max && (
            <div className="text-[9px] text-[#555] tracking-widest">/ {max} {unit}</div>
          )}
        </>
      )}
    </div>
  );
}

/** Tag badge */
function Tag({ label, color }) {
  const map = {
    lime:  { border: "#C6F135", text: "#C6F135" },
    hot:   { border: "#FF2A5E", text: "#FF2A5E" },
    cyan:  { border: "#00E5FF", text: "#00E5FF" },
    amber: { border: "#FFAA00", text: "#FFAA00" },
  };
  const c = map[color] || map.lime;
  return (
    <span
      className="inline-block text-[8px] tracking-[0.15em] uppercase px-2.5 py-1 border"
      style={{ borderColor: c.border, color: c.text }}
    >
      {label}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const [exploreFilter, setExploreFilter] = useState("All");

  const filters = ["All", "Strength", "Cardio", "Mobility", "Endurance", "Bodyweight"];

  const filteredPlans =
    exploreFilter === "All"
      ? explorePlans
      : explorePlans.filter((p) => p.tag === exploreFilter);

  return (
    <div className="min-h-screen bg-[#080808] text-[#ECECEC] font-['JetBrains_Mono']">

      {/* ── Ticker bar ──────────────────────────────────────────── */}
      <div className="bg-[#C6F135] text-black text-[10px] font-bold tracking-[0.2em] uppercase py-2 overflow-hidden whitespace-nowrap">
        <div className="inline-flex animate-[ticker_22s_linear_infinite]">
          {[...Array(2)].flatMap(() =>
            ["Today's Workout Ready", "●", "Calories Tracked", "●", "Stay Consistent", "●", "FitTrack v3.0", "●"].map(
              (t, i) => (
                <span key={i} className="px-8">{t}</span>
              )
            )
          )}
        </div>
      </div>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 h-[60px] border-b border-[#1E1E1E] bg-[rgba(8,8,8,0.92)] backdrop-blur-xl grid grid-cols-[auto_1fr_auto_auto] items-center">
        {/* Logo */}
        <div className="px-8 h-full border-r border-[#1E1E1E] flex items-center font-['Barlow_Condensed'] text-2xl font-black tracking-wider uppercase text-[#C6F135]">
          FitTrack<sup className="text-[#FF2A5E] text-xs ml-0.5">™</sup>
        </div>

        {/* Nav links */}
        <ul className="flex items-center gap-8 px-8 list-none">
          {[
            { label: "User Progress",    to: "/progress"  },
            { label: "Meal Planner",     to: "/meals"     },
            { label: "Exercise Library", to: "/exercises" },
            { label: "Log Workout",      to: "/log"       },
            { label: "Settings",         to: "/settings"  },
          ].map(({ label, to }) => (
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

        {/* Live status */}
        <div className="px-6 h-full border-l border-[#1E1E1E] flex items-center gap-2 text-[9px] tracking-[0.15em] uppercase text-[#555]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C6F135] animate-pulse" />
          Live
        </div>

        {/* Account button — top right */}
        <button
          onClick={() => navigate("/profile")}
          className="px-7 h-full border-l border-[#1E1E1E] bg-[#C6F135] text-black font-bold text-[10px] tracking-[0.18em] uppercase hover:bg-[#FF2A5E] hover:text-white transition-colors"
        >
          Account
        </button>
      </nav>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — Today's Dashboard header                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="border-b border-[#1E1E1E]">
        <div className="flex items-end justify-between px-14 pt-12 pb-10 border-b border-[#1E1E1E]">
          <div>
            <div className="text-[8px] tracking-[0.25em] uppercase text-[#FF2A5E] mb-2.5">
              // 001 — Workout Dashboard
            </div>
            <h1 className="font-['Barlow_Condensed'] font-black text-6xl uppercase leading-none tracking-tight">
              Today&apos;s{" "}
              <em className="not-italic text-[#C6F135]">Stats</em>
            </h1>
          </div>
          <div className="text-[9px] tracking-[0.2em] uppercase text-[#555]">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {/* KPI row 1: Calories In / Burnt / Water / Exercises */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#1E1E1E]">
          <KpiCard
            label="Calories Intake"
            value={todayStats.caloriesIntake}
            unit="kcal"
            max={todayStats.caloriesGoal}
            color="#C6F135"
            barPct={(todayStats.caloriesIntake / todayStats.caloriesGoal) * 100}
          />
          <KpiCard
            label="Calories Burnt"
            value={todayStats.caloriesBurnt}
            unit="kcal"
            color="#FF2A5E"
          />
          <KpiCard
            label="Water Intake"
            value={todayStats.waterIntake}
            unit="L"
            max={todayStats.waterGoal}
            color="#00E5FF"
            barPct={(todayStats.waterIntake / todayStats.waterGoal) * 100}
          />
          <KpiCard
            label="Exercises Done"
            value={todayStats.exercisesDone}
            unit={`/ ${todayStats.exercisesGoal}`}
            color="#FFAA00"
          />
        </div>

        {/* Steps row */}
        <div className="px-14 py-6 border-b border-[#1E1E1E] flex items-center gap-8">
          <span className="text-[8px] tracking-[0.22em] uppercase text-[#555] shrink-0">Steps Taken</span>
          <div className="flex-1 bg-[#1E1E1E] h-[6px] relative overflow-hidden">
            <div
              className="h-full bg-[#C6F135] transition-all duration-700"
              style={{ width: `${(todayStats.steps / todayStats.stepsGoal) * 100}%` }}
            />
          </div>
          <span className="font-['Barlow_Condensed'] font-black text-3xl text-[#C6F135] shrink-0">
            {todayStats.steps.toLocaleString()}
          </span>
          <span className="text-[9px] text-[#555] shrink-0">/ {todayStats.stepsGoal.toLocaleString()} steps</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 2 — Plan Progress + Achievements                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="border-b border-[#1E1E1E]">
        {/* Section header */}
        <div className="flex items-end justify-between px-14 pt-12 pb-10 border-b border-[#1E1E1E]">
          <div>
            <div className="text-[8px] tracking-[0.25em] uppercase text-[#FF2A5E] mb-2.5">// 002 — Plan & Achievements</div>
            <h2 className="font-['Barlow_Condensed'] font-black text-5xl uppercase leading-none tracking-tight">
              Your <em className="not-italic text-[#C6F135]">Progress</em>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Plan progress */}
          <div className="px-14 py-10 border-r border-[#1E1E1E]">
            <div className="text-[8px] tracking-[0.2em] uppercase text-[#555] mb-3">Current Plan</div>
            <div className="font-['Barlow_Condensed'] font-bold text-2xl uppercase mb-6">
              {weeklyPlan.name}
            </div>

            {/* Big ring */}
            <div className="flex items-center gap-10 mb-8">
              <RingProgress value={weeklyPlan.progress} max={100} color="#C6F135" size={120} stroke={8}>
                <span className="font-['Barlow_Condensed'] font-black text-3xl text-[#C6F135] leading-none">
                  {weeklyPlan.progress}%
                </span>
              </RingProgress>
              <div className="flex flex-col gap-2">
                <div className="text-[9px] tracking-[0.15em] uppercase text-[#555]">Weekly Days</div>
                <div className="flex gap-2 mt-1">
                  {Array.from({ length: weeklyPlan.totalDays }).map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 border flex items-center justify-center text-[10px] transition-colors"
                      style={
                        i < weeklyPlan.daysCompleted
                          ? { borderColor: "#C6F135", background: "rgba(198,241,53,0.1)", color: "#C6F135" }
                          : { borderColor: "#1E1E1E", color: "#333" }
                      }
                    >
                      {i < weeklyPlan.daysCompleted ? "✓" : i + 1}
                    </div>
                  ))}
                </div>
                <div className="text-[9px] tracking-widest text-[#555] mt-2">
                  {weeklyPlan.daysCompleted} / {weeklyPlan.totalDays} Days Completed
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="border border-[#1E1E1E] p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[8px] tracking-[0.2em] uppercase text-[#555]">Completion</span>
                <span className="text-[9px] text-[#C6F135]">{weeklyPlan.progress}%</span>
              </div>
              <div className="bg-[#1E1E1E] h-2 w-full">
                <div
                  className="h-full bg-[#C6F135] transition-all duration-700"
                  style={{ width: `${weeklyPlan.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="px-14 py-10">
            <div className="font-['Barlow_Condensed'] font-black text-4xl uppercase mb-6">
              Achieve<em className="not-italic text-[#C6F135]">ments</em>
            </div>
            <div className="border border-[#1E1E1E]">
              {achievements.map((a, i) => (
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
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 3 — Explore Workout Plans                        */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="border-b border-[#1E1E1E]">
        {/* Header */}
        <div className="flex items-end justify-between px-14 pt-12 pb-10 border-b border-[#1E1E1E]">
          <div>
            <div className="text-[8px] tracking-[0.25em] uppercase text-[#FF2A5E] mb-2.5">// 003 — Explore</div>
            <h2 className="font-['Barlow_Condensed'] font-black text-5xl uppercase leading-none tracking-tight">
              Workout <em className="not-italic text-[#C6F135]">Plans</em>
            </h2>
          </div>
          <button
            onClick={() => navigate("/exercises")}
            className="text-[9px] tracking-[0.2em] uppercase text-[#555] border-b border-[#2A2A2A] pb-1 hover:text-[#C6F135] hover:border-[#C6F135] transition-colors bg-transparent cursor-pointer"
          >
            View All →
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center border-b border-[#1E1E1E] overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setExploreFilter(f)}
              className={`px-6 py-3 text-[9px] tracking-[0.18em] uppercase border-r border-[#1E1E1E] whitespace-nowrap transition-colors first:border-l first:border-[#1E1E1E] cursor-pointer ${
                exploreFilter === f
                  ? "bg-[#C6F135] text-black font-bold"
                  : "bg-transparent text-[#555] hover:bg-[#C6F135] hover:text-black"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Plan grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-14 gap-0">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="border border-[#1E1E1E] -mt-px -ml-px p-8 hover:bg-[#111] hover:border-[#C6F135] transition-all duration-200 cursor-pointer group relative overflow-hidden"
              onClick={() => navigate(`/plan/${plan.id}`)}
            >
              {/* Ghost number */}
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
                <div className="text-[9px] text-[#555] tracking-[0.15em] uppercase mb-6">{plan.level}</div>
                <button className="w-full border border-[#C6F135] text-[#C6F135] text-[9px] tracking-[0.18em] uppercase py-2.5 hover:bg-[#C6F135] hover:text-black transition-colors cursor-pointer">
                  View Plan →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="px-14 py-8 flex items-center justify-between border-t border-[#1E1E1E]">
        <div className="font-['Barlow_Condensed'] font-black text-xl text-[#C6F135] uppercase">
          FitTrack<sup className="text-[#FF2A5E] text-xs">™</sup>
        </div>
        <div className="text-[8px] tracking-[0.2em] uppercase text-[#555]">
          © 2026 FitTrack · v3.0.0
        </div>
      </footer>

      {/* Ticker keyframe injected via style tag for portability */}
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
      `}</style>
    </div>
  );
}
