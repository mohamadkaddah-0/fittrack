import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { label: "Home",             to: "/"          },
  { label: "User Progress",    to: "/progress"  },
  { label: "Diet Program",     to: "/diet"      },
  { label: "Log Meal",         to: "/meal-log"  }, 
  { label: "Exercise Library", to: "/exercises" },
  { label: "Log Workout",      to: "/log"       },
  { label: "Settings",         to: "/settings"  },
];

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Ticker bar */}
      <div className="bg-[#C6F135] text-black text-[10px] font-bold tracking-[0.2em] uppercase py-2 overflow-hidden whitespace-nowrap">
        <div className="inline-flex animate-[ticker_22s_linear_infinite]">
          {[...Array(2)].flatMap((_, ai) =>
            ["FitTrack", "* * *", "Track Your Limits", "* * *", "Stay Consistent", "* * *", "v3.0.0", "* * *"].map(
              (t, i) => <span key={`${ai}-${i}`} className="px-8">{t}</span>
            )
          )}
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[#1E1E1E] bg-[rgba(8,8,8,0.92)] backdrop-blur-xl">
        <div className="h-[60px] flex items-center justify-between px-6">

          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="font-['Barlow_Condensed'] text-2xl font-black tracking-wider uppercase text-[#C6F135] bg-transparent border-none cursor-pointer"
          >
            FitTrack
          </button>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-8 list-none">
            {NAV_LINKS.map(({ label, to }) => {
              const isActive = location.pathname === to;
              return (
                <li key={to}>
                  <button
                    onClick={() => navigate(to)}
                    className={`text-[10px] tracking-[0.18em] uppercase transition-colors relative group bg-transparent border-none cursor-pointer ${
                      isActive ? "text-[#ECECEC]" : "text-[#555] hover:text-[#ECECEC]"
                    }`}
                  >
                    {label}
                    <span className={`absolute -bottom-1 left-0 right-0 h-px bg-[#C6F135] transition-transform origin-left ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`} />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-4">

            {/* Live dot */}
            <div className="hidden md:flex items-center gap-2 text-[9px] tracking-[0.15em] uppercase text-[#555]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6F135] animate-pulse" />
              Live
            </div>

            {/* Account button */}
            <button
              onClick={() => navigate("/profile")}
              className="bg-[#C6F135] text-black font-bold text-[10px] tracking-[0.18em] uppercase px-4 py-2 hover:bg-[#FF2A5E] hover:text-white transition-colors cursor-pointer"
            >
              Account
            </button>

            {/* Burger — mobile only */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex flex-col gap-1.5 p-1 cursor-pointer bg-transparent border-none"
              aria-label="Toggle menu"
            >
              <span className={`block w-6 h-0.5 bg-[#ECECEC] transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-6 h-0.5 bg-[#ECECEC] transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-6 h-0.5 bg-[#ECECEC] transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#1E1E1E] bg-[#0D0D0D]">
            {NAV_LINKS.map(({ label, to }) => (
              <button
                key={to}
                onClick={() => { navigate(to); setMenuOpen(false); }}
                className="w-full text-left px-6 py-4 text-[10px] tracking-[0.18em] uppercase text-[#555] hover:text-[#ECECEC] hover:bg-[#111] border-b border-[#1E1E1E] last:border-b-0 transition-colors cursor-pointer bg-transparent"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </nav>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
}
