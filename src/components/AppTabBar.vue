<script setup lang="ts">
import { useRoute } from "vue-router";
import { useIonRouter } from "@ionic/vue";

const route = useRoute();
const ionRouter = useIonRouter();

function selectTab(path: "/rutinas" | "/cronometro") {
  if (route.path === path) return;
  ionRouter.navigate(path, "none", "replace");
}
</script>

<template>
  <nav class="tabbar" aria-label="Navegación principal">
    <button :class="{ active: route.path === '/rutinas' }" @click="selectTab('/rutinas')">
      <span aria-hidden="true">◫</span>Rutinas
    </button>
    <button :class="{ active: route.path === '/cronometro' }" @click="selectTab('/cronometro')">
      <span aria-hidden="true">◷</span>Cronómetro
    </button>
  </nav>
</template>
