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
    <IonHeader class="app-header" translucent>
      <IonToolbar>
        <header class="top app-top">
          <div class="brand">kron<i>o</i></div>
          <button class="icon-button settings-button" aria-label="Ajustes" @click="isSettingsOpen = true">
            ⚙
          </button>
        </header>
      </IonToolbar>
    </IonHeader>
    <IonContent class="app-content" fullscreen>
      <main class="app">
        <p class="eyebrow">Tiempo a tu manera</p>
        <h1 class="title">Cronómetro.</h1>
        <section class="hero timer-hero">
          <h2>¿Cuánto tiempo?</h2>
          <label class="timer-duration"
            >Minutos<input
              v-model.number="minutes"
              min="1"
              max="1440"
              type="number"
              inputmode="numeric"
          /></label>
          <button class="primary" @click="startTimer">Preparar cronómetro</button>
        </section>
        <SettingsSheet :open="isSettingsOpen" @close="isSettingsOpen = false" />
        <AppTabBar @open-settings="isSettingsOpen = true" />
      </main>
    </IonContent>
  </IonPage>
</template>
