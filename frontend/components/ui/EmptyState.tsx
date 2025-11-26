import { ReactNode } from "react";
import Card from "./Card";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center gap-3 p-6 text-center">
      <div className="text-3xl">🪄</div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </Card>
  );
}
