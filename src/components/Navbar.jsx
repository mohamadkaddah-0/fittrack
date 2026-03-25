// Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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

  const accountRef = useRef(null);

  const checkAuth = () => {
    const currentUser = sessionStorage.getItem("currentUser");
    if (currentUser) {
      try { setUser(JSON.parse(currentUser)); return; } catch (e) {}
    }
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); return; } catch (e) {}
    }
    setUser(null);
  };

  useEffect(() => { checkAuth(); }, [location.pathname]);
  useEffect(() => {
    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-change", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);
  useEffect(() => {
    const close = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => { setMenuOpen(false); setAccountOpen(false); }, [location.pathname]);

  function handleLogout() {
    ["currentUser", "user", "token"].forEach((k) => {
      sessionStorage.removeItem(k);
      localStorage.removeItem(k);
    });
    setUser(null);
    setAccountOpen(false);
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  }

  const displayName = () => user
    ? (user.name || user.username || user.email || "User")
    : "Guest";

  return (
    <>
      {/* ── Ticker ── */}
      <div style={{ background: "#C6F135", color: "#000", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", padding: "8px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-flex", animation: "ticker 22s linear infinite" }}>
          {[...Array(2)].flatMap((_, ai) =>
            ["FitTrack","* * *","Track Your Limits","* * *","Stay Consistent","* * *","v3.0.0","* * *"].map(
              (t, i) => <span key={`${ai}-${i}`} style={{ padding: "0 32px" }}>{t}</span>
            )
          )}
        </div>
      </div>

      {/* ── Navbar wrapper — sticky, full width, no overflow clipping ── */}
      <nav id="fittrack-nav" style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid #1E1E1E",
        background: "rgba(8,8,8,0.92)",
        backdropFilter: "blur(20px)",
        width: "100%",
        display: "block",
      }}>

        {/* ── Top bar — always exactly 60px tall, logo left, controls right ── */}
        <div style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          boxSizing: "border-box",
          width: "100%",
        }}>

          {/* Logo */}
          <button
            onClick={() => navigate("/dashboard")}
            style={{ flexShrink: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#C6F135", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
          >
            FitTrack<sup style={{ fontSize: 10 }}>™</sup>
          </button>

          {/* Desktop nav links — hidden on mobile */}
          <ul className="hidden md:flex" style={{ listStyle: "none", display: "flex", alignItems: "center", gap: 32, margin: 0, padding: 0 }}>
            {NAV_LINKS.map(({ label, to }) => {
              const active = location.pathname === to;
              return (
                <li key={to}>
                  <button
                    onClick={() => navigate(to)}
                    style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer", color: active ? "#ECECEC" : "#555", position: "relative", padding: 0 }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#ECECEC"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#555"; }}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Right side controls */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>

            {/* Live dot — desktop only */}
            <div className="hidden md:flex" style={{ alignItems: "center", gap: 8, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C6F135", display: "inline-block", animation: "pulse 2s infinite" }} />
              Live
            </div>

            {/* Account dropdown */}
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
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", width: 192, border: "1px solid #2A2A2A", background: "#0D0D0D", zIndex: 999 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E1E1E" }}>
                    <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555" }}>Signed in as</div>
                    <div style={{ fontSize: 10, color: "#ECECEC", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName()}</div>
                  </div>
                  {ACCOUNT_MENU.map(({ label, to }) => (
                    <button key={to} onClick={() => { setAccountOpen(false); navigate(to); }}
                      style={{ width: "100%", textAlign: "left", padding: "12px 16px", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#555", background: "none", border: "none", borderBottom: "1px solid #1E1E1E", cursor: "pointer" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#ECECEC"; e.currentTarget.style.background = "#111"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.background = "none"; }}
                    >{label}</button>
                  ))}
                  {user ? (
                    <button onClick={handleLogout}
                      style={{ width: "100%", textAlign: "left", padding: "12px 16px", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#FF2A5E", background: "none", border: "none", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#111"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >Logout</button>
                  ) : (
                    <button onClick={() => { setAccountOpen(false); navigate("/login"); }}
                      style={{ width: "100%", textAlign: "left", padding: "12px 16px", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#C6F135", background: "none", border: "none", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#111"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >Login</button>
                  )}
                </div>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 6, padding: 4, background: "none", border: "none", cursor: "pointer" }}
              className="md:hidden"
            >
              <span style={{ display: "block", width: 24, height: 2, background: "#ECECEC", transition: "all 0.3s", transform: menuOpen ? "rotate(45deg) translateY(8px)" : "none" }} />
              <span style={{ display: "block", width: 24, height: 2, background: "#ECECEC", transition: "all 0.3s", opacity: menuOpen ? 0 : 1 }} />
              <span style={{ display: "block", width: 24, height: 2, background: "#ECECEC", transition: "all 0.3s", transform: menuOpen ? "rotate(-45deg) translateY(-8px)" : "none" }} />
            </button>
          </div>
        </div>

        {/* ── Mobile menu — full-width block, sits directly below the 60px bar ── */}
        {menuOpen && (
          <div
            className="md:hidden"
            style={{ borderTop: "1px solid #1E1E1E", background: "#0D0D0D", width: "100%" }}
          >
            {NAV_LINKS.map(({ label, to }) => {
              const active = location.pathname === to;
              return (
                <button
                  key={to}
                  onClick={() => { navigate(to); setMenuOpen(false); }}
                  style={{ width: "100%", textAlign: "left", padding: "16px 24px", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", borderBottom: "1px solid #1E1E1E", background: "none", border: "none", borderBottom: "1px solid #1E1E1E", cursor: "pointer", color: active ? "#C6F135" : "#555", display: "block", boxSizing: "border-box" }}
                >
                  {label}
                </button>
              );
            })}
            <div style={{ borderTop: "1px solid #2A2A2A" }}>
              <button onClick={() => { navigate("/profile"); setMenuOpen(false); }}
                style={{ width: "100%", textAlign: "left", padding: "16px 24px", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#555", background: "none", border: "none", borderBottom: "1px solid #1E1E1E", cursor: "pointer", display: "block", boxSizing: "border-box" }}
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
        /* Hide hamburger on desktop, show on mobile */
        @media (min-width: 768px) {
          button[aria-label="Toggle menu"] { display: none !important; }
        }
        /* Hide desktop nav on mobile */
        @media (max-width: 767px) {
          nav ul { display: none !important; }
          nav .live-dot { display: none !important; }
        }
      `}</style>
    </>
  );
}
