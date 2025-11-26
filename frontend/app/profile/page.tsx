"use client";

import { useState } from "react";
import {
  claimPendingMedals,
  createReferral,
  fetchMe,
  linkSocial,
  unlinkSocial,
  useReferral,
  MeProfile,
} from "../../lib/api";

const socials = [
  { key: "gmail", label: "Gmail" },
  { key: "x", label: "X" },
  { key: "discord", label: "Discord" },
] as const;

type SocialKey = (typeof socials)[number]["key"];

export default function ProfilePage() {
  const [address, setAddress] = useState("");
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [referralCodeInput, setReferralCodeInput] = useState("");

  const loadProfile = async () => {
    if (!address.trim()) {
      setError("Please enter a wallet address.");
      return;
    }
    setLoading(true);
    setError(null);
    setStatusMessage(null);
    try {
      const data = await fetchMe(address.trim());
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const withProfileReload = async (action: () => Promise<unknown>) => {
    if (!address.trim()) {
      setError("Please enter a wallet address first.");
      return;
    }
    setLoading(true);
    setError(null);
    setStatusMessage(null);
    try {
      await action();
      const data = await fetchMe(address.trim());
      setProfile(data);
      setStatusMessage("Updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimMedals = async () => {
    await withProfileReload(() => claimPendingMedals(address.trim()));
  };

  const handleSocialToggle = async (social: SocialKey, isLinked: boolean) => {
    if (isLinked) {
      await withProfileReload(() => unlinkSocial(address.trim(), social));
    } else {
      await withProfileReload(() => linkSocial(address.trim(), social));
    }
  };

  const handleCreateReferral = async () => {
    await withProfileReload(() => createReferral(address.trim()));
  };

  const handleUseReferral = async () => {
    if (!referralCodeInput.trim()) {
      setError("Enter a referral code to use.");
      return;
    }
    setLoading(true);
    setError(null);
    setStatusMessage(null);
    try {
      await useReferral(referralCodeInput.trim(), address.trim());
      setStatusMessage("Referral applied.");
      const data = await fetchMe(address.trim());
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to use referral");
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setStatusMessage("Referral code copied to clipboard.");
    } catch (err) {
      setError("Failed to copy referral code.");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Master Mind Profile</h2>
          <p className="text-slate-300">View your stats and manage your rewards.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <label className="text-sm text-slate-300" htmlFor="address">
            Wallet address
          </label>
          <input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring focus:ring-indigo-500"
          />
          <button
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={loadProfile}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load profile"}
          </button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {statusMessage && <p className="text-sm text-green-400">{statusMessage}</p>}
      </div>

      {profile && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Overview</h3>
                <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase text-white">
                  {profile.activityTier}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatBlock label="Total medals" value={profile.medals} />
                <StatBlock label="On-chain" value={profile.medalsOnChain} />
                <StatBlock label="Pending" value={profile.medalsPending} />
              </div>
              <button
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleClaimMedals}
                disabled={loading || profile.medalsPending === 0}
              >
                Claim pending medals
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 p-4 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold">Games</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatBlock label="Games played" value={profile.gamesPlayed} />
                <StatBlock label="Games won" value={profile.gamesWon} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 p-4 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold">Socials</h3>
              <div className="space-y-3">
                {socials.map((social) => {
                  const isLinked = profile.linkedSocials[social.key];
                  return (
                    <div
                      key={social.key}
                      className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{social.label}</p>
                        <p className="text-sm text-slate-400">{isLinked ? "Linked" : "Not linked"}</p>
                      </div>
                      <button
                        className="rounded-lg bg-slate-800 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => handleSocialToggle(social.key, isLinked)}
                        disabled={loading}
                      >
                        {isLinked ? "Unlink" : "Link"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 p-4 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold">Referral</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-400">Your referral code</p>
                    <p className="font-semibold">
                      {profile.referralCode ?? "No referral code yet"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {profile.referralCode && (
                      <button
                        className="rounded-lg bg-slate-800 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => copyReferralCode(profile.referralCode!)}
                        disabled={loading}
                      >
                        Copy code
                      </button>
                    )}
                    {!profile.referralCode && (
                      <button
                        className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={handleCreateReferral}
                        disabled={loading}
                      >
                        Generate referral code
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-400">Invited {profile.referredCount} players</p>
              </div>

              <div className="space-y-2 rounded-lg border border-slate-800 p-3">
                <p className="text-sm font-semibold">Use a referral code</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value)}
                    placeholder="Enter referral code"
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring focus:ring-indigo-500"
                  />
                  <button
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleUseReferral}
                    disabled={loading}
                  >
                    Use referral
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
