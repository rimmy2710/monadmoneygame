interface CountdownProps {
  total: number;
  remaining: number;
  label: string;
}

export default function Countdown({ total, remaining, label }: CountdownProps) {
  const progress = Math.max(0, Math.min(1, remaining / total));
  const strokeDasharray = 283; // circumference of circle r=45
  const strokeDashoffset = strokeDasharray * (1 - progress);
  const isWarning = remaining <= 5;
  const isDanger = remaining <= 3;
  const color = isDanger ? "stroke-red-400" : isWarning ? "stroke-yellow-300" : "stroke-emerald-400";

  return (
    <div className="flex flex-col items-center gap-2 text-center text-sm text-slate-300">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            className="stroke-slate-800"
            cx="50"
            cy="50"
            r="45"
            strokeWidth="10"
            fill="none"
          />
          <circle
            className={`${color} transition-all duration-300 ease-linear`}
            cx="50"
            cy="50"
            r="45"
            strokeWidth="10"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white">{Math.max(0, Math.ceil(remaining))}s</span>
          <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
        </div>
      </div>
    </div>
  );
}
