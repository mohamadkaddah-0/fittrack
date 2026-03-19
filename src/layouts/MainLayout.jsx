import Navbar from "../components/Navbar.jsx";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#080808] text-[#ECECEC] font-['JetBrains_Mono']">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}