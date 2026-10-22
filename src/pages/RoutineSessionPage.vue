<script setup lang="ts">
import { computed } from "vue";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewWillLeave,
  useIonRouter,
} from "@ionic/vue";
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
const label = computed(() =>
  isPreparingNextExercise.value
    ? "Prepárate"
    : {
        countdown: "Prepárate",
        exercise: "A entrenar",
        rest: "Recupera",
        complete: "¡Completado!",
        ready: "",
      }[phase.value],
);
const title = computed(() =>
  phase.value === "ready"
    ? "Comencemos"
    : isPreparingNextExercise.value
      ? "Siguiente ejercicio"
      : phase.value === "exercise"
        ? `Ejercicio ${exercise.value}`
        : phase.value === "rest"
          ? "Descanso"
          : phase.value === "countdown"
            ? "Siguiente ejercicio"
            : activeRoutine.value?.name || "",
);
const timerHint = computed(() =>
  isPreparingNextExercise.value
    ? "empieza en breve"
    : phase.value === "exercise"
      ? "mantén el ritmo"
      : phase.value === "rest"
        ? "respira"
        : "empieza en breve",
);
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
  session.finish();
});
</script>

<template>
  <IonPage :class="[phase, { 'preparing-next-exercise': isPreparingNextExercise }]">
    <IonHeader class="session-header" translucent>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/rutinas" text="" />
        </IonButtons>
        <IonTitle>{{ activeRoutine?.name }}</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent class="app-content session-content" fullscreen>
      <main class="app session">
        <section class="session">
          <div class="session-state">{{ label }}</div>
          <h1 class="session-title">{{ title }}</h1>
          <div class="timer-wrap" :style="{ '--progress': `${progress}%` }">
            <div class="timer">
              <strong>{{ formattedTime }}</strong
              ><span v-if="phase !== 'complete'">{{ timerHint }}</span>
            </div>
          </div>
          <p v-if="phase === 'ready'" class="session-meta">Todo listo. Tú marcas el comienzo.</p>
          <p v-else-if="activeRoutine && phase !== 'complete'" class="session-meta">
            Ejercicio {{ exercise }} de {{ activeRoutine.exerciseCount }} · Ciclo {{ cycle }} de
            {{ activeRoutine.cycleCount }}
          </p>
          <p v-else class="session-meta">Rutina finalizada. Gran trabajo.</p>
          <div v-if="phase === 'ready'" class="session-controls">
            <button class="primary start-session" @click="startSession">Iniciar</button>
          </div>
          <div v-else-if="phase !== 'complete'" class="session-controls">
            <button class="primary pause-session" @click="session.togglePause">
              {{ paused ? "Reanudar" : "Pausar" }}
            </button>
            <button class="secondary" @click="restart">Reiniciar</button>
            <button class="danger" @click="exitSession">Finalizar sesión</button>
          </div>
          <button v-else class="primary wide" @click="exitSession">Volver al inicio</button>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>
