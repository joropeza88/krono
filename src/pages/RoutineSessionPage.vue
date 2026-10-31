<script setup lang="ts">
import { computed } from "vue";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewDidLeave,
  onIonViewWillLeave,
  useIonRouter,
} from "@ionic/vue";
import { checkmark, pause, play, refresh, stopCircle } from "ionicons/icons";
import { useRoutineSessionStore } from "../stores/useRoutineSessionStore";

const ionRouter = useIonRouter();
const session = useRoutineSessionStore();
const {
  activeRoutine,
  phase,
  remaining,
  exercise,
  cycle,
  paused,
  progress,
  isPreparingNextExercise,
} = session;
const formattedTime = computed(
  () =>
    `${Math.floor(remaining.value / 60)
      .toString()
      .padStart(2, "0")}:${(remaining.value % 60).toString().padStart(2, "0")}`,
);

async function restart() {
  if (activeRoutine.value) await session.start(activeRoutine.value);
}

async function startSession() {
  if (activeRoutine.value) await session.start(activeRoutine.value);
}

function exitSession() {
  ionRouter.back();
}

onIonViewWillLeave(() => {
  if (phase.value !== "complete") session.finish();
});

onIonViewDidLeave(() => {
  if (phase.value === "complete") session.finish();
});
</script>

<template>
  <IonPage class="routine-session-page" :class="[phase, { 'preparing-next-exercise': isPreparingNextExercise }]">
    <IonHeader class="session-header" translucent>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/rutinas" text="" />
        </IonButtons>
        <IonTitle>{{ activeRoutine?.name }}</IonTitle>
      </IonToolbar>
    </IonHeader>
    <aside class="session-side-rail" aria-label="Controles de sesión">
      <span class="session-side-brand" aria-hidden="true">kron<i>o</i></span>
      <button class="session-side-back" aria-label="Volver a rutinas" @click="exitSession">→</button>
    </aside>
    <IonContent class="app-content session-content" fullscreen>
      <main class="app session">
        <section class="session">
          <template v-if="phase === 'complete'">
            <div class="session-complete-panel">
              <div class="session-complete-mark" aria-hidden="true"><IonIcon :icon="checkmark" /></div>
              <h1>Rutina completada.</h1>
              <p>Has completado tu rutina.</p>
              <button class="primary session-complete-exit" @click="exitSession">Volver al inicio</button>
            </div>
          </template>
          <template v-else>
            <div class="session-timer-panel">
              <p v-if="activeRoutine" class="session-exercise-meta">Ejercicio {{ exercise }} / {{ activeRoutine.exerciseCount }}</p>
              <div class="timer-wrap" :style="{ '--progress': `${progress}%` }">
                <div class="timer">
                  <strong>{{ formattedTime }}</strong>
                </div>
              </div>
              <p v-if="activeRoutine" class="session-round-meta">Ronda {{ cycle }} / {{ activeRoutine.cycleCount }}</p>
            </div>
            <div class="session-actions-panel">
              <div v-if="phase === 'ready'" class="session-controls session-start-controls">
                <button class="session-icon-button start-session" aria-label="Iniciar rutina" @click="startSession"><IonIcon :icon="play" /></button>
              </div>
              <div v-else class="session-controls session-icon-controls">
                <button class="session-icon-button restart-session" aria-label="Reiniciar" @click="restart"><IonIcon :icon="refresh" /></button>
                <button class="session-icon-button pause-session" :aria-label="paused ? 'Reanudar' : 'Pausar'" @click="session.togglePause"><IonIcon :icon="paused ? play : pause" /></button>
                <button class="session-icon-button stop-session" aria-label="Terminar" @click="exitSession"><IonIcon :icon="stopCircle" /></button>
              </div>
            </div>
          </template>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>
