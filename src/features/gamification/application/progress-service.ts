import type { ActivityEvent, PointTransaction } from "../domain/types";
import { gamificationStores, requestResult, withGamificationTransaction } from "../infrastructure/gamification-repository";

export type ProgressDashboard = { balance: number; earned: number; spent: number; routineCount: number; freeSessionCount: number; activeSeconds: number; title: string; nextTitle?: { name: string; target: number }; recentTransactions: PointTransaction[] };

const titles = [[0, "Principiante"], [10, "En marcha"], [25, "Constante"], [50, "Disciplinado"], [100, "Incansable"], [250, "Veterano"], [500, "Maestro del ritmo"], [1000, "Leyenda"]] as const;

export async function getProgressDashboard(): Promise<ProgressDashboard> {
  return withGamificationTransaction([gamificationStores.activityEvents, gamificationStores.pointTransactions, gamificationStores.wallet], "readonly", async (stores) => {
    const events = await requestResult(stores[gamificationStores.activityEvents].getAll() as IDBRequest<ActivityEvent[]>);
    const transactions = await requestResult(stores[gamificationStores.pointTransactions].getAll() as IDBRequest<PointTransaction[]>);
    const wallet = await requestResult(stores[gamificationStores.wallet].get("main") as IDBRequest<{ balance: number } | undefined>);
    const routineCount = events.filter((event) => event.mode === "routine").length;
    const titleIndex = titles.reduce((index, [threshold]) => (routineCount >= threshold ? index + 1 : index), 0) - 1;
    const next = titles[titleIndex + 1];
    return { balance: wallet?.balance ?? 0, earned: transactions.filter((item) => item.amount > 0).reduce((total, item) => total + item.amount, 0), spent: Math.abs(transactions.filter((item) => item.amount < 0).reduce((total, item) => total + item.amount, 0)), routineCount, freeSessionCount: events.filter((event) => event.mode === "free").length, activeSeconds: events.reduce((total, event) => total + event.elapsedActiveSeconds, 0), title: titles[Math.max(0, titleIndex)][1], nextTitle: next ? { target: next[0], name: next[1] } : undefined, recentTransactions: [...transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5) };
  });
}
