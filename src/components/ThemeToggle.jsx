import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  // Theme persists during the browser session (sessionStorage).
  // When the user closes the browser / tab the preference resets to dark (default).
  const [isDark, setIsDark] = useState(() => {
    const saved = sessionStorage.getItem('fittrack-theme');
    if (saved) return saved === 'dark';
    // No session preference yet → default dark
    return true;
  });

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    // Write to sessionStorage only — clears when browser/tab closes
    sessionStorage.setItem('fittrack-theme', theme);
    // Remove any stale localStorage entry so it doesn't interfere
    localStorage.removeItem('fittrack-theme');
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      aria-label="Toggle theme"
      style={{
        background: 'var(--bg3)',
        border: '1px solid var(--line)',
        borderRadius: '40px',
        width: '48px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 6px',
        cursor: 'pointer',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '11px' }}>☀️</span>
      <span style={{ fontSize: '11px' }}>🌙</span>
      <div
        style={{
          position: 'absolute',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'var(--lime)',
          left: isDark ? '24px' : '4px',
          transition: 'left 0.2s ease',
        }}
      />
    </button>
  );
}
