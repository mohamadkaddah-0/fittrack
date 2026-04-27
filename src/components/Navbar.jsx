import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const THEME_STORAGE_KEY = "fittrack-theme";

const NAV_LINKS = [
  { label: "Home",             to: "/dashboard" },
  { label: "User Progress",    to: "/progress"  },
  { label: "Diet Program",     to: "/diet"      },
  { label: "Log Meal",         to: "/meal-log"  },
  { label: "Exercise Library", to: "/exercises" },
  { label: "Log Workout",      to: "/log"       },
];

const ACCOUNT_MENU = [
  { label: "My Profile",  to: "/profile"   },
  { label: "Dashboard",   to: "/dashboard" },
];

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user,        setUser]        = useState(null);
  const [theme,       setTheme]       = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem(THEME_STORAGE_KEY) || sessionStorage.getItem(THEME_STORAGE_KEY) || "dark";
  });

  const accountRef = useRef(null);

  const checkAuth = () => {
    const token = localStorage.getItem("fittrack_token");
    
    if (!token) {
      setUser(null);
      return;
    }
    
    const storedUser = localStorage.getItem("fittrack_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        return;
      } catch (e) {}
    }
    
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  useEffect(() => {
    const handleStorageChange = () => {
      checkAuth();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    sessionStorage.removeItem(THEME_STORAGE_KEY);
  }, [theme]);

  useEffect(() => {
    const close = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    localStorage.removeItem("fittrack_token");
    localStorage.removeItem("fittrack_user");
    sessionStorage.removeItem("currentUser");
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setAccountOpen(false);
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  }

  const displayName = () => {
    if (!user) return "Guest";
    return user.name || user.username || user.email || user.firstName || "User";
  };

  const isLightTheme = theme === "light";
  const toggleTheme = () => setTheme((current) => current === "dark" ? "light" : "dark");

  return (
    <>
      <div style={{ background: "#C6F135", color: "#000", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", padding: "8px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-flex", animation: "ticker 22s linear infinite" }}>
          {[...Array(2)].flatMap((_, ai) =>
            ["FitTrack","* * *","Track Your Limits","* * *","Stay Consistent","* * *","v3.0.0","* * *"].map(
              (t, i) => <span key={`${ai}-${i}`} style={{ padding: "0 32px" }}>{t}</span>
            )
          )}
        </div>
      </div>

      <nav id="fittrack-nav" style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--line)",
        background: "color-mix(in srgb, var(--bg) 92%, transparent)",
        backdropFilter: "blur(20px)",
        width: "100%",
        display: "block",
      }}>

        <div style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          boxSizing: "border-box",
          width: "100%",
        }}>

          <button
            onClick={() => navigate("/dashboard")}
            style={{ flexShrink: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#C6F135", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
          >
            FitTrack<sup style={{ fontSize: 10 }}>™</sup>
          </button>

          <ul className="hidden md:flex" style={{ listStyle: "none", display: "flex", alignItems: "center", gap: 32, margin: 0, padding: 0 }}>
            {NAV_LINKS.map(({ label, to }) => {
              const active = location.pathname === to;
              return (
                <li key={to}>
                  <button
                    onClick={() => navigate(to)}
                    style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer", color: active ? "var(--text)" : "var(--dim)", position: "relative", padding: 0 }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = "var(--text)"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = "var(--dim)"; }}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>

          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>

            <div className="hidden md:flex" style={{ alignItems: "center", gap: 8, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--dim)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C6F135", display: "inline-block", animation: "pulse 2s infinite" }} />
              Live
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isLightTheme ? "dark" : "light"} mode`}
              title={`Switch to ${isLightTheme ? "dark" : "light"} mode`}
              style={{
                width: 62,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid var(--line2)",
                borderRadius: 999,
                background: isLightTheme ? "#F7FAF0" : "#101010",
                color: "transparent",
                cursor: "pointer",
                fontSize: 0,
                fontWeight: 900,
                letterSpacing: "0.12em",
                lineHeight: 1,
                padding: "0 8px",
                position: "relative",
                boxShadow: isLightTheme ? "inset 0 0 0 1px rgba(198,241,53,0.25)" : "inset 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              {isLightTheme ? "☾" : "☀"}
              <span style={{ opacity: isLightTheme ? 1 : 0.45, color: isLightTheme ? "#111" : "#ECECEC", fontSize: 9 }}>LT</span>
              <span style={{ opacity: isLightTheme ? 0.45 : 1, color: isLightTheme ? "#111" : "#ECECEC", fontSize: 9 }}>DK</span>
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 3,
                  left: isLightTheme ? 3 : 31,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: isLightTheme ? "#C6F135" : "#FFAA00",
                  transition: "left 0.22s ease, background 0.22s ease",
                  boxShadow: "0 6px 14px rgba(0,0,0,0.28)",
                }}
              />
            </button>

            <div style={{ position: "relative" }} ref={accountRef}>
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                style={{ background: "#C6F135", color: "#000", fontWeight: 700, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", padding: "8px 14px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#FF2A5E"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#C6F135"; e.currentTarget.style.color = "#000"; }}
              >
                Account <span style={{ fontSize: 8, display: "inline-block", transform: accountOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
              </button>

              {accountOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", width: 192, border: "1px solid var(--line2)", background: "var(--bg2)", zIndex: 999 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--dim)" }}>Signed in as</div>
                    <div style={{ fontSize: 10, color: "var(--text)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName()}</div>
                  </div>
                  {user ? (
                    <>
                      {ACCOUNT_MENU.map(({ label, to }) => (
                        <button key={to} onClick={() => { setAccountOpen(false); navigate(to); }}
                          style={{ width: "100%", textAlign: "left", padding: "12px 16px", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--dim)", background: "none", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--bg3)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "var(--dim)"; e.currentTarget.style.background = "none"; }}
                        >{label}</button>
                      ))}
                      <button onClick={handleLogout}
                        style={{ width: "100%", textAlign: "left", padding: "12px 16px", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#FF2A5E", background: "none", border: "none", cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >Logout</button>
                    </>
                  ) : (
                    <button onClick={() => { setAccountOpen(false); navigate("/login"); }}
                      style={{ width: "100%", textAlign: "left", padding: "12px 16px", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C6F135", background: "none", border: "none", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >Login</button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 6, padding: 4, background: "none", border: "none", cursor: "pointer" }}
              className="md:hidden"
            >
              <span style={{ display: "block", width: 24, height: 2, background: "var(--text)", transition: "all 0.3s", transform: menuOpen ? "rotate(45deg) translateY(8px)" : "none" }} />
              <span style={{ display: "block", width: 24, height: 2, background: "var(--text)", transition: "all 0.3s", opacity: menuOpen ? 0 : 1 }} />
              <span style={{ display: "block", width: 24, height: 2, background: "var(--text)", transition: "all 0.3s", transform: menuOpen ? "rotate(-45deg) translateY(-8px)" : "none" }} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            className="md:hidden"
            style={{ borderTop: "1px solid var(--line)", background: "var(--bg2)", width: "100%" }}
          >
            {NAV_LINKS.map(({ label, to }) => {
              const active = location.pathname === to;
              return (
                <button
                  key={to}
                  onClick={() => { navigate(to); setMenuOpen(false); }}
                  style={{ width: "100%", textAlign: "left", padding: "16px 24px", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", background: "none", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", color: active ? "#C6F135" : "var(--dim)", display: "block", boxSizing: "border-box" }}
                >
                  {label}
                </button>
              );
            })}
            <div style={{ borderTop: "1px solid var(--line2)" }}>
              <button onClick={() => { navigate("/profile"); setMenuOpen(false); }}
                style={{ width: "100%", textAlign: "left", padding: "16px 24px", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--dim)", background: "none", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", display: "block", boxSizing: "border-box" }}
              >My Profile</button>
              {user ? (
                <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                  style={{ width: "100%", textAlign: "left", padding: "16px 24px", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#FF2A5E", background: "none", border: "none", cursor: "pointer", display: "block", boxSizing: "border-box" }}
                >Logout</button>
              ) : (
                <button onClick={() => { navigate("/login"); setMenuOpen(false); }}
                  style={{ width: "100%", textAlign: "left", padding: "16px 24px", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C6F135", background: "none", border: "none", cursor: "pointer", display: "block", boxSizing: "border-box" }}
                >Login</button>
              )}
            </div>
          </div>
        )}
      </nav>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (min-width: 768px) {
          button[aria-label="Toggle menu"] { display: none !important; }
        }
        @media (max-width: 767px) {
          nav ul { display: none !important; }
          nav .live-dot { display: none !important; }
        }
      `}</style>
    </>
  );
}
