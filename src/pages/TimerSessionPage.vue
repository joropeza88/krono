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
import { useTimerSessionStore } from "../stores/useTimerSessionStore";

const ionRouter = useIonRouter();
const session = useTimerSessionStore();
const { phase, remaining, paused, progress } = session;
const formattedTime = computed(
  () =>
    `${Math.floor(remaining.value / 60)
      .toString()
      .padStart(2, "0")}:${(remaining.value % 60).toString().padStart(2, "0")}`,
);

function finish() {
  ionRouter.back();
}

async function startSession() {
  await session.start();
}

onIonViewWillLeave(() => {
  if (phase.value !== "complete") session.reset();
});

onIonViewDidLeave(() => {
  if (phase.value === "complete") session.reset();
});
</script>

<template>
  <IonPage class="simple-timer-session" :class="phase">
    <IonHeader class="session-header" translucent>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/cronometro" text="" />
        </IonButtons>
        <IonTitle>Cronómetro</IonTitle>
      </IonToolbar>
    </IonHeader>
    <aside class="session-side-rail" aria-label="Controles de sesión">
      <span class="session-side-brand" aria-hidden="true">kron<i>o</i></span>
      <button class="session-side-back" aria-label="Volver al cronómetro" @click="finish">→</button>
    </aside>
    <IonContent class="app-content session-content" fullscreen>
      <main class="app session">
        <section class="session">
          <template v-if="phase === 'complete'">
            <div class="session-complete-panel">
              <div class="session-complete-mark" aria-hidden="true"><IonIcon :icon="checkmark" /></div>
              <h1>Cronómetro completado.</h1>
              <p>Has completado tu tiempo.</p>
              <button class="primary session-complete-exit" @click="finish">Volver al inicio</button>
            </div>
          </template>
          <template v-else>
            <div class="session-timer-panel">
              <div class="timer-wrap" :style="{ '--progress': `${progress}%` }">
                <div class="timer"><strong>{{ formattedTime }}</strong></div>
              </div>
            </div>
            <div class="session-actions-panel">
              <div v-if="phase === 'setup'" class="session-controls session-start-controls">
                <button class="session-icon-button start-session" aria-label="Iniciar cronómetro" @click="startSession"><IonIcon :icon="play" /></button>
              </div>
              <div v-else class="session-controls session-icon-controls">
                <button class="session-icon-button restart-session" aria-label="Reiniciar" @click="session.start"><IonIcon :icon="refresh" /></button>
                <button class="session-icon-button pause-session" :aria-label="paused ? 'Reanudar' : 'Pausar'" @click="session.togglePause"><IonIcon :icon="paused ? play : pause" /></button>
                <button class="session-icon-button stop-session" aria-label="Terminar" @click="finish"><IonIcon :icon="stopCircle" /></button>
              </div>
            </div>
          </template>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>
