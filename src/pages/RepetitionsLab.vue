<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonToolbar, useIonRouter } from "@ionic/vue";
import { add, checkmark, pause, play, refresh, remove, stopCircle } from "ionicons/icons";
import { CameraManager, getExercise, PoseDetector, RepetitionEngine, type RepetitionState, type RoutineConfig } from "../modules/repetitions";
import { playCue, unlockAudio } from "../audio";
import { usePreferencesStore } from "../stores/usePreferencesStore";

const TEST_ROUTINE: RoutineConfig = { exercises: [{ exerciseId: "squat", targetReps: 5 }, { exerciseId: "jumping_jack", targetReps: 5 }], restSeconds: 20, rounds: 3 };
const ionRouter = useIonRouter();
const { preferences } = usePreferencesStore();
const video = ref<HTMLVideoElement>();
const overlay = ref<HTMLCanvasElement>();
const camera = new CameraManager();
const detector = new PoseDetector();
let engine: RepetitionEngine | undefined;
let frame = 0;
let processing = false;
const error = ref("");
const state = ref<RepetitionState>();
let lastCountdownCue: number | undefined;
const view = computed(() => getExercise(state.value?.exerciseId ?? TEST_ROUTINE.exercises[0].exerciseId));
const isSession = computed(() => Boolean(state.value && !["idle", "stopped", "error"].includes(state.value.phase)));
const isPreparing = computed(() => state.value?.phase === "resting" && state.value.restRemainingSeconds > 0 && state.value.restRemainingSeconds <= 3);
const restProgress = computed(() => state.value ? Math.max(0, Math.min(100, ((TEST_ROUTINE.restSeconds - state.value.restRemainingSeconds) / TEST_ROUTINE.restSeconds) * 100)) : 0);
const nextExercise = computed(() => {
  const current = state.value;
  if (!current) return getExercise(TEST_ROUTINE.exercises[0].exerciseId);
  const nextIndex = current.exerciseIndex < current.exerciseCount - 1 ? current.exerciseIndex + 1 : 0;
  return getExercise(TEST_ROUTINE.exercises[nextIndex].exerciseId);
});
const statusClass = computed(() => ({
  "is-resting": state.value?.phase === "resting" && !isPreparing.value,
  "is-preparing": isPreparing.value,
  "is-lost": state.value?.phase === "active" && !state.value.isSetComplete && state.value.detectorState === "tracking-lost",
}));

function update(next: RepetitionState) { state.value = next; }
function eventSound(type: string, next: RepetitionState) {
  if (type === "rest-started") { lastCountdownCue = undefined; void playCue("rest", preferences.value); }
  if (type === "rest-tick" && next.restRemainingSeconds > 0 && next.restRemainingSeconds <= 3 && lastCountdownCue !== next.restRemainingSeconds) {
    lastCountdownCue = next.restRemainingSeconds;
    void playCue("countdown", preferences.value);
  }
  if (type === "round-started") void playCue("exercise", preferences.value);
}
async function start() {
  error.value = "";
  try {
    await unlockAudio();
    engine?.stop();
    engine = new RepetitionEngine(TEST_ROUTINE, (event) => { update(event.state); eventSound(event.type, event.state); });
    engine.ready();
    await nextTick();
    if (!video.value) return;
    await camera.start(video.value);
    await detector.initialize();
    engine.start();
    loop();
  } catch (cause) {
    const name = cause instanceof DOMException ? cause.name : "";
    error.value = name === "NotAllowedError" ? "Permite el acceso a la cámara para iniciar la prueba." : name === "NotFoundError" ? "No se encontró una cámara disponible." : "No se pudo preparar la cámara o el detector.";
    engine?.stop();
    camera.stop();
  }
}
function loop() {
  frame = requestAnimationFrame(loop);
  if (!video.value || !engine || processing || state.value?.phase !== "active") return;
  processing = true;
  const started = performance.now();
  try {
    const landmarks = detector.detect(video.value, started);
    drawOverlay(landmarks);
    engine.recordInference(performance.now() - started);
    engine.processLandmarks(landmarks);
  } catch { engine.process("tracking-lost", "No se pudo leer la pose."); }
  finally { processing = false; }
}
function drawOverlay(landmarks?: Array<{ x: number; y: number }>) {
  const canvas = overlay.value, element = video.value;
  if (!canvas || !element) return;
  canvas.width = element.videoWidth || 640; canvas.height = element.videoHeight || 480;
  const context = canvas.getContext("2d"); if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!landmarks) return;
  const links = [[11, 12], [11, 23], [12, 24], [23, 24], [11, 13], [13, 15], [12, 14], [14, 16], [23, 25], [25, 27], [24, 26], [26, 28]];
  context.strokeStyle = state.value?.detectorState === "tracking-lost" ? "#f17d75" : "#b6f36c"; context.lineWidth = 3;
  links.forEach(([a, b]) => { const one = landmarks[a], two = landmarks[b]; if (!one || !two) return; context.beginPath(); context.moveTo(one.x * canvas.width, one.y * canvas.height); context.lineTo(two.x * canvas.width, two.y * canvas.height); context.stroke(); });
  context.fillStyle = "#f6f7f2";
  landmarks.forEach((point) => { context.beginPath(); context.arc(point.x * canvas.width, point.y * canvas.height, 3, 0, Math.PI * 2); context.fill(); });
}
function pauseOrResume() { if (state.value?.phase === "paused") engine?.resume(); else engine?.pause(); }
function stop() { engine?.stop(); cancelAnimationFrame(frame); camera.stop(); }
function restart() { stop(); engine = undefined; void start(); }
function leave() { stop(); detector.dispose(); }
function leaveAndReturn() { leave(); ionRouter.navigate("/rutinas", "back", "replace"); }
onBeforeUnmount(leave);
</script>

<template>
  <IonPage>
    <IonHeader class="session-header" translucent><IonToolbar><IonButtons slot="start"><button class="lab-back" aria-label="Volver a Rutinas" @click="leaveAndReturn">‹ <span>Rutinas</span></button></IonButtons></IonToolbar></IonHeader>
    <IonContent class="app-content" fullscreen><main class="app repetitions-lab" :class="{ 'repetitions-live': isSession }">
      <section v-if="!state || state.phase === 'idle' || state.phase === 'stopped' || state.phase === 'error'" class="hero repetition-prep">
        <h2>Rutina de prueba</h2><p>3 rondas: 5 sentadillas y 5 jumping jacks. Descansa 20 s al completar cada ejercicio.</p>
        <div class="repetition-plan"><span>1</span><p><strong>Sentadillas</strong><small>5 repeticiones · vista lateral</small></p><span>2</span><p><strong>Jumping jacks</strong><small>5 repeticiones · vista frontal</small></p></div>
        <button class="primary wide" @click="start">Iniciar prueba</button><p v-if="error" class="repetition-error">{{ error }}</p>
      </section>
      <section v-else class="repetition-session" :class="{ resting: state.phase === 'resting', preparing: isPreparing }">
        <div class="repetition-video"><video ref="video" autoplay muted playsinline></video><canvas ref="overlay" aria-label="Esqueleto detectado" /></div>
        <div class="repetition-shade"></div>
        <section v-if="state.phase === 'resting'" class="repetition-transition-screen" :class="{ preparing: isPreparing }">
          <p class="repetition-transition-label">{{ isPreparing ? 'Prepárate' : 'Descanso' }}</p>
          <h1 v-if="isPreparing">{{ nextExercise.name }}</h1>
          <div class="repetition-transition-ring" :style="{ '--progress': `${restProgress}%` }"><div><strong>{{ state.restRemainingSeconds }}</strong><span>s</span></div></div>
        </section>
        <section v-else-if="state.phase === 'completed'" class="repetition-complete-screen">
          <div class="session-complete-panel">
            <div class="session-complete-mark" aria-hidden="true"><IonIcon :icon="checkmark" /></div>
            <h1>Rutina completada.</h1>
            <p>Has completado tu rutina.</p>
            <button class="primary session-complete-exit" @click="leaveAndReturn">Volver al inicio</button>
          </div>
        </section>
        <div v-else class="repetition-hud">
          <div class="repetition-focus"><p class="repetition-exercise-meta">Ejercicio {{ state.exerciseIndex + 1 }} / {{ state.exerciseCount }}</p><!-- <p class="repetition-exercise-name">{{ view.name }}</p> --><div class="repetition-count-row"><button class="repetition-adjust" :class="{ hidden: state.phase !== 'active' }" :disabled="state.phase !== 'active'" aria-label="Restar una repetición" @click="engine?.removeRepetition()"><IonIcon :icon="remove" /></button><div class="repetition-count"><strong>{{ state.reps }}</strong><span>/ {{ state.targetReps }}</span></div><button class="repetition-adjust" :class="{ hidden: state.phase !== 'active' }" :disabled="state.phase !== 'active'" aria-label="Sumar una repetición" @click="engine?.addRepetition()"><IonIcon :icon="add" /></button></div><p v-if="state.isSetComplete || state.phase === 'paused'" class="repetition-status" :class="statusClass">{{ state.isSetComplete ? 'Serie completada' : 'Pausado' }}</p><p class="repetition-round">Ronda {{ state.round }} / {{ state.rounds }}</p><!-- <span class="repetition-view-pill">Vista {{ view.cameraView === 'side' ? 'lateral' : 'frontal' }}</span> --></div>
          <div class="repetition-main-actions"><button class="repetition-action restart-action" aria-label="Reiniciar" @click="restart"><IonIcon :icon="refresh" /></button><button class="repetition-action pause-action" :aria-label="state.phase === 'paused' ? 'Reanudar' : 'Pausar'" @click="pauseOrResume"><IonIcon :icon="state.phase === 'paused' ? play : pause" /></button><button class="repetition-action stop-action" aria-label="Terminar" @click="stop"><IonIcon :icon="stopCircle" /></button></div>
        </div>
      </section>
    </main></IonContent>
  </IonPage>
</template>
