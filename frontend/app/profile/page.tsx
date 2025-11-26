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
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import Divider from "../../components/ui/Divider";
import SectionTitle from "../../components/ui/SectionTitle";
import SkeletonCard from "../../components/ui/SkeletonCard";
import Spinner from "../../components/ui/Spinner";
import { showError, showSuccess, showWarning } from "../../components/ui/Toaster";

const socials = [
  { key: "gmail", label: "Gmail" },
  { key: "x", label: "X" },
  { key: "discord", label: "Discord" },
] as const;

type SocialKey = (typeof socials)[number]["key"];

export default function ProfilePage() {
  const [address, setAddress] = useState("");
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralCodeInput, setReferralCodeInput] = useState("");

  const loadProfile = async () => {
    if (!address.trim()) {
      const message = "Please enter a wallet address.";
      setError(message);
      showWarning(message);
      return;
    }
    setProfileLoading(true);
    setError(null);
    try {
      const data = await fetchMe(address.trim());
      setProfile(data);
      showSuccess("Profile loaded");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load profile";
      setError(message);
      showError(message);
    } finally {
      setProfileLoading(false);
    }
  };

  const withProfileReload = async (action: () => Promise<unknown>) => {
    if (!address.trim()) {
      const message = "Please enter a wallet address first.";
      setError(message);
      showWarning(message);
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await action();
      const data = await fetchMe(address.trim());
      setProfile(data);
      showSuccess("Profile updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      showError(message);
    } finally {
      setActionLoading(false);
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
      const message = "Enter a referral code to use.";
      setError(message);
      showWarning(message);
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await useReferral(referralCodeInput.trim(), address.trim());
      showSuccess("Referral applied");
      const data = await fetchMe(address.trim());
      setProfile(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to use referral";
      setError(message);
      showError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const copyReferralCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showSuccess("Referral code copied to clipboard");
    } catch (err) {
      const message = "Failed to copy referral code.";
      setError(message);
      showError(message);
    }
  };

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Master Mind Profile"
        description="View your stats and manage rewards and referrals."
      />

      <Card className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <label className="text-sm text-slate-300" htmlFor="address">
            Wallet address
          </label>
          <input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="flex-1 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
          />
          <Button onClick={loadProfile} disabled={profileLoading} className="min-w-[130px]">
            {profileLoading && <Spinner />} Load profile
          </Button>
        </div>
      </Card>

      {profileLoading && !profile && (
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={5} />
          <SkeletonCard lines={4} />
        </div>
      )}

      {error && !profile && <ErrorState message={error} onRetry={loadProfile} />}
      {error && profile && <ErrorState message={error} onRetry={loadProfile} />}

      {!profile && !profileLoading && !error && (
        <EmptyState
          title="No profile loaded"
          description="Enter your wallet address above to see your Master Mind progress."
          action={
            <Button onClick={loadProfile} variant="secondary">
              Load profile
            </Button>
          }
        />
      )}

      {profile && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="space-y-5 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">Overview</h3>
                  <p className="text-sm text-slate-400">Your current medal status</p>
                </div>
                <Badge variant="info">{profile.activityTier}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatBlock label="Total medals" value={profile.medals} />
                <StatBlock label="On-chain" value={profile.medalsOnChain} />
                <StatBlock label="Pending" value={profile.medalsPending} />
              </div>
              <Button
                variant="secondary"
                onClick={handleClaimMedals}
                disabled={actionLoading || profile.medalsPending === 0}
                className="w-full sm:w-auto"
              >
                {actionLoading && <Spinner />} Claim pending medals
              </Button>
            </Card>

            <Card className="space-y-4 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Games</h3>
                  <p className="text-sm text-slate-400">Your performance so far</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatBlock label="Games played" value={profile.gamesPlayed} />
                <StatBlock label="Games won" value={profile.gamesWon} />
              </div>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="space-y-4 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Socials</h3>
                <Badge variant="default">Connections</Badge>
              </div>
              <div className="space-y-3">
                {socials.map((social) => {
                  const isLinked = profile.linkedSocials[social.key];
                  return (
                    <div
                      key={social.key}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{social.label}</p>
                        <p className="text-sm text-slate-400">{isLinked ? "Linked" : "Not linked"}</p>
                      </div>
                      <Button
                        variant={isLinked ? "soft" : "secondary"}
                        onClick={() => handleSocialToggle(social.key, isLinked)}
                        disabled={actionLoading}
                        className="min-w-[96px]"
                      >
                        {actionLoading && <Spinner />} {isLinked ? "Unlink" : "Link"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="space-y-5 p-4 sm:p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Referral</h3>
                  <Badge variant="warning">Rewards</Badge>
                </div>
                <p className="text-sm text-slate-400">Invite friends and earn medals.</p>
              </div>

              <div className="space-y-3 rounded-lg border border-white/5 bg-slate-900/40 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-400">Your referral code</p>
                    <p className="font-semibold">
                      {profile.referralCode ?? "No referral code yet"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.referralCode ? (
                      <Button
                        variant="secondary"
                        onClick={() => copyReferralCode(profile.referralCode!)}
                        disabled={actionLoading}
                      >
                        {actionLoading && <Spinner />} Copy code
                      </Button>
                    ) : (
                      <Button onClick={handleCreateReferral} disabled={actionLoading}>
                        {actionLoading && <Spinner />} Generate referral code
                      </Button>
                    )}
                  </div>
                </div>
                <Divider />
                <p className="text-sm text-slate-300">Invited {profile.referredCount} players</p>
              </div>

              <div className="space-y-3 rounded-lg border border-white/5 bg-slate-900/40 p-3">
                <p className="text-sm font-semibold">Use a referral code</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value)}
                    placeholder="Enter referral code"
                    className="flex-1 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleUseReferral}
                    disabled={actionLoading}
                    className="sm:min-w-[140px]"
                  >
                    {actionLoading && <Spinner />} Use referral
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-slate-900/60 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
