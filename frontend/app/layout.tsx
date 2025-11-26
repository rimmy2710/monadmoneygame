import "../styles/globals.css";
import { ReactNode } from "react";
import Providers from "../components/providers";

export const metadata = {
  title: "Monad Master Mind",
  description: "Play and track games on Monad",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        <Providers>
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            <header className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Monad Master Mind</h1>
              <div className="flex items-center gap-4">
                <nav className="flex gap-4 text-sm text-slate-300">
                  <a href="/">Lobby</a>
                  <a href="/my-games">My Games</a>
                  <a href="/leaderboard">Leaderboard</a>
                  <a href="/profile">Profile</a>
                </nav>
                <div>
                  <Providers.ConnectButton />
                </div>
              </div>
            </header>
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
