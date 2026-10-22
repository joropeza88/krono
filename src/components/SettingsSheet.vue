<script setup lang="ts">
import AppSheet from "./AppSheet.vue";
import { playCue, unlockAudio } from "../audio";
import { usePreferencesStore } from "../stores/usePreferencesStore";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();
const { preferences } = usePreferencesStore();

async function testAudio() {
  await unlockAudio();
  void playCue("exercise", preferences.value);
}
</script>

<template>
  <AppSheet :open="open" title="Preferencias" @close="emit('close')">
    <p class="eyebrow">Tu experiencia</p>
    <section class="settings">
      <div class="setting">
        <div>
          <strong>Sonidos</strong>
          <p>Señales de inicio y descanso.</p>
        </div>
        <input v-model="preferences.enabled" class="switch" type="checkbox" />
      </div>
      <div class="setting">
        <div>
          <strong>Motivación aleatoria</strong>
          <p>Preparada para futuros packs de sonido.</p>
        </div>
        <input
          v-model="preferences.motivationalSoundsEnabled"
          :disabled="!preferences.enabled"
          class="switch"
          type="checkbox"
        />
      </div>
      <div class="setting">
        <div>
          <strong>Volumen</strong>
          <p>{{ Math.round(preferences.volume * 100) }}%</p>
        </div>
        <input
          v-model.number="preferences.volume"
          class="range"
          type="range"
          min="0"
          max="1"
          step="0.05"
        />
      </div>
      <div class="setting">
        <div>
          <strong>Pack activo</strong>
          <p>{{ preferences.activeSoundPackId || "default" }}.</p>
        </div>
        <span>✦</span>
      </div>
      <button class="secondary wide" :disabled="!preferences.enabled" @click="testAudio">
        Probar sonido
      </button>
      <p class="notice">
        Los futuros packs de voces o personajes se añadirán aquí. Tus rutinas permanecen solo en
        este dispositivo.
      </p>
    </section>
  </AppSheet>
</template>
