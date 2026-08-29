import { useEffect, useRef, useState } from "react";

export default function useAutoRefresh(fetchFn, deps = [], options = {}) {
  const {
    initialDelay = 0,
    intervalMs = 1500,
    maxIntervalMs = 8000,
    timeoutMs = 8000,
    stopOnError = false,
    isReady = null,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const intervalRef = useRef(intervalMs);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    setLoading(true);
    setError(null);
    setData(null);
    intervalRef.current = intervalMs;

    const attempt = async () => {
      if (!activeRef.current) return;
      const controller = new AbortController();
      abortRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const result = await fetchFn({ signal: controller.signal });
        clearTimeout(timeout);
        if (!activeRef.current) return;
        setData(result);
        setError(null);

        const ready = typeof isReady === "function" ? !!isReady(result) : true;
        if (ready) {
          setLoading(false);
          return;
        }

        const nextDelay = Math.min(
          Math.round(intervalRef.current * 1.3),
          maxIntervalMs
        );
        intervalRef.current = nextDelay;
        timerRef.current = setTimeout(attempt, nextDelay);
        return;
      } catch (err) {
        clearTimeout(timeout);
        if (!activeRef.current) return;
        setError(err);
        if (stopOnError) {
          setLoading(false);
          return;
        }
        const nextDelay = Math.min(
          Math.round(intervalRef.current * 1.6),
          maxIntervalMs
        );
        intervalRef.current = nextDelay;
        timerRef.current = setTimeout(attempt, nextDelay);
      }
    };

    timerRef.current = setTimeout(attempt, initialDelay);

    return () => {
      activeRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };

  }, deps);

  return { data, loading, error };
}
