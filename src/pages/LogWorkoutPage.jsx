import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const EXERCISE_DB = {
  Strength: [
    { id: 1,  name: "Bench Press",       muscles: "Chest / Triceps / Shoulders" },
    { id: 2,  name: "Squat",             muscles: "Quads / Glutes / Hamstrings"  },
    { id: 3,  name: "Deadlift",          muscles: "Back / Glutes / Hamstrings"   },
    { id: 4,  name: "Overhead Press",    muscles: "Shoulders / Triceps"          },
    { id: 5,  name: "Barbell Row",       muscles: "Back / Biceps"                },
    { id: 6,  name: "Pull Ups",          muscles: "Back / Biceps"                },
    { id: 7,  name: "Dumbbell Press",    muscles: "Chest / Triceps"              },
    { id: 8,  name: "Romanian Deadlift", muscles: "Hamstrings / Glutes"          },
  ],
  Cardio: [
    { id: 9,  name: "Treadmill Run", muscles: "Full Body Cardio"       },
    { id: 10, name: "Cycling",       muscles: "Legs / Cardio"          },
    { id: 11, name: "Jump Rope",     muscles: "Full Body Cardio"       },
    { id: 12, name: "Stairmaster",   muscles: "Glutes / Legs / Cardio" },
  ],
  Bodyweight: [
    { id: 13, name: "Push Ups",     muscles: "Chest / Triceps"  },
    { id: 14, name: "Dips",         muscles: "Triceps / Chest"  },
    { id: 15, name: "Pistol Squat", muscles: "Quads / Glutes"   },
    { id: 16, name: "Plank",        muscles: "Core / Shoulders" },
    { id: 17, name: "Burpees",      muscles: "Full Body"        },
  ],
  Mobility: [
    { id: 18, name: "Hip Flexor Stretch", muscles: "Hip Flexors"          },
    { id: 19, name: "Thoracic Rotation",  muscles: "Upper Back / Spine"   },
    { id: 20, name: "Pigeon Pose",        muscles: "Glutes / Hip Flexors" },
    { id: 21, name: "Worlds Greatest",    muscles: "Full Lower Body"      },
  ],
  HIIT: [
    { id: 22, name: "Box Jumps",        muscles: "Legs / Power"            },
    { id: 23, name: "Kettlebell Swing", muscles: "Glutes / Core / Back"    },
    { id: 24, name: "Battle Ropes",     muscles: "Arms / Shoulders / Core" },
    { id: 25, name: "Sled Push",        muscles: "Full Body Power"         },
  ],
};

const CATEGORIES = ["Strength", "Cardio", "Bodyweight", "Mobility", "HIIT"];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function validate(form) {
  const errors = {};
  if (!form.workoutName.trim())                        errors.workoutName = "Workout name is required";
  if (!form.category)                                  errors.category    = "Select a category";
  if (!form.exercise)                                  errors.exercise    = "Select an exercise";
  if (!form.sets || form.sets < 1 || form.sets > 20)  errors.sets        = "Sets: 1 to 20";
  if (!form.reps || form.reps < 1 || form.reps > 200) errors.reps        = "Reps: 1 to 200";
  return errors;
}

// Reusable field wrapper: shows label, input, and error message
function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[8px] tracking-[0.22em] uppercase text-[#555]">{label}</label>
      {children}
      {error && <span className="text-[9px] text-[#FF2A5E] tracking-wide">!! {error}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function LogWorkoutPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    workoutName: "",
    category:    "",
    exercise:    "",
    sets:        "",
    reps:        "",
    weight:      "",
    weightUnit:  "kg",
    notes:       "",
    date:        new Date().toISOString().split("T")[0],
    duration:    "",
  });

  const [errors,    setErrors]    = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [search,    setSearch]    = useState("");
  const [dropOpen,  setDropOpen]  = useState(false);

  // Exercises filtered by selected category and search text
  const exercises        = form.category ? EXERCISE_DB[form.category] ?? [] : [];
  const filteredExercises = search.trim()
    ? exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  const selectedExercise = exercises.find((e) => e.name === form.exercise);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function handleCategoryChange(cat) {
    setForm((prev) => ({ ...prev, category: cat, exercise: "" }));
    setSearch("");
    setErrors((prev) => { const n = { ...prev }; delete n.category; delete n.exercise; return n; });
  }

  function handleExerciseSelect(name) {
    setField("exercise", name);
    setSearch(name);
    setDropOpen(false);
  }

  function handleSubmit() {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const entry = {
      id:          Date.now(),
      workoutName: form.workoutName,
      category:    form.category,
      exercise:    form.exercise,
      sets:        Number(form.sets),
      reps:        Number(form.reps),
      weight:      form.weight ? form.weight + " " + form.weightUnit : "Bodyweight",
      notes:       form.notes,
      date:        form.date,
      duration:    form.duration,
      loggedAt:    new Date().toISOString(),
    };
    console.log("Workout logged (mock):", entry);
    setSubmitted(true);
  }

  function handleReset() {
    setForm({ workoutName: "", category: "", exercise: "", sets: "", reps: "", weight: "", weightUnit: "kg", notes: "", date: new Date().toISOString().split("T")[0], duration: "" });
    setErrors({});
    setSearch("");
    setSubmitted(false);
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div>

      {/* Page header */}
      <div className="px-6 md:px-14 pt-10 pb-8 border-b border-[#1E1E1E] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[8px] tracking-[0.25em] uppercase text-[#FF2A5E] mb-2">// Log - New Session</div>
          <h1 className="font-['Barlow_Condensed'] font-black text-5xl md:text-6xl uppercase leading-none tracking-tight">
            Log <em className="not-italic text-[#C6F135]">Workout</em>
          </h1>
        </div>
        <button
          onClick={() => navigate("/")}
          className="text-[9px] tracking-[0.2em] uppercase text-[#555] border-b border-[#2A2A2A] pb-1 hover:text-[#C6F135] hover:border-[#C6F135] transition-colors bg-transparent cursor-pointer self-start sm:self-auto"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Success screen */}
      {submitted ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-8">
          <div className="border border-[#C6F135] p-12 flex flex-col items-center gap-6 max-w-lg w-full">
            <div className="font-['Barlow_Condensed'] font-black text-6xl text-[#C6F135]">OK</div>
            <div className="font-['Barlow_Condensed'] font-black text-4xl text-[#C6F135] uppercase tracking-tight text-center">
              Workout Logged!
            </div>
            <div className="text-[9px] text-[#555] tracking-[0.15em] uppercase text-center">
              {form.exercise} / {form.sets} Sets / {form.reps} Reps / {form.weight ? form.weight + " " + form.weightUnit : "Bodyweight"}
            </div>
            <div className="flex gap-0 w-full mt-4">
              <button onClick={handleReset} className="flex-1 bg-[#C6F135] text-black font-bold text-[10px] tracking-[0.18em] uppercase py-4 hover:bg-[#FF2A5E] hover:text-white transition-colors cursor-pointer">
                Log Another
              </button>
              <button onClick={() => navigate("/")} className="flex-1 bg-transparent text-[#555] border border-[#2A2A2A] border-l-0 text-[10px] tracking-[0.18em] uppercase py-4 hover:text-[#ECECEC] hover:border-[#555] transition-colors cursor-pointer">
                Dashboard
              </button>
            </div>
          </div>
        </div>

      ) : (
        /* Form + preview layout */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px]">

          {/* Left — form */}
          <div className="px-6 md:px-14 py-10 border-r border-[#1E1E1E] flex flex-col gap-8">

            {/* Workout name + date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Workout Name" error={errors.workoutName}>
                <input type="text" value={form.workoutName} onChange={(e) => setField("workoutName", e.target.value)} placeholder="e.g. Morning Push Day"
                  className="bg-transparent border border-[#1E1E1E] text-[#ECECEC] text-[10px] tracking-[0.1em] px-4 py-3 outline-none focus:border-[#C6F135] transition-colors placeholder:text-[#333] w-full"
                  style={{ fontFamily: "JetBrains Mono, monospace" }} />
              </Field>
              <Field label="Date">
                <input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)}
                  className="bg-transparent border border-[#1E1E1E] text-[#ECECEC] text-[10px] tracking-[0.1em] px-4 py-3 outline-none focus:border-[#C6F135] transition-colors w-full"
                  style={{ fontFamily: "JetBrains Mono, monospace", colorScheme: "dark" }} />
              </Field>
            </div>

            {/* Category filter */}
            <Field label="Select Category" error={errors.category}>
              <div className="flex flex-wrap gap-0 border border-[#1E1E1E] w-fit">
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => handleCategoryChange(cat)}
                    className={`px-5 py-3 text-[9px] tracking-[0.18em] uppercase border-r border-[#1E1E1E] last:border-r-0 transition-colors cursor-pointer ${
                      form.category === cat ? "bg-[#C6F135] text-black font-bold" : "bg-transparent text-[#555] hover:bg-[#C6F135] hover:text-black"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </Field>

            {/* Exercise search */}
            <Field label="Exercise Name" error={errors.exercise}>
              <div className="relative">
                <input type="text" value={search}
                  onChange={(e) => { setSearch(e.target.value); setDropOpen(true); setField("exercise", ""); }}
                  onFocus={() => setDropOpen(true)}
                  placeholder={form.category ? "Search " + form.category + " exercises" : "Select a category first"}
                  disabled={!form.category}
                  className="bg-transparent border border-[#1E1E1E] text-[#ECECEC] text-[10px] tracking-[0.1em] px-4 py-3 outline-none focus:border-[#C6F135] transition-colors placeholder:text-[#333] w-full disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ fontFamily: "JetBrains Mono, monospace" }} />
                {dropOpen && form.category && filteredExercises.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 border border-[#2A2A2A] border-t-0 bg-[#0D0D0D] max-h-52 overflow-y-auto">
                    {filteredExercises.map((ex) => (
                      <button key={ex.id} onClick={() => handleExerciseSelect(ex.name)}
                        className="w-full text-left px-4 py-3 border-b border-[#1E1E1E] last:border-b-0 hover:bg-[#111] transition-colors cursor-pointer">
                        <div className="text-[10px] text-[#ECECEC] tracking-wide">{ex.name}</div>
                        <div className="text-[8px] text-[#555] tracking-widest mt-0.5">{ex.muscles}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedExercise && (
                <div className="flex items-center gap-3 px-4 py-2 border border-[#C6F135] bg-[rgba(198,241,53,0.04)] mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C6F135]" />
                  <span className="text-[9px] tracking-widest text-[#C6F135]">{selectedExercise.name}</span>
                  <span className="text-[8px] text-[#555] ml-2">{selectedExercise.muscles}</span>
                </div>
              )}
            </Field>

            {/* Sets / Reps / Weight / Unit */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Field label="Sets" error={errors.sets}>
                <input type="number" min="1" max="20" value={form.sets} onChange={(e) => setField("sets", e.target.value)} placeholder="4"
                  className="bg-transparent border border-[#1E1E1E] text-[#ECECEC] text-[10px] px-4 py-3 outline-none focus:border-[#C6F135] transition-colors placeholder:text-[#333] w-full"
                  style={{ fontFamily: "JetBrains Mono, monospace" }} />
              </Field>
              <Field label="Reps" error={errors.reps}>
                <input type="number" min="1" max="200" value={form.reps} onChange={(e) => setField("reps", e.target.value)} placeholder="10"
                  className="bg-transparent border border-[#1E1E1E] text-[#ECECEC] text-[10px] px-4 py-3 outline-none focus:border-[#C6F135] transition-colors placeholder:text-[#333] w-full"
                  style={{ fontFamily: "JetBrains Mono, monospace" }} />
              </Field>
              <Field label="Weight (optional)">
                <input type="number" min="0" value={form.weight} onChange={(e) => setField("weight", e.target.value)} placeholder="0"
                  className="bg-transparent border border-[#1E1E1E] text-[#ECECEC] text-[10px] px-4 py-3 outline-none focus:border-[#C6F135] transition-colors placeholder:text-[#333] w-full"
                  style={{ fontFamily: "JetBrains Mono, monospace" }} />
              </Field>
              <Field label="Unit">
                <div className="flex border border-[#1E1E1E]">
                  {["kg", "lbs"].map((u) => (
                    <button key={u} onClick={() => setField("weightUnit", u)}
                      className={`flex-1 py-3 text-[9px] tracking-[0.18em] uppercase transition-colors cursor-pointer ${
                        form.weightUnit === u ? "bg-[#C6F135] text-black font-bold" : "bg-transparent text-[#555] hover:text-[#ECECEC]"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Duration + Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Duration in minutes (optional)">
                <input type="number" min="1" value={form.duration} onChange={(e) => setField("duration", e.target.value)} placeholder="45"
                  className="bg-transparent border border-[#1E1E1E] text-[#ECECEC] text-[10px] px-4 py-3 outline-none focus:border-[#C6F135] transition-colors placeholder:text-[#333] w-full"
                  style={{ fontFamily: "JetBrains Mono, monospace" }} />
              </Field>
              <Field label="Notes (optional)">
                <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="How did it feel? Personal records?" rows={3}
                  className="bg-transparent border border-[#1E1E1E] text-[#ECECEC] text-[10px] px-4 py-3 outline-none focus:border-[#C6F135] transition-colors placeholder:text-[#333] w-full resize-none"
                  style={{ fontFamily: "JetBrains Mono, monospace" }} />
              </Field>
            </div>

            {/* Submit + Clear */}
            <div className="flex gap-0 pt-2">
              <button onClick={handleSubmit}
                className="flex-1 bg-[#C6F135] text-black font-bold text-[11px] tracking-[0.18em] uppercase py-5 hover:bg-[#FF2A5E] hover:text-white transition-colors cursor-pointer">
                Log Workout
              </button>
              <button onClick={handleReset}
                className="bg-transparent text-[#555] border border-[#2A2A2A] border-l-0 text-[10px] tracking-[0.18em] uppercase px-8 py-5 hover:text-[#ECECEC] hover:border-[#555] transition-colors cursor-pointer">
                Clear
              </button>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="border border-[#FF2A5E] px-6 py-4 text-[9px] text-[#FF2A5E] tracking-wide">
                Please fix the highlighted fields before logging.
              </div>
            )}
          </div>

          {/* Right — live preview */}
          <div className="px-8 py-10 flex flex-col gap-8">
            <div className="text-[8px] tracking-[0.25em] uppercase text-[#FF2A5E]">// Session Preview</div>

            <div className="border border-[#1E1E1E] flex flex-col">
              <div className="px-6 py-5 border-b border-[#1E1E1E]">
                <div className="text-[8px] tracking-widest text-[#555] uppercase mb-1">{form.date || "---"}</div>
                <div className="font-['Barlow_Condensed'] font-black text-3xl uppercase">
                  {form.workoutName || <span className="text-[#333]">Workout Name</span>}
                </div>
              </div>
              <div className="grid grid-cols-2">
                {[
                  { label: "Category", value: form.category || "---",  color: "#C6F135" },
                  { label: "Exercise", value: form.exercise || "---",  color: "#ECECEC" },
                  { label: "Sets",     value: form.sets     || "---",  color: "#FF2A5E" },
                  { label: "Reps",     value: form.reps     || "---",  color: "#00E5FF" },
                  { label: "Weight",   value: form.weight ? form.weight + " " + form.weightUnit : "BW", color: "#FFAA00" },
                  { label: "Duration", value: form.duration ? form.duration + " min" : "---", color: "#555" },
                ].map(({ label, value, color }, i) => (
                  <div key={i} className="px-5 py-4 border-b border-r border-[#1E1E1E] even:border-r-0">
                    <div className="text-[8px] tracking-[0.2em] uppercase text-[#555] mb-1.5">{label}</div>
                    <div className="font-['Barlow_Condensed'] font-black text-2xl leading-none" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>
              {form.notes && (
                <div className="px-6 py-4 border-t border-[#1E1E1E]">
                  <div className="text-[8px] tracking-widest text-[#555] uppercase mb-2">Notes</div>
                  <div className="text-[10px] text-[#555] leading-relaxed">{form.notes}</div>
                </div>
              )}
            </div>

            <div className="border border-[#1E1E1E] px-6 py-5">
              <div className="text-[8px] tracking-[0.2em] uppercase text-[#555] mb-4">// Tips</div>
              <ul className="flex flex-col gap-3">
                {[
                  "Warm up before heavy lifts",
                  "Track progressive overload weekly",
                  "Rest 48 to 72h before training same muscle",
                  "Hydration affects performance by 10%",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-[9px] text-[#555] leading-relaxed">
                    <span className="text-[#C6F135] mt-0.5 shrink-0">&gt;</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
