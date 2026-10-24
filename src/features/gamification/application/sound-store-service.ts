import { getAvailableSoundPacks, getSoundPack } from "../domain/sound-catalog";
import type { PointTransaction, SoundUnlock, Wallet } from "../domain/types";
import { gamificationStores, requestResult, withGamificationTransaction } from "../infrastructure/gamification-repository";

export type SoundProductView = ReturnType<typeof getAvailableSoundPacks>[number] & { unlocked: boolean };

export async function listSoundProducts(): Promise<SoundProductView[]> {
  return withGamificationTransaction([gamificationStores.soundUnlocks], "readonly", async (stores) => {
    const unlocks = await requestResult(stores[gamificationStores.soundUnlocks].getAll() as IDBRequest<SoundUnlock[]>);
    return getAvailableSoundPacks().map((pack) => ({ ...pack, unlocked: pack.free || unlocks.some((unlock) => unlock.productId === pack.id) }));
  });
}

export async function purchaseSoundPack(productId: string) {
  const product = getSoundPack(productId);
  if (!product) return { ok: false as const, reason: "not-found" as const };
  return withGamificationTransaction([gamificationStores.soundUnlocks, gamificationStores.pointTransactions, gamificationStores.wallet], "readwrite", async (stores) => {
    const owned = await requestResult(stores[gamificationStores.soundUnlocks].get(productId) as IDBRequest<SoundUnlock | undefined>);
    if (product.free || owned) return { ok: true as const, alreadyOwned: true };
    const wallet = (await requestResult(stores[gamificationStores.wallet].get("main") as IDBRequest<Wallet | undefined>)) ?? { walletId: "main" as const, balance: 0, version: 1 };
    if (wallet.balance < product.pricePoints) return { ok: false as const, reason: "insufficient-funds" as const };
    const transaction: PointTransaction = { transactionId: crypto.randomUUID(), reference: `sound-purchase:${productId}`, amount: -product.pricePoints, reason: "sound_purchase", createdAt: new Date().toISOString() };
    stores[gamificationStores.pointTransactions].add(transaction);
    stores[gamificationStores.soundUnlocks].add({ productId, unlockedAt: transaction.createdAt, transactionId: transaction.transactionId });
    stores[gamificationStores.wallet].put({ ...wallet, balance: wallet.balance - product.pricePoints, version: wallet.version + 1 });
    return { ok: true as const, alreadyOwned: false };
  });
}

export async function isSoundPackAvailable(productId: string) {
  const product = getSoundPack(productId);
  if (!product) return false;
  if (product.free) return true;
  return withGamificationTransaction([gamificationStores.soundUnlocks], "readonly", async (stores) => Boolean(await requestResult(stores[gamificationStores.soundUnlocks].get(productId))));
}
