"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

export type ToastKind = "success" | "error" | "warning";

type Toast = {
  id: number;
  message: string;
  type: ToastKind;
};

type Listener = (toast: Toast) => void;

let listeners: Listener[] = [];
let toastId = 0;

const variants: Record<ToastKind, string> = {
  success: "border-emerald-500/50 bg-emerald-900/60 text-emerald-50",
  error: "border-rose-500/60 bg-rose-900/60 text-rose-50",
  warning: "border-amber-400/60 bg-amber-900/60 text-amber-50",
};

function subscribe(listener: Listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function pushToast(type: ToastKind, message: string) {
  const toast: Toast = { id: toastId++, type, message };
  listeners.forEach((listener) => listener(toast));
}

export function showSuccess(message: string) {
  pushToast("success", message);
}

export function showError(message: string) {
  pushToast("error", message);
}

export function showWarning(message: string) {
  pushToast("warning", message);
}

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3600);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-4 z-50 flex flex-col gap-3 sm:right-6">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  return (
    <div
      className={clsx(
        "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-black/30 backdrop-blur",
        variants[toast.type]
      )}
    >
      <span className="text-lg" aria-hidden>
        {toast.type === "success" && "✅"}
        {toast.type === "error" && "⚠️"}
        {toast.type === "warning" && "⚡"}
      </span>
      <div className="text-sm leading-relaxed">{toast.message}</div>
    </div>
  );
}
