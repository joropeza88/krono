import { computed, ref } from "vue";
import { playCue, playMotivation, unlockAudio } from "../audio";
import { createCountdownTimer } from "../services/countdownTimer";
import { releaseScreenWakeLock, requestScreenWakeLock } from "../services/wakeLock";
import { usePreferencesStore } from "./usePreferencesStore";
import type { Phase, Routine } from "../types";

const { preferences } = usePreferencesStore();
const activeRoutine = ref<Routine | null>(null);
const phase = ref<Phase>("ready");
const remaining = ref(0);
const phaseDuration = ref(0);
const exercise = ref(1);
const cycle = ref(1);
const paused = ref(false);
let pausedRemaining = 0;
let motivationCued = false;

const progress = computed(() =>
  phaseDuration.value
    ? Math.max(
        0,
        Math.min(100, ((phaseDuration.value - remaining.value) / phaseDuration.value) * 100),
      )
    : 0,
);
const isActive = computed(
  () => activeRoutine.value !== null && phase.value !== "complete" && !paused.value,
);

async function updateWakeLock() {
  if (isActive.value) await requestScreenWakeLock();
  else await releaseScreenWakeLock();
}

function startPhase(nextPhase: Phase, seconds: number, deadline = Date.now() + seconds * 1000) {
  phase.value = nextPhase;
  motivationCued = false;
  if (nextPhase === "countdown") void playCue("countdown", preferences.value);
  if (nextPhase === "exercise") {
    void playCue("exercise", preferences.value);
    navigator.vibrate?.(90);
  }
  if (nextPhase === "rest") void playCue("rest", preferences.value);
  countdown.start(seconds, deadline);
}

const countdown = createCountdownTimer(({ remaining: nextRemaining, duration }) => {
  remaining.value = nextRemaining;
  phaseDuration.value = duration;
  const routine = activeRoutine.value;
  if (phase.value === "rest" && remaining.value <= 3 && routine) {
    if (exercise.value < routine.exerciseCount) {
      exercise.value++;
      return startPhase("countdown", 3, countdown.deadline);
    }
    if (cycle.value < routine.cycleCount) {
      cycle.value++;
      exercise.value = 1;
      return startPhase("countdown", 3, countdown.deadline);
    }
  }
  if (
    phase.value === "exercise" &&
    remaining.value === Math.max(2, Math.floor(phaseDuration.value / 2)) &&
    !motivationCued
  ) {
    motivationCued = true;
    playMotivation(preferences.value);
  }
}, advance);

function advance() {
  const routine = activeRoutine.value;
  if (!routine) return;
  if (phase.value === "countdown") return startPhase("exercise", routine.exerciseDuration);
  if (phase.value === "exercise") {
    if (exercise.value === routine.exerciseCount && cycle.value === routine.cycleCount)
      return complete();
    return startPhase("rest", routine.restDuration);
  }
  if (phase.value === "rest") {
    if (exercise.value < routine.exerciseCount) {
      exercise.value++;
      return startPhase("countdown", 3);
    }
    if (cycle.value < routine.cycleCount) {
      cycle.value++;
      exercise.value = 1;
      return startPhase("countdown", 3);
    }
    complete();
  }
}

async function start(routine: Routine) {
  await unlockAudio();
  prepare(routine);
  await updateWakeLock();
  startPhase("countdown", 3);
}

function prepare(routine: Routine) {
  countdown.stop();
  activeRoutine.value = routine;
  phase.value = "ready";
  remaining.value = 0;
  phaseDuration.value = 0;
  exercise.value = 1;
  cycle.value = 1;
  paused.value = false;
  pausedRemaining = 0;
}

async function togglePause() {
  if (paused.value) {
    await unlockAudio();
    paused.value = false;
    countdown.start(pausedRemaining);
    await updateWakeLock();
  } else {
    paused.value = true;
    pausedRemaining = countdown.pause();
    await updateWakeLock();
  }
}

function complete() {
  countdown.stop();
  remaining.value = 0;
  phase.value = "complete";
  void updateWakeLock();
  navigator.vibrate?.([70, 70, 180]);
}

function finish() {
  countdown.stop();
  activeRoutine.value = null;
  phase.value = "ready";
  paused.value = false;
  void updateWakeLock();
}

export function useRoutineSessionStore() {
  return {
    activeRoutine,
    phase,
    remaining,
    exercise,
    cycle,
    paused,
    progress,
    isActive,
    prepare,
    start,
    togglePause,
    finish,
    complete,
  };
}
