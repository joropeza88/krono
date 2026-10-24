<script setup lang="ts">
import { computed } from "vue";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  onIonViewWillLeave,
  useIonRouter,
} from "@ionic/vue";
import { useTimerSessionStore } from "../stores/useTimerSessionStore";

const ionRouter = useIonRouter();
const session = useTimerSessionStore();
const { minutes, phase, remaining, paused, progress } = session;
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
  session.reset();
});
</script>

<template>
  <IonPage class="simple-timer-session">
    <IonHeader class="session-header" translucent>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton default-href="/cronometro" text="" />
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <aside class="session-side-rail" aria-label="Controles de sesión">
      <span class="session-side-brand" aria-hidden="true">kron<i>o</i></span>
      <button class="session-side-back" aria-label="Volver al cronómetro" @click="finish">←</button>
    </aside>
    <IonContent class="app-content session-content" fullscreen>
      <main class="app session">
        <section class="session">
          <div class="session-timer-panel">
            <div class="session-state">
              {{
                phase === "complete"
                  ? "¡Completado!"
                  : phase === "setup"
                    ? "Comencemos"
                    : paused
                      ? "En pausa"
                      : "Cronómetro"
              }}
            </div>
            <h1 class="session-title">
              {{ phase === "complete" ? "Tiempo terminado" : "Sigue a tu ritmo" }}
            </h1>
            <div class="timer-wrap" :style="{ '--progress': `${progress}%` }">
              <div class="timer">
                <strong>{{ formattedTime }}</strong
                ><span v-if="phase === 'running'">{{ paused ? "en pausa" : "el tiempo corre" }}</span>
                <span v-else>{{ "empieza en breve" }}</span>
              </div>
            </div>
          </div>
          <div class="session-actions-panel">
            <p v-if="phase === 'setup'" class="session-meta">
              {{ minutes }} minuto{{ minutes === 1 ? "" : "s" }} preparado{{
                minutes === 1 ? "" : "s"
              }}.
            </p>
            <p v-else-if="phase === 'running'" class="session-meta">
              {{
                paused
                  ? "Tu cronómetro está pausado."
                  : `${minutes} minuto${minutes === 1 ? "" : "s"} configurado${minutes === 1 ? "" : "s"}.`
              }}
            </p>
            <p v-else class="session-meta">Buen trabajo. Has terminado tu tiempo.</p>
            <div v-if="phase === 'setup'" class="session-controls">
              <button class="primary start-session" @click="startSession">Iniciar</button>
            </div>
            <div v-else-if="phase === 'running'" class="session-controls">
              <button class="primary pause-session" @click="session.togglePause">
                {{ paused ? "Reanudar" : "Pausar" }}
              </button>
              <button class="secondary" @click="session.start">Reiniciar</button>
              <button class="danger" @click="finish">Finalizar</button>
            </div>
            <button v-else class="primary wide" @click="finish">Nuevo cronómetro</button>
          </div>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>
