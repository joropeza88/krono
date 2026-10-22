import { computed, ref } from "vue";
import { playCue, unlockAudio } from "../audio";
import { createCountdownTimer } from "../services/countdownTimer";
import { releaseScreenWakeLock, requestScreenWakeLock } from "../services/wakeLock";
import { usePreferencesStore } from "./usePreferencesStore";

type TimerPhase = "setup" | "running" | "complete";

const { preferences } = usePreferencesStore();
const minutes = ref(10);
const phase = ref<TimerPhase>("setup");
const remaining = ref(0);
const paused = ref(false);
let pausedRemaining = 0;

const progress = computed(() => {
  const duration = minutes.value * 60;
  return duration ? Math.max(0, Math.min(100, ((duration - remaining.value) / duration) * 100)) : 0;
});
const isActive = computed(() => phase.value === "running" && !paused.value);

async function updateWakeLock() {
  if (isActive.value) await requestScreenWakeLock();
  else await releaseScreenWakeLock();
}

const countdown = createCountdownTimer(({ remaining: nextRemaining }) => {
  remaining.value = nextRemaining;
}, complete);

async function start() {
  if (minutes.value < 1) return;
  await unlockAudio();
  prepare();
  phase.value = "running";
  void playCue("exercise", preferences.value);
  await updateWakeLock();
  countdown.start(remaining.value);
}

function prepare() {
  countdown.stop();
  phase.value = "setup";
  paused.value = false;
  pausedRemaining = 0;
  remaining.value = minutes.value * 60;
}

async function togglePause() {
  if (paused.value) {
    await unlockAudio();
    paused.value = false;
    countdown.start(pausedRemaining);
  } else {
    paused.value = true;
    pausedRemaining = countdown.pause();
  }
  await updateWakeLock();
}

function complete() {
  countdown.stop();
  remaining.value = 0;
  paused.value = false;
  phase.value = "complete";
  void playCue("rest", preferences.value);
  void updateWakeLock();
  navigator.vibrate?.([70, 70, 180]);
}

function reset() {
  countdown.stop();
  phase.value = "setup";
  paused.value = false;
  remaining.value = 0;
  void updateWakeLock();
}

export function useTimerSessionStore() {
  return {
    minutes,
    phase,
    remaining,
    paused,
    progress,
    isActive,
    prepare,
    start,
    togglePause,
    reset,
  };
}
