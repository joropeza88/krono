<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonToolbar, useIonRouter } from "@ionic/vue";
import AppTabBar from "../components/AppTabBar.vue";
import SettingsSheet from "../components/SettingsSheet.vue";
import { ref } from "vue";
import { useTimerSessionStore } from "../stores/useTimerSessionStore";

const ionRouter = useIonRouter();
const { minutes, prepare } = useTimerSessionStore();
const isSettingsOpen = ref(false);

async function startTimer() {
  if (minutes.value < 1) return;
  prepare();
  ionRouter.navigate("/cronometro/activo", "forward", "push");
}
</script>

<template>
  <IonPage>
    <IonHeader class="app-header">
      <IonToolbar>
        <header class="top app-top">
          <div class="brand">kron<i>o</i></div>
          <button class="icon-button" aria-label="Ajustes" @click="isSettingsOpen = true">
            ⚙
          </button>
        </header>
      </IonToolbar>
    </IonHeader>
    <IonContent class="app-content">
      <main class="app">
        <p class="eyebrow">Tiempo a tu manera</p>
        <h1 class="title">Cronómetro<br />simple.</h1>
        <section class="hero timer-hero">
          <h2>¿Cuánto tiempo?</h2>
          <p>Sin ciclos ni descansos. Solo empieza y sigue tu ritmo.</p>
          <label class="timer-duration"
            >Minutos<input
              v-model.number="minutes"
              min="1"
              max="1440"
              type="number"
              inputmode="numeric"
          /></label>
          <button class="primary" @click="startTimer">Iniciar cronómetro</button>
        </section>
        <SettingsSheet :open="isSettingsOpen" @close="isSettingsOpen = false" />
        <AppTabBar />
      </main>
    </IonContent>
  </IonPage>
</template>
