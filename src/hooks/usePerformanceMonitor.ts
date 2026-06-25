import { useRef, useCallback } from "preact/hooks";

export function usePerformanceMonitor() {
  const timersRef = useRef<Map<string, number> | null>(null);
  if (timersRef.current === null) timersRef.current = new Map();

  const startTimer = useCallback((name: string) => {
    timersRef.current!.set(name, performance.now());
  }, []);

  const endTimer = useCallback((name: string) => {
    const start = timersRef.current!.get(name);
    if (start === undefined) return null;
    const duration = performance.now() - start;
    timersRef.current!.delete(name);

    if (import.meta.env.DEV) {
      console.log(`[perf] ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }, []);

  return { startTimer, endTimer };
}
