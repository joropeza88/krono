<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { IonButtons, IonContent, IonHeader, IonPage, IonToolbar, useIonRouter } from "@ionic/vue";
import { CameraManager, exercises, getExercise, PoseDetector, RepetitionEngine, type ExerciseId, type RepetitionState } from "../modules/repetitions";
import { playCue, unlockAudio } from "../audio";
import { usePreferencesStore } from "../stores/usePreferencesStore";

const DEFAULTS = { targetReps: 15, restSeconds: 20, rounds: 3 } as const;
const ionRouter = useIonRouter();
const { preferences } = usePreferencesStore();
const video = ref<HTMLVideoElement>();
const overlay = ref<HTMLCanvasElement>();
const exerciseId = ref<ExerciseId>("squat");
const showDebug = ref(true);
const camera = new CameraManager();
const detector = new PoseDetector();
let engine: RepetitionEngine | undefined;
let frame = 0;
let processing = false;
const error = ref("");
const debugDetail = ref("Preparando");
const state = ref<RepetitionState>();
const observedReps = ref<number>();
const view = computed(() => getExercise(exerciseId.value));
const averageMs = computed(() => { const samples = state.value?.metrics.inferenceMs ?? []; return samples.length ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length) : 0; });
const fps = computed(() => averageMs.value ? Math.round(1000 / averageMs.value) : 0);

function update(next: RepetitionState) { state.value = next; }
function eventSound(type: string) {
  if (type === "rep-counted") void playCue("exercise", preferences.value);
  if (type === "rest-started" || type === "round-started") void playCue("rest", preferences.value);
}
async function start() {
  error.value = "";
  observedReps.value = undefined;
  try {
    await unlockAudio();
    engine?.stop();
    engine = new RepetitionEngine({ exerciseId: exerciseId.value, ...DEFAULTS }, (event) => { update(event.state); debugDetail.value = "detail" in event ? event.detail ?? event.type : event.type; eventSound(event.type); });
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
  context.strokeStyle = "#b6f36c"; context.lineWidth = 3;
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
  const payload = { exportedAt: new Date().toISOString(), routine: { exerciseId: exerciseId.value, ...DEFAULTS }, observedReps: observedReps.value ?? null, automaticReps: state.value.metrics.automaticReps, difference: observedReps.value === undefined ? null : state.value.metrics.automaticReps - observedReps.value, metrics: state.value.metrics };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = "krono-repeticiones-diagnostico.json"; link.click(); URL.revokeObjectURL(url);
}
onBeforeUnmount(leave);
</script>

<template>
  <IonPage>
    <IonHeader class="session-header" translucent><IonToolbar><IonButtons slot="start"><button class="lab-back" aria-label="Volver a Rutinas" @click="leaveAndReturn">‹ <span>Rutinas</span></button></IonButtons></IonToolbar></IonHeader>
    <IonContent class="app-content" fullscreen><main class="app repetitions-lab">
      <p class="eyebrow">Laboratorio · cámara local</p><h1 class="title">Repeticiones.</h1>
      <section v-if="!state || state.phase === 'idle' || state.phase === 'stopped' || state.phase === 'error'" class="hero repetition-prep">
        <h2>Rutina de prueba</h2><p>15 repeticiones · 20 s de descanso · 3 rondas. Coloca el teléfono estable a 2–3 m y muestra el cuerpo completo.</p>
        <label>Ejercicio<select v-model="exerciseId"><option v-for="exercise in exercises" :key="exercise.id" :value="exercise.id">{{ exercise.name }}</option></select></label>
        <p class="repetition-view">Vista recomendada: <strong>{{ view.cameraView === 'side' ? 'Lateral' : 'Frontal' }}</strong></p>
        <button class="primary wide" @click="start">Iniciar prueba</button><p v-if="error" class="repetition-error">{{ error }}</p>
      </section>
      <section v-else class="repetition-session">
        <p class="eyebrow">{{ view.name }} · vista {{ view.cameraView === 'side' ? 'lateral' : 'frontal' }}</p>
        <div class="repetition-count"><strong>{{ state.reps }}</strong><span>/ {{ state.targetReps }}</span></div>
        <p class="repetition-round">Ronda {{ state.round }} de {{ state.rounds }}</p>
        <p class="repetition-status">{{ state.phase === 'resting' ? `Descansando · ${state.restRemainingSeconds}s` : state.phase === 'paused' ? 'Pausado' : state.phase === 'completed' ? 'Prueba terminada' : state.detectorState === 'tracking-lost' ? 'Fuera de cuadro' : 'Detectando' }}</p>
        <div v-if="state.phase === 'completed'" class="hero repetition-completed"><h2>¡Completada!</h2><p>{{ state.rounds }} rondas de {{ state.targetReps }} repeticiones. Correcciones manuales: {{ state.metrics.manualCorrections }}.</p><label>Repeticiones observadas <input v-model.number="observedReps" type="number" min="0" inputmode="numeric" placeholder="Opcional" /></label><p v-if="observedReps !== undefined">Automáticas: {{ state.metrics.automaticReps }} · Diferencia: {{ state.metrics.automaticReps - observedReps }}</p><button class="secondary wide" @click="exportDiagnostics">Exportar diagnóstico JSON</button><button class="primary wide" @click="restart">Repetir prueba</button></div>
        <template v-else><div class="repetition-controls"><button class="secondary" :disabled="state.phase !== 'active'" @click="engine?.removeRepetition()">−1</button><button class="secondary" :disabled="state.phase !== 'active'" @click="engine?.addRepetition()">+1</button></div><div class="repetition-controls"><button class="secondary" @click="pauseOrResume">{{ state.phase === 'paused' ? 'Reanudar' : 'Pausar' }}</button><button class="danger" @click="stop">Detener</button><button class="secondary" @click="restart">Reiniciar</button></div></template>
        <label class="debug-toggle"><input v-model="showDebug" type="checkbox" /> Mostrar depuración</label>
        <section v-show="showDebug" class="repetition-debug"><div class="repetition-video"><video ref="video" autoplay muted playsinline></video><canvas ref="overlay" aria-label="Esqueleto detectado" /></div><p>Estado: {{ debugDetail }}</p><p>{{ fps }} FPS · {{ averageMs }} ms por inferencia · {{ state.metrics.trackingLosses }} pérdidas de seguimiento</p></section>
      </section>
    </main></IonContent>
  </IonPage>
</template>
