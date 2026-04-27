import Navbar from "../components/Navbar.jsx";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-['JetBrains_Mono']">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}