import type { ReferralStats, ReferralUseResult } from "../types";
import { registerPlayers } from "./players";

const addressToCode = new Map<string, string>();
const codeToAddress = new Map<string, string>();
const referrerToReferees = new Map<string, Set<string>>();
const pendingMedals = new Map<string, number>();

const REFERRER_REWARD = 20;
const NEW_USER_REWARD = 10;

function generateCode(address: string): string {
  const clean = address.toLowerCase();
  return `MM-${clean.slice(2, 8)}-${clean.slice(-4)}`;
}

export function getOrCreateReferralCode(address: string): string {
  if (addressToCode.has(address)) return addressToCode.get(address)!;
  const code = generateCode(address);
  addressToCode.set(address, code);
  codeToAddress.set(code, address);
  return code;
}

export function registerReferral(
  referralCode: string,
  newAddress: string
): ReferralUseResult {
  const referrer = codeToAddress.get(referralCode);
  if (!referrer) {
    return { ok: false, reason: "invalid_code" };
  }
  if (referrer.toLowerCase() === newAddress.toLowerCase()) {
    return { ok: false, reason: "self_referral_not_allowed" };
  }

  const refs = referrerToReferees.get(referrer) ?? new Set<string>();
  if (refs.has(newAddress.toLowerCase())) {
    return { ok: false, reason: "already_referred" };
  }

  refs.add(newAddress.toLowerCase());
  referrerToReferees.set(referrer, refs);

  pendingMedals.set(referrer, (pendingMedals.get(referrer) ?? 0) + REFERRER_REWARD);
  pendingMedals.set(newAddress, (pendingMedals.get(newAddress) ?? 0) + NEW_USER_REWARD);

  registerPlayers([referrer, newAddress]);

  return {
    ok: true,
    referrer,
    newUser: newAddress,
    referrerPendingMedals: pendingMedals.get(referrer)!,
    newUserPendingMedals: pendingMedals.get(newAddress)!,
  };
}

export function getReferralStats(address: string): ReferralStats {
  const code = addressToCode.get(address) ?? null;
  const refs = referrerToReferees.get(address) ?? new Set<string>();
  const pending = pendingMedals.get(address) ?? 0;
  return {
    address,
    referralCode: code,
    referredCount: refs.size,
    pendingMedals: pending,
  };
}

export function claimPendingMedals(address: string): number {
  const amount = pendingMedals.get(address) ?? 0;
  pendingMedals.set(address, 0);
  return amount;
}
