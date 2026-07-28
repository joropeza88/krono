import type { AudioPreferences } from './types'

type Cue = 'countdown' | 'exercise' | 'rest'

const cueFiles: Record<Cue, string> = {
  countdown: 'get_ready',
  exercise: 'start',
  rest: 'rest',
}

const decodedSounds = new Map<string, AudioBuffer>()
const unavailableSounds = new Set<string>()
let audioContext: AudioContext | undefined

function getContext() {
  audioContext ??= new AudioContext()
  return audioContext
}

function packId(preferences: Pick<AudioPreferences, 'activeSoundPackId'>) {
  return preferences.activeSoundPackId?.trim() || 'default'
}

function soundUrl(pack: string, sound: string) {
  return `/sounds/${encodeURIComponent(pack)}/${sound}.mp3`
}

async function loadSound(url: string) {
  if (decodedSounds.has(url) || unavailableSounds.has(url)) return

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const audioData = await response.arrayBuffer()
    const decoded = await getContext().decodeAudioData(audioData)
    decodedSounds.set(url, decoded)
  } catch (error) {
    unavailableSounds.add(url)
    console.warn(`No se pudo cargar el sonido de Krono: ${url}`, error)
  }
}

/** Carga todos los recursos de un pack antes de permitir abrir la app. */
export async function preloadSoundPack(pack = 'default') {
  const packs = pack === 'default' ? ['default'] : ['default', pack]
  await Promise.all(packs.flatMap(currentPack => Object.values(cueFiles).map(sound => loadSound(soundUrl(currentPack, sound)))))
}

/** Debe invocarse desde el toque que inicia una rutina para desbloquear iOS. */
export function unlockAudio() {
  const context = getContext()
  if (context.state === 'suspended') void context.resume()
}

export function playCue(kind: Cue, preferences: AudioPreferences) {
  if (!preferences.enabled) return

  const sound = cueFiles[kind]
  const selectedUrl = soundUrl(packId(preferences), sound)
  const fallbackUrl = soundUrl('default', sound)
  const buffer = decodedSounds.get(selectedUrl) || decodedSounds.get(fallbackUrl)

  if (!buffer) {
    void preloadSoundPack(packId(preferences))
    console.warn(`El sonido ${sound} todavía no está listo.`)
    return
  }

  const context = getContext()
  const source = context.createBufferSource()
  const gain = context.createGain()
  source.buffer = buffer
  gain.gain.value = preferences.volume
  source.connect(gain).connect(context.destination)
  source.start()
}

export function playMotivation(preferences: AudioPreferences) {
  if (!preferences.enabled || !preferences.motivationalSoundsEnabled) return

  // Cuando cada pack incluya sonidos de motivación, seleccionar uno al azar aquí
  // y reproducirlo desde /sounds/<pack>/ mediante el mismo buffer precargado.
  console.log('Sonido motivacional pendiente de definir para el pack:', packId(preferences))
}
