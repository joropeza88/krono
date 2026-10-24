<script setup lang="ts">
import { IonContent, IonHeader, IonModal, IonToolbar } from "@ionic/vue";
import { onBeforeUnmount, onMounted, ref } from "vue";

defineProps<{ open: boolean; title: string }>();
const emit = defineEmits<{ close: [] }>();

const compactLandscapeQuery = "(orientation: landscape) and (max-height: 600px)";
const isCompactLandscape = ref(false);
let compactLandscapeMedia: MediaQueryList | undefined;

function updateCompactLandscape() {
  isCompactLandscape.value = compactLandscapeMedia?.matches ?? false;
}

onMounted(() => {
  compactLandscapeMedia = window.matchMedia(compactLandscapeQuery);
  updateCompactLandscape();
  compactLandscapeMedia.addEventListener("change", updateCompactLandscape);
});

onBeforeUnmount(() => {
  compactLandscapeMedia?.removeEventListener("change", updateCompactLandscape);
});
</script>

<template>
  <Teleport to="ion-app">
    <IonModal
      v-if="isCompactLandscape"
      class="app-sheet-modal"
      :is-open="open"
      mode="ios"
      :handle="false"
      :expand-to-scroll="false"
      @didDismiss="emit('close')"
    >
      <IonHeader class="app-sheet-header">
        <IonToolbar>
          <header class="sheet-header">
            <h2>{{ title }}</h2>
            <button class="sheet-close" aria-label="Cerrar" @click="emit('close')">×</button>
          </header>
        </IonToolbar>
      </IonHeader>
      <IonContent class="app-sheet-content">
        <div class="sheet-body"><slot /></div>
      </IonContent>
    </IonModal>
    <IonModal
      v-else
      class="app-sheet-modal"
      :is-open="open"
      mode="ios"
      :breakpoints="[0, 0.94]"
      :initial-breakpoint="0.94"
      :backdrop-breakpoint="0.1"
      :handle="true"
      :expand-to-scroll="false"
      @didDismiss="emit('close')"
    >
      <IonHeader class="app-sheet-header">
        <IonToolbar>
          <header class="sheet-header">
            <h2>{{ title }}</h2>
            <button class="sheet-close" aria-label="Cerrar" @click="emit('close')">×</button>
          </header>
        </IonToolbar>
      </IonHeader>
      <IonContent class="app-sheet-content">
        <div class="sheet-body"><slot /></div>
      </IonContent>
    </IonModal>
  </Teleport>
</template>
