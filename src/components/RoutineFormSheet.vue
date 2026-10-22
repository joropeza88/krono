<script setup lang="ts">
import { ref, watch } from "vue";
import AppSheet from "./AppSheet.vue";
import type { Routine } from "../types";

const props = defineProps<{ open: boolean; routine?: Routine | null }>();
const emit = defineEmits<{
  close: [];
  save: [routine: Omit<Routine, "id" | "createdAt" | "updatedAt">, andStart: boolean];
}>();

const form = ref({
  name: "",
  exerciseDuration: 30,
  restDuration: 15,
  exerciseCount: 4,
  cycleCount: 3,
});

watch(
  () => [props.open, props.routine] as const,
  () => {
    form.value = props.routine
      ? {
          name: props.routine.name,
          exerciseDuration: props.routine.exerciseDuration,
          restDuration: props.routine.restDuration,
          exerciseCount: props.routine.exerciseCount,
          cycleCount: props.routine.cycleCount,
        }
      : { name: "", exerciseDuration: 30, restDuration: 15, exerciseCount: 4, cycleCount: 3 };
  },
  { immediate: true },
);

function submit(andStart: boolean) {
  const { exerciseDuration, restDuration, exerciseCount, cycleCount } = form.value;
  if (
    !form.value.name.trim() ||
    exerciseDuration < 1 ||
    restDuration < 0 ||
    exerciseCount < 1 ||
    cycleCount < 1
  )
    return;
  emit("save", { ...form.value, name: form.value.name.trim() }, andStart);
}
</script>

<template>
  <AppSheet :open="open" :title="routine ? 'Editar rutina' : 'Nueva rutina'" @close="emit('close')">
    <p class="eyebrow">{{ routine ? "Edita los detalles" : "Ponle ritmo a tu sesión" }}</p>
    <form class="form" @submit.prevent="submit(false)">
      <label class="field">
        Nombre
        <input v-model="form.name" required maxlength="40" placeholder="Ej. HIIT mañanero" />
      </label>
      <div class="routine-settings">
        <div class="routine-setting-group">
          <label class="setting routine-setting">
            <div>
              <strong>Tabajo</strong>
              <p>Duración de cada bloque.</p>
              <output>{{ form.exerciseDuration }} s</output>
            </div>
            <input
              v-model.number="form.exerciseDuration"
              class="range"
              min="5"
              max="120"
              step="5"
              type="range"
            />
          </label>
        </div>
        <div class="routine-setting-group">
          <label class="setting routine-setting">
            <div>
              <strong>Descanso</strong>
              <p>Tiempo para recuperarte.</p>
              <output>{{ form.restDuration }} s</output>
            </div>
            <input
              v-model.number="form.restDuration"
              class="range"
              min="0"
              max="90"
              step="5"
              type="range"
            />
          </label>
        </div>
        <div class="routine-setting-group">
          <label class="setting routine-setting">
            <div>
              <strong>Ejercicios</strong>
              <p>Bloques por ronda.</p>
              <output>{{ form.exerciseCount }}</output>
            </div>
            <input
              v-model.number="form.exerciseCount"
              class="range"
              min="1"
              max="15"
              step="1"
              type="range"
            />
          </label>
        </div>
        <div class="routine-setting-group">
          <label class="setting routine-setting">
            <div>
              <strong>Rondas</strong>
              <p>Veces que repetirás la rutina.</p>
              <output>{{ form.cycleCount }}</output>
            </div>
            <input
              v-model.number="form.cycleCount"
              class="range"
              min="1"
              max="10"
              step="1"
              type="range"
            />
          </label>
        </div>
      </div>
      <div class="form-actions">
        <button class="primary wide" type="submit">Guardar rutina</button>
        <button class="secondary wide" type="button" @click="submit(true)">
          Guardar y empezar
        </button>
      </div>
    </form>
  </AppSheet>
</template>
