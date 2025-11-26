import { ReactNode } from "react";
import Card from "./Card";
import Button from "./Button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  action?: ReactNode;
};

export default function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  action,
}: ErrorStateProps) {
  return (
    <Card className="flex flex-col items-center gap-3 border border-rose-500/40 bg-rose-900/40 p-6 text-center text-rose-50">
      <div className="text-3xl">⚠️</div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-rose-100">{message}</p>
      </div>
      {action}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-1">
          Retry
        </Button>
      )}
    </Card>
  );
}
