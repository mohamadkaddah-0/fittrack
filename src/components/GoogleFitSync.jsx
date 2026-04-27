import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

/**
 * GoogleFitSync
 *
 * Props:
 *   onStepsUpdated(steps: number) — called whenever a fresh step count arrives
 *
 * Behaviour:
 *   • On mount: checks if the user already has Google Fit connected.
 *   • If connected: silently syncs today's steps immediately, then offers a
 *     manual "Sync Now" button.
 *   • If not connected: shows a "Connect Google Fit" button that starts the
 *     OAuth flow in the same tab (Google redirects back to /dashboard).
 *   • On return from OAuth (?googlefit=connected): syncs automatically.
 */
export default function GoogleFitSync({ onStepsUpdated }) {
  const [connected,  setConnected]  = useState(null); // null = loading
  const [syncing,    setSyncing]    = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [error,      setError]      = useState(null);

  // ── Sync steps from Google Fit ─────────────────────────────────────────────
  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await api.syncGoogleFitSteps();
      if (res.connected && typeof res.steps === "number") {
        onStepsUpdated(res.steps);
        setLastSynced(new Date());
        setConnected(true);
      }
    } catch (err) {
      setError("Sync failed — try again");
    } finally {
      setSyncing(false);
    }
  }, [onStepsUpdated]);

  // ── On mount: check status, auto-sync if connected ─────────────────────────
  useEffect(() => {
    // Don't attempt if user is not logged in
    if (!api.hasActivityIdentity()) {
      setConnected(false);
      return;
    }

    // Handle redirect back from Google OAuth
    const params = new URLSearchParams(window.location.search);
    const googlefit = params.get("googlefit");
    if (googlefit === "connected" || googlefit === "error") {
      // Clean the URL
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
      if (googlefit === "connected") {
        setConnected(true);
        sync();
        return;
      }
      if (googlefit === "error") {
        setError("Google Fit connection failed — please try again");
        setConnected(false);
        return;
      }
    }

    // Normal load — check status then sync if connected
    api.getGoogleFitStatus()
      .then((res) => {
        setConnected(res.connected);
        if (res.connected) sync();
      })
      .catch(() => setConnected(false));
  }, [sync]);

  // ── Start OAuth flow ───────────────────────────────────────────────────────
  async function handleConnect() {
    setError(null);
    try {
      const res = await api.getGoogleFitAuthUrl();
      // Redirect the whole page — Google will redirect back to /dashboard
      window.location.href = res.url;
    } catch {
      setError("Could not start Google Fit connection — are you logged in?");
    }
  }

  async function handleDisconnect() {
    setError(null);
    try {
      await api.disconnectGoogleFit();
      setConnected(false);
      setLastSynced(null);
    } catch {
      setError("Disconnect failed");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const dim  = "#555";
  const cyan = "#00E5FF";
  const lime = "#C6F135";
  const red  = "#FF2A5E";

  // Loading state
  if (connected === null) {
    return (
      <span style={{ fontSize: "9px", color: dim, letterSpacing: "0.15em", textTransform: "uppercase" }}>
        Checking Google Fit…
      </span>
    );
  }

  // Not logged in — silent, no button
  if (!api.hasActivityIdentity()) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>

      {connected ? (
        <>
          {/* Sync Now button */}
          <button
            onClick={sync}
            disabled={syncing}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "transparent",
              border: `1px solid ${syncing ? dim : cyan}`,
              borderRadius: "4px",
              padding: "4px 10px",
              fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: syncing ? dim : cyan,
              cursor: syncing ? "default" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {/* Google Fit "G" icon */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {syncing ? "Syncing…" : "Sync Now"}
          </button>

          {/* Last synced timestamp */}
          {lastSynced && !syncing && (
            <span style={{ fontSize: "8px", color: dim, letterSpacing: "0.12em" }}>
              Last synced {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}

          {/* Disconnect link */}
          <button
            onClick={handleDisconnect}
            style={{
              background: "none", border: "none", padding: 0,
              fontSize: "8px", color: dim, letterSpacing: "0.12em",
              textTransform: "uppercase", cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Disconnect
          </button>
        </>
      ) : (
        /* Connect button */
        <button
          onClick={handleConnect}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "rgba(0,229,255,0.08)",
            border: `1px solid ${cyan}`,
            borderRadius: "4px",
            padding: "4px 12px",
            fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em",
            textTransform: "uppercase", color: cyan,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,229,255,0.15)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,229,255,0.08)"; }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Connect Google Fit
        </button>
      )}

      {/* Error message */}
      {error && (
        <span style={{ fontSize: "8px", color: red, letterSpacing: "0.1em" }}>{error}</span>
      )}
    </div>
  );
}
