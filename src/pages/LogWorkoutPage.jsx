import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { EXERCISES, getUserProfile } from "../data/mockData";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Each exercise has a log type that determines which input fields to show:
//   duration   → sets + time per set   (timed cardio: cycling, stairmaster)
//   reps-cardio → sets + reps          (HIIT / rep-based cardio: high knees, jumping jacks)
//   bodyweight → sets + reps           (push-ups, dips, pistol squat)
//   weighted   → sets + reps + weight  (bench press, deadlift)
//   distance   → distance + time       (running, rowing)
const DISTANCE_EXERCISES = new Set([7, 8, 9]); // Cycling, Treadmill, Rowing

function getLogType(ex) {
  if (DISTANCE_EXERCISES.has(ex.id)) return "distance";
  return ex.logType || "bodyweight";
}

// MET-based calorie estimator per exercise type
function estimateCalories(ex, logData, userWeightKg) {
  const wt   = userWeightKg || 70;
  const type = getLogType(ex);

  if (type === "duration") {
    const mins = (parseFloat(logData.duration) || 0) * (parseInt(logData.sets) || 1);
    return Math.round((ex.met || 7) * wt * (mins / 60));
  }
  if (type === "reps-cardio") {
    const reps = (parseInt(logData.reps) || 0) * (parseInt(logData.sets) || 1);
    return Math.round(reps * (ex.kcalPerRep || 0.4));
  }
  if (type === "bodyweight") {
    const reps = (parseInt(logData.reps) || 0) * (parseInt(logData.sets) || 1);
    return Math.round(reps * (ex.kcalPerRep || 0.32));
  }
  if (type === "weighted") {
    const reps   = (parseInt(logData.reps) || 0) * (parseInt(logData.sets) || 1);
    const weight = parseFloat(logData.weight) || 20;
    return Math.round(reps * weight * 0.1);
  }
  if (type === "distance") {
    const mins = parseFloat(logData.duration) || 30;
    return Math.round((ex.met || 7) * wt * (mins / 60));
  }
  return 0;
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

const MONTHS_FULL = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

// ─────────────────────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Label({ children, color = "#555555" }) {
  return (
    <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em",
      textTransform: "uppercase", color, margin: "0 0 6px" }}>
      {children}
    </p>
  );
}

function Field({ value, onChange, type = "text", placeholder, min, step, unit }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} min={min} step={step}
        style={{ width: "100%", background: "#080808", border: "1px solid #2A2A2A",
          borderRadius: "10px", padding: unit ? "11px 40px 11px 14px" : "11px 14px",
          fontSize: "14px", color: "#ECECEC", outline: "none",
          fontFamily: "'JetBrains Mono', monospace", transition: "border-color 0.2s" }}
        onFocus={e  => { e.target.style.borderColor = "#C6F135"; }}
        onBlur={e   => { e.target.style.borderColor = "#2A2A2A"; }}
      />
      {unit && (
        <span style={{ position: "absolute", right: "12px", top: "50%",
          transform: "translateY(-50%)", fontSize: "11px", color: "#555555",
          pointerEvents: "none" }}>
          {unit}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOG FORM — shows the right inputs based on exercise type
// ─────────────────────────────────────────────────────────────────────────────

function LogForm({ ex, logData, onChange, calories }) {
  const type = getLogType(ex);

  return (
    <div style={{ display: "grid", gap: "14px" }}>

      {/* Cardio duration-based: sets + time per set */}
      {type === "duration" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <Label>Sets</Label>
              <Field type="number" min="1" value={logData.sets || ""} placeholder="3"
                onChange={e => onChange("sets", e.target.value)} />
            </div>
            <div>
              <Label>Duration per Set</Label>
              <Field type="number" min="1" value={logData.duration || ""} placeholder="30"
                onChange={e => onChange("duration", e.target.value)} unit="sec" />
            </div>
          </div>
          <div>
            <Label>Rest Between Sets</Label>
            <Field type="number" min="0" value={logData.rest || ""} placeholder="60"
              onChange={e => onChange("rest", e.target.value)} unit="sec" />
          </div>
        </>
      )}

      {/* HIIT reps-based: sets + reps */}
      {type === "reps-cardio" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div>
            <Label>Sets</Label>
            <Field type="number" min="1" value={logData.sets || ""} placeholder="3"
              onChange={e => onChange("sets", e.target.value)} />
          </div>
          <div>
            <Label>Reps</Label>
            <Field type="number" min="1" value={logData.reps || ""} placeholder="20"
              onChange={e => onChange("reps", e.target.value)} />
          </div>
          <div>
            <Label>Rest</Label>
            <Field type="number" min="0" value={logData.rest || ""} placeholder="30"
              onChange={e => onChange("rest", e.target.value)} unit="sec" />
          </div>
        </div>
      )}

      {/* Bodyweight: sets + reps */}
      {type === "bodyweight" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <div>
            <Label>Sets</Label>
            <Field type="number" min="1" value={logData.sets || ""} placeholder="3"
              onChange={e => onChange("sets", e.target.value)} />
          </div>
          <div>
            <Label>Reps</Label>
            <Field type="number" min="1" value={logData.reps || ""} placeholder="12"
              onChange={e => onChange("reps", e.target.value)} />
          </div>
          <div>
            <Label>Rest</Label>
            <Field type="number" min="0" value={logData.rest || ""} placeholder="45"
              onChange={e => onChange("rest", e.target.value)} unit="sec" />
          </div>
        </div>
      )}

      {/* Weighted: sets + reps + weight */}
      {type === "weighted" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <Label>Sets</Label>
              <Field type="number" min="1" value={logData.sets || ""} placeholder="4"
                onChange={e => onChange("sets", e.target.value)} />
            </div>
            <div>
              <Label>Reps</Label>
              <Field type="number" min="1" value={logData.reps || ""} placeholder="10"
                onChange={e => onChange("reps", e.target.value)} />
            </div>
            <div>
              <Label>Weight</Label>
              <Field type="number" min="0" step="0.5" value={logData.weight || ""} placeholder="20"
                onChange={e => onChange("weight", e.target.value)} unit="kg" />
            </div>
          </div>
          <div>
            <Label>Rest Between Sets</Label>
            <Field type="number" min="0" value={logData.rest || ""} placeholder="60"
              onChange={e => onChange("rest", e.target.value)} unit="sec" />
          </div>
        </>
      )}

      {/* Distance (cardio): distance + time */}
      {type === "distance" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <Label>Distance</Label>
              <Field type="number" min="0" step="0.1" value={logData.distance || ""} placeholder="5"
                onChange={e => onChange("distance", e.target.value)} unit="km" />
            </div>
            <div>
              <Label>Duration</Label>
              <Field type="number" min="1" value={logData.duration || ""} placeholder="30"
                onChange={e => onChange("duration", e.target.value)} unit="min" />
            </div>
          </div>
          {logData.distance && logData.duration && (
            <div>
              <Label>Average Speed</Label>
              <div style={{ background: "#111111", borderRadius: "10px", padding: "10px 14px",
                fontSize: "14px", color: "#FFAA00", border: "1px solid #1E1E1E" }}>
                {((parseFloat(logData.distance) / parseFloat(logData.duration)) * 60).toFixed(1)} km/h
              </div>
            </div>
          )}
        </>
      )}

      {/* Notes */}
      <div>
        <Label>Notes (optional)</Label>
        <textarea value={logData.notes || ""} onChange={e => onChange("notes", e.target.value)}
          placeholder="How did it feel? Any personal records?"
          rows={2}
          style={{ width: "100%", background: "#080808", border: "1px solid #2A2A2A",
            borderRadius: "10px", padding: "11px 14px", fontSize: "13px", color: "#ECECEC",
            outline: "none", fontFamily: "'JetBrains Mono', monospace", resize: "vertical",
            transition: "border-color 0.2s" }}
          onFocus={e => { e.target.style.borderColor = "#C6F135"; }}
          onBlur={e  => { e.target.style.borderColor = "#2A2A2A"; }}
        />
      </div>

      {/* Estimated calories — live preview, locked after logging */}
      {calories > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 14px", borderRadius: "10px",
          background: "rgba(255,170,0,0.08)", border: "1px solid rgba(255,170,0,0.25)" }}>
          <span style={{ fontSize: "18px" }}>🔥</span>
          <div>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#555555" }}>Estimated Burn</p>
            <p style={{ margin: 0, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900,
              fontSize: "24px", color: "#FFAA00", lineHeight: 1 }}>
              {calories} kcal
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE PICKER
// ─────────────────────────────────────────────────────────────────────────────

function ExercisePicker({ onSelect }) {
  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const filtered = EXERCISES.filter(ex => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === "All" || ex.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", marginBottom: "14px" }}>
        <input
          type="text"
          placeholder="Search exercises…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: "#080808", border: "1px solid #2A2A2A", borderRadius: "10px",
            padding: "11px 14px", fontSize: "13px", color: "#ECECEC", outline: "none",
            fontFamily: "'JetBrains Mono', monospace" }}
          onFocus={e => { e.target.style.borderColor = "#C6F135"; }}
          onBlur={e  => { e.target.style.borderColor = "#2A2A2A"; }}
        />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ background: "#080808", border: "1px solid #2A2A2A", borderRadius: "10px",
            padding: "11px 14px", fontSize: "13px", color: "#ECECEC", outline: "none",
            fontFamily: "'JetBrains Mono', monospace", cursor: "pointer" }}>
          <option value="All">All</option>
          <option value="Cardio">Cardio</option>
          <option value="Weightlifting">Strength</option>
        </select>
      </div>

      <div style={{ display: "grid", gap: "6px", maxHeight: "320px", overflowY: "auto", paddingRight: "4px" }}>
        {filtered.map(ex => (
          <button key={ex.id} onClick={() => onSelect(ex)}
            style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%",
              background: "#111111", border: "1px solid #1E1E1E", borderRadius: "10px",
              padding: "12px 14px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#C6F135"; e.currentTarget.style.background = "#161616"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E1E"; e.currentTarget.style.background = "#111111"; }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
              background: ex.category === "Cardio" ? "#FF2A5E" : "#C6F135" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#ECECEC",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ex.name}
              </p>
              <p style={{ margin: 0, fontSize: "10px", color: "#555555",
                textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {ex.category} · {ex.difficulty}
              </p>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#555555", flexShrink: 0 }}>
              {getLogType(ex)}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "#333333", fontSize: "12px", padding: "24px" }}>
            No exercises found
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGGED ENTRY CARD — calories are read-only once logged
// ─────────────────────────────────────────────────────────────────────────────

const statChip = {
  fontSize: "11px", fontWeight: 700, padding: "3px 10px",
  borderRadius: "999px", border: "1px solid #2A2A2A", color: "#ECECEC",
};

function LoggedEntryCard({ entry, onDelete }) {
  const type = entry.logType;
  return (
    <div style={{ background: "#0D0D0D", border: "1px solid #1E1E1E", borderRadius: "12px",
      padding: "16px", display: "flex", gap: "12px" }}>
      {/* Category accent bar */}
      <div style={{ width: "4px", borderRadius: "2px", flexShrink: 0,
        background: entry.category === "Cardio" ? "#FF2A5E" : "#C6F135" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: "8px", marginBottom: "8px" }}>
          <div>
            <p style={{ margin: 0, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900,
              fontSize: "20px", color: "#ECECEC", lineHeight: 1 }}>
              {entry.name}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#555555",
              textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {entry.category} · {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <button onClick={onDelete}
            style={{ background: "transparent", border: "1px solid #2A2A2A", borderRadius: "6px",
              padding: "4px 8px", fontSize: "10px", color: "#555555", cursor: "pointer", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#FF2A5E"; e.currentTarget.style.color = "#FF2A5E"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#2A2A2A"; e.currentTarget.style.color = "#555555"; }}>
            Remove
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {entry.sets     && <span style={statChip}>{entry.sets} sets</span>}
          {entry.reps     && <span style={statChip}>{entry.reps} reps</span>}
          {entry.weight   && <span style={statChip}>{entry.weight} kg</span>}
          {entry.duration && type !== "distance" && <span style={statChip}>{entry.duration} sec/set</span>}
          {entry.duration && type === "distance" && <span style={statChip}>{entry.duration} min</span>}
          {entry.distance && <span style={statChip}>{entry.distance} km</span>}
          {entry.rest     && <span style={{ ...statChip, color: "#555555" }}>{entry.rest}s rest</span>}
          {/* Calories are locked (read-only) once logged — value comes from estimateCalories at log time */}
          {entry.calories > 0 && (
            <span style={{ ...statChip, color: "#FFAA00", borderColor: "rgba(255,170,0,0.3)" }}>
              🔥 {entry.calories} kcal
            </span>
          )}
        </div>

        {entry.notes && (
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#555555",
            fontStyle: "italic", lineHeight: 1.6 }}>
            "{entry.notes}"
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REST TIMER
// ─────────────────────────────────────────────────────────────────────────────

function RestTimer({ defaultSeconds = 60 }) {
  const [seconds,  setSeconds]  = useState(defaultSeconds);
  const [running,  setRunning]  = useState(false);
  const [finished, setFinished] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            clearInterval(ref.current);
            setRunning(false);
            setFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);

  function reset() {
    clearInterval(ref.current);
    setRunning(false);
    setFinished(false);
    setSeconds(defaultSeconds);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div style={{ background: "#0D0D0D", border: "1px solid #1E1E1E",
      borderRadius: "14px", padding: "20px", textAlign: "center" }}>
      <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 700,
        letterSpacing: "0.12em", textTransform: "uppercase", color: "#555555" }}>
        Rest Timer
      </p>
      <p style={{ margin: "0 0 16px", fontFamily: "'Barlow Condensed',sans-serif",
        fontWeight: 900, fontSize: "52px", lineHeight: 1,
        color: finished ? "#C6F135" : running ? "#FFAA00" : "#ECECEC" }}>
        {finished ? "GO!" : `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`}
      </p>
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        <button onClick={() => { setFinished(false); setRunning(r => !r); }}
          style={{ padding: "10px 20px", borderRadius: "8px", border: 0,
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", cursor: "pointer",
            background: running ? "#FF2A5E" : "#C6F135", color: "#080808" }}>
          {running ? "Pause" : finished ? "Restart" : "Start"}
        </button>
        <button onClick={reset}
          style={{ padding: "10px 16px", borderRadius: "8px",
            border: "1px solid #2A2A2A", fontSize: "11px", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
            background: "transparent", color: "#555555" }}>
          Reset
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function LogWorkoutPage({ addWorkoutToCalendar }) {
  const user    = getUserProfile();
  const navigate = useNavigate();

  // Exercise currently selected for logging
  const [selectedEx,     setSelectedEx]     = useState(null);
  // Form fields for the selected exercise
  const [logData,        setLogData]        = useState({});
  // All exercises logged this session (persisted to localStorage per day)
  const [loggedEntries,  setLoggedEntries]  = useState(() => {
    try {
      const saved = localStorage.getItem("workoutLog_" + getTodayKey());
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  // Exercise picker panel open state
  const [pickerOpen,     setPickerOpen]     = useState(false);
  // Toast notification
  const [toast,          setToast]          = useState(null);
  // Whether the session has been saved to the calendar
  const [savedToCalendar, setSavedToCalendar] = useState(false);

  // Persist today's log to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem("workoutLog_" + getTodayKey(), JSON.stringify(loggedEntries));
  }, [loggedEntries]);

  function showToast(text, color = "#C6F135") {
    setToast({ text, color });
    setTimeout(() => setToast(null), 3000);
  }

  function handleFieldChange(field, value) {
    setLogData(prev => ({ ...prev, [field]: value }));
  }

  function handleSelectExercise(ex) {
    setSelectedEx(ex);
    setLogData({});
    setPickerOpen(false);
    setSavedToCalendar(false);
  }

  // Add current exercise to the session log with locked calories
  function handleAddExercise() {
    if (!selectedEx) return;
    const type     = getLogType(selectedEx);
    // Calories are calculated now and locked — they won't change after logging
    const calories = estimateCalories(selectedEx, logData, user.weight);

    const entry = {
      id:        Date.now(),
      name:      selectedEx.name,
      category:  selectedEx.category,
      logType:   type,
      timestamp: new Date().toISOString(),
      calories,  // locked at log time
      ...logData,
    };

    setLoggedEntries(prev => [entry, ...prev]);
    showToast(`${selectedEx.name} logged — ${calories} kcal burned`);
    setLogData({});
    setSavedToCalendar(false);
  }

  // Save the full session to the shared homepage calendar
  function handleSaveToCalendar() {
    if (!addWorkoutToCalendar || loggedEntries.length === 0) return;
    const today = getTodayKey();
    loggedEntries.forEach(entry => {
      addWorkoutToCalendar(today, {
        name:           entry.name,
        cat:            "workout",
        type:           "workout",
        caloriesBurned: entry.calories || 0,
      });
    });
    setSavedToCalendar(true);
    showToast("Workout saved to your calendar!", "#00E5FF");
  }

  function handleDeleteEntry(id) {
    setLoggedEntries(prev => prev.filter(e => e.id !== id));
    setSavedToCalendar(false);
  }

  const totalCalories = loggedEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
  // Live calorie preview for the currently filled-in form
  const previewCalories = selectedEx ? estimateCalories(selectedEx, logData, user.weight) : 0;
  const today           = new Date();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:translateX(0);} }
        .lw-fade-up  { animation: fadeUp  0.4s ease both; }
        .lw-slide-in { animation: slideIn 0.3s ease both; }
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:#0D0D0D;}
        ::-webkit-scrollbar-thumb{background:#2A2A2A;border-radius:2px;}
        select option{background:#0D0D0D;color:#ECECEC;}
        .lw-grid{display:grid;grid-template-columns:1fr;gap:24px;}
        @media(min-width:1024px){.lw-grid{grid-template-columns:1fr 360px;}}
        .lw-summary{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:#1E1E1E;}
        @media(min-width:640px){.lw-summary{grid-template-columns:repeat(4,1fr);}}
      `}</style>

      <div style={{ background: "#080808", color: "#ECECEC", minHeight: "100vh",
        fontFamily: "'JetBrains Mono', monospace", overflowX: "hidden" }}>
        <main style={{ maxWidth: "1200px", margin: "0 auto",
          padding: "clamp(24px,5vw,48px) clamp(16px,4vw,40px)" }}>

          {/* Page header */}
          <header className="lw-fade-up" style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "16px",
              marginBottom: "6px", flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900,
                fontSize: "clamp(48px,8vw,80px)", lineHeight: 1, margin: 0 }}>
                LOG<br />
                <span style={{ color: "transparent", WebkitTextStroke: "2px #C6F135" }}>WORKOUT</span>
              </h1>
              <div style={{ marginLeft: "auto" }}>
                <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "#555555", textAlign: "right" }}>
                  {MONTHS_FULL[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#333333", textAlign: "right" }}>
                  {user.name}
                </p>
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "#555555", maxWidth: "480px", lineHeight: 1.7, margin: 0 }}>
              Select exercises, log your sets and reps. Save your session to the calendar when done.
            </p>
          </header>

          {/* Daily summary bar */}
          <div className="lw-summary lw-fade-up" style={{ marginBottom: "32px" }}>
            {[
              { label: "Exercises",    value: loggedEntries.length,                                              color: "#C6F135"  },
              { label: "Total Burned", value: `${totalCalories} kcal`,                                           color: "#FFAA00"  },
              { label: "Sets Done",    value: loggedEntries.reduce((s, e) => s + (parseInt(e.sets) || 1), 0),    color: "#00E5FF"  },
              { label: "Saved",        value: savedToCalendar ? "✓ Done" : "Not yet",                            color: savedToCalendar ? "#C6F135" : "#333333" },
            ].map(item => (
              <div key={item.label} style={{ padding: "16px 20px", background: "#0D0D0D" }}>
                <p style={{ margin: "0 0 4px", fontSize: "10px", fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase", color: "#555555" }}>
                  {item.label}
                </p>
                <p style={{ margin: 0, fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 900, fontSize: "28px", lineHeight: 1, color: item.color }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="lw-grid">

            {/* Left — log form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Exercise picker trigger */}
              <div style={{ background: "#0D0D0D", border: "1px solid #1E1E1E",
                borderRadius: "14px", padding: "20px" }}>
                <Label color="#555555">Select Exercise</Label>
                <button onClick={() => setPickerOpen(p => !p)}
                  style={{ width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: "12px",
                    background: "#111111", border: `1px solid ${pickerOpen ? "#C6F135" : "#2A2A2A"}`,
                    borderRadius: "10px", padding: "14px 16px", cursor: "pointer",
                    textAlign: "left", transition: "all 0.2s" }}
                  onMouseEnter={e => { if (!pickerOpen) e.currentTarget.style.borderColor = "#555555"; }}
                  onMouseLeave={e => { if (!pickerOpen) e.currentTarget.style.borderColor = "#2A2A2A"; }}>
                  {selectedEx ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%",
                        background: selectedEx.category === "Cardio" ? "#FF2A5E" : "#C6F135" }} />
                      <div>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#ECECEC" }}>
                          {selectedEx.name}
                        </p>
                        <p style={{ margin: 0, fontSize: "10px", color: "#555555",
                          textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {selectedEx.category} · {selectedEx.difficulty}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: "13px", color: "#555555" }}>
                      Browse Exercise Library to log…
                    </span>
                  )}
                  <span style={{ fontSize: "16px", color: "#555555",
                    transform: pickerOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                    ▾
                  </span>
                </button>

                {pickerOpen && (
                  <div style={{ marginTop: "14px", animation: "fadeUp 0.2s ease" }}>
                    <ExercisePicker onSelect={handleSelectExercise} />
                  </div>
                )}
              </div>

              {/* Log form fields — shown once an exercise is selected */}
              {selectedEx && (
                <div className="lw-slide-in" style={{ background: "#0D0D0D", border: "1px solid #1E1E1E",
                  borderRadius: "14px", padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%",
                      background: selectedEx.category === "Cardio" ? "#FF2A5E" : "#C6F135" }} />
                    <h3 style={{ margin: 0, fontFamily: "'Barlow Condensed',sans-serif",
                      fontWeight: 900, fontSize: "24px", color: "#ECECEC" }}>
                      {selectedEx.name}
                    </h3>
                    <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      padding: "3px 10px", borderRadius: "999px",
                      border: "1px solid #2A2A2A", color: "#555555" }}>
                      {getLogType(selectedEx)}
                    </span>
                  </div>

                  <LogForm
                    ex={selectedEx}
                    logData={logData}
                    onChange={handleFieldChange}
                    calories={previewCalories}
                  />

                  <button onClick={handleAddExercise}
                    style={{ width: "100%", marginTop: "16px", padding: "14px",
                      background: "#C6F135", border: 0, borderRadius: "10px",
                      fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em",
                      textTransform: "uppercase", color: "#080808", cursor: "pointer",
                      transition: "opacity 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                    + Add to Today's Log
                  </button>
                </div>
              )}

              {/* Rest timer — shown when an exercise is selected */}
              {selectedEx && <RestTimer defaultSeconds={logData.rest ? parseInt(logData.rest) : 60} />}

              {/* Save to calendar — only shown once exercises have been logged */}
              {loggedEntries.length > 0 && (
                <button onClick={handleSaveToCalendar}
                  disabled={savedToCalendar}
                  style={{ width: "100%", padding: "16px",
                    background: savedToCalendar ? "transparent" : "#00E5FF",
                    border: savedToCalendar ? "1px solid #C6F135" : "none",
                    borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: savedToCalendar ? "#C6F135" : "#080808",
                    cursor: savedToCalendar ? "default" : "pointer", transition: "all 0.2s" }}>
                  {savedToCalendar ? "✓ Workout Logged" : "Log Workout →"}
                </button>
              )}
            </div>

            {/* Right — today's log */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ position: "sticky", top: "24px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between",
                  gap: "8px", marginBottom: "16px" }}>
                  <h2 style={{ margin: 0, fontFamily: "'Barlow Condensed',sans-serif",
                    fontWeight: 900, fontSize: "28px", color: "#ECECEC" }}>
                    TODAY'S LOG
                  </h2>
                  {loggedEntries.length > 0 && (
                    <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", color: "#555555" }}>
                      {loggedEntries.length} exercise{loggedEntries.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {loggedEntries.length === 0 ? (
                  <div style={{ background: "#0D0D0D", border: "1px dashed #1E1E1E",
                    borderRadius: "14px", padding: "48px 24px", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "32px", marginBottom: "8px" }}>💪</p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#333333" }}>
                      No exercises logged yet today.<br />Pick one on the left to get started.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {loggedEntries.map(entry => (
                      <LoggedEntryCard
                        key={entry.id}
                        entry={entry}
                        onDelete={() => handleDeleteEntry(entry.id)}
                      />
                    ))}

                    {/* Session total — calories are locked per entry */}
                    <div style={{ background: "rgba(198,241,53,0.05)",
                      border: "1px solid rgba(198,241,53,0.2)", borderRadius: "12px",
                      padding: "16px", marginTop: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "10px", fontWeight: 700,
                            letterSpacing: "0.12em", textTransform: "uppercase", color: "#555555" }}>
                            Total Burned Today
                          </p>
                          <p style={{ margin: 0, fontFamily: "'Barlow Condensed',sans-serif",
                            fontWeight: 900, fontSize: "36px", color: "#C6F135", lineHeight: 1 }}>
                            {totalCalories} kcal
                          </p>
                        </div>
                        <p style={{ margin: 0, fontSize: "11px", color: "#333333", textAlign: "right" }}>
                          {loggedEntries.length} exercise{loggedEntries.length !== 1 ? "s" : ""}<br />
                          {loggedEntries.reduce((s, e) => s + (parseInt(e.sets) || 1), 0)} sets total
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </main>

        {/* Toast notification */}
        {toast && (
          <div style={{ position: "fixed", bottom: "24px", left: "24px", zIndex: 999,
            background: "#0D0D0D", border: `1px solid ${toast.color}`,
            borderRadius: "12px", padding: "12px 20px",
            fontSize: "13px", color: "#ECECEC", fontFamily: "inherit",
            animation: "fadeUp 0.3s ease" }}>
            {toast.text}
          </div>
        )}
      </div>
    </>
  );
}
