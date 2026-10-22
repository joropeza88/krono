import { ref, watch } from "vue";
import { loadPreferences, savePreferences } from "../storage";

const preferences = ref(loadPreferences());

watch(preferences, (value) => savePreferences(value), { deep: true });

export function usePreferencesStore() {
  return { preferences };
}
