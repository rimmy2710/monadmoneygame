interface RoundResultProps {
  result: "win" | "lose" | "draw";
  opponent?: string | null;
}

const labels: Record<"win" | "lose" | "draw", string> = {
  win: "You win",
  lose: "You lose",
  draw: "Draw",
};

export default function RoundResult({ result, opponent }: RoundResultProps) {
  const color =
    result === "win"
      ? "border-emerald-500 bg-emerald-900/50 text-emerald-100"
      : result === "lose"
        ? "border-rose-500 bg-rose-900/50 text-rose-100"
        : "border-amber-500 bg-amber-900/40 text-amber-100";

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border px-4 py-3 text-center text-lg font-semibold shadow-sm transition animate-pop ${color}`}
    >
      <div className="text-2xl">{result === "win" ? "🏅" : result === "lose" ? "💀" : "⚔️"}</div>
      <div>{labels[result]}</div>
      {opponent && <div className="text-sm text-slate-200">vs {shortAddress(opponent)}</div>}
    </div>
  );
}

function shortAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
