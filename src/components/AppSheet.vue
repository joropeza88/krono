<script setup lang="ts">
import { IonContent, IonHeader, IonModal, IonToolbar } from "@ionic/vue";

defineProps<{ open: boolean; title: string }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="ion-app">
    <IonModal
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
