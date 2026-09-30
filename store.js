import { useState, useEffect, useCallback } from "react";

// Small shared store on localStorage. Tabs stay in sync through the "storage" event,
// and update() always applies your change to the freshest saved value.
export function useShared(key, init) {
  const read = () => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : init; } catch { return init; } };
  const [v, set] = useState(read);
  useEffect(() => {
    const f = e => { if (e.key === key) set(read()); };
    window.addEventListener("storage", f);
    return () => window.removeEventListener("storage", f);
  }, [key]);
  const update = useCallback(fn => { const n = fn(read()); try { localStorage.setItem(key, JSON.stringify(n)); } catch {} set(n); }, [key]);
  return [v, update];
}
