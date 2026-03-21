

import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ── Shared components ─────────────────────────────────────────
import Navbar from "./components/Navbar";

// ── Mohamad Kaddah's pages ────────────────────────────────────
import HomePage       from "./pages/HomePage";
import LogWorkoutPage from "./pages/LogWorkoutPage";
// jawad's Added pages 
import ExerciseLibrary from "./pages/exerciseLibrary";
import ExerciseDetailPage from "./pages/ExerciseDetailPage";

// ── Teammate's pages (Diet Program) ──────────────────────────
import DietProgram      from "./pages/DietProgram";
import MealLog          from "./pages/MealLog";
import IngredientDetail from "./pages/IngredientDetail";

// ── Mock data (teammate's) ────────────────────────────────────
import { MOCK_USERS, INITIAL_CALENDAR, getTodayKey } from "./data/mockData";



export default function App() {

  // ── Shared state (Diet Program) ──────────────────────────────
  const [currentUser,  setCurrentUser]  = useState(MOCK_USERS[0]);
  const [calendarData, setCalendarData] = useState(INITIAL_CALENDAR);
  const [loggedMeals,  setLoggedMeals]  = useState({});
  const [savedMeals,   setSavedMeals]   = useState([]);

  // Add a meal to the calendar
  const addMealToCalendar = (dateKey, entry) => {
    const existing = calendarData[dateKey] || [];
    setCalendarData({ ...calendarData, [dateKey]: [...existing, entry] });
  };

  // Delete a meal from a specific day
  const deleteMealFromDay = (dateKey, index) => {
    const existing = calendarData[dateKey] || [];
    const updated  = existing.filter((_, i) => i !== index);
    const newCalendar = { ...calendarData };
    if (updated.length === 0) {
      delete newCalendar[dateKey];
    } else {
      newCalendar[dateKey] = updated;
    }
    setCalendarData(newCalendar);
  };

  // Toggle a recommended meal checkbox
  const togglePlanMeal = (meal) => {
    const today        = getTodayKey();
    const todayChecked = new Set(loggedMeals[today] || []);

    if (todayChecked.has(meal.id)) {
      todayChecked.delete(meal.id);
      const todayCalendar = (calendarData[today] || []).filter(
        (entry) => entry.name !== meal.name
      );
      const newCalendar = { ...calendarData };
      if (todayCalendar.length === 0) {
        delete newCalendar[today];
      } else {
        newCalendar[today] = todayCalendar;
      }
      setCalendarData(newCalendar);
    } else {
      todayChecked.add(meal.id);
      const todayCalendar = calendarData[today] || [];
      const alreadyLogged = todayCalendar.find((e) => e.name === meal.name);
      if (!alreadyLogged) {
        setCalendarData({
          ...calendarData,
          [today]: [...todayCalendar, {
            name:    meal.name,
            kcal:    meal.kcal,
            cat:     meal.cat,
            protein: meal.protein,
            carbs:   meal.carbs,
            fat:     meal.fat,
            type:    "meal",
          }],
        });
      }
    }
    setLoggedMeals({ ...loggedMeals, [today]: todayChecked });
  };

  // Save / delete custom meals
  const saveCustomMeal = (meal) => {
    setSavedMeals([...savedMeals, { ...meal, id: `custom-${Date.now()}` }]);
  };

  const deleteSavedMeal = (mealId) => {
    setSavedMeals(savedMeals.filter((m) => m.id !== mealId));
  };

  return (
    <div className="bg-[#080808] text-[#ECECEC] min-h-screen font-['JetBrains_Mono'] overflow-x-hidden">
      <BrowserRouter>

        {/* Shared navbar appears on every page */}
        <Navbar />

        <Routes>

          {/* ── Mohamad Kaddah ── */}
          <Route path="/"    element={<HomePage />} />
          <Route path="/log" element={<LogWorkoutPage />} />
         {/* ── Jawad Al Housseini ── */}
         <Route path="/exercises" element={<ExerciseLibrary />} />
         <Route path="/exercise/:id" element={<ExerciseDetailPage />} />

          {/*  ── Sara Ibrahim  ── */}
          <Route path="/diet" element={
            <DietProgram
              currentUser={currentUser}
              calendarData={calendarData}
              loggedMeals={loggedMeals}
              togglePlanMeal={togglePlanMeal}
              deleteMealFromDay={deleteMealFromDay}
            />}
          />
          <Route path="/diet-program" element={
            <DietProgram
              currentUser={currentUser}
              calendarData={calendarData}
              loggedMeals={loggedMeals}
              togglePlanMeal={togglePlanMeal}
              deleteMealFromDay={deleteMealFromDay}
            />}
          />
          <Route path="/meal-log" element={
            <MealLog
              currentUser={currentUser}
              calendarData={calendarData}
              savedMeals={savedMeals}
              addMealToCalendar={addMealToCalendar}
              saveCustomMeal={saveCustomMeal}
              deleteSavedMeal={deleteSavedMeal}
            />}
          />
          <Route path="/ingredient/:id" element={<IngredientDetail />} />

          
        </Routes>
      </BrowserRouter>
    </div>
  );
}
