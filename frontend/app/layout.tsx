import "../styles/globals.css";
import { ReactNode } from "react";
import Providers from "../components/providers";
import Toaster from "../components/ui/Toaster";

export const metadata = {
  title: "Monad Master Mind",
  description: "Play and track games on Monad",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        <Providers>
          <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-3xl font-bold leading-tight">Monad Master Mind</h1>
              <div className="flex flex-wrap items-center gap-4">
                <nav className="flex flex-wrap gap-4 text-sm text-slate-300">
                  <a href="/">Lobby</a>
                  <a href="/my-games">My Games</a>
                  <a href="/leaderboard">Leaderboard</a>
                  <a href="/profile">Profile</a>
                </nav>
                <Providers.ConnectButton />
              </div>
            </header>
            <main className="space-y-8">{children}</main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
