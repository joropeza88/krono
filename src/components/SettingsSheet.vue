<script setup lang="ts">
import AppSheet from "./AppSheet.vue";
import { playCue, previewSoundPack, unlockAudio } from "../audio";
import { onMounted, ref } from "vue";
import { listSoundProducts, purchaseSoundPack, type SoundProductView } from "../features/gamification/application/sound-store-service";
import { usePreferencesStore } from "../stores/usePreferencesStore";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();
const { preferences } = usePreferencesStore();
const packs = ref<SoundProductView[]>([]);
const soundPickerOpen = ref(false);
const pickerMessage = ref("");
async function refreshPacks() { packs.value = await listSoundProducts(); }
onMounted(() => void refreshPacks());

async function testAudio() {
  await unlockAudio();
  void playCue("exercise", preferences.value);
}

async function preview(pack: SoundProductView) {
  pickerMessage.value = "";
  await previewSoundPack(pack.id, preferences.value.volume);
}

async function acquire(pack: SoundProductView) {
  const result = await purchaseSoundPack(pack.id);
  pickerMessage.value = result.ok ? "Pack desbloqueado. Ya puedes usarlo." : result.reason === "insufficient-funds" ? "No tienes suficientes FP para este pack." : "Este pack ya no está disponible.";
  await refreshPacks();
}

function selectPack(pack: SoundProductView) {
  if (!pack.unlocked) return;
  preferences.value.activeSoundPackId = pack.id;
  pickerMessage.value = `${pack.name} está configurado.`;
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
      <button class="setting sound-picker setting-button" @click="soundPickerOpen = true">
        <div>
          <strong>Pack activo</strong>
          <p>{{ packs.find((pack) => pack.id === preferences.activeSoundPackId)?.name || "Clásico" }} · Toca para cambiar.</p>
        </div>
        <span aria-hidden="true">›</span>
      </button>
      <button class="secondary wide" :disabled="!preferences.enabled" @click="testAudio">
        Probar sonido
      </button>
      <p class="notice">
        Los futuros packs de voces o personajes se añadirán aquí. Tus rutinas permanecen solo en
        este dispositivo.
      </p>
    </section>
  </AppSheet>
  <AppSheet :open="soundPickerOpen" title="Packs de sonido" @close="soundPickerOpen = false">
    <p class="eyebrow">Tienda local</p>
    <p class="notice">Escucha cada pack antes de desbloquearlo. Los packs adquiridos quedan disponibles en este dispositivo.</p>
    <p v-if="pickerMessage" class="notice sound-message">{{ pickerMessage }}</p>
    <section class="sound-store">
      <article v-for="pack in packs" :key="pack.id">
        <div><p class="eyebrow">{{ pack.free ? "Gratis" : `${pack.pricePoints} FP` }}</p><h2>{{ pack.name }}</h2><p>{{ pack.description }}</p></div>
        <div class="sound-actions"><button class="secondary" @click="preview(pack)">Probar</button><button v-if="pack.unlocked" class="primary" :disabled="preferences.activeSoundPackId === pack.id" @click="selectPack(pack)">{{ preferences.activeSoundPackId === pack.id ? "Configurado" : "Usar" }}</button><button v-else class="primary" @click="acquire(pack)">Desbloquear</button></div>
      </article>
    </section>
  </AppSheet>
</template>
