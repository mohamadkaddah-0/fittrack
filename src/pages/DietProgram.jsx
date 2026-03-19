// DietProgram.jsx
// Page: Personalised Diet Program
//
// Features:
//   - Macro bar showing daily targets (calculated from user profile) vs consumed
//   - Recommended meals picked by the 3-day rotation recommender
//   - Category filter tabs (All / Breakfast / Lunch / Dinner / Snack)
//   - Checkable meals — checking adds to calendar and macro bar
//   - Clickable meal names — opens ingredient breakdown modal
//   - Monthly calendar with colored dots per logged meal
//   - Day detail panel below calendar
//   - Goal switcher modal
//
// Props:
//   darkMode       (bool)
//   currentUser    (object) — used to calculate personalised targets
//   calendarData   (object) — { "YYYY-MM-DD": [meal entries] }
//   loggedMeals    (object) — { "YYYY-MM-DD": Set of checked meal ids }
//   togglePlanMeal (fn)     — called when user checks/unchecks a meal
//
// Hooks used: useState


// DietProgram.jsx
// Page: Personalised Diet Program
//
// New features:
//   - Read-only past days — delete button only shown on today
//   - recommendMeals now receives user for duration-aware meal selection
//   - Targets now include weeklyRate and durationWeeks, shown in header
//   - user cannot log in more than 10% of the daily macros

 
//
// Hooks used: useState

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  INGREDIENTS,
  MEAL_INGREDIENTS,
  calcNutritionTargets,
  recommendMeals,
  getTodayKey,
} from "../data/mockData";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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

export default function DietProgram({
  darkMode, currentUser, calendarData, loggedMeals, togglePlanMeal, deleteMealFromDay
}) {

  const today     = getTodayKey();
  const todayDate = new Date();

  // ── Local state ────────────────────────────────────────────────────────────
  const [activeFilter,    setActiveFilter]    = useState("all");
  const [calYear,         setCalYear]         = useState(todayDate.getFullYear());
  const [calMonth,        setCalMonth]        = useState(todayDate.getMonth());
  const [selectedDay,     setSelectedDay]     = useState(today);
  const [mealModal, setMealModal] = useState(null);

  // ── Targets — now includes weeklyRate, isAggressive, durationWeeks ─────────
  const targets = calcNutritionTargets(currentUser);

  // Recommended meals — passes user for duration-aware selection
  const recommendedMeals = recommendMeals(targets, today, currentUser);

  // ── Today's consumed totals ────────────────────────────────────────────────
  const todayEntries = calendarData[today] || [];
  let consumedKcal = 0, consumedProtein = 0, consumedCarbs = 0, consumedFat = 0;
  for (const entry of todayEntries) {
    consumedKcal    += entry.kcal    || 0;
    consumedProtein += entry.protein || 0;
    consumedCarbs   += entry.carbs   || 0;
    consumedFat     += entry.fat     || 0;
  }

  const checkedToday = loggedMeals[today] || new Set();

  const mealsToShow = activeFilter === "all"
    ? recommendedMeals
    : recommendedMeals.filter((m) => m.cat === activeFilter);

  function pct(consumed, target) {
    if (target === 0) return 0;
    return Math.min(100, Math.round((consumed / target) * 100));
  }

  // ── Open meal ingredient modal ─────────────────────────────────────────────
  function openMealModal(meal) {
    const ingList  = MEAL_INGREDIENTS[meal.id] || [];
    const resolved = [];
    for (const { ingredientId, portionG } of ingList) {
      const item = INGREDIENTS.find((i) => i.id === ingredientId);
      if (!item) continue;
      const ratio = portionG / 100;
      resolved.push({
        item, portionG,
        kcal:    Math.round(item.kcal    * ratio),
        protein: Math.round(item.protein * ratio * 10) / 10,
        carbs:   Math.round(item.carbs   * ratio * 10) / 10,
        fat:     Math.round(item.fat     * ratio * 10) / 10,
      });
    }
    setMealModal({ meal, ingredients: resolved });
  }

  // ── Calendar helpers ───────────────────────────────────────────────────────
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
        logs:       calendarData[dateKey] || [],
        label:      `${MONTHS_SHORT[month]} ${day}, ${year}`,
      });
    }
    return cells;
  }

  // ── Styling ────────────────────────────────────────────────────────────────
  const bg    = darkMode ? "bg-[#0a0a0a]"   : "bg-white";
  const bg2   = darkMode ? "bg-[#111]"      : "bg-neutral-50";
  const bg3   = darkMode ? "bg-[#161616]"   : "bg-neutral-100";
  const bdr   = darkMode ? "border-[#222]"  : "border-neutral-200";
  const txt   = darkMode ? "text-[#e8e8e8]" : "text-neutral-900";
  const muted = darkMode ? "text-[#555]"    : "text-neutral-400";

  const selectedDayEntries = calendarData[selectedDay] || [];
  const firstName          = currentUser?.name?.split(" ")[0] || "You";
  const goalLabel          = currentUser?.goal?.replace(/_/g, " ") || "your plan";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className={`${bg} ${txt} min-h-screen`}>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <header className={`flex flex-wrap items-end justify-between gap-4 px-6 md:px-8 pt-6 pb-5 border-b ${bdr}`}>
        <div>
          <p className={`text-xs tracking-widest uppercase ${muted} mb-2`}>
            {todayDate.toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric"
            })}
          </p>
          <h1 className="font-black text-4xl md:text-5xl uppercase tracking-tight leading-none">
            Diet <span className="text-[#C6F135]">Program</span>
          </h1>
        </div>
        <div className="border border-[#C6F135] px-4 py-2 text-right">
          <p className={`text-xs tracking-widest uppercase ${muted}`}>{firstName}'s Goal</p>
          <p className="font-black text-lg uppercase text-[#C6F135]">{goalLabel}</p>
          {/* Show weekly rate so user knows what they're working with */}
          {targets.weeklyRate > 0 && (
            <p className={`text-xs ${muted} mt-1`}>
              {targets.weeklyRate}kg / week
              {targets.durationWeeks && ` · ${Math.round(targets.durationWeeks / 4.33)} months`}
            </p>
          )}
        </div>
      </header>

      {/* ── Macro Bar ────────────────────────────────────────────────────── */}
      <section className={`grid grid-cols-2 md:grid-cols-4 border-b ${bdr}`}>
        {[
          { label: "Daily Calories", target: targets.kcal,    consumed: consumedKcal,    color: "#C6F135", cls: "text-[#C6F135]", unit: "kcal" },
          { label: "Protein",        target: targets.protein, consumed: consumedProtein, color: "#FF2A5E", cls: "text-[#FF2A5E]", unit: "g"    },
          { label: "Carbs",          target: targets.carbs,   consumed: consumedCarbs,   color: "#00E5FF", cls: "text-[#00E5FF]", unit: "g"    },
          { label: "Fat",            target: targets.fat,     consumed: consumedFat,     color: "#FFAA00", cls: "text-[#FFAA00]", unit: "g"    },
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

      {/* ── Main Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">

        {/* ── Left: Meal List ────────────────────────────────────────────── */}
        <div className={`border-r ${bdr}`}>

          {/* Category filter tabs */}
          <div className={`flex border-b ${bdr}`} role="tablist">
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
              {goalLabel} · {targets.kcal.toLocaleString()} kcal · {targets.protein}g protein · {targets.carbs}g carbs · {targets.fat}g fat
            </p>
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
                  const hasIngredients = !!MEAL_INGREDIENTS[meal.id];
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
                        className={`w-6 h-6 border flex items-center justify-center text-xs transition-all ${
                          isChecked
                            ? "border-[#C6F135] text-[#C6F135] bg-[#C6F135]/10"
                            : `${darkMode ? "border-[#2e2e2e] text-transparent" : "border-neutral-300 text-transparent"} hover:border-[#C6F135] hover:text-[#C6F135]`
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

        {/* ── Right: Calendar ──────────────────────────────────────────────── */}
        <div className="flex flex-col">
          <div className={`flex items-center justify-between px-5 py-3 border-b ${bdr}`}>
            <p className="font-black text-xl uppercase tracking-tight">
              <span className="text-[#C6F135]">{MONTHS[calMonth]}</span>
              <span className={`text-base ${muted} ml-2`}>{calYear}</span>
            </p>
            <div className="flex">
              <button onClick={() => changeMonth(-1)} aria-label="Previous month"
                className={`w-8 h-8 border border-r-0 text-sm flex items-center justify-center transition-colors ${bdr} ${muted} hover:bg-[#C6F135] hover:text-black`}>
                ‹
              </button>
              <button onClick={() => changeMonth(1)} aria-label="Next month"
                className={`w-8 h-8 border text-sm flex items-center justify-center transition-colors ${bdr} ${muted} hover:bg-[#C6F135] hover:text-black`}>
                ›
              </button>
            </div>
          </div>

          <div className={`grid grid-cols-7 border-b ${bdr}`}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
              <div key={d} className={`py-2 text-center text-xs tracking-widest uppercase ${muted} border-r last:border-r-0 ${bdr}`}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {buildCalendarCells().map((cell) => {
              let cellClass = `border-r border-b last:border-r-0 min-h-[44px] p-1 flex flex-col text-left transition-colors ${bdr}`;
              if (cell.isOtherMonth)  cellClass += " opacity-20 cursor-default";
              else                    cellClass += " cursor-pointer";
              if (cell.isToday)       cellClass += darkMode ? " bg-[#C6F135]/5"  : " bg-[#C6F135]/10";
              if (cell.isSelected)    cellClass += darkMode ? " bg-[#C6F135]/10 outline outline-1 outline-[#C6F135]/50" : " bg-[#C6F135]/20";
              if (!cell.isOtherMonth && !cell.isSelected)
                                      cellClass += darkMode ? " hover:bg-[#111]" : " hover:bg-neutral-50";
              return (
                <button key={cell.dateKey}
                  onClick={() => !cell.isOtherMonth && setSelectedDay(cell.dateKey)}
                  disabled={cell.isOtherMonth}
                  className={cellClass}>
                  <span className={`text-xs font-bold leading-none mb-1 ${cell.isToday ? "text-[#C6F135]" : ""}`}>
                    {cell.day}
                  </span>
                  <div className="flex flex-wrap gap-[2px]">
                    {cell.logs.slice(0, 4).map((log, i) => (
                      <div key={i} className="w-[4px] h-[4px] rounded-full"
                        style={{ background: CAT_COLORS[log.cat] || "#555" }}
                        title={log.name}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected day detail */}
          <div className={`border-t ${bdr} p-4 flex-1`} aria-live="polite">
            <div className={`flex items-center justify-between mb-3 pb-3 border-b ${bdr}`}>
              <p className="text-xs tracking-widest uppercase text-[#FF2A5E]">
                {MONTHS_SHORT[parseInt(selectedDay.split("-")[1]) - 1]}{" "}
                {parseInt(selectedDay.split("-")[2])},{" "}
                {selectedDay.split("-")[0]}
              </p>
              <p className="font-black text-lg text-[#C6F135]">
                {selectedDayEntries.reduce((sum, e) => sum + (e.kcal || 0), 0).toLocaleString()}
                <span className={`text-xs font-normal ${muted} ml-1`}>kcal</span>
              </p>
            </div>

            {/* Past days show a read-only notice */}
            {selectedDay !== today && selectedDayEntries.length > 0 && (
              <p className={`text-xs ${muted} mb-3 italic`}>Past day — read only</p>
            )}

            {selectedDayEntries.length === 0 ? (
              <p className={`text-xs ${muted}`}>No meals logged this day.</p>
            ) : (
              <ul>
                {selectedDayEntries.map((entry, i) => (
                  <li key={i} className={`flex items-center justify-between py-2 border-b last:border-b-0 ${bdr}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                        style={{ background: CAT_COLORS[entry.cat] || "#555" }} />
                      <div>
                        <p className="text-xs font-bold">{entry.name}</p>
                        <p className={`text-xs ${muted}`}>{entry.cat}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-bold text-[#C6F135]">{entry.kcal} kcal</p>
                      {/* Delete button only shown for today */}
                      {selectedDay === today && (
                        <button
                          onClick={() => {
                            deleteMealFromDay(selectedDay, i);
                            const matched = recommendedMeals.find((m) => m.name === entry.name);
                            if (matched && checkedToday.has(matched.id)) {
                              togglePlanMeal(matched);
                            }
                          }}
                          aria-label={`Delete ${entry.name}`}
                          className={`w-6 h-6 border ${bdr} ${muted} hover:border-[#FF2A5E] hover:text-[#FF2A5E] flex items-center justify-center text-xs transition-colors`}>
                          ✕
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Meal Ingredient Modal ─────────────────────────────────────────── */}
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
              <button onClick={() => setMealModal(null)}
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
                  <div key={i} className={`grid grid-cols-[1fr_60px_auto_auto_auto_auto] items-center gap-3 px-6 py-3 border-b last:border-b-0 ${bdr}`}>
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
