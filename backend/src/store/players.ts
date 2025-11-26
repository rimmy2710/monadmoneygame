const knownPlayers = new Set<string>();

knownPlayers.add("0xMockUser".toLowerCase());

export function registerPlayer(address: string): void {
  if (!address) return;
  knownPlayers.add(address.toLowerCase());
}

export function registerPlayers(addresses: string[]): void {
  for (const a of addresses) registerPlayer(a);
}

export function getKnownPlayers(): string[] {
  return Array.from(knownPlayers.values());
}
