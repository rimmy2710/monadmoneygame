import { useCallback, useEffect, useRef } from "react";

type AutoRefreshCallback = (options?: { silent?: boolean; background?: boolean }) => void | Promise<void>;

export default function useAutoRefresh(
  callback: AutoRefreshCallback,
  intervalMs: number,
  enabled: boolean
) {
  const savedCallback = useRef<AutoRefreshCallback>(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const tick = useCallback(() => {
    void savedCallback.current({ silent: true, background: true });
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => {
      tick();
    }, intervalMs);

    return () => clearInterval(id);
  }, [enabled, intervalMs, tick]);
}
