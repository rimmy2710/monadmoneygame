export type SocialKey = "gmail" | "x" | "discord";

export interface SocialState {
  gmail: boolean;
  x: boolean;
  discord: boolean;
}

const DEFAULT_SOCIAL_STATE: SocialState = {
  gmail: false,
  x: false,
  discord: false,
};

const socialsByAddress = new Map<string, SocialState>();

function getState(address: string): SocialState {
  const key = address.toLowerCase();
  if (!socialsByAddress.has(key)) {
    socialsByAddress.set(key, { ...DEFAULT_SOCIAL_STATE });
  }
  return socialsByAddress.get(key)!;
}

export function getSocials(address: string): SocialState {
  return { ...getState(address) };
}

export function linkSocial(address: string, social: SocialKey): SocialState {
  const state = getState(address);
  state[social] = true;
  return { ...state };
}

export function unlinkSocial(address: string, social: SocialKey): SocialState {
  const state = getState(address);
  state[social] = false;
  return { ...state };
}
