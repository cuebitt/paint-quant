import { useRef, useCallback } from "preact/hooks";

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

const metricsHistory: PerformanceMetric[] = [];
const MAX_METRICS = 100;

export function usePerformanceMonitor() {
  const timersRef = useRef<Map<string, number> | null>(null);
  if (timersRef.current === null) {
    timersRef.current = new Map();
  }

  const startTimer = useCallback((name: string) => {
    timersRef.current!.set(name, performance.now());
  }, []);

  const endTimer = useCallback((name: string): number | null => {
    const start = timersRef.current!.get(name);
    if (start === undefined) return null;
    const duration = performance.now() - start;
    timersRef.current!.delete(name);

    metricsHistory.push({ name, duration, timestamp: Date.now() });
    if (metricsHistory.length > MAX_METRICS) {
      metricsHistory.shift();
    }

    if (import.meta.env.DEV) {
      console.log(`[perf] ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }, []);

  return { startTimer, endTimer };
}
