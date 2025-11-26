import clsx from "clsx";

export default function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white",
        className
      )}
      aria-label="Loading"
      role="status"
    />
  );
}
