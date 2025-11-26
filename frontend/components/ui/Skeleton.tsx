import clsx from "clsx";

type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-md bg-white/10",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:animate-shimmer",
        className
      )}
    />
  );
}
