import { ReactNode } from "react";
import clsx from "clsx";

type SectionTitleProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function SectionTitle({ title, description, action, className }: SectionTitleProps) {
  return (
    <div className={clsx("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="space-y-1">
        <h2 className="text-3xl font-semibold leading-tight text-white">{title}</h2>
        {description && <p className="text-sm text-slate-300 sm:text-base">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-3">{action}</div>}
    </div>
  );
}
