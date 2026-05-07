import data from "./pharos-residents.json";

// One row per Pharos summoner that we replayed onto Base via
// MintFacet.migrationMintBatch. gotchiId mirrors the Pharos token_id (also
// the Base token_id, since migrationMintBatch preserves order). oldName is
// the chi-name they had on Pharos — shown in SummonModal as a default so
// they can keep it without typing it again.
export interface PharosResident {
  gotchiId: number;
  oldName: string;
  wallet: string;
}

const residents = data as PharosResident[];

const byWallet = new Map<string, PharosResident[]>();
const byGotchiId = new Map<number, PharosResident>();
for (const r of residents) {
  const key = r.wallet.toLowerCase();
  const list = byWallet.get(key) ?? [];
  list.push(r);
  byWallet.set(key, list);
  byGotchiId.set(r.gotchiId, r);
}

// Find the Pharos record for a given (wallet, gotchiId) pair. Wallet match
// matters: if a user transferred their Beacon to someone else after migration,
// the new owner shouldn't see the old name as a default — they get the
// blank slate.
export function findPharosResident(
  wallet: string | undefined,
  gotchiId: number | string,
): PharosResident | undefined {
  if (!wallet) return undefined;
  const id = typeof gotchiId === "string" ? Number(gotchiId) : gotchiId;
  const record = byGotchiId.get(id);
  if (!record) return undefined;
  if (record.wallet.toLowerCase() !== wallet.toLowerCase()) return undefined;
  return record;
}
