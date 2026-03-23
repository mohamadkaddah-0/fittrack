import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { EXERCISES, getExercisePlan, getUserProfile, isRiskyForUser } from "../data/mockData";

function getCatColor(category) {
  return category === "Cardio" ? "#FF2A5E" : "#C6F135";
}

function getDiffColor(difficulty) {
  if (difficulty === "Beginner")     return "#C6F135";
  if (difficulty === "Intermediate") return "#FFAA00";
  return "#FF2A5E";
}

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

function TimerSection({ exercise }) {
  const isDuration  = exercise.logType === "duration";
  const defaultSecs = isDuration ? 30 : 60;
  const [seconds,   setSeconds]   = useState(defaultSecs);
  const [running,   setRunning]   = useState(false);
  const [finished,  setFinished]  = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
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
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function reset() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setFinished(false);
    setSeconds(defaultSecs);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div style={{ background: "#0D0D0D", border: "1px solid #1E1E1E", borderRadius: 18, padding: 24, marginBottom: 24 }}>
      <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "30px", margin: "0 0 6px" }}>
        TIMER
      </h2>
      {!isDuration && (
        <p style={{ color: "#555555", fontSize: 12, marginBottom: 16 }}>
          Optional — use this as a rest timer between sets.
        </p>
      )}
      {isDuration && (
        <p style={{ color: "#555555", fontSize: 12, marginBottom: 16 }}>
          This is a duration-based exercise. Use the timer to track your set.
        </p>
      )}

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "64px", lineHeight: 1, color: finished ? "#C6F135" : "#ECECEC" }}>
          {finished ? "DONE" : display}
        </p>
      </div>

      {!finished && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "#555555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, display: "block", marginBottom: 8 }}>
            Set duration (seconds)
          </label>
          <input
            type="number"
            min="5"
            max="3600"
            value={seconds}
            onChange={e => { if (!running) setSeconds(parseInt(e.target.value) || 30); }}
            style={{ width: "100%", background: "#111111", border: "1px solid #1E1E1E", borderRadius: 10, padding: "10px 14px", color: "#ECECEC", fontSize: 14 }}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => { setFinished(false); setRunning(r => !r); }}
          style={{ flex: 1, padding: "12px", borderRadius: 10, border: 0, fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", background: running ? "#FF2A5E" : "#C6F135", color: "#080808" }}>
          {running ? "Pause" : finished ? "Restart" : "Start"}
        </button>
        <button
          onClick={reset}
          style={{ padding: "12px 18px", borderRadius: 10, border: "1px solid #2A2A2A", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", background: "transparent", color: "#555555" }}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default function ExerciseDetailPage() {
  const { id }    = useParams();
  const user      = getUserProfile();
  const [imgErr, setImgErr] = useState(false);

  const exercise = useMemo(() => EXERCISES.find(ex => ex.id === Number(id)), [id]);

  if (!exercise) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", color: "#ECECEC" }}>
        <Navbar />
        <div style={{ padding: "40px" }}>
          <h1 style={{ fontSize: "42px", fontWeight: 900 }}>Exercise not found</h1>
          <Link to="/exercises" style={{ color: "#00E5FF", textDecoration: "none" }}>← Back to library</Link>
        </div>
      </div>
    );
  }

  const plan    = getExercisePlan(exercise, user.level);
  const caution = isRiskyForUser(exercise, user.limitations);
  const initials = exercise.name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        * { font-family: 'JetBrains Mono', monospace; }
        @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr !important; } .detail-stats { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 640px) { .detail-stats { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#080808", color: "#ECECEC" }}>

        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>

          <nav style={{ display: "flex", alignItems: "center", gap: 8, color: "#333333", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 28, flexWrap: "wrap" }}>
            <span>Home</span><span>/</span>
            <Link to="/exercises" style={{ textDecoration: "none", color: "#555555" }}>Exercise Library</Link>
            <span>/</span>
            <span style={{ color: "#ECECEC" }}>{exercise.name}</span>
          </nav>

          <div style={{ width: "100%", height: "280px", borderRadius: 18, overflow: "hidden", marginBottom: 28, position: "relative", background: "#111111", border: "1px solid #1E1E1E" }}>
            {!imgErr && exercise.image ? (
              <img src={exercise.image} alt={exercise.name} onError={() => setImgErr(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "100px", color: "#2A2A2A" }}>{initials}</span>
              </div>
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,8,0.9) 0%, transparent 60%)" }} />
            <div style={{ position: "absolute", bottom: 20, left: 24 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: getCatColor(exercise.category), border: `1px solid ${getCatColor(exercise.category)}66`, borderRadius: 999, padding: "6px 10px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, background: "rgba(0,0,0,0.5)" }}>
                {exercise.category}
              </span>
            </div>
          </div>

          {exercise.videoId && (
            <div style={{ marginBottom: 28, borderRadius: 18, overflow: "hidden", border: "1px solid #1E1E1E" }}>
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                <iframe
                  src={`https://www.youtube.com/embed/${exercise.videoId}`}
                  title={`${exercise.name} tutorial`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                />
              </div>
            </div>
          )}

          <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "28px" }}>
            <section>
              <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "clamp(56px,9vw,100px)", lineHeight: 1.02, margin: "0 0 16px" }}>
                {exercise.name}
              </h1>

              <p style={{ maxWidth: 680, color: "#555555", lineHeight: 1.9, fontSize: 14, marginBottom: 22 }}>{exercise.desc}</p>

              {caution && (
                <div style={{ background: "rgba(255,170,0,0.1)", border: "1px solid rgba(255,170,0,0.4)", color: "#FFAA00", padding: "14px 16px", borderRadius: "14px", marginBottom: "22px", lineHeight: 1.8 }}>
                  ⚠ This exercise may not be suitable for your limitations. Consult your doctor or trainer first.
                </div>
              )}

              <div className="detail-stats" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                {[
                  ["Equipment", exercise.equipmentName || "Not specified", "#00E5FF"],
                  ["Type",      exercise.type          || "Exercise",      "#FFAA00"],
                  ["Muscles",   exercise.muscles,                          "#FF2A5E"],
                  ["Difficulty",exercise.difficulty,    getDiffColor(exercise.difficulty)],
                ].map(([label, value, color]) => (
                  <div key={label} style={{ background: "#0D0D0D", border: "1px solid #1E1E1E", borderRadius: 18, padding: 20 }}>
                    <p style={{ margin: "0 0 6px", color: "#555555", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>{label}</p>
                    <p style={{ margin: 0, color, fontWeight: 700 }}>{value}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: "#0D0D0D", border: "1px solid #1E1E1E", borderRadius: 18, padding: 24, marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "34px", margin: "0 0 16px" }}>YOUR LEVEL-BASED PLAN</h2>
                <div style={{ background: "#111111", border: "1px solid #1E1E1E", borderRadius: 14, padding: 16 }}>
                  <p style={{ margin: "0 0 8px", color: "#555555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
                    Recommended for {user.level}
                  </p>
                  <p style={{ margin: "0 0 8px", color: "#C6F135", fontWeight: 700, fontSize: 20 }}>{plan.title}</p>
                  <p style={{ margin: 0, color: "#555555", lineHeight: 1.8 }}>{plan.details}</p>
                </div>
              </div>

              <TimerSection exercise={exercise} />

              <div style={{ background: "#0D0D0D", border: "1px solid #1E1E1E", borderRadius: 18, padding: 24, marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "34px", margin: "0 0 16px" }}>HOW TO DO IT</h2>
                <div style={{ display: "grid", gap: 12 }}>
                  {(exercise.steps || []).map((step, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 12, alignItems: "start", background: "#111111", border: "1px solid #1E1E1E", borderRadius: 14, padding: 14 }}>
                      <span style={{ color: "#C6F135", fontSize: 28, lineHeight: 1, fontWeight: 900 }}>{idx + 1}</span>
                      <p style={{ margin: 0, color: "#ECECEC", lineHeight: 1.8 }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "#0D0D0D", border: "1px solid #1E1E1E", borderRadius: 18, padding: 24 }}>
                <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "34px", margin: "0 0 16px" }}>TIPS & MISTAKES</h2>
                <div style={{ display: "grid", gap: 12 }}>
                  {(exercise.tips || []).map((tip, idx) => (
                    <div key={`tip-${idx}`} style={{ color: "#C6F135", background: "#111111", border: "1px solid #1E1E1E", borderRadius: 14, padding: 14 }}>✓ {tip}</div>
                  ))}
                  {(exercise.mistakes || []).map((m, idx) => (
                    <div key={`m-${idx}`} style={{ color: "#FF2A5E", background: "#111111", border: "1px solid #1E1E1E", borderRadius: 14, padding: 14 }}>✕ {m}</div>
                  ))}
                </div>
              </div>
            </section>

            <aside style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ background: "#0D0D0D", border: "1px solid #1E1E1E", borderRadius: 18, padding: 24 }}>
                <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "30px", margin: "0 0 16px" }}>MUSCLES</h2>
                <p style={{ margin: "0 0 8px", color: "#555555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>Primary</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {(exercise.primaryMuscles || []).map(m => <span key={m} style={tagStyle("#C6F135")}>{m}</span>)}
                </div>
                <p style={{ margin: "0 0 8px", color: "#555555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>Secondary</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(exercise.secondaryMuscles || []).map(m => <span key={m} style={tagStyle("#00E5FF")}>{m}</span>)}
                </div>
              </div>

              <div style={{ background: "#0D0D0D", border: "1px solid #1E1E1E", borderRadius: 18, padding: 24 }}>
                <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "30px", margin: "0 0 16px" }}>VARIATIONS</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {(exercise.variations || []).map((v, idx) => (
                    <div key={idx} style={{ background: "#111111", border: "1px solid #1E1E1E", borderRadius: 14, padding: 14, color: "#ECECEC" }}>{v}</div>
                  ))}
                </div>
              </div>

              <div style={{ background: "#0D0D0D", border: "1px solid #1E1E1E", borderRadius: 18, padding: 24 }}>
                <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: "30px", margin: "0 0 16px" }}>QUICK ACTIONS</h2>
                <Link to="/exercises"
                  style={{ display: "block", textAlign: "center", textDecoration: "none", width: "100%", padding: 14, borderRadius: 12, border: "1px solid #00E5FF", color: "#00E5FF", fontWeight: 700 }}>
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

