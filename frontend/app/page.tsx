import Card from "../components/ui/Card";
import SectionTitle from "../components/ui/SectionTitle";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <SectionTitle
        title="Welcome to Monad Master Mind"
        description="Play, track, and compete in Rock–Paper–Scissors battles on Monad."
      />

      <Card className="space-y-3 p-4 sm:p-6">
        <p className="text-slate-200">
          Use the navigation above to browse the lobby, monitor your games, and climb the leaderboard. Everything is
          ready with consistent UI components for a smooth first demo.
        </p>
      </Card>
    </section>
  );
}
