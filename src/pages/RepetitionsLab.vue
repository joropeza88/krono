<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { IonButtons, IonContent, IonHeader, IonPage, IonToolbar, useIonRouter } from "@ionic/vue";
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
const observedReps = ref<number>();
let lastCountdownCue: number | undefined;
const view = computed(() => getExercise(state.value?.exerciseId ?? TEST_ROUTINE.exercises[0].exerciseId));
const isSession = computed(() => Boolean(state.value && !["idle", "stopped", "error"].includes(state.value.phase)));
const isPreparing = computed(() => state.value?.phase === "resting" && state.value.restRemainingSeconds > 0 && state.value.restRemainingSeconds <= 3);
const guidance = computed(() => {
  if (isPreparing.value) return "Prepárate: la siguiente ronda empieza en breve.";
  if (state.value?.phase === "resting") return "Recupera el aire. La siguiente ronda comienza enseguida.";
  if (state.value?.phase === "paused") return "Sesión pausada. Reanuda cuando estés listo.";
  if (state.value?.phase === "completed") return "Rutina terminada. Buen trabajo.";
  if (state.value?.detectorState === "tracking-lost") return "Aléjate un poco y muestra cuerpo completo, manos y pies.";
  return view.value.cameraView === "side" ? "Mantente de perfil y deja visible cadera, rodilla y tobillo." : "Mira de frente y deja visibles manos y pies.";
});

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
  observedReps.value = undefined;
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
function exportDiagnostics() {
  if (!state.value) return;
  const payload = { exportedAt: new Date().toISOString(), routine: TEST_ROUTINE, observedReps: observedReps.value ?? null, automaticReps: state.value.metrics.automaticReps, difference: observedReps.value === undefined ? null : state.value.metrics.automaticReps - observedReps.value, metrics: state.value.metrics };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = "krono-repeticiones-diagnostico.json"; link.click(); URL.revokeObjectURL(url);
}
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
        <div class="repetition-hud">
          <div class="repetition-session-top"><p class="eyebrow">{{ view.name }}</p><span>Vista {{ view.cameraView === 'side' ? 'lateral' : 'frontal' }}</span></div>
          <div class="repetition-focus"><p class="repetition-round">Ejercicio {{ state.exerciseIndex + 1 }} de {{ state.exerciseCount }} · Ronda {{ state.round }} de {{ state.rounds }}</p><div class="repetition-count"><strong>{{ state.phase === 'resting' ? state.restRemainingSeconds : state.reps }}</strong><span>{{ state.phase === 'resting' ? 's' : `/ ${state.targetReps}` }}</span></div><p class="repetition-status">{{ isPreparing ? 'Prepárate' : state.phase === 'resting' ? 'Descansando' : state.phase === 'paused' ? 'Pausado' : state.phase === 'completed' ? 'Prueba terminada' : state.detectorState === 'tracking-lost' ? 'Fuera de cuadro' : 'Detectando' }}</p><p class="repetition-guidance">{{ guidance }}</p></div>
          <div v-if="state.phase === 'completed'" class="repetition-finish"><p>{{ state.rounds }} rondas completadas · {{ state.metrics.manualCorrections }} correcciones.</p><label>Repeticiones observadas <input v-model.number="observedReps" type="number" min="0" inputmode="numeric" placeholder="Opcional" /></label><p v-if="observedReps !== undefined">Automáticas: {{ state.metrics.automaticReps }} · Diferencia: {{ state.metrics.automaticReps - observedReps }}</p><button class="secondary wide" @click="exportDiagnostics">Exportar diagnóstico</button><button class="primary wide" @click="restart">Repetir prueba</button></div>
          <template v-else><div class="repetition-controls"><button class="secondary" :disabled="state.phase !== 'active'" @click="engine?.removeRepetition()">−1</button><button class="secondary" :disabled="state.phase !== 'active'" @click="engine?.addRepetition()">+1</button></div><div class="repetition-controls repetition-actions"><button class="secondary" @click="pauseOrResume">{{ state.phase === 'paused' ? 'Reanudar' : 'Pausar' }}</button><button class="danger" @click="stop">Detener</button><button class="secondary" @click="restart">Reiniciar</button></div></template>
        </div>
      </section>
    </main></IonContent>
  </IonPage>
</template>
