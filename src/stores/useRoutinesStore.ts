import { ref, watch } from "vue";
import { loadRoutines, saveRoutines } from "../storage";
import type { Routine } from "../types";

const routines = ref<Routine[]>(loadRoutines());

watch(routines, (value) => saveRoutines(value), { deep: true });

export function useRoutinesStore() {
  function save(routine: Routine) {
    const existing = routines.value.some((item) => item.id === routine.id);
    routines.value = existing
      ? routines.value.map((item) => (item.id === routine.id ? routine : item))
      : [routine, ...routines.value];
  }

  function remove(id: string) {
    routines.value = routines.value.filter((item) => item.id !== id);
  }

  return { routines, save, remove };
}
