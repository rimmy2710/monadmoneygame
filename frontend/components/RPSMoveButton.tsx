import { ReactNode } from "react";

type Move = "rock" | "paper" | "scissors";

interface Props {
  move: Move;
  icon: ReactNode;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: (move: Move) => void;
}

export default function RPSMoveButton({ move, icon, label, selected, disabled, onSelect }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(move)}
      className={[
        "flex flex-col items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition",
        selected ? "border-emerald-400 bg-emerald-900/40 text-white" : "border-slate-800 bg-slate-900 text-slate-100",
        "hover:border-emerald-400 hover:bg-emerald-900/30",
        disabled ? "cursor-not-allowed opacity-50 hover:border-slate-800 hover:bg-slate-900" : "",
      ].join(" ")}
    >
      <span className="text-2xl">{icon}</span>
      <span className="uppercase tracking-wide">{label}</span>
    </button>
  );
}
