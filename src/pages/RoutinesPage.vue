<script setup lang="ts">
import { ref } from "vue";
import { IonAlert, IonContent, IonHeader, IonPage, IonToolbar, useIonRouter } from "@ionic/vue";
import AppTabBar from "../components/AppTabBar.vue";
import RoutineFormSheet from "../components/RoutineFormSheet.vue";
import SettingsSheet from "../components/SettingsSheet.vue";
import { useRoutineSessionStore } from "../stores/useRoutineSessionStore";
import { useRoutinesStore } from "../stores/useRoutinesStore";
import type { Routine } from "../types";

const ionRouter = useIonRouter();
const { routines, save, remove } = useRoutinesStore();
const routineSession = useRoutineSessionStore();
const isFormOpen = ref(false);
const isSettingsOpen = ref(false);
const editingRoutine = ref<Routine | null>(null);
const routinePendingDeletion = ref<Routine | null>(null);

function openNewRoutine() {
  editingRoutine.value = null;
  isFormOpen.value = true;
}

function openEditRoutine(routine: Routine) {
  editingRoutine.value = routine;
  isFormOpen.value = true;
}

async function saveRoutine(
  input: Omit<Routine, "id" | "createdAt" | "updatedAt">,
  andStart: boolean,
) {
  const now = new Date().toISOString();
  const previous = editingRoutine.value;
  const routine: Routine = {
    ...input,
    id: previous?.id ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };

  save(routine);
  isFormOpen.value = false;
  if (andStart) await startRoutine(routine);
}

function removeRoutine(routine: Routine) {
  routinePendingDeletion.value = routine;
}

function cancelRoutineDeletion() {
  routinePendingDeletion.value = null;
}

function confirmRoutineDeletion() {
  const routine = routinePendingDeletion.value;
  if (routine) remove(routine.id);
  routinePendingDeletion.value = null;
}

async function startRoutine(routine: Routine) {
  routineSession.prepare(routine);
  ionRouter.navigate("/rutinas/sesion", "forward", "push");
}

function openRepetitionsLab() {
  ionRouter.navigate("/laboratorio-repeticiones", "forward", "push");
}
</script>

<template>
  <IonPage>
    <IonHeader class="app-header" translucent>
      <IonToolbar>
        <header class="top app-top">
          <div class="brand">kron<i>o</i></div>
          <button class="icon-button settings-button" aria-label="Ajustes" @click="isSettingsOpen = true">
            ⚙︎
          </button>
        </header>
      </IonToolbar>
    </IonHeader>
    <IonContent class="app-content" fullscreen>
      <main class="app">
        <p class="eyebrow">Tu ritmo, tus reglas</p>
        <h1 class="title">Entrena por<br />intervalos.</h1>
        <section class="hero">
          <h2>Listo cuando tú.</h2>
          <p>Crea una rutina y deja que Krono marque el ritmo.</p>
          <button class="primary" @click="openNewRoutine">Crear rutina</button>
        </section>
        <button class="repetitions-lab-link" @click="openRepetitionsLab">
          <span>◌</span><div><strong>Probar contador con cámara</strong><small>Laboratorio de repeticiones</small></div><b>→</b>
        </button>
        <div class="section-head">
          <h2>Tus rutinas</h2>
          <span class="eyebrow">{{ routines.length }}</span>
        </div>
        <div v-if="routines.length" class="routine-list">
          <article v-for="routine in routines" :key="routine.id" class="routine">
            <div>
              <h3>{{ routine.name }}</h3>
              <p>
                {{ routine.exerciseCount }} ejercicios · {{ routine.cycleCount }} rondas ·
                {{ routine.exerciseDuration }}s / {{ routine.restDuration }}s
              </p>
              <div class="routine-actions">
                <button class="text-button" @click="openEditRoutine(routine)">Editar</button>
                <button class="text-button delete" @click="removeRoutine(routine)">Eliminar</button>
              </div>
            </div>
            <button
              class="play"
              :aria-label="`Iniciar ${routine.name}`"
              @click="startRoutine(routine)"
            >
              ▶
            </button>
          </article>
        </div>
        <div v-else class="empty">Aún no tienes rutinas. Crea la primera y empieza a moverte.</div>

        <RoutineFormSheet
          :open="isFormOpen"
          :routine="editingRoutine"
          @close="isFormOpen = false"
          @save="saveRoutine"
        />
        <SettingsSheet :open="isSettingsOpen" @close="isSettingsOpen = false" />
        <IonAlert
          :is-open="Boolean(routinePendingDeletion)"
          class="routine-delete-alert"
          css-class="routine-delete-alert"
          header="¿Eliminar rutina?"
          :message="`“${routinePendingDeletion?.name ?? ''}” se eliminará permanentemente.`"
          :buttons="[
            { text: 'Cancelar', role: 'cancel', handler: cancelRoutineDeletion },
            { text: 'Eliminar', role: 'destructive', handler: confirmRoutineDeletion },
          ]"
          @did-dismiss="cancelRoutineDeletion"
        />
        <AppTabBar @open-settings="isSettingsOpen = true" />
      </main>
    </IonContent>
  </IonPage>
</template>
