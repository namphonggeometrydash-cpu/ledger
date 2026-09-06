import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "ledger.preferences";

export const THEMES = [
  { id: "paper", label: "Paper", swatch: ["#eef0ec", "#1f2a24", "#c68a3d"] },
  { id: "dark", label: "Dark Mode", swatch: ["#15181a", "#edf0ec", "#e0a352"] },
  { id: "cream", label: "Cream", swatch: ["#f7f1e3", "#3b2f22", "#b5762c"] },
  { id: "forest", label: "Forest", swatch: ["#eef2ea", "#1d2b1a", "#3f7a4a"] },
  { id: "tomorrow-night", label: "Tomorrow Night", swatch: ["#1d1f21", "#c5c8c6", "#de935f"] },
  { id: "cyberpunk", label: "Cyberpunk", swatch: ["#0b0716", "#f2e9ff", "#ff2e88"] },
];

const DEFAULTS = {
  theme: "paper",
  density: "comfortable", // "comfortable" | "compact"
  reduceMotion: false,
  soundOnComplete: true,
  browserNotifications: false,
  defaultFocusLength: 25,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    const root = document.documentElement;
    root.setAttribute("data-theme", prefs.theme);
    root.setAttribute("data-density", prefs.density);
    root.setAttribute("data-reduce-motion", String(prefs.reduceMotion));
  }, [prefs]);

  function setPref(key, value) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  // A short, synthesized two-tone chime — no external audio file needed.
  function playTestSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      [523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + i * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.14 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.14);
        osc.stop(now + i * 0.14 + 0.4);
      });
    } catch {
      // Audio isn't available in this environment — fail silently.
    }
  }

  async function requestBrowserNotifications() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  return (
    <PreferencesContext.Provider
      value={{ prefs, setPref, playTestSound, requestBrowserNotifications }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
