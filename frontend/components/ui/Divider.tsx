import clsx from "clsx";

export default function Divider({ className }: { className?: string }) {
  return <div className={clsx("h-px w-full bg-white/10", className)} />;
}
