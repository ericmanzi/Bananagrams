import { useEffect, useRef } from 'react';

/** Calls `onTick` once a second while `running`. iOS pauses it in the background. */
export function useTicker(running: boolean, onTick: () => void) {
  const tick = useRef(onTick);
  tick.current = onTick;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => tick.current(), 1000);
    return () => clearInterval(id);
  }, [running]);
}

export function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
