<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { pwaUpdateService, type PwaUpdateState } from "../services/pwaUpdate";

const state = ref<PwaUpdateState>({ available: false, updating: false });
let unsubscribe: (() => void) | undefined;

onMounted(() => { unsubscribe = pwaUpdateService.subscribe((next) => (state.value = next)); });
onBeforeUnmount(() => unsubscribe?.());
</script>

<template>
  <aside v-if="state.available" class="pwa-update-notice" role="status" aria-live="polite">
    <div><strong>Hay una versión nueva</strong><span>Actualiza para usar las mejoras.</span></div>
    <button :disabled="state.updating" @click="pwaUpdateService.applyUpdate()">{{ state.updating ? "Actualizando…" : "Actualizar" }}</button>
  </aside>
</template>
