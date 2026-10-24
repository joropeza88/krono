<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonToolbar, onIonViewWillEnter } from "@ionic/vue";
import { computed, ref } from "vue";
import AppTabBar from "../components/AppTabBar.vue";
import SettingsSheet from "../components/SettingsSheet.vue";
import { getActiveChallenges } from "../features/gamification/application/challenge-service";
import { getProgressDashboard, type ProgressDashboard } from "../features/gamification/application/progress-service";
import type { Challenge } from "../features/gamification/domain/types";

const dashboard = ref<ProgressDashboard>();
const challenges = ref<Challenge[]>([]);
const period = ref<"daily" | "weekly">("daily");
const isSettingsOpen = ref(false);
const visibleChallenges = computed(() => challenges.value.filter((challenge) => challenge.periodType === period.value));
const challengeNames: Record<string, string> = {
  routine_count: "Completa una rutina",
  routine_minutes: "Minutos en rutinas",
  free_sessions: "Completa una sesión libre",
  free_minutes: "Minutos con cronómetro",
  total_minutes: "Minutos activos",
  distinct_routines: "Rutinas diferentes",
  active_days: "Días activos",
  mixed_modes: "Combina ambos modos",
};
const difficultyNames: Record<Challenge["difficulty"], string> = { easy: "Fácil", medium: "Medio", hard: "Difícil" };

function challengeName(challenge: Challenge) { return challengeNames[challenge.family] ?? "Reto de actividad"; }

async function refresh() {
  const [nextDashboard, nextChallenges] = await Promise.all([getProgressDashboard(), getActiveChallenges()]);
  dashboard.value = nextDashboard;
  challenges.value = nextChallenges;
}
onIonViewWillEnter(() => void refresh());
</script>

<template>
  <IonPage><IonHeader class="app-header" translucent><IonToolbar><header class="top app-top"><div class="brand">kron<i>o</i></div><button class="icon-button settings-button" aria-label="Ajustes" @click="isSettingsOpen = true">⚙︎</button></header></IonToolbar></IonHeader>
    <IonContent class="app-content" fullscreen><main class="app progress-page">
      <p class="eyebrow">Tu avance</p><h1 class="title">Progreso.</h1>
      <section v-if="dashboard" class="hero progress-balance"><p>Saldo actual</p><strong>{{ dashboard.balance }} <small>FP</small></strong><span>{{ dashboard.title }}</span><p v-if="dashboard.nextTitle" class="progress-next">{{ dashboard.routineCount }} / {{ dashboard.nextTitle.target }} rutinas · {{ dashboard.nextTitle.name }}</p></section>
      <section v-if="dashboard" class="progress-grid"><article><strong>{{ dashboard.routineCount }}</strong><span>Rutinas completadas</span></article><article><strong>{{ dashboard.freeSessionCount }}</strong><span>Sesiones libres</span></article><article><strong>{{ Math.floor(dashboard.activeSeconds / 60) }}</strong><span>Minutos activos</span></article></section>
      <section class="section-head"><h2>Retos</h2><div class="challenge-tabs"><button :class="{ active: period === 'daily' }" @click="period = 'daily'">Hoy</button><button :class="{ active: period === 'weekly' }" @click="period = 'weekly'">Semana</button></div></section>
      <div v-if="visibleChallenges.length" class="challenge-list"><article v-for="challenge in visibleChallenges" :key="challenge.challengeId" class="challenge"><div><p class="eyebrow">{{ difficultyNames[challenge.difficulty] }} · +{{ challenge.rewardPoints }} FP</p><h3>{{ challengeName(challenge) }}</h3><p>{{ Math.min(challenge.progress, challenge.target) }} de {{ challenge.target }}</p></div><strong :class="challenge.status">{{ challenge.status === 'completed' ? 'Listo' : `${Math.min(100, Math.round(challenge.progress / challenge.target * 100))}%` }}</strong><div class="challenge-bar"><span :style="{ width: `${Math.min(100, challenge.progress / challenge.target * 100)}%` }" /></div></article></div>
      <div v-else class="empty">Completa una sesión de al menos tres minutos para empezar a sumar puntos.</div>
      <section v-if="dashboard?.recentTransactions.length" class="transactions"><div class="section-head"><h2>Movimientos recientes</h2><span class="eyebrow">{{ dashboard.earned }} ganados · {{ dashboard.spent }} gastados</span></div><article v-for="entry in dashboard.recentTransactions" :key="entry.transactionId"><span>{{ entry.reason === 'challenge_reward' ? 'Reto completado' : entry.reason === 'activity_reward' ? 'Sesión completada' : 'Pack de sonido' }}</span><strong :class="entry.amount > 0 ? 'credit' : 'debit'">{{ entry.amount > 0 ? '+' : '' }}{{ entry.amount }} FP</strong></article></section>
      <SettingsSheet :open="isSettingsOpen" @close="isSettingsOpen = false" />
      <AppTabBar @open-settings="isSettingsOpen = true" />
    </main></IonContent>
  </IonPage>
</template>
