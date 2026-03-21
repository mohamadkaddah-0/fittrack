import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const GOALS = {
  calories:  2400,
  water:     3.0,
  exercises: 6,
  steps:     10000,
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

export default function HomePage() {
  const navigate = useNavigate();

  const [caloriesIntake, setCaloriesIntake] = useState(0);
  const [caloriesBurnt,  setCaloriesBurnt]  = useState(0);
  const [waterIntake,    setWaterIntake]     = useState(0);
  const [exercisesDone,  setExercisesDone]   = useState(0);
  const [steps,          setSteps]           = useState(0);
  const [daysCompleted,  setDaysCompleted]   = useState(0);

  const planProgress = Math.round((daysCompleted / CURRENT_PLAN.totalDays) * 100);

  return (
    <div>

      {/* SECTION 1 — Today's Stats */}
      <div className="border-b border-[#1E1E1E]">

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#1E1E1E]">
          <EditableStatCard label="Calories Intake" value={caloriesIntake} unit="kcal" goal={GOALS.calories}  color="#C6F135" onSave={setCaloriesIntake} />
          <EditableStatCard label="Calories Burnt"  value={caloriesBurnt}  unit="kcal" goal={0}               color="#FF2A5E" onSave={setCaloriesBurnt}  />
          <EditableStatCard label="Water Intake"    value={waterIntake}    unit="L"    goal={GOALS.water}     color="#00E5FF" onSave={setWaterIntake}     />
          <EditableStatCard label="Exercises Done"  value={exercisesDone}  unit=""     goal={GOALS.exercises} color="#FFAA00" onSave={setExercisesDone}   />
        </div>

        <div
          className="px-6 md:px-14 py-5 border-b border-[#1E1E1E] flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:bg-[#111] transition-colors"
          onClick={() => {
            const val = prompt("Enter steps taken:");
            const parsed = parseInt(val);
            if (!isNaN(parsed) && parsed >= 0) setSteps(parsed);
          }}
          title="Click to update steps"
        >
          <span className="text-[8px] tracking-[0.22em] uppercase text-[#555] shrink-0">Steps Taken</span>
          <div className="flex-1 bg-[#1E1E1E] h-[6px] overflow-hidden">
            <div className="h-full bg-[#C6F135] transition-all duration-700" style={{ width: `${Math.min((steps / GOALS.steps) * 100, 100)}%` }} />
          </div>
          <span className="font-['Barlow_Condensed'] font-black text-3xl text-[#C6F135] shrink-0">{steps.toLocaleString()}</span>
          <span className="text-[9px] text-[#555] shrink-0">/ {GOALS.steps.toLocaleString()} steps</span>
          <span className="text-[8px] text-[#333] uppercase tracking-widest shrink-0">click to edit</span>
        </div>
      </div>

      {/* SECTION 2 — Plan Progress + Achievements */}
      <div className="border-b border-[#1E1E1E]">

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
            <div className="font-['Barlow_Condensed'] font-bold text-2xl uppercase mb-8">{CURRENT_PLAN.name}</div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-8">
              <RingProgress value={daysCompleted} max={CURRENT_PLAN.totalDays} color="#C6F135" size={120} stroke={8}>
                <span className="font-['Barlow_Condensed'] font-black text-3xl text-[#C6F135] leading-none">{planProgress}%</span>
              </RingProgress>
              <div className="flex flex-col gap-3">
                <div className="text-[9px] tracking-[0.15em] uppercase text-[#555]">Click a day to mark it done</div>
                <div className="flex gap-2 flex-wrap mt-1">
                  {Array.from({ length: CURRENT_PLAN.totalDays }).map((_, i) => (
                    <button key={i}
                      onClick={() => setDaysCompleted(i < daysCompleted ? i : i + 1)}
                      className="w-9 h-9 border flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                      style={i < daysCompleted
                        ? { borderColor: "#C6F135", background: "rgba(198,241,53,0.1)", color: "#C6F135" }
                        : { borderColor: "#1E1E1E", color: "#333" }}
                    >
                      {i < daysCompleted ? "OK" : i + 1}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] tracking-widest text-[#555]">{daysCompleted} / {CURRENT_PLAN.totalDays} Days Completed</div>
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

          {/* Achievements */}
          <div className="px-6 md:px-14 py-10">
            <div className="font-['Barlow_Condensed'] font-black text-4xl uppercase mb-6">
              Achieve<em className="not-italic text-[#C6F135]">ments</em>
            </div>
            <div className="border border-[#1E1E1E]">
              {ACHIEVEMENTS.map((a, i) => (
                <div key={i}
                  className={`flex items-center gap-5 px-6 py-5 border-b border-[#1E1E1E] last:border-b-0 transition-all duration-200 cursor-default hover:bg-[#111] hover:pl-8 ${a.locked ? "opacity-40" : ""}`}
                >
                  <div className="w-10 h-10 border flex items-center justify-center text-lg flex-shrink-0"
                    style={{ borderColor: a.locked ? "#333" : a.color }}>
                    {a.emoji}
                  </div>
                  <div>
                    <div className="text-sm font-bold tracking-wide">{a.name}</div>
                    <div className="text-[9px] text-[#555] tracking-widest mt-1">{a.sub}</div>
                  </div>
                  {!a.locked && (
                    <div className="ml-auto text-[8px] tracking-widest uppercase" style={{ color: a.color }}>OK</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 md:px-14 py-8 flex items-center justify-between border-t border-[#1E1E1E]">
        <div className="font-['Barlow_Condensed'] font-black text-xl text-[#C6F135] uppercase">FitTrack</div>
        <div className="text-[8px] tracking-[0.2em] uppercase text-[#555]">2026 FitTrack v3.0.0</div>
      </footer>

    </div>
  );
}
