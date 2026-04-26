import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('fittrack-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('fittrack-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('fittrack-theme', 'light');
    }
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