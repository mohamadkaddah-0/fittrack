import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";

// ── Shared components ─────────────────────────────────────────
import Navbar from "./components/Navbar";

// ── Mohamad Kaddah's pages ────────────────────────────────────
import HomePage       from "./pages/HomePage";
import LogWorkoutPage from "./pages/LogWorkoutPage";

// ── Jawad's pages ─────────────────────────────────────────────
import ExerciseLibrary    from "./pages/exerciseLibrary";
import ExerciseDetailPage from "./pages/ExerciseDetailPage";



// ── Sara pages ─────────────────────────────────────
import DietProgram      from "./pages/DietProgram";
import MealLog          from "./pages/MealLog";
import IngredientDetail from "./pages/IngredientDetail";
import UserProgress     from "./pages/UserProgress";
import { getUserProfile, INITIAL_CALENDAR, getTodayKey } from "./data/mockData";
import api from "./services/api";

// ── Mohammad Moghnieh's pages ─────────────────────────────────
import Register       from "./pages/Register/Register";
import UserProfile    from "./pages/UserProfile/UserProfile";
import Survey         from "./pages/survey/Survey";
import Terms          from "./pages/Terms/Terms";
import Privacy        from "./pages/Terms/Privacy";
import Support        from "./pages/Terms/Support";
import ReadySurvey    from "./pages/survey/ReadySurvey";
import Welcome        from "./pages/WelcomePage/WelcomePage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword  from "./pages/ResetPassword";

// ── Pages that should NOT show the navbar ─────────────────────
const NO_NAVBAR_ROUTES = [
  "/",
  "/terms",
  "/privacy",
  "/welcome",
  "/login",
  "/register",
  "/surveys",
  "/ready-survey",
  "/forgot-password",
  "/reset-password",
  "/get-started",
];



const THEME_STORAGE_KEY = "fittrack-theme";

// ── Wrapper that conditionally shows navbar ───────────────────
function AppLayout({ children }) {
  const location = useLocation();
  const showNavbar = !NO_NAVBAR_ROUTES.includes(location.pathname);
  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
}

// ── Mohammad Moghnieh — Login component ──────────────────────
const Login = ({ 
  email, 
  setEmail, 
  password, 
  setPassword, 
  rememberMe, 
  setRememberMe, 
  message, 
  setMessage, 
  showExtraInfo, 
  setShowExtraInfo, 
  handleLogin, 
  isFormValid,
  isLoading 
}) => {

   const navigate = useNavigate();

  return (
    <section className="login-section">
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => navigate("/")}
          className="font-['Barlow_Condensed'] text-2xl font-black tracking-wider uppercase text-[#C6F135] bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity"
        >
          FitTrack<sup className="text-xs">™</sup>
        </button>
      </div>
      <div className="login-card">
        <div className="login-ghost">//</div>
        <div className="login-header">
          <div className="login-title">
            member
            <em>login</em>
          </div>
        </div>
        <div className="login-body">
          <form onSubmit={handleLogin}>
            <div className="field">
              <label className="field-label" htmlFor="email">
                EMAIL ADDRESS
              </label>
              <input 
                type="email" 
                id="email"
                className="field-input bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-xs p-[13px_16px] outline-none transition-colors duration-200 focus:border-[var(--cyan)]"
                placeholder="you@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={isLoading}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="password">
                PASSWORD
              </label>
              <input 
                type="password" 
                id="password"
                className="field-input bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-xs p-[13px_16px] outline-none transition-colors duration-200 focus:border-[var(--cyan)]"
                placeholder="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength="3"
                disabled={isLoading}
              />
            </div>
            <div className="login-options">
              <label className="checkbox-item">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                  disabled={isLoading}
                />
                keep me logged in
              </label>
              <Link to="/forgot-password" className="forgot-link">
                reset passphrase
              </Link>
            </div>
            <button 
              type="submit" 
              className="btn-submit" 
              disabled={!isFormValid() || isLoading}
            >
              <span>{isLoading ? 'LOGGING IN...' : 'Login'}</span>
            </button>
          </form>
          {message.text && (
            <div className={`mock-alert ${message.type}`}>
              <span>{message.type === "success" ? "SUCCESS" : "ERROR"}</span>{" "}{message.text}
            </div>
          )}
          <div className="auth-foot">
            no credentials? <Link to="/register" onClick={() => window.scrollTo(0, 0)}>join now</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const useBackendCalendar = api.hasActivityIdentity();

  useEffect(() => {
    // Read theme from sessionStorage (resets to dark when browser closes).
    // Remove any legacy localStorage value so it doesn't interfere.
    localStorage.removeItem(THEME_STORAGE_KEY);
    const savedTheme = sessionStorage.getItem(THEME_STORAGE_KEY) || "dark";
    document.documentElement.dataset.theme = savedTheme;
    sessionStorage.setItem(THEME_STORAGE_KEY, savedTheme);
  }, []);

  // ── Diet teammate's shared state ─────────────────────────────
  const [currentUser,  setCurrentUser]  = useState(getUserProfile());
  const [calendarData, setCalendarData] = useState(INITIAL_CALENDAR);
  const [loggedMeals,  setLoggedMeals]  = useState({});
  const [savedMeals,   setSavedMeals]   = useState([]);
  const [ingredients, setIngredients] = useState([]);
const [mealPool,    setMealPool]    = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleUserUpdate = (event) => {
      if (event.detail) {
        setCurrentUser(event.detail);
      }
    };
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

  useEffect(() => {
    if (!useBackendCalendar) return undefined;
    let cancelled = false;

    async function loadSavedMeals() {
      try {
        const response = await api.getSavedMeals();
        if (!cancelled && response?.meals) setSavedMeals(response.meals);
      } catch (_) {}
    }

    async function loadReferenceData() {
      try {
        const [ingRes, mealRes] = await Promise.all([
          api.getIngredients(),
          api.getMealPool(),
        ]);
        if (!cancelled) {
          if (ingRes?.ingredients) setIngredients(ingRes.ingredients);
          if (mealRes?.meals)      setMealPool(mealRes.meals);
        }
      } catch (_) {}
    }
    async function loadCalendar() {
      try {
        const response = await api.getCalendarData();
        if (!cancelled) {
          setCalendarData(response.calendarData || {});
        }
      } catch (error) {
        if (!cancelled) {
          setCalendarData(INITIAL_CALENDAR);
        }
      }
    }

    loadCalendar();
    loadSavedMeals();
    loadReferenceData();

    return () => {
      cancelled = true;
    };
  }, [useBackendCalendar, currentUser?.id]);

  const addMealToCalendar = async (dateKey, entry) => {
    if (useBackendCalendar) {
      try {
        const response = await api.addCalendarEntry(dateKey, { ...entry, type: "meal" });
        setCalendarData((prev) => {
          const existing = prev[dateKey] || [];
          return { ...prev, [dateKey]: [...existing, response.entry] };
        });
        return response.entry;
      } catch (error) {
        return null;
      }
    }

    const existing = calendarData[dateKey] || [];
    setCalendarData({ ...calendarData, [dateKey]: [...existing, entry] });
    return entry;
  };

  const addWorkoutToCalendar = async (dateKey, entry) => {
    if (useBackendCalendar) {
      try {
        const response = await api.addCalendarEntry(dateKey, { ...entry, type: "workout" });
        setCalendarData((prev) => {
          const existing = prev[dateKey] || [];
          return { ...prev, [dateKey]: [...existing, response.entry] };
        });
        return response.entry;
      } catch (error) {
        return null;
      }
    }

    const existing = calendarData[dateKey] || [];
    setCalendarData({ ...calendarData, [dateKey]: [...existing, { ...entry, type: "workout" }] });
    return entry;
  };

  const deleteMealFromDay = async (dateKey, index) => {
    const existing = calendarData[dateKey] || [];
    const targetEntry = existing[index];

    if (useBackendCalendar && targetEntry?.id) {
      try {
        await api.deleteCalendarEntry(targetEntry.id, dateKey);
      } catch (error) {
        return;
      }
    }

    const updated     = existing.filter((_, i) => i !== index);
    const newCalendar = { ...calendarData };
    if (updated.length === 0) { delete newCalendar[dateKey]; } else { newCalendar[dateKey] = updated; }
    setCalendarData(newCalendar);
  };

  const deleteWorkoutFromDay = async (dateKey, index) => {
    const existing = calendarData[dateKey] || [];
    const targetEntry = existing[index];

    if (useBackendCalendar && targetEntry?.id) {
      try {
        await api.deleteCalendarEntry(targetEntry.id, dateKey);
      } catch (error) {
        return;
      }
    }

    const updated     = existing.filter((_, i) => i !== index);
    const newCalendar = { ...calendarData };
    if (updated.length === 0) { delete newCalendar[dateKey]; } else { newCalendar[dateKey] = updated; }
    setCalendarData(newCalendar);
  };

  const togglePlanMeal = async (meal) => {
    const today        = getTodayKey();
    const todayChecked = new Set(loggedMeals[today] || []);
    if (todayChecked.has(meal.id)) {
      todayChecked.delete(meal.id);
      const todayEntries = calendarData[today] || [];
      const targetIndex = todayEntries.findIndex((e) => e.type === "meal" && e.name === meal.name);
      if (targetIndex >= 0) {
        await deleteMealFromDay(today, targetIndex);
      }
      const todayCalendar = (calendarData[today] || []).filter((e) => e.name !== meal.name);
      const newCalendar   = { ...calendarData };
      if (todayCalendar.length === 0) { delete newCalendar[today]; } else { newCalendar[today] = todayCalendar; }
      setCalendarData(newCalendar);
    } else {
      todayChecked.add(meal.id);
      const todayCalendar = calendarData[today] || [];
      if (!todayCalendar.find((e) => e.name === meal.name)) {
        await addMealToCalendar(today, { name: meal.name, kcal: meal.kcal, cat: meal.cat, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, type: "meal" });
      }
    }
    setLoggedMeals({ ...loggedMeals, [today]: todayChecked });
  };

  const saveCustomMeal = async (meal) => {
    if (useBackendCalendar) {
      try {
        const response = await api.addSavedMeal(meal);
        setSavedMeals(prev => [...prev, response.meal || { ...meal, id: `custom-${Date.now()}` }]);
        return;
      } catch (_) {}
    }
    setSavedMeals(prev => [...prev, { ...meal, id: `custom-${Date.now()}` }]);
  };

  const deleteSavedMeal = async (mealId) => {
    if (useBackendCalendar) {
      try {
        await api.deleteSavedMeal(mealId);
      } catch (_) {}
    }
    setSavedMeals(prev => prev.filter((m) => m.id !== mealId));
  };
  // ── Mohammad Moghnieh's shared state ─────────────────────────
  const [email,         setEmail]        = useState("");
  const [password,      setPassword]     = useState("");
  const [rememberMe,    setRememberMe]   = useState(false);
  const [message,       setMessage]      = useState({ text: "", type: "info" });
  const [showExtraInfo, setShowExtraInfo] = useState(false);

  const mockUsers = [
    { email: "demo@fittrack.io", password: "demo123", name: "Demo User" },
    { email: "test@test.com",    password: "test123", name: "Test User"  },
  ];

  const handleLogin = async (e) => {
  e.preventDefault();
  setMessage({ text: "", type: "info" });
  setIsLoading(true);

  try {
    const response = await fetch('https://fittrack-t4iu.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('fittrack_token', data.token);
      localStorage.setItem('fittrack_user', JSON.stringify(data.user));

      // Load full profile from DB and set as currentUser
      try {
        const profileRes = await api.getCurrentUser();
        if (profileRes?.user) {
          setCurrentUser({
            ...profileRes.user,
            weight:       profileRes.user.currentWeight,
            targetWeight: profileRes.user.targetWeight,
            goal:         profileRes.user.goal,
            level:        profileRes.user.fitnessLevel,
            activityLevel: profileRes.user.activityLevel,
          });
        }
      } catch (_) {
        setCurrentUser({ name: data.user.name, email: data.user.email });
      }

      setMessage({ text: `Welcome back, ${data.user.name}!`, type: "success" });
      setTimeout(() => { window.location.href = "/dashboard"; }, 1000);
    } else {
      setMessage({ text: data.message, type: "error" });
    }
  } catch (error) {
    console.error('Login error:', error);
    setMessage({ text: "Connection error. Please try again.", type: "error" });
  } finally {
    setIsLoading(false);
  }
};

  const isFormValid = () => email.includes("@") && email.includes(".") && password.length >= 3;

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-[var(--bg)] text-[var(--text)] min-h-screen font-['JetBrains_Mono']">
      <BrowserRouter>
        <AppLayout>
          <Routes>

            {/* ── Default — Welcome page (no navbar) ── */}
            <Route path="/"            element={<Welcome />} />
            <Route path="/welcome"     element={<Welcome />} />
            <Route path="/get-started" element={<Welcome />} />

            {/* ── Auth pages (no navbar) ── */}
            <Route 
              path="/login" 
              element={
                <Login 
                  email={email} 
                  setEmail={setEmail} 
                  password={password} 
                  setPassword={setPassword} 
                  rememberMe={rememberMe} 
                  setRememberMe={setRememberMe} 
                  message={message} 
                  setMessage={setMessage} 
                  showExtraInfo={showExtraInfo} 
                  setShowExtraInfo={setShowExtraInfo} 
                  handleLogin={handleLogin} 
                  isFormValid={isFormValid}
                  isLoading={isLoading}
                />
              } 
            />
            <Route path="/register"        element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />
            <Route path="/ready-survey"    element={<ReadySurvey />} />
            <Route path="/surveys"         element={<Survey setCurrentUser={setCurrentUser} />} />

            {/* ── App pages (navbar shown) ── */}

            {/* Mohamad Kaddah */}
            <Route path="/dashboard" element={<HomePage calendarData={calendarData} currentUser={currentUser} deleteMealFromDay={deleteMealFromDay} deleteWorkoutFromDay={deleteWorkoutFromDay} togglePlanMeal={togglePlanMeal} loggedMeals={loggedMeals} />} />

            {/* Sara Ibrahim */}
            <Route path="/progress" element={<UserProgress currentUser={currentUser} calendarData={calendarData}/>} />
           <Route path="/diet"           element={<DietProgram currentUser={currentUser} calendarData={calendarData} loggedMeals={loggedMeals} togglePlanMeal={togglePlanMeal} deleteMealFromDay={deleteMealFromDay} mealPool={mealPool} ingredients={ingredients} />} />
<Route path="/diet-program"   element={<DietProgram currentUser={currentUser} calendarData={calendarData} loggedMeals={loggedMeals} togglePlanMeal={togglePlanMeal} deleteMealFromDay={deleteMealFromDay} mealPool={mealPool} ingredients={ingredients} />} />
<Route path="/meal-log"       element={<MealLog currentUser={currentUser} calendarData={calendarData} savedMeals={savedMeals} addMealToCalendar={addMealToCalendar} saveCustomMeal={saveCustomMeal} deleteSavedMeal={deleteSavedMeal} ingredients={ingredients} />} />
<Route path="/ingredient/:id" element={<IngredientDetail ingredients={ingredients} />} />
            {/* Jawad */}
            <Route path="/exercises"    element={<ExerciseLibrary calendarData={calendarData} addWorkoutToCalendar={addWorkoutToCalendar} currentUser={currentUser} />} />
            <Route path="/exercise/:id" element={<ExerciseDetailPage />} />
            <Route path="/log" element={<LogWorkoutPage addWorkoutToCalendar={addWorkoutToCalendar} currentUser={currentUser} />} />
            {/* Mohammad Moghnieh */}
            <Route path="/profile"         element={<UserProfile user={currentUser} />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/terms"           element={<Terms />} />
            <Route path="/privacy"         element={<Privacy />} />
            <Route path="/support"         element={<Support />} />

          </Routes>

          {/* Footer only on app pages */}
          <AppFooter />
        </AppLayout>
      </BrowserRouter>
    </div>
  );
}

// ── Footer only shown on app pages ───────────────────────────
function AppFooter() {
  const location = useLocation();
  const NO_FOOTER_ROUTES = ["/", "/welcome", "/login", "/register", "/surveys", "/ready-survey", "/forgot-password", "/reset-password", "/get-started"];
  if (NO_FOOTER_ROUTES.includes(location.pathname)) return null;
  return (
    <footer className="px-14 py-8 flex items-center justify-between border-t border-[var(--line)] bg-[var(--bg)] text-[var(--text)]">
      <div className="font-['Barlow_Condensed'] font-black text-xl text-[#C6F135] uppercase">FitTrack</div>
      <ul className="flex gap-6 list-none">
        <li><Link to="/privacy" className="text-[8px] tracking-[0.2em] uppercase text-[var(--dim)] hover:text-[#C6F135] transition-colors">Privacy</Link></li>
        <li><Link to="/terms"   className="text-[8px] tracking-[0.2em] uppercase text-[var(--dim)] hover:text-[#C6F135] transition-colors">Terms</Link></li>
        <li><Link to="/support" className="text-[8px] tracking-[0.2em] uppercase text-[var(--dim)] hover:text-[#C6F135] transition-colors">Support</Link></li>
      </ul>
      <div className="text-[8px] tracking-[0.2em] uppercase text-[var(--dim)]">2026 FitTrack v1.0.0</div>
    </footer>
  );
}
