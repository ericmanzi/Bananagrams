import { useCallback, useRef, useState } from 'react';

/**
 * State plus a ref that always holds the newest value. Updates go through
 * `update(fn)`, so a tap and a server message landing in the same frame both
 * build on the latest value instead of one overwriting the other.
 */
export function useLatest<T>(initial: T | (() => T)) {
  const [state, setState] = useState(initial);
  const ref = useRef(state);
  const update = useCallback((next: T | ((prev: T) => T)) => {
    ref.current = typeof next === 'function' ? (next as (prev: T) => T)(ref.current) : next;
    setState(ref.current);
  }, []);
  return [state, update, ref] as const;
}
