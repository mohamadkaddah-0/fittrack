import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";

// ── Shared components ─────────────────────────────────────────
import Navbar from "./components/Navbar";

// ── Mohamad Kaddah's pages ────────────────────────────────────
import HomePage       from "./pages/HomePage";
import LogWorkoutPage from "./pages/LogWorkoutPage";
// ── Jawad's pages ────────────────────────────────────
import ExerciseLibrary from "./pages/exerciseLibrary";
import ExerciseDetailPage  from "./pages/ExerciseDetailPage";
// ── Diet teammate's pages ─────────────────────────────────────
import DietProgram      from "./pages/DietProgram";
import MealLog          from "./pages/MealLog";
import IngredientDetail from "./pages/IngredientDetail";
import { getUserProfile, INITIAL_CALENDAR, getTodayKey } from "./data/mockData";

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

// ── Other teammates — uncomment when ready ────────────────────
// import ListViewPage    from "./pages/ListViewPage";
// import DetailView1Page from "./pages/DetailView1Page";

// ── Pages that should NOT show the navbar ─────────────────────
const NO_NAVBAR_ROUTES = [
  "/",
  "/welcome",
  "/login",
  "/register",
  "/surveys",
  "/ready-survey",
  "/forgot-password",
  "/reset-password",
  "/get-started",
];

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
const Login = ({ email, setEmail, password, setPassword, rememberMe, setRememberMe, message, showExtraInfo, setShowExtraInfo, handleLogin, isFormValid }) => {
  return (
    <section className="login-section">
      <div className="login-card">
        <div className="login-ghost">//</div>
        <div className="login-header">
          <div className="login-title">member<em>login</em></div>
        </div>
        <div className="login-body">
          <form onSubmit={handleLogin}>
            <div className="field">
              <label className="field-label" htmlFor="email">EMAIL ADDRESS</label>
              <input type="email" id="email"
                className="field-input bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-xs p-[13px_16px] outline-none transition-colors duration-200 focus:border-[var(--cyan)]"
                placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="password">PASSWORD</label>
              <input type="password" id="password"
                className="field-input bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] font-['JetBrains_Mono'] text-xs p-[13px_16px] outline-none transition-colors duration-200 focus:border-[var(--cyan)]"
                placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="3" />
            </div>
            <div className="login-options">
              <label className="checkbox-item">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                keep me logged in
              </label>
              <Link to="/forgot-password" className="forgot-link">reset passphrase</Link>
            </div>
            <button type="submit" className="btn-submit" disabled={!isFormValid()}>
              <span>Login</span>
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

  // ── Diet teammate's shared state ─────────────────────────────
  const [currentUser,  setCurrentUser]  = useState(getUserProfile());
  const [calendarData, setCalendarData] = useState(INITIAL_CALENDAR);
  const [loggedMeals,  setLoggedMeals]  = useState({});
  const [savedMeals,   setSavedMeals]   = useState([]);

  const addMealToCalendar = (dateKey, entry) => {
    const existing = calendarData[dateKey] || [];
    setCalendarData({ ...calendarData, [dateKey]: [...existing, entry] });
  };

  const addWorkoutToCalendar = (dateKey, entry) => {
  const existing = calendarData[dateKey] || [];
  setCalendarData({ ...calendarData, [dateKey]: [...existing, { ...entry, type: "workout" }] });
  };

  const deleteMealFromDay = (dateKey, index) => {
    const existing    = calendarData[dateKey] || [];
    const updated     = existing.filter((_, i) => i !== index);
    const newCalendar = { ...calendarData };
    if (updated.length === 0) { delete newCalendar[dateKey]; } else { newCalendar[dateKey] = updated; }
    setCalendarData(newCalendar);
  };

  const togglePlanMeal = (meal) => {
    const today        = getTodayKey();
    const todayChecked = new Set(loggedMeals[today] || []);
    if (todayChecked.has(meal.id)) {
      todayChecked.delete(meal.id);
      const todayCalendar = (calendarData[today] || []).filter((e) => e.name !== meal.name);
      const newCalendar   = { ...calendarData };
      if (todayCalendar.length === 0) { delete newCalendar[today]; } else { newCalendar[today] = todayCalendar; }
      setCalendarData(newCalendar);
    } else {
      todayChecked.add(meal.id);
      const todayCalendar = calendarData[today] || [];
      if (!todayCalendar.find((e) => e.name === meal.name)) {
        setCalendarData({ ...calendarData, [today]: [...todayCalendar, { name: meal.name, kcal: meal.kcal, cat: meal.cat, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, type: "meal" }] });
      }
    }
    setLoggedMeals({ ...loggedMeals, [today]: todayChecked });
  };

  const saveCustomMeal  = (meal)   => setSavedMeals([...savedMeals, { ...meal, id: `custom-${Date.now()}` }]);
  const deleteSavedMeal = (mealId) => setSavedMeals(savedMeals.filter((m) => m.id !== mealId));

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
  await new Promise((r) => setTimeout(r, 1000));
  
  // First check mock users (demo accounts)
  let foundUser = mockUsers.find((u) => u.email === email && u.password === password);
  
  // If not found in mock users, check registered users from localStorage
  if (!foundUser) {
    const registeredUsers = JSON.parse(localStorage.getItem('fittrack_logins') || '[]');
    foundUser = registeredUsers.find((u) => u.email === email && u.password === password);
  }
  
  if (foundUser) {
    setCurrentUser({ name: foundUser.name, email: foundUser.email });
    setMessage({ text: `Welcome back, ${foundUser.name}!`, type: "success" });
    setTimeout(() => { window.location.href = "/ready-survey"; }, 1000);
  } else {
    setMessage({ text: "Invalid email or password", type: "error" });
  }
};

  const isFormValid = () => email.includes("@") && email.includes(".") && password.length >= 3;

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#080808] text-[#ECECEC] min-h-screen font-['JetBrains_Mono']">
      <BrowserRouter>
        <AppLayout>
          <Routes>

            {/* ── Default — Welcome page (no navbar) ── */}
            <Route path="/"            element={<Welcome />} />
            <Route path="/welcome"     element={<Welcome />} />
            <Route path="/get-started" element={<Welcome />} />

            {/* ── Auth pages (no navbar) ── */}
            <Route path="/login"           element={<Login email={email} setEmail={setEmail} password={password} setPassword={setPassword} rememberMe={rememberMe} setRememberMe={setRememberMe} message={message} setMessage={setMessage} showExtraInfo={showExtraInfo} setShowExtraInfo={setShowExtraInfo} handleLogin={handleLogin} isFormValid={isFormValid} />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />
            <Route path="/ready-survey"    element={<ReadySurvey />} />
           <Route path="/surveys" element={<Survey setCurrentUser={setCurrentUser} />} />
            {/* ── App pages (navbar shown) ── */}

            {/* Mohamad Kaddah */}
            <Route path="/dashboard" element={<HomePage calendarData={calendarData} currentUser={currentUser} />} />
            <Route path="/log"       element={<LogWorkoutPage />} />

            {/* Sara Ibrahim */}
            <Route path="/diet"           element={<DietProgram currentUser={currentUser} calendarData={calendarData} loggedMeals={loggedMeals} togglePlanMeal={togglePlanMeal} deleteMealFromDay={deleteMealFromDay} />} />
            <Route path="/diet-program"   element={<DietProgram currentUser={currentUser} calendarData={calendarData} loggedMeals={loggedMeals} togglePlanMeal={togglePlanMeal} deleteMealFromDay={deleteMealFromDay} />} />
            <Route path="/meal-log"       element={<MealLog currentUser={currentUser} calendarData={calendarData} savedMeals={savedMeals} addMealToCalendar={addMealToCalendar} saveCustomMeal={saveCustomMeal} deleteSavedMeal={deleteSavedMeal} />} />
            <Route path="/ingredient/:id" element={<IngredientDetail />} />
            
            {/* Jawad */}
            <Route path="/exercises"    element={<ExerciseLibrary calendarData={calendarData} addWorkoutToCalendar={addWorkoutToCalendar} currentUser={currentUser} />} />   
            <Route path="/exercise/:id" element={<ExerciseDetailPage />} />

            {/* Mohammad Moghnieh */}
            <Route path="/profile"         element={<UserProfile user={currentUser} />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/terms"           element={<Terms />} />
            <Route path="/privacy"         element={<Privacy />} />
            <Route path="/support"         element={<Support />} />

            {/* ── Other teammates — uncomment when ready ── */}
            {/* <Route path="/exercises"    element={<ListViewPage />} /> */}
            {/* <Route path="/exercise/:id" element={<DetailView1Page />} /> */}

          </Routes>

          {/* Footer — only on app pages */}
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
    <footer className="px-14 py-8 flex items-center justify-between border-t border-[#1E1E1E]">
      <div className="font-['Barlow_Condensed'] font-black text-xl text-[#C6F135] uppercase">FitTrack</div>
      <ul className="flex gap-6 list-none">
        <li><Link to="/privacy" className="text-[8px] tracking-[0.2em] uppercase text-[#555] hover:text-[#C6F135] transition-colors">Privacy</Link></li>
        <li><Link to="/terms"   className="text-[8px] tracking-[0.2em] uppercase text-[#555] hover:text-[#C6F135] transition-colors">Terms</Link></li>
        <li><Link to="/support" className="text-[8px] tracking-[0.2em] uppercase text-[#555] hover:text-[#C6F135] transition-colors">Support</Link></li>
      </ul>
      <div className="text-[8px] tracking-[0.2em] uppercase text-[#555]">2026 FitTrack v3.0.0</div>
    </footer>
  );
}
