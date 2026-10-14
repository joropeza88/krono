<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { playCue, playMotivation, preloadSoundPack, unlockAudio } from './audio'
import { loadPreferences, loadRoutines, savePreferences, saveRoutines } from './storage'
import type { Phase, Routine } from './types'

type View = 'home' | 'form' | 'session' | 'settings'
const routines = ref<Routine[]>(loadRoutines())
const preferences = ref(loadPreferences())
const isLoading = ref(true)
const view = ref<View>('home')
const editingId = ref<string | null>(null)
const form = ref({ name: '', exerciseDuration: 30, restDuration: 15, exerciseCount: 4, cycleCount: 3 })
const activeRoutine = ref<Routine | null>(null)
const phase = ref<Phase>('ready')
const remaining = ref(0)
const phaseDuration = ref(0)
const exercise = ref(1)
const cycle = ref(1)
const paused = ref(false)
let timer: number | undefined
let endsAt = 0
let pausedRemaining = 0
let motivationCued = false

watch(routines, value => saveRoutines(value), { deep: true })
watch(preferences, value => savePreferences(value), { deep: true })

const progress = computed(() => phaseDuration.value ? Math.max(0, Math.min(100, ((phaseDuration.value - remaining.value) / phaseDuration.value) * 100)) : 0)
const sessionLabel = computed(() => ({ countdown: 'Prepárate', exercise: 'A entrenar', rest: 'Recupera', complete: '¡Completado!', ready: '' })[phase.value])
const timerTitle = computed(() => phase.value === 'exercise' ? `Ejercicio ${exercise.value}` : phase.value === 'rest' ? 'Descanso' : phase.value === 'countdown' ? 'Siguiente ejercicio' : activeRoutine.value?.name || '')
const formattedTime = computed(() => `${Math.floor(remaining.value / 60).toString().padStart(2, '0')}:${(remaining.value % 60).toString().padStart(2, '0')}`)

onMounted(async () => {
  await preloadSoundPack(preferences.value.activeSoundPackId || 'default')
  isLoading.value = false
})

function id() { return crypto.randomUUID?.() || `${Date.now()}-${Math.random()}` }
function newRoutine() { editingId.value = null; form.value = { name: '', exerciseDuration: 30, restDuration: 15, exerciseCount: 4, cycleCount: 3 }; view.value = 'form' }
function editRoutine(routine: Routine) { editingId.value = routine.id; form.value = { name: routine.name, exerciseDuration: routine.exerciseDuration, restDuration: routine.restDuration, exerciseCount: routine.exerciseCount, cycleCount: routine.cycleCount }; view.value = 'form' }
function saveRoutine(andStart = false) {
  const now = new Date().toISOString()
  const input = form.value
  if (!input.name.trim() || [input.exerciseDuration, input.restDuration, input.exerciseCount, input.cycleCount].some(value => value < 1)) return
  const routine: Routine = { ...input, name: input.name.trim(), id: editingId.value || id(), createdAt: now, updatedAt: now }
  if (editingId.value) { const old = routines.value.find(item => item.id === editingId.value); routine.createdAt = old?.createdAt || now; routines.value = routines.value.map(item => item.id === routine.id ? routine : item) } else routines.value.unshift(routine)
  andStart ? startRoutine(routine) : view.value = 'home'
}
function removeRoutine(routine: Routine) { if (confirm(`¿Eliminar “${routine.name}”?`)) routines.value = routines.value.filter(item => item.id !== routine.id) }
function startRoutine(routine: Routine) { unlockAudio(); activeRoutine.value = routine; exercise.value = 1; cycle.value = 1; paused.value = false; view.value = 'session'; startPhase('countdown', 3) }
function startPhase(nextPhase: Phase, seconds: number, deadline = Date.now() + seconds * 1000) {
  window.clearInterval(timer); phase.value = nextPhase; phaseDuration.value = seconds; endsAt = deadline; remaining.value = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)); motivationCued = false
  if (nextPhase === 'countdown') playCue('countdown', preferences.value)
  if (nextPhase === 'exercise') { playCue('exercise', preferences.value); navigator.vibrate?.(90) }
  if (nextPhase === 'rest') playCue('rest', preferences.value)
  timer = window.setInterval(tick, 100)
}
function tick() {
  remaining.value = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
  if (phase.value === 'rest' && remaining.value <= 3 && activeRoutine.value) {
    if (exercise.value < activeRoutine.value.exerciseCount) { exercise.value++; return startPhase('countdown', 3, endsAt) }
    if (cycle.value < activeRoutine.value.cycleCount) { cycle.value++; exercise.value = 1; return startPhase('countdown', 3, endsAt) }
  }
  if (phase.value === 'exercise' && remaining.value === Math.max(2, Math.floor(phaseDuration.value / 2)) && !motivationCued) { motivationCued = true; playMotivation(preferences.value) }
  if (remaining.value <= 0) advance()
}
function advance() {
  if (!activeRoutine.value) return
  if (phase.value === 'countdown') return startPhase('exercise', activeRoutine.value.exerciseDuration)
  if (phase.value === 'exercise') return startPhase('rest', activeRoutine.value.restDuration)
  if (phase.value === 'rest') {
    if (exercise.value < activeRoutine.value.exerciseCount) { exercise.value++; return startPhase('countdown', 3) }
    if (cycle.value < activeRoutine.value.cycleCount) { cycle.value++; exercise.value = 1; return startPhase('countdown', 3) }
    window.clearInterval(timer); phase.value = 'complete'; navigator.vibrate?.([70, 70, 180])
  }
}
function togglePause() { if (paused.value) { paused.value = false; endsAt = Date.now() + pausedRemaining * 1000; timer = window.setInterval(tick, 100) } else { paused.value = true; pausedRemaining = remaining.value; window.clearInterval(timer) } }
function endSession() { window.clearInterval(timer); activeRoutine.value = null; phase.value = 'ready'; view.value = 'home' }
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <main v-if="isLoading" class="app session">
    <div class="session-state">Preparando Krono</div>
    <h1 class="session-title">Cargando sonidos</h1>
    <div class="timer-wrap" style="--progress: 68%"><div class="timer"><strong>···</strong><span>un momento</span></div></div>
    <p class="session-meta">Estamos dejando todo listo para tu entrenamiento.</p>
  </main>
  <main v-else class="app" :class="phase">
    <template v-if="view === 'home'">
      <header class="top"><div class="brand">kron<i>o</i></div><button class="icon-button" aria-label="Ajustes" @click="view = 'settings'">⚙</button></header>
      <p class="eyebrow">Tu ritmo, tus reglas</p><h1 class="title">Entrena por<br>intervalos.</h1>
      <section class="hero"><h2>Listo cuando tú.</h2><p>Crea una rutina y deja que Krono marque el ritmo.</p><button class="primary" @click="newRoutine">Crear rutina</button></section>
      <div class="section-head"><h2>Tus rutinas</h2><span class="eyebrow">{{ routines.length }}</span></div>
      <div v-if="routines.length" class="routine-list"><article v-for="routine in routines" :key="routine.id" class="routine"><div><h3>{{ routine.name }}</h3><p>{{ routine.exerciseCount }} ejercicios · {{ routine.cycleCount }} ciclos · {{ routine.exerciseDuration }}s / {{ routine.restDuration }}s</p><div class="routine-actions"><button class="text-button" @click="editRoutine(routine)">Editar</button><button class="text-button delete" @click="removeRoutine(routine)">Eliminar</button></div></div><button class="play" :aria-label="`Iniciar ${routine.name}`" @click="startRoutine(routine)">▶</button></article></div>
      <div v-else class="empty">Aún no tienes rutinas. Crea la primera y empieza a moverte.</div>
    </template>

    <template v-else-if="view === 'form'">
      <button class="back" @click="view = 'home'">← Volver</button><p class="eyebrow">{{ editingId ? 'Editar' : 'Nueva' }} rutina</p><h1 class="title">Ponle ritmo<br>a tu sesión.</h1>
      <form class="form" @submit.prevent="saveRoutine()"><label class="field">Nombre<input v-model="form.name" required maxlength="40" placeholder="Ej. HIIT mañanero" /></label><div class="field-grid"><label class="field">Ejercicio (seg)<input v-model.number="form.exerciseDuration" min="1" max="3600" type="number" required /></label><label class="field">Descanso (seg)<input v-model.number="form.restDuration" min="1" max="3600" type="number" required /></label></div><div class="field-grid"><label class="field">Ejercicios<input v-model.number="form.exerciseCount" min="1" max="99" type="number" required /></label><label class="field">Ciclos<input v-model.number="form.cycleCount" min="1" max="99" type="number" required /></label></div><div class="form-actions"><button class="primary wide" type="submit">Guardar rutina</button><button class="secondary wide" type="button" @click="saveRoutine(true)">Guardar y empezar</button></div></form>
    </template>

    <template v-else-if="view === 'session'">
      <section class="session"><button class="back" @click="endSession">← Salir de sesión</button><div class="session-state">{{ sessionLabel }}</div><h1 class="session-title">{{ timerTitle }}</h1><div class="timer-wrap" :style="{ '--progress': `${progress}%` }"><div class="timer"><strong>{{ formattedTime }}</strong><span v-if="phase !== 'complete'">{{ phase === 'exercise' ? 'mantén el ritmo' : phase === 'rest' ? 'respira' : 'empieza en breve' }}</span></div></div><p class="session-meta" v-if="activeRoutine && phase !== 'complete'">Ejercicio {{ exercise }} de {{ activeRoutine.exerciseCount }} · Ciclo {{ cycle }} de {{ activeRoutine.cycleCount }}</p><p class="session-meta" v-else>Rutina finalizada. Gran trabajo.</p><div class="session-controls" v-if="phase !== 'complete'"><button class="primary" @click="togglePause">{{ paused ? 'Reanudar' : 'Pausar' }}</button><button class="secondary" @click="startRoutine(activeRoutine!)">Reiniciar</button><button class="danger" @click="endSession">Finalizar sesión</button></div><button v-else class="primary wide" @click="endSession">Volver al inicio</button></section>
    </template>

    <template v-else>
      <button class="back" @click="view = 'home'">← Volver</button><p class="eyebrow">Preferencias</p><h1 class="title">Tu experiencia.</h1><section class="settings"><div class="setting"><div><strong>Sonidos</strong><p>Señales de inicio y descanso.</p></div><input v-model="preferences.enabled" class="switch" type="checkbox" /></div><div class="setting"><div><strong>Motivación aleatoria</strong><p>Preparada para futuros packs de sonido.</p></div><input v-model="preferences.motivationalSoundsEnabled" :disabled="!preferences.enabled" class="switch" type="checkbox" /></div><div class="setting"><div><strong>Volumen</strong><p>{{ Math.round(preferences.volume * 100) }}%</p></div><input v-model.number="preferences.volume" class="range" type="range" min="0" max="1" step="0.05" /></div><div class="setting"><div><strong>Pack activo</strong><p>{{ preferences.activeSoundPackId || 'default' }}.</p></div><span>✦</span></div><p class="notice">Los futuros packs de voces o personajes se añadirán aquí. Tus rutinas permanecen solo en este dispositivo.</p></section>
    </template>
  </main>
</template>
