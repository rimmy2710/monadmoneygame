import { HTMLAttributes } from "react";
import clsx from "clsx";

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-white/10 bg-white/5 backdrop-blur shadow-sm",
        className
      )}
      {...props}
    />
  );
}
