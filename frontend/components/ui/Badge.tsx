import clsx from "clsx";

const variantStyles = {
  default: "bg-white/10 text-white border border-white/20",
  info: "bg-indigo-600/20 text-indigo-100 border border-indigo-400/40",
  success: "bg-emerald-600/20 text-emerald-100 border border-emerald-400/40",
  warning: "bg-amber-500/20 text-amber-100 border border-amber-400/40",
  danger: "bg-rose-600/20 text-rose-100 border border-rose-400/40",
  secondary: "bg-slate-800 text-slate-100 border border-white/10",
  soft: "bg-white/5 text-slate-100 border border-white/10",
} as const;

type BadgeProps = {
  children: React.ReactNode;
  variant?: keyof typeof variantStyles;
  className?: string;
};

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
