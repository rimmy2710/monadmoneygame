import Badge from "./Badge";
import Spinner from "./Spinner";
import useNetworkLatency from "../../hooks/useNetworkLatency";

const statusCopy: Record<string, string> = {
  green: "Fast",
  yellow: "Moderate",
  red: "Slow",
  unknown: "Checking...",
};

const colorMap: Record<string, "success" | "warning" | "danger" | "info"> = {
  green: "success",
  yellow: "warning",
  red: "danger",
  unknown: "info",
};

export default function NetworkStatus({ pollMs = 10000 }: { pollMs?: number }) {
  const { latency, status, checking } = useNetworkLatency(pollMs);
  const label = statusCopy[status] ?? "Checking";
  const variant = colorMap[status] ?? "info";

  return (
    <div className="flex items-center gap-2 text-sm text-slate-200">
      <Badge variant={variant} className="flex items-center gap-2">
        {checking ? <Spinner /> : <span className="h-2 w-2 rounded-full bg-current" />}
        <span>{label}</span>
        {latency !== null && <span className="text-xs text-slate-100">{latency}ms</span>}
      </Badge>
    </div>
  );
}
