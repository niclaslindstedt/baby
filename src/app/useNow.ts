// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useState } from "react";

/**
 * The clock, read at the edge. The derivations are clock-free — `now` is a
 * parameter to every one of them — and this is where a screen gets the value
 * it passes: the current moment, re-read once a minute while the screen is
 * up (a rolling window and an "awake for 1 h 20 min" move with it), and again
 * whenever `reset` changes, so an edit is read against the moment it was
 * made rather than the last tick.
 */
export function useNow(reset?: unknown): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => setNow(new Date()), [reset]);
  return now;
}
