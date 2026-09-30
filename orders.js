import { useState, useEffect, useCallback } from "react";

// Shared order queue. Kept in localStorage so a shopper tab and an admin tab
// on the same browser see the same queue (synced through the "storage" event).
const KEY = "mm:orders";
export const STAGES = ["Pending", "Confirmed", "Packaging", "Out for delivery", "Delivered"];
export const isDone = o => o.status === "Delivered" || o.status === "Canceled";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
const write = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {} };
export const newId = () => "ORD-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();

export function useOrders() {
  const [orders, set] = useState(read);
  useEffect(() => {
    const f = e => { if (e.key === KEY) set(read()); };
    window.addEventListener("storage", f);
    return () => window.removeEventListener("storage", f);
  }, []);
  // update() always applies fn to the freshest saved list, so two writers do not overwrite stale data
  const update = useCallback(fn => { const next = fn(read()); write(next); set(next); }, []);
  return [orders, update];
}

// Move one order forward a stage, only if it is still in the state the caller saw
export const step = (o, from) => {
  if (o.status !== from || isDone(o)) return o;
  const ns = STAGES[STAGES.indexOf(o.status) + 1];
  return { ...o, status: ns, log: [...(o.log || []), [ns, Date.now()]] };
};
// Queue worker: take the oldest open orders first, at most n at a time
export const runWorkers = (list, n) => { let left = n; return list.map(o => (left > 0 && !isDone(o) ? (left--, step(o, o.status)) : o)); };
