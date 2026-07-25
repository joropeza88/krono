import type { AudioPreferences } from './types'

type Cue = 'countdown' | 'exercise' | 'rest'

const cueFiles: Record<Cue, string> = {
  countdown: 'get_ready',
  exercise: 'start',
  rest: 'rest',
}

function packId(preferences: AudioPreferences) {
  return preferences.activeSoundPackId?.trim() || 'default'
}

function soundUrl(pack: string, sound: string) {
  return `/sounds/${encodeURIComponent(pack)}/${sound}.mp3`
}

function playAudio(url: string, volume: number, fallbackUrl?: string) {
  const audio = new Audio(url)
  audio.preload = 'auto'
  audio.volume = volume

  if (fallbackUrl) {
    audio.addEventListener('error', () => playAudio(fallbackUrl, volume), { once: true })
  }

  void audio.play().catch(error => {
    // El navegador puede bloquear audio si la sesión no proviene de un gesto del usuario.
    console.warn('No se pudo reproducir el sonido de Krono.', error)
  })
}

export function playCue(kind: Cue, preferences: AudioPreferences) {
  if (!preferences.enabled) return

  const sound = cueFiles[kind]
  const selectedPack = packId(preferences)
  const selectedUrl = soundUrl(selectedPack, sound)
  const fallbackUrl = selectedPack === 'default' ? undefined : soundUrl('default', sound)

  playAudio(selectedUrl, preferences.volume, fallbackUrl)
}

export function playMotivation(preferences: AudioPreferences) {
  if (!preferences.enabled || !preferences.motivationalSoundsEnabled) return

  // Cuando cada pack incluya sonidos de motivación, seleccionar uno al azar aquí
  // y reproducirlo desde /sounds/<pack>/.
  console.log('Sonido motivacional pendiente de definir para el pack:', packId(preferences))
}
