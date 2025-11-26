import SkeletonCard from "./SkeletonCard";

type SkeletonListProps = {
  count?: number;
};

export default function SkeletonList({ count = 4 }: SkeletonListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} lines={3} />
      ))}
    </div>
  );
}
