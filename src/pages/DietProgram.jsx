// DietProgram.jsx
// Page: Personalised Diet Program
//
// Features:
//   - Macro bar: daily targets vs consumed, calculated from user profile
//   - Calories burned from workouts added to daily calorie target
//   - Recommended meals: 3-day rotation, duration + goal aware
//   - Category filter tabs
//   - Checkable meals → updates calendar + macro bar
//   - Meal ingredient modal
//   - Calendar moved to HomePage
//
// Props:
//   currentUser      (object)
//   calendarData     (object)
//   loggedMeals      (object)
//   togglePlanMeal   (fn)
//   deleteMealFromDay(fn)
//
// Hooks used: useState

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  calcNutritionTargets,
  recommendMeals,
  getTodayKey,
} from "../data/mockData";
import api from "../services/api";

//  Constants 
const CAT_COLORS = {
  breakfast: "#FFAA00",
  lunch:     "#C6F135",
  snack:     "#00E5FF",
  dinner:    "#FF2A5E",
};

const CAT_TIMES = {
  breakfast: "07:00–09:30",
  lunch:     "12:00–14:00",
  dinner:    "18:30–20:30",
  snack:     "15:00–17:00",
};

//  Hardcoded dark theme classes 
const bg    = "bg-[#0a0a0a]";
const bg2   = "bg-[#111]";
const bg3   = "bg-[#161616]";
const bdr   = "border-[#222]";
const txt   = "text-[#e8e8e8]";
const muted = "text-[#555]";

//  Component 
export default function DietProgram({
  currentUser, calendarData, loggedMeals, togglePlanMeal, deleteMealFromDay,
  mealPool = [], ingredients = []
}) {

  const today     = getTodayKey();
  const todayDate = new Date();

  //  Local state 
  const [activeFilter, setActiveFilter] = useState("all");
  const [mealModal,    setMealModal]    = useState(null);

  //  Targets + recommendations 
  const targets          = calcNutritionTargets(currentUser);
  const recommendedMeals = recommendMeals(targets, today, currentUser, mealPool.length > 0 ? mealPool : null);

  //  Today's entries 
  const todayEntries = calendarData[today] || [];

  //  Calories burned from workouts today 
  let caloriesBurnedToday = 0;
  for (const entry of todayEntries) {
    if (entry.type === "workout") {
      caloriesBurnedToday += entry.caloriesBurned || 0;
    }
  }

  //  Adjusted calorie target = base + burned 
  const adjustedKcalTarget = targets.kcal + caloriesBurnedToday;

  //  Today's consumed meal totals (meals only) 
  let consumedKcal = 0, consumedProtein = 0, consumedCarbs = 0, consumedFat = 0;
  for (const entry of todayEntries) {
    if (entry.type === "meal") {
      consumedKcal    += entry.kcal    || 0;
      consumedProtein += entry.protein || 0;
      consumedCarbs   += entry.carbs   || 0;
      consumedFat     += entry.fat     || 0;
    }
  }

  const checkedToday = loggedMeals[today] || new Set();
  const mealsToShow  = activeFilter === "all"
    ? recommendedMeals
    : recommendedMeals.filter((m) => m.cat === activeFilter);

  function pct(consumed, target) {
    if (target === 0) return 0;
    return Math.min(100, Math.round((consumed / target) * 100));
  }

  //  Open meal ingredient modal — fetches from DB API
  async function openMealModal(meal) {
    try {
      const res     = await api.getMealIngredients(meal.id);
      const ingList = res?.ingredients || [];
      const resolved = ingList.map(row => ({
        item: {
          id:      row.ingredient_id,
          name:    row.name,
          kcal:    row.kcal,
          protein: row.protein,
          carbs:   row.carbs,
          fat:     row.fat,
        },
        portionG: row.portion_g,
        kcal:     Math.round(row.kcal    * row.portion_g / 100),
        protein:  Math.round(row.protein * row.portion_g / 100 * 10) / 10,
        carbs:    Math.round(row.carbs   * row.portion_g / 100 * 10) / 10,
        fat:      Math.round(row.fat     * row.portion_g / 100 * 10) / 10,
      }));
      setMealModal({ meal, ingredients: resolved });
    } catch (_) {
      setMealModal({ meal, ingredients: [] });
    }
  }

  const firstName = currentUser?.name?.split(" ")[0] || "You";
  const goalLabel = currentUser?.goal?.replace(/_/g, " ") || "your plan";

  //  Render 
  return (
    <main className={`${bg} ${txt} min-h-screen font-sans`}>

      {/*  Page Header  */}
      <header className={`flex flex-wrap items-end justify-between gap-4 px-6 md:px-8 pt-6 pb-5 border-b ${bdr}`}>
        <div>
          <p className={`text-xs tracking-widest uppercase ${muted} mb-2`}>
            {todayDate.toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric"
            })}
          </p>
          <h1 className="font-['Barlow_Condensed'] font-black text-4xl md:text-5xl uppercase tracking-tight leading-none">
            Diet <span className="text-[#C6F135]">Program</span>
          </h1>
        </div>
        <div className={`border border-[#C6F135] px-4 py-2 text-right`}>
          <p className={`text-xs tracking-widest uppercase ${muted}`}>{firstName}'s Goal</p>
          <p className="font-black text-lg uppercase text-[#C6F135]">{goalLabel}</p>
          {targets.weeklyRate > 0 && (
            <p className={`text-xs ${muted} mt-1`}>
              {targets.weeklyRate}kg / week
              {targets.durationWeeks && ` · ${Math.round(targets.durationWeeks / 4.33)} months`}
            </p>
          )}
        </div>
      </header>

      {/*  Macro Bar  */}
      <section className={`grid grid-cols-2 md:grid-cols-4 border-b ${bdr}`}>

        {/* Daily Calories — adjusted if workouts logged today */}
        <div className={`px-5 py-4 border-r ${bdr} ${bg2}`}>
          <p className={`text-xs tracking-widest uppercase ${muted} mb-2`}>Daily Calories</p>
          <p className="font-black text-3xl leading-none text-[#C6F135]">
            {adjustedKcalTarget.toLocaleString()}
            <span className={`text-xs ${muted} ml-1`}>kcal</span>
          </p>
          {caloriesBurnedToday > 0 && (
            <p className="text-xs text-[#a78bfa] mt-1">
              {targets.kcal.toLocaleString()} + {caloriesBurnedToday} burned
            </p>
          )}
          <div className="mt-2 h-[2px] rounded-sm" style={{ background: "#C6F13530" }}>
            <div
              className="h-full transition-all duration-500 rounded-sm"
              style={{ width: `${pct(consumedKcal, adjustedKcalTarget)}%`, background: "#C6F135" }}
            />
          </div>
          <p className={`text-xs ${muted} mt-1`}>
            {Math.round(consumedKcal)} consumed · {Math.round(Math.max(0, adjustedKcalTarget - consumedKcal))} left
          </p>
        </div>

        {/* Protein, Carbs, Fat */}
        {[
          { label: "Protein", target: targets.protein, consumed: consumedProtein, color: "#FF2A5E", cls: "text-[#FF2A5E]", unit: "g" },
          { label: "Carbs",   target: targets.carbs,   consumed: consumedCarbs,   color: "#00E5FF", cls: "text-[#00E5FF]", unit: "g" },
          { label: "Fat",     target: targets.fat,     consumed: consumedFat,     color: "#FFAA00", cls: "text-[#FFAA00]", unit: "g" },
        ].map((macro) => (
          <div key={macro.label} className={`px-5 py-4 border-r last:border-r-0 ${bdr} ${bg2}`}>
            <p className={`text-xs tracking-widest uppercase ${muted} mb-2`}>{macro.label}</p>
            <p className={`font-black text-3xl leading-none ${macro.cls}`}>
              {macro.target.toLocaleString()}
              <span className={`text-xs ${muted} ml-1`}>{macro.unit}</span>
            </p>
            <div className="mt-2 h-[2px] rounded-sm" style={{ background: `${macro.color}30` }}>
              <div
                className="h-full transition-all duration-500 rounded-sm"
                style={{ width: `${pct(macro.consumed, macro.target)}%`, background: macro.color }}
              />
            </div>
            <p className={`text-xs ${muted} mt-1`}>
              {Math.round(macro.consumed)} consumed · {Math.round(Math.max(0, macro.target - macro.consumed))} left
            </p>
          </div>
        ))}
      </section>

      {/*  Meal List  */}
      <div>

        {/* Category filter tabs */}
        <div className={`flex border-b ${bdr} overflow-x-auto`} role="tablist">
          {["all","breakfast","lunch","dinner","snack"].map((cat) => (
            <button key={cat} role="tab" aria-selected={activeFilter === cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-3 text-xs tracking-widest uppercase border-r last:border-r-0 transition-all ${bdr} ${
                activeFilter === cat ? "bg-[#C6F135] text-black font-bold" : `${muted} ${bg2} hover:text-[#e8e8e8]`
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Recommended label */}
        <div className={`px-6 py-4 border-b ${bdr} ${bg2}`}>
          <p className={`text-xs tracking-widest uppercase ${muted} mb-1`}>Today's recommended meals</p>
          <p className="font-black text-2xl md:text-3xl uppercase tracking-tight leading-tight">
            Meal Plan for <span className="text-[#C6F135]">{firstName}</span>
          </p>
          <p className={`text-sm ${muted} mt-1`}>
            {goalLabel} · {adjustedKcalTarget.toLocaleString()} kcal · {targets.protein}g protein · {targets.carbs}g carbs · {targets.fat}g fat
          </p>
          {caloriesBurnedToday > 0 && (
            <p className="text-xs text-[#a78bfa] mt-1">
              Includes {caloriesBurnedToday} kcal burned from today's workouts
            </p>
          )}
          <p className={`text-xs mt-1 ${muted} opacity-60`}>Meals rotate every 3 days</p>
        </div>

        {/* Meals grouped by category */}
        {["breakfast","lunch","dinner","snack"].map((cat) => {
          const meals = mealsToShow.filter((m) => m.cat === cat);
          if (meals.length === 0) return null;
          return (
            <div key={cat}>
              <div className={`flex items-center gap-3 px-6 py-2 ${bg3} border-b ${bdr}`}>
                <span className="text-xs tracking-widest uppercase px-2 py-1 border font-bold"
                  style={{ color: CAT_COLORS[cat], borderColor: CAT_COLORS[cat] }}>
                  {cat}
                </span>
                <span className={`text-xs ${muted}`}>{CAT_TIMES[cat]}</span>
                <span className={`text-xs ${muted} ml-auto`}>
                  {meals.reduce((sum, m) => sum + m.kcal, 0)} kcal
                </span>
              </div>

              {meals.map((meal, i) => {
                const isChecked      = checkedToday.has(meal.id);
                const hasIngredients = true; // all meals have ingredients in DB
                return (
                  <div key={meal.id}
                    className={`grid grid-cols-[20px_1fr_auto_auto] items-center gap-4 px-6 py-3 border-b ${bdr} relative ${isChecked ? "opacity-60" : ""}`}>
                    {isChecked && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#C6F135]" />}
                    <span className={`text-xs ${muted}`}>{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <button
                        onClick={() => hasIngredients && openMealModal(meal)}
                        className={`font-bold text-sm uppercase tracking-wide text-left transition-colors ${
                          hasIngredients ? "hover:text-[#C6F135] cursor-pointer" : "cursor-default"
                        }`}>
                        {meal.name}
                        {hasIngredients && (
                          <span className={`ml-2 text-xs font-normal ${muted} normal-case tracking-normal`}>
                            view ingredients →
                          </span>
                        )}
                      </button>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-[#FF2A5E]">{meal.protein}g P</span>
                        <span className="text-xs text-[#00E5FF]">{meal.carbs}g C</span>
                        <span className="text-xs text-[#FFAA00]">{meal.fat}g F</span>
                      </div>
                    </div>
                    <p className="font-black text-lg text-[#C6F135] whitespace-nowrap">
                      {meal.kcal}<span className={`text-xs ${muted} ml-1`}>kcal</span>
                    </p>
                    <button
                      onClick={() => togglePlanMeal(meal)}
                      aria-pressed={isChecked}
                      aria-label={isChecked ? `Unmark ${meal.name}` : `Mark ${meal.name} as eaten`}
                      className={`w-6 h-6 border flex items-center justify-center text-xs transition-all ${
                        isChecked
                          ? "border-[#C6F135] text-[#C6F135] bg-[#C6F135]/10"
                          : `border-[#2e2e2e] text-transparent hover:border-[#C6F135] hover:text-[#C6F135]`
                      }`}>
                      ✓
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}

        <div className={`flex justify-end px-6 py-4 border-t ${bdr}`}>
          <Link to="/meal-log"
            className="bg-[#C6F135] text-black text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-[#FF2A5E] hover:text-white transition-colors">
            + Log New Meal
          </Link>
        </div>
      </div>

      {/*  Meal Ingredient Modal  */}
      {mealModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog" aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setMealModal(null)}>
          <div className={`${bg} border ${bdr} w-full max-w-lg max-h-[80vh] overflow-y-auto`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${bdr}`}>
              <div>
                <p className={`text-xs tracking-widest uppercase ${muted} mb-1`}>Meal Breakdown</p>
                <h2 className="font-black text-xl uppercase tracking-tight">{mealModal.meal.name}</h2>
              </div>
              <button onClick={() => setMealModal(null)} aria-label="Close"
                className={`w-8 h-8 border ${bdr} ${muted} hover:border-[#FF2A5E] hover:text-[#FF2A5E] transition-colors flex items-center justify-center`}>
                ✕
              </button>
            </div>

            <div className={`grid grid-cols-4 border-b ${bdr}`}>
              {[
                { label: "Calories", val: mealModal.meal.kcal,    unit: "kcal", cls: "text-[#C6F135]" },
                { label: "Protein",  val: mealModal.meal.protein, unit: "g",    cls: "text-[#FF2A5E]" },
                { label: "Carbs",    val: mealModal.meal.carbs,   unit: "g",    cls: "text-[#00E5FF]" },
                { label: "Fat",      val: mealModal.meal.fat,     unit: "g",    cls: "text-[#FFAA00]" },
              ].map((s) => (
                <div key={s.label} className={`px-4 py-3 border-r last:border-r-0 ${bdr} text-center ${bg2}`}>
                  <p className={`text-xs ${muted} mb-1`}>{s.label}</p>
                  <p className={`font-black text-xl leading-none ${s.cls}`}>
                    {s.val}<span className={`text-xs ${muted} ml-0.5`}>{s.unit}</span>
                  </p>
                </div>
              ))}
            </div>

            {mealModal.ingredients.length === 0 ? (
              <p className={`px-6 py-8 text-sm ${muted} text-center`}>No ingredient data available.</p>
            ) : (
              <>
                <div className={`grid grid-cols-[1fr_60px_auto_auto_auto_auto] items-center gap-3 px-6 py-2 ${bg2} border-b ${bdr} text-xs tracking-widest uppercase ${muted}`}>
                  <div>Ingredient</div><div>g</div><div>Kcal</div><div>P</div><div>C</div><div>F</div>
                </div>
                {mealModal.ingredients.map((entry, i) => (
                  <div key={i}
                    className={`grid grid-cols-[1fr_60px_auto_auto_auto_auto] items-center gap-3 px-6 py-3 border-b last:border-b-0 ${bdr}`}>
                    <Link to={`/ingredient/${entry.item.id}`} onClick={() => setMealModal(null)}
                      className="text-xs font-bold hover:text-[#C6F135] transition-colors">
                      {entry.item.name} <span className={muted}>→</span>
                    </Link>
                    <span className={`text-xs ${muted}`}>{entry.portionG}g</span>
                    <span className="text-xs font-bold text-[#C6F135]">{entry.kcal}</span>
                    <span className="text-xs text-[#FF2A5E]">{entry.protein}g</span>
                    <span className="text-xs text-[#00E5FF]">{entry.carbs}g</span>
                    <span className="text-xs text-[#FFAA00]">{entry.fat}g</span>
                  </div>
                ))}
              </>
            )}

            <div className={`px-6 py-4 border-t ${bdr} flex justify-between items-center`}>
              <p className={`text-xs ${muted}`}>Click any ingredient for full nutrition details</p>
              <button onClick={() => setMealModal(null)}
                className="bg-[#C6F135] text-black text-xs font-bold tracking-widest uppercase px-5 py-2 hover:bg-[#FF2A5E] hover:text-white transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
