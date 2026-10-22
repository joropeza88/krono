<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { IonApp, IonRouterOutlet } from "@ionic/vue";
import { preloadSoundPack } from "./audio";
import { releaseScreenWakeLock, requestScreenWakeLock } from "./services/wakeLock";
import { usePreferencesStore } from "./stores/usePreferencesStore";
import { useRoutineSessionStore } from "./stores/useRoutineSessionStore";
import { useTimerSessionStore } from "./stores/useTimerSessionStore";

const { preferences } = usePreferencesStore();
const { isActive: isRoutineActive } = useRoutineSessionStore();
const { isActive: isTimerActive } = useTimerSessionStore();

function handleVisibilityChange() {
  if (document.visibilityState === "visible" && (isRoutineActive.value || isTimerActive.value)) {
    void requestScreenWakeLock();
    return;
  }

  void releaseScreenWakeLock();
}

onMounted(() => {
  document.addEventListener("visibilitychange", handleVisibilityChange);
  void preloadSoundPack(preferences.value.activeSoundPackId || "default");
});

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  void releaseScreenWakeLock();
});
</script>

<template>
  <IonApp><IonRouterOutlet :animated="true" mode="ios" /></IonApp>
</template>
