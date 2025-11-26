import Card from "./Card";
import Skeleton from "./Skeleton";

type SkeletonCardProps = {
  lines?: number;
};

export default function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  return (
    <Card className="space-y-3 p-4 sm:p-6">
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton key={idx} className="h-4 w-full" />
      ))}
    </Card>
  );
}
