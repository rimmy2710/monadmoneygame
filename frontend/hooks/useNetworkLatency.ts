import { useCallback, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export type LatencyStatus = "green" | "yellow" | "red" | "unknown";

export default function useNetworkLatency(pollIntervalMs = 10000) {
  const [latency, setLatency] = useState<number | null>(null);
  const [status, setStatus] = useState<LatencyStatus>("unknown");
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkLatency = useCallback(async () => {
    const started = performance.now();
    setChecking(true);
    try {
      await fetch(`${API_BASE}/health`, { method: "GET", cache: "no-store" });
      const delta = Math.round(performance.now() - started);
      setLatency(delta);
      setStatus(delta < 150 ? "green" : delta <= 350 ? "yellow" : "red");
      setLastChecked(new Date());
    } catch (err) {
      console.error("Latency check failed", err);
      setLatency(null);
      setStatus("unknown");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkLatency();
    const id = setInterval(() => {
      void checkLatency();
    }, pollIntervalMs);

    return () => clearInterval(id);
  }, [checkLatency, pollIntervalMs]);

  return { latency, status, checking, lastChecked, refresh: checkLatency };
}
