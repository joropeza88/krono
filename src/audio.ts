import type { AudioPreferences } from './types'

type Cue = 'countdown' | 'exercise' | 'rest'

const cueFiles: Record<Cue, string> = {
  countdown: 'get_ready',
  exercise: 'start',
  rest: 'rest',
}

const decodedSounds = new Map<string, AudioBuffer>()
const loadingSounds = new Map<string, Promise<boolean>>()
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

async function loadSound(url: string): Promise<boolean> {
  if (decodedSounds.has(url)) return true

  const pending = loadingSounds.get(url)
  if (pending) return pending

  const request = (async () => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const audioData = await response.arrayBuffer()
      const decoded = await getContext().decodeAudioData(audioData)
      decodedSounds.set(url, decoded)
      return true
    } catch (error) {
      console.warn(`No se pudo cargar el sonido de Krono: ${url}`, error)
      return false
    } finally {
      loadingSounds.delete(url)
    }
  })()

  loadingSounds.set(url, request)
  return request
}

/** Carga todos los recursos de un pack antes de permitir abrir la app. */
export async function preloadSoundPack(pack = 'default') {
  const packs = pack === 'default' ? ['default'] : ['default', pack]
  await Promise.all(packs.flatMap(currentPack => Object.values(cueFiles).map(sound => loadSound(soundUrl(currentPack, sound)))))
}

/** Debe invocarse desde el toque que inicia una rutina para desbloquear iOS. */
export async function unlockAudio() {
  const context = getContext()
  try {
    if (context.state !== 'running') await context.resume()
    if (context.state !== 'running') return false

    // iOS puede requerir una reproducción dentro del toque inicial para dejar
    // preparado el canal de salida antes de los avisos del temporizador.
    const silentBuffer = context.createBuffer(1, 1, context.sampleRate)
    const source = context.createBufferSource()
    source.buffer = silentBuffer
    source.connect(context.destination)
    source.start()
    return true
  } catch (error) {
    console.warn('No se pudo activar el audio de Krono.', error)
    return false
  }
}

export async function playCue(kind: Cue, preferences: AudioPreferences) {
  if (!preferences.enabled) return

  const sound = cueFiles[kind]
  const selectedUrl = soundUrl(packId(preferences), sound)
  const fallbackUrl = soundUrl('default', sound)
  let buffer = decodedSounds.get(selectedUrl) || decodedSounds.get(fallbackUrl)

  if (!buffer) {
    await loadSound(selectedUrl)
    if (!decodedSounds.has(selectedUrl) && selectedUrl !== fallbackUrl) await loadSound(fallbackUrl)
    buffer = decodedSounds.get(selectedUrl) || decodedSounds.get(fallbackUrl)
  }
  if (!buffer) return

  const context = getContext()
  if (context.state !== 'running') {
    console.warn(`El contexto de audio no está activo para reproducir ${sound}.`)
    return
  }
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
