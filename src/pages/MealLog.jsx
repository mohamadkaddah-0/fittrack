// MealLog.jsx
// Page: Log a Meal (Add/Edit Form)
//
// Features:
//   - Step 1: Meal name, type selector, date/time/servings
//   - Step 2: Ingredient search with category filter tabs, live kcal calc
//   - Step 3: Optional notes
//   - Right sidebar: nutrition summary with macro progress bars + daily budget
//   - Form validation with inline error messages
//   - Success toast notification
//   - Back button to Diet Program
//   - Logged meals update the shared calendarData in App.jsx
//
// Props:
//   darkMode           (bool)
//   currentUser        (object) - used to get personalised daily targets
//   calendarData       (object) - to calculate already eaten today
//   addMealToCalendar  (fn)     - called on form submit to update shared state
//
// Hooks used: useState, useEffect, useRef

// MealLog.jsx
// Page: Log a Meal
//
// New features:
//   - "My Meals" tab - shows user's saved custom meals, log directly from there
//   - "Save as Meal" button - saves current ingredients as a reusable meal
//   - Macro limit warning - warns if logging this meal would exceed daily targets
//   - Each saved meal shows ingredient breakdown modal (same as Diet Program)
//
// Props:
//   currentUser        (object)
//   calendarData       (object)
//   savedMeals         (array)
//   addMealToCalendar  (fn)
//   saveCustomMeal     (fn)
//   deleteSavedMeal    (fn)
//
// Hooks used: useState, useEffect, useRef

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { calcNutritionTargets, getTodayKey } from "../data/mockData";

//  Constants 
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const ING_CATS   = ["all", "protein", "carbs", "vegetable", "fat", "dairy"];

const TYPE_COLORS = {
  breakfast: { bg: "bg-[#FFAA00]", text: "text-black" },
  lunch:     { bg: "bg-[#C6F135]", text: "text-black" },
  dinner:    { bg: "bg-[#FF2A5E]", text: "text-white" },
  snack:     { bg: "bg-[#00E5FF]", text: "text-black" },
};

//  Hardcoded dark theme classes 
const bg    = "bg-[#0a0a0a]";
const bg2   = "bg-[#111]";
const bg3   = "bg-[#161616]";
const bdr   = "border-[#222]";
const txt   = "text-[#e8e8e8]";
const muted = "text-[#555]";
const inputClass = `w-full bg-[#111] text-[#e8e8e8] border border-[#222] font-mono text-xs px-3 py-2.5 outline-none focus:border-[#C6F135] transition-colors placeholder:text-[#333]`;

//  Component 
export default function MealLog({
  currentUser, calendarData, savedMeals,
  addMealToCalendar, saveCustomMeal, deleteSavedMeal,
  ingredients = []
}) {

  const today     = getTodayKey();
  const todayDate = new Date();
  const targets   = calcNutritionTargets(currentUser);

  //  Tab state 
  const [activeTab, setActiveTab] = useState("log");

  //  Form state 
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("breakfast");
  const [mealDate, setMealDate] = useState(today);
  const [mealTime, setMealTime] = useState("13:00");
  const [servings, setServings] = useState(1);
  const [notes,    setNotes]    = useState("");

  //  Ingredient state 
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [catFilter,    setCatFilter]    = useState("all");
  const [showResults,  setShowResults]  = useState(false);
  const [savedMealModal, setSavedMealModal] = useState(null);

  //  Validation + toast + warning 
  const [errors,        setErrors]        = useState({});
  const [toast,         setToast]         = useState(null);
  const [showOverLimit, setShowOverLimit] = useState(false);

  const toastTimer = useRef(null);
  const searchRef  = useRef(null);
  const navigate   = useNavigate();

  //  Search results 
  let searchResults = catFilter === "all" ? ingredients : ingredients.filter((i) => i.cat === catFilter);
  if (searchQuery.trim()) {
    searchResults = searchResults.filter((i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  searchResults = searchResults.slice(0, 8);

  useEffect(() => {
    if (catFilter !== "all" || searchQuery.trim()) setShowResults(true);
    else setShowResults(false);
  }, [catFilter, searchQuery]);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  //  Already consumed today 
  const todayEntries = calendarData[today] || [];
  let alreadyKcal = 0, alreadyProtein = 0, alreadyCarbs = 0, alreadyFat = 0;
  for (const entry of todayEntries) {
    alreadyKcal    += entry.kcal    || 0;
    alreadyProtein += entry.protein || 0;
    alreadyCarbs   += entry.carbs   || 0;
    alreadyFat     += entry.fat     || 0;
  }

  //  This meal's totals 
  let mealKcal = 0, mealProtein = 0, mealCarbs = 0, mealFat = 0;
  for (const { item, portionG } of selectedIngredients) {
    const ratio = portionG / 100;
    mealKcal    += item.kcal    * ratio * servings;
    mealProtein += item.protein * ratio * servings;
    mealCarbs   += item.carbs   * ratio * servings;
    mealFat     += item.fat     * ratio * servings;
  }
  mealKcal    = Math.round(mealKcal);
  mealProtein = Math.round(mealProtein);
  mealCarbs   = Math.round(mealCarbs);
  mealFat     = Math.round(mealFat);

  const totalAfter = alreadyKcal + mealKcal;
  const remaining  = targets.kcal - totalAfter;

  function wouldExceedLimits() {
    if (alreadyKcal    + mealKcal    > targets.kcal    * 1.1) return true;
    if (alreadyProtein + mealProtein > targets.protein * 1.1) return true;
    if (alreadyCarbs   + mealCarbs   > targets.carbs   * 1.1) return true;
    if (alreadyFat     + mealFat     > targets.fat     * 1.1) return true;
    return false;
  }

  function pct(value, target) {
    if (target === 0) return 0;
    return Math.min(100, Math.round((value / target) * 100));
  }

  //  Ingredient handlers 
  function addIngredient(item) {
    setSelectedIngredients([...selectedIngredients, { item, portionG: 100 }]);
    setSearchQuery("");
    setShowResults(false);
    setErrors({ ...errors, ingredients: "" });
  }

  function removeIngredient(index) {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  }

  function updatePortion(index, value) {
    const grams = parseFloat(value);
    if (!isNaN(grams) && grams > 0) {
      setSelectedIngredients(
        selectedIngredients.map((entry, i) => i === index ? { ...entry, portionG: grams } : entry)
      );
    }
  }

  //  Validation 
  function validate() {
    const newErrors = {};
    if (!mealName.trim())         newErrors.mealName    = "Meal name is required";
    if (selectedIngredients.length === 0) newErrors.ingredients = "Add at least one ingredient";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  //  Toast 
  function showToastMessage(message) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  //  Submit 
  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    if (wouldExceedLimits()) { setShowOverLimit(true); return; }
    logTheMeal();
  }

  function logTheMeal() {
    const entry = {
      name:    mealName.trim(),
      kcal:    mealKcal,
      protein: mealProtein,
      carbs:   mealCarbs,
      fat:     mealFat,
      cat:     mealType,
      time:    mealTime,
      type:    "meal",
    };
    addMealToCalendar(mealDate, entry);
    showToastMessage(`"${entry.name}" logged — ${entry.kcal} kcal`);
    resetForm();
    setShowOverLimit(false);
  }

  //  Save as custom meal 
  function handleSaveAsMeal() {
    if (!validate()) return;
    saveCustomMeal({
      name:        mealName.trim(),
      kcal:        mealKcal,
      protein:     mealProtein,
      carbs:       mealCarbs,
      fat:         mealFat,
      cat:         mealType,
      ingredients: selectedIngredients,
    });
    showToastMessage(`"${mealName.trim()}" saved to My Meals`);
    resetForm();
  }

  //  Log a saved meal directly 
  function logSavedMeal(meal) {
    addMealToCalendar(today, {
      name:    meal.name,
      kcal:    meal.kcal,
      protein: meal.protein,
      carbs:   meal.carbs,
      fat:     meal.fat,
      cat:     meal.cat || mealType,
      time:    mealTime,
      type:    "meal",
    });
    showToastMessage(`"${meal.name}" logged — ${meal.kcal} kcal`);
  }

  //  Reset form 
  function resetForm() {
    setMealName(""); setNotes(""); setServings(1);
    setMealType("breakfast"); setMealDate(today); setMealTime("13:00");
    setSelectedIngredients([]); setErrors({});
    setSearchQuery(""); setCatFilter("all");
  }

  //  Render 
  return (
    <main className={`${bg} ${txt} min-h-screen`}>

      {/*  Page Header  */}
      <header className={`px-6 md:px-8 pt-6 pb-5 border-b ${bdr}`}>
        <Link to="/diet-program"
          className={`inline-flex items-center gap-2 text-xs tracking-widest uppercase ${muted} hover:text-[#C6F135] transition-colors mb-4`}>
          ← Back to Diet Program
        </Link>
        <p className={`text-xs tracking-widest uppercase ${muted} mb-2`}>
          {todayDate.toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
          })}
        </p>
       <h1 className="font-['Barlow_Condensed'] font-black text-5xl md:text-7xl uppercase tracking-tight leading-none">
       Log a <span className="text-[#C6F135]">Meal</span>
       </h1>
      </header>

      {/*  Tab switcher  */}
      <div className={`flex border-b ${bdr} overflow-x-auto`}>
        <button onClick={() => setActiveTab("log")}
          className={`px-6 py-3 text-xs tracking-widest uppercase border-r transition-all ${bdr} ${
            activeTab === "log" ? "bg-[#C6F135] text-black font-bold" : `${muted} ${bg2} hover:text-[#e8e8e8]`
          }`}>
          + Log New Meal
        </button>
        <button onClick={() => setActiveTab("saved")}
          className={`px-6 py-3 text-xs tracking-widest uppercase transition-all ${
            activeTab === "saved" ? "bg-[#C6F135] text-black font-bold" : `${muted} ${bg2} hover:text-[#e8e8e8]`
          }`}>
          My Meals {savedMeals.length > 0 && `(${savedMeals.length})`}
        </button>
      </div>

      
      {/* TAB 1: LOG NEW MEAL*/}
      
      {activeTab === "log" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">

          <form onSubmit={handleSubmit} noValidate className={`border-r ${bdr}`} aria-label="Log a meal form">

            {/* Step 1: Meal Details */}
            <section className={`border-b ${bdr}`} aria-labelledby="step1-heading">
              <div className={`flex items-center gap-3 px-6 py-3 ${bg2} border-b ${bdr}`}>
                <span className="w-5 h-5 bg-[#C6F135] text-black text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                <h2 id="step1-heading" className={`text-xs tracking-widest uppercase ${muted}`}>Meal Details</h2>
              </div>
              <div className="px-6 py-5 space-y-4">

                <div>
                  <label htmlFor="mealName" className={`block text-xs tracking-widest uppercase ${muted} mb-1.5`}>Meal Name</label>
                  <input id="mealName" type="text" value={mealName}
                    onChange={(e) => { setMealName(e.target.value); setErrors({ ...errors, mealName: "" }); }}
                    placeholder="e.g. Post-workout bowl"
                    aria-required="true" aria-invalid={!!errors.mealName}
                    className={`${inputClass} ${errors.mealName ? "border-[#FF2A5E]" : ""}`} />
                  {errors.mealName && <p role="alert" className="text-xs text-[#FF2A5E] mt-1">{errors.mealName}</p>}
                </div>

                <div>
                  <p id="mealtype-label" className={`text-xs tracking-widest uppercase ${muted} mb-1.5`}>Meal Type</p>
                  <div className={`flex border ${bdr}`} role="group" aria-labelledby="mealtype-label">
                    {MEAL_TYPES.map((type) => {
                      const isActive = mealType === type;
                      const colors   = TYPE_COLORS[type];
                      return (
                        <button key={type} type="button" onClick={() => setMealType(type)} aria-pressed={isActive}
                          className={`flex-1 py-2.5 text-xs tracking-widest uppercase border-r last:border-r-0 transition-all ${bdr} ${
                            isActive ? `${colors.bg} ${colors.text} font-bold` : `${muted} ${bg2} hover:text-[#e8e8e8]`
                          }`}>
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="mealDate" className={`block text-xs tracking-widest uppercase ${muted} mb-1.5`}>Date</label>
                    <input id="mealDate" type="date" value={mealDate}
                      onChange={(e) => setMealDate(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="mealTime" className={`block text-xs tracking-widest uppercase ${muted} mb-1.5`}>Time</label>
                    <input id="mealTime" type="time" value={mealTime}
                      onChange={(e) => setMealTime(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="servings" className={`block text-xs tracking-widest uppercase ${muted} mb-1.5`}>Servings</label>
                    <input id="servings" type="number" value={servings} min="0.5" step="0.5"
                      onChange={(e) => setServings(parseFloat(e.target.value) || 1)} className={inputClass} />
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Ingredients */}
            <section className={`border-b ${bdr}`} aria-labelledby="step2-heading">
              <div className={`flex items-center gap-3 px-6 py-3 ${bg2} border-b ${bdr}`}>
                <span className="w-5 h-5 bg-[#C6F135] text-black text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                <h2 id="step2-heading" className={`text-xs tracking-widest uppercase ${muted}`}>Add Ingredients</h2>
              </div>
              <div className="px-6 py-5">
                <div ref={searchRef} className="mb-4">

                  {/* Category filter */}
                  <div className={`flex border border-b-0 ${bdr} overflow-x-auto`} role="group">
                    {ING_CATS.map((cat) => (
                      <button key={cat} type="button" onClick={() => setCatFilter(cat)} aria-pressed={catFilter === cat}
                        className={`flex-1 py-2 text-xs tracking-wide uppercase border-r last:border-r-0 transition-all ${bdr} ${
                          catFilter === cat ? "bg-[#C6F135] text-black font-bold" : `${muted} ${bg2} hover:text-[#e8e8e8]`
                        }`}>
                        {cat === "vegetable" ? "Veg" : cat}
                      </button>
                    ))}
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${muted} pointer-events-none`}>⌕</span>
                    <input type="search" value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => { if (catFilter !== "all" || searchQuery.trim()) setShowResults(true); }}
                      placeholder="search ingredients..."
                      aria-label="Search ingredients"
                      aria-expanded={showResults}
                      className={`${inputClass} pl-8`} />
                  </div>

                  {/* Results dropdown */}
                  {showResults && (
                    <div role="listbox" className={`border border-t-0 ${bdr} max-h-48 overflow-y-auto ${bg}`}>
                      {searchResults.length === 0 ? (
                        <p className={`px-4 py-3 text-xs ${muted}`}>No results found.</p>
                      ) : searchResults.map((item) => (
                        <div key={item.id} role="option" aria-selected="false"
                          className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-4 py-2.5 border-b last:border-b-0 ${bdr} hover:${bg2} transition-colors`}>
                          <div>
                            <button type="button" onClick={() => navigate(`/ingredient/${item.id}`)}
                              className="text-xs font-bold text-left hover:text-[#C6F135] transition-colors">
                              {item.name}
                            </button>
                            <p className={`text-xs ${muted} uppercase tracking-wide mt-0.5`}>
                              {item.cat} · P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                            </p>
                          </div>
                          <p className="font-black text-base text-[#C6F135] whitespace-nowrap">
                            {item.kcal}<span className={`text-xs font-normal ${muted}`}> kcal</span>
                          </p>
                          <Link to={`/ingredient/${item.id}`}
                            className={`text-xs ${muted} hover:text-[#C6F135] px-1`}>ℹ</Link>
                          <button type="button" onClick={() => addIngredient(item)}
                            aria-label={`Add ${item.name}`}
                            className={`w-6 h-6 border ${bdr} ${muted} hover:border-[#C6F135] hover:text-[#C6F135] flex items-center justify-center text-sm transition-colors`}>
                            +
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.ingredients && <p role="alert" className="text-xs text-[#FF2A5E] mt-1">{errors.ingredients}</p>}
                </div>

                {/* Ingredients table */}
                <div className={`border ${bdr}`}>
                  <div className={`grid grid-cols-[1fr_90px_60px_26px] gap-3 px-4 py-2 ${bg3} border-b ${bdr} text-xs tracking-widest uppercase ${muted}`}>
                    <div>Ingredient</div><div>Portion (g)</div><div className="text-right">Kcal</div><div />
                  </div>
                  {selectedIngredients.length === 0 ? (
                    <p className={`px-4 py-5 text-xs ${muted}`}>No ingredients yet — search above to add.</p>
                  ) : selectedIngredients.map(({ item, portionG }, idx) => {
                    const ratio    = portionG / 100;
                    const rowKcal  = Math.round(item.kcal    * ratio * servings);
                    const rowPro   = Math.round(item.protein * ratio * servings);
                    const rowCarbs = Math.round(item.carbs   * ratio * servings);
                    const rowFat   = Math.round(item.fat     * ratio * servings);
                    return (
                      <div key={idx}
                        className={`grid grid-cols-[1fr_90px_60px_26px] items-center gap-3 px-4 py-2.5 border-b last:border-b-0 ${bdr} hover:${bg2} transition-colors`}>
                        <div>
                          <Link to={`/ingredient/${item.id}`}
                            className="text-xs font-bold hover:text-[#C6F135] transition-colors">
                            {item.name}
                          </Link>
                          <div className="flex gap-2 mt-0.5">
                            <span className="text-xs text-[#FF2A5E]">{rowPro}g P</span>
                            <span className="text-xs text-[#00E5FF]">{rowCarbs}g C</span>
                            <span className="text-xs text-[#FFAA00]">{rowFat}g F</span>
                          </div>
                        </div>
                        <div>
                          <input type="number" value={portionG} min="1" step="5"
                            onChange={(e) => updatePortion(idx, e.target.value)}
                            aria-label={`Portion of ${item.name} in grams`}
                            className={`w-full bg-[#111] text-[#e8e8e8] border border-[#222] text-xs text-center px-2 py-1.5 outline-none focus:border-[#C6F135] font-mono`} />
                          <p className={`text-xs ${muted} text-center mt-0.5`}>grams</p>
                        </div>
                        <p className="text-right font-black text-base text-[#C6F135]">{rowKcal}</p>
                        <button type="button" onClick={() => removeIngredient(idx)}
                          aria-label={`Remove ${item.name}`}
                          className={`w-6 h-6 border ${bdr} ${muted} hover:border-[#FF2A5E] hover:text-[#FF2A5E] flex items-center justify-center text-xs transition-colors`}>
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Step 3: Notes */}
            <section className={`border-b ${bdr}`} aria-labelledby="step3-heading">
              <div className={`flex items-center gap-3 px-6 py-3 ${bg2} border-b ${bdr}`}>
                <span className="w-5 h-5 bg-[#C6F135] text-black text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                <h2 id="step3-heading" className={`text-xs tracking-widest uppercase ${muted}`}>
                  Notes <span className="text-[#333] ml-1">(optional)</span>
                </h2>
              </div>
              <div className="px-6 py-5">
                <label htmlFor="mealNotes" className="sr-only">Notes about this meal</label>
                <textarea id="mealNotes" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did it taste? Any adjustments next time..." rows={3}
                  className={`${inputClass} resize-y`} />
              </div>
            </section>

            {/* Submit row */}
            <div className="flex items-center justify-between px-6 py-4 gap-3">
              <button type="button" onClick={resetForm}
                className={`text-xs tracking-widest uppercase px-5 py-2.5 border ${bdr} ${muted} hover:text-[#e8e8e8] hover:border-[#555] transition-colors`}>
                Clear
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={handleSaveAsMeal}
                  className="text-xs tracking-widest uppercase px-5 py-2.5 border border-[#C6F135] text-[#C6F135] hover:bg-[#C6F135] hover:text-black transition-colors">
                  Save as Meal
                </button>
                <button type="submit"
                  className="bg-[#C6F135] text-black text-xs font-bold tracking-widest uppercase px-7 py-2.5 hover:bg-[#FF2A5E] hover:text-white transition-colors">
                  Log Meal ✓
                </button>
              </div>
            </div>
          </form>

          {/* Nutrition Summary Sidebar */}
          <aside className="flex flex-col" aria-label="Nutrition summary">
            <div className={`px-5 py-3 border-b ${bdr} ${bg2}`}>
              <h2 className="font-black text-lg uppercase tracking-tight">
                Nutrition <span className="text-[#C6F135]">Summary</span>
              </h2>
              <p className={`text-xs ${muted} mt-0.5`}>
                {selectedIngredients.length} ingredient{selectedIngredients.length !== 1 ? "s" : ""} added
              </p>
            </div>

            <div className={`px-5 py-6 border-b ${bdr} text-center`}>
              <p className="font-black text-6xl leading-none text-[#C6F135]" aria-live="polite">
                {mealKcal.toLocaleString()}
              </p>
              <p className={`text-xs tracking-widest uppercase ${muted} mt-1`}>This Meal</p>
              <p className={`text-xs ${muted} mt-2`}>
                Daily target: <span className="text-[#C6F135]">{targets.kcal.toLocaleString()} kcal</span>
              </p>
              <p className={`text-xs ${muted} mt-1`}>
                Already eaten: <span className="text-[#C6F135]">{alreadyKcal.toLocaleString()} kcal</span>
              </p>
            </div>

            <div className={`px-5 py-4 border-b ${bdr} space-y-4`}>
              {[
                { label: "Protein", value: mealProtein, target: targets.protein, color: "#FF2A5E", cls: "text-[#FF2A5E]" },
                { label: "Carbs",   value: mealCarbs,   target: targets.carbs,   color: "#00E5FF", cls: "text-[#00E5FF]" },
                { label: "Fat",     value: mealFat,     target: targets.fat,     color: "#FFAA00", cls: "text-[#FFAA00]" },
              ].map((macro) => (
                <div key={macro.label}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`text-xs uppercase tracking-wide ${macro.cls}`}>{macro.label}</span>
                    <span className={`font-black text-base ${macro.cls}`} aria-live="polite">
                      {macro.value}g <span className={`text-xs font-normal ${muted}`}>/ {macro.target}g</span>
                    </span>
                  </div>
                  <div className="h-[2px] rounded-sm" style={{ background: `${macro.color}30` }}>
                    <div className="h-full transition-all duration-500 rounded-sm"
                      style={{ width: `${pct(macro.value, macro.target)}%`, background: macro.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-4">
              <p className={`text-xs tracking-widest uppercase ${muted} mb-3`}>Daily Budget</p>
              {[
                { label: "Already consumed", value: `${alreadyKcal.toLocaleString()} kcal`,   cls: txt },
                { label: "This meal",        value: `${mealKcal.toLocaleString()} kcal`,       cls: txt },
                { label: "Total after",      value: `${totalAfter.toLocaleString()} kcal`,
                  cls: totalAfter > targets.kcal ? "text-[#FF2A5E] font-bold" : "text-[#C6F135] font-bold" },
                { label: "Remaining",
                  value: `${Math.abs(remaining).toLocaleString()} kcal${remaining < 0 ? " over" : ""}`,
                  cls: remaining < 0 ? "text-[#FF2A5E] font-bold" : remaining < 200 ? "text-[#FFAA00] font-bold" : "text-[#C6F135] font-bold" },
              ].map((row) => (
                <div key={row.label} className={`flex justify-between items-center py-1.5 border-b last:border-b-0 ${bdr} text-xs`}>
                  <span className={muted}>{row.label}</span>
                  <span className={row.cls} aria-live="polite">{row.value}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      
      {/* TAB 2: MY MEALS */}
      
      {activeTab === "saved" && (
        <div className="px-6 md:px-8 py-6">
          {savedMeals.length === 0 ? (
            <div className="text-center py-16">
              <p className={`font-black text-2xl uppercase ${muted} mb-3`}>No Saved Meals Yet</p>
              <p className={`text-sm ${muted} mb-6`}>
                Build a meal in the Log tab and click "Save as Meal" to store it here.
              </p>
              <button onClick={() => setActiveTab("log")}
                className="bg-[#C6F135] text-black text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-[#FF2A5E] hover:text-white transition-colors">
                + Create a Meal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedMeals.map((meal) => (
                <div key={meal.id} className={`border ${bdr} ${bg2}`}>
                  <div className={`px-5 py-4 border-b ${bdr}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-lg uppercase tracking-tight">{meal.name}</p>
                        <p className={`text-xs ${muted} mt-1 capitalize`}>{meal.cat}</p>
                      </div>
                      <button onClick={() => deleteSavedMeal(meal.id)}
                        aria-label={`Delete ${meal.name}`}
                        className={`w-7 h-7 border ${bdr} ${muted} hover:border-[#FF2A5E] hover:text-[#FF2A5E] flex items-center justify-center text-xs transition-colors flex-shrink-0`}>
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {[
                        { label: "Kcal", val: meal.kcal,         cls: "text-[#C6F135]" },
                        { label: "P",    val: `${meal.protein}g`, cls: "text-[#FF2A5E]" },
                        { label: "C",    val: `${meal.carbs}g`,   cls: "text-[#00E5FF]" },
                        { label: "F",    val: `${meal.fat}g`,     cls: "text-[#FFAA00]" },
                      ].map((s) => (
                        <div key={s.label} className={`${bg3} border ${bdr} px-2 py-2 text-center`}>
                          <p className={`text-xs ${muted}`}>{s.label}</p>
                          <p className={`font-bold text-sm ${s.cls}`}>{s.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={`flex border-t ${bdr}`}>
                    <button onClick={() => setSavedMealModal(meal)}
                      className={`flex-1 py-3 text-xs tracking-widest uppercase ${muted} border-r ${bdr} hover:text-[#C6F135] transition-colors`}>
                      View Ingredients
                    </button>
                    <button onClick={() => logSavedMeal(meal)}
                      className="flex-1 py-3 text-xs font-bold tracking-widest uppercase bg-[#C6F135] text-black hover:bg-[#FF2A5E] hover:text-white transition-colors">
                      Log Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/*  Saved Meal Ingredient Modal  */}
      {savedMealModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog" aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setSavedMealModal(null)}>
          <div className={`${bg} border ${bdr} w-full max-w-lg max-h-[80vh] overflow-y-auto`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${bdr}`}>
              <div>
                <p className={`text-xs tracking-widest uppercase ${muted} mb-1`}>My Meal — Breakdown</p>
                <h2 className="font-black text-xl uppercase tracking-tight">{savedMealModal.name}</h2>
              </div>
              <button onClick={() => setSavedMealModal(null)} aria-label="Close"
                className={`w-8 h-8 border ${bdr} ${muted} hover:border-[#FF2A5E] hover:text-[#FF2A5E] transition-colors flex items-center justify-center`}>
                ✕
              </button>
            </div>
            <div className={`grid grid-cols-4 border-b ${bdr}`}>
              {[
                { label: "Calories", val: savedMealModal.kcal,    unit: "kcal", cls: "text-[#C6F135]" },
                { label: "Protein",  val: savedMealModal.protein, unit: "g",    cls: "text-[#FF2A5E]" },
                { label: "Carbs",    val: savedMealModal.carbs,   unit: "g",    cls: "text-[#00E5FF]" },
                { label: "Fat",      val: savedMealModal.fat,     unit: "g",    cls: "text-[#FFAA00]" },
              ].map((s) => (
                <div key={s.label} className={`px-4 py-3 border-r last:border-r-0 ${bdr} text-center ${bg2}`}>
                  <p className={`text-xs ${muted} mb-1`}>{s.label}</p>
                  <p className={`font-black text-xl leading-none ${s.cls}`}>
                    {s.val}<span className={`text-xs ${muted} ml-0.5`}>{s.unit}</span>
                  </p>
                </div>
              ))}
            </div>
            {(!savedMealModal.ingredients || savedMealModal.ingredients.length === 0) ? (
              <p className={`px-6 py-8 text-sm ${muted} text-center`}>No ingredient data available.</p>
            ) : (
              <>
                <div className={`grid grid-cols-[1fr_60px_auto_auto_auto_auto] items-center gap-3 px-6 py-2 ${bg2} border-b ${bdr} text-xs tracking-widest uppercase ${muted}`}>
                  <div>Ingredient</div><div>g</div><div>Kcal</div><div>P</div><div>C</div><div>F</div>
                </div>
                {savedMealModal.ingredients.map(({ item, portionG }, i) => {
                  const ratio = portionG / 100;
                  return (
                    <div key={i}
                      className={`grid grid-cols-[1fr_60px_auto_auto_auto_auto] items-center gap-3 px-6 py-3 border-b last:border-b-0 ${bdr}`}>
                      <Link to={`/ingredient/${item.id}`} onClick={() => setSavedMealModal(null)}
                        className="text-xs font-bold hover:text-[#C6F135] transition-colors">
                        {item.name} <span className={muted}>→</span>
                      </Link>
                      <span className={`text-xs ${muted}`}>{portionG}g</span>
                      <span className="text-xs font-bold text-[#C6F135]">{Math.round(item.kcal * ratio)}</span>
                      <span className="text-xs text-[#FF2A5E]">{Math.round(item.protein * ratio * 10) / 10}g</span>
                      <span className="text-xs text-[#00E5FF]">{Math.round(item.carbs * ratio * 10) / 10}g</span>
                      <span className="text-xs text-[#FFAA00]">{Math.round(item.fat * ratio * 10) / 10}g</span>
                    </div>
                  );
                })}
              </>
            )}
            <div className={`px-6 py-4 border-t ${bdr} flex justify-end`}>
              <button onClick={() => setSavedMealModal(null)}
                className="bg-[#C6F135] text-black text-xs font-bold tracking-widest uppercase px-5 py-2 hover:bg-[#FF2A5E] hover:text-white transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  Macro Limit Warning Modal  */}
      {showOverLimit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="alertdialog" aria-modal="true">
          <div className={`${bg} border border-[#FFAA00] w-full max-w-sm`}>
            <div className="bg-[#FFAA00] px-6 py-4">
              <p className="font-black text-lg uppercase tracking-tight text-black">⚠ Over Daily Limit</p>
            </div>
            <div className="px-6 py-5">
              <p className={`text-sm leading-relaxed mb-4 ${txt}`}>
                Logging this meal will put you over your daily target. Are you sure?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowOverLimit(false)}
                  className={`flex-1 text-xs tracking-widest uppercase px-4 py-3 border ${bdr} ${muted} hover:border-[#555] transition-colors`}>
                  Cancel
                </button>
                <button onClick={logTheMeal}
                  className="flex-1 text-xs font-bold tracking-widest uppercase px-4 py-3 bg-[#FFAA00] text-black hover:opacity-80 transition-opacity">
                  Log Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  Toast  */}
      <div role="status" aria-live="polite"
        className={`fixed bottom-6 right-6 z-50 bg-[#C6F135] text-black text-xs font-bold tracking-widest uppercase px-5 py-3 transition-all duration-300 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}>
        {toast}
      </div>
    </main>
  );
}
