import type {
  ActivityEvent,
  Challenge,
  GamificationMeta,
  PointTransaction,
  SoundUnlock,
  Wallet,
} from "../domain/types";

const DATABASE_NAME = "krono-gamification";
const DATABASE_VERSION = 1;

export const gamificationStores = {
  activityEvents: "activity_events",
  challenges: "challenges",
  pointTransactions: "point_transactions",
  wallet: "wallet",
  soundUnlocks: "sound_unlocks",
  meta: "gamification_meta",
} as const;

type StoreName = (typeof gamificationStores)[keyof typeof gamificationStores];

let databasePromise: Promise<IDBDatabase> | undefined;

function openDatabase() {
  databasePromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(gamificationStores.activityEvents)) {
        const store = database.createObjectStore(gamificationStores.activityEvents, { keyPath: "eventId" });
        store.createIndex("byLocalDay", "localDayId");
        store.createIndex("byLocalWeek", "localWeekId");
      }
      if (!database.objectStoreNames.contains(gamificationStores.challenges)) {
        const store = database.createObjectStore(gamificationStores.challenges, { keyPath: "challengeId" });
        store.createIndex("byPeriod", "periodId");
      }
      if (!database.objectStoreNames.contains(gamificationStores.pointTransactions)) {
        const store = database.createObjectStore(gamificationStores.pointTransactions, { keyPath: "transactionId" });
        store.createIndex("byReference", "reference", { unique: true });
        store.createIndex("byCreatedAt", "createdAt");
      }
      if (!database.objectStoreNames.contains(gamificationStores.wallet)) {
        database.createObjectStore(gamificationStores.wallet, { keyPath: "walletId" });
      }
      if (!database.objectStoreNames.contains(gamificationStores.soundUnlocks)) {
        database.createObjectStore(gamificationStores.soundUnlocks, { keyPath: "productId" });
      }
      if (!database.objectStoreNames.contains(gamificationStores.meta)) {
        database.createObjectStore(gamificationStores.meta, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir la base local de Krono."));
  });

  return databasePromise;
}

export async function withGamificationTransaction<T>(
  storeNames: StoreName[],
  mode: IDBTransactionMode,
  work: (stores: Record<StoreName, IDBObjectStore>) => Promise<T> | T,
) {
  const database = await openDatabase();
  const transaction = database.transaction(storeNames, mode);
  const stores = Object.fromEntries(
    storeNames.map((storeName) => [storeName, transaction.objectStore(storeName)]),
  ) as Record<StoreName, IDBObjectStore>;

  const completed = new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Transacción local fallida."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Transacción local cancelada."));
  });

  const result = await work(stores);
  await completed;
  return result;
}

export function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Operación local fallida."));
  });
}

export async function getWallet() {
  return withGamificationTransaction([gamificationStores.wallet], "readonly", async (stores) => {
    const wallet = await requestResult(stores[gamificationStores.wallet].get("main") as IDBRequest<Wallet | undefined>);
    return wallet ?? { walletId: "main", balance: 0, version: 1 };
  });
}

export type GamificationRepositoryRecords = {
  activityEvent: ActivityEvent;
  challenge: Challenge;
  pointTransaction: PointTransaction;
  soundUnlock: SoundUnlock;
  meta: GamificationMeta;
};
