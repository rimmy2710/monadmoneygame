import { useEffect, useState } from "react";
import clsx from "clsx";

interface RefreshIconProps {
  spinning: boolean;
}

export default function RefreshIcon({ spinning }: RefreshIconProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!spinning) {
      setPulse(true);
      const timeout = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [spinning]);

  return (
    <span
      className={clsx(
        "inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/30 p-1 text-[10px]", 
        spinning && "animate-spin", 
        pulse && !spinning && "animate-pulse"
      )}
      aria-hidden
    >
      ↻
    </span>
  );
}
