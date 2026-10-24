<script setup lang="ts">
import { useRoute } from "vue-router";
import { useIonRouter } from "@ionic/vue";

const route = useRoute();
const ionRouter = useIonRouter();
const emit = defineEmits<{ openSettings: [] }>();

function selectTab(path: "/rutinas" | "/cronometro") {
  if (route.path === path) return;
  ionRouter.navigate(path, "none", "replace");
}
</script>

<template>
  <nav class="tabbar" aria-label="Navegación principal">
    <div class="tabbar-brand" aria-hidden="true">kron<i>o</i></div>
    <div class="tabbar-actions">
      <button :class="{ active: route.path === '/rutinas' }" aria-label="Rutinas" @click="selectTab('/rutinas')">
        <span class="tabbar-icon" aria-hidden="true">◫</span><span class="tabbar-label">Rutinas</span>
      </button>
      <button :class="{ active: route.path === '/cronometro' }" aria-label="Cronómetro" @click="selectTab('/cronometro')">
        <span class="tabbar-icon" aria-hidden="true">◷</span><span class="tabbar-label">Cronómetro</span>
      </button>
      <button class="tabbar-settings" aria-label="Ajustes" @click="emit('openSettings')">
        <span class="tabbar-icon" aria-hidden="true">⚙︎</span><span class="tabbar-label">Ajustes</span>
      </button>
    </div>
  </nav>
</template>
