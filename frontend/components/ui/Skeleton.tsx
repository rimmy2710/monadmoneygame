import clsx from "clsx";

type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className }: SkeletonProps) {
  return <div className={clsx("animate-pulse rounded-md bg-white/10", className)} />;
}
