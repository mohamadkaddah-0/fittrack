import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// ── Your pages ────────────────────────────────────────────────
import HomePage       from "./pages/HomePage";
import LogWorkoutPage from "./pages/LogWorkoutPage";

// ── Teammates add their imports below ─────────────────────────
// import ListViewPage    from "./pages/ListViewPage";
// import DetailView1Page from "./pages/DetailView1Page";
// import DetailView2Page from "./pages/DetailView2Page";
// import AddEditPage     from "./pages/AddEditPage";
// import DashboardPage   from "./pages/DashboardPage";
// import LoginPage       from "./pages/LoginPage";
// import RegisterPage    from "./pages/RegisterPage";

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>

          {/* ── Mohamad Kaddah ── */}
          <Route path="/"    element={<HomePage />} />
          <Route path="/log" element={<LogWorkoutPage />} />

          {/* ── Teammate 1 — uncomment when ready ── */}
          {/* <Route path="/exercises"    element={<ListViewPage />} /> */}
          {/* <Route path="/exercise/:id" element={<DetailView1Page />} /> */}

          {/* ── Teammate 2 — uncomment when ready ── */}
          {/* <Route path="/workout/:id"  element={<DetailView2Page />} /> */}
          {/* <Route path="/edit/:id"     element={<AddEditPage />} /> */}

          {/* ── Teammate 3 — uncomment when ready ── */}
          {/* <Route path="/profile"   element={<DashboardPage />} /> */}
          {/* <Route path="/login"     element={<LoginPage />} /> */}
          {/* <Route path="/register"  element={<RegisterPage />} /> */}

        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
