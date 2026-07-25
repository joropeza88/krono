import type { AudioPreferences, Routine } from './types'

const ROUTINES_KEY = 'krono-routines'
const PREFERENCES_KEY = 'krono-preferences'

export const defaultPreferences: AudioPreferences = {
  enabled: true,
  volume: 0.55,
  motivationalSoundsEnabled: true,
  activeSoundPackId: 'default',
}

export function loadRoutines(): Routine[] {
  try { return JSON.parse(localStorage.getItem(ROUTINES_KEY) || '[]') } catch { return [] }
}

export function saveRoutines(routines: Routine[]) {
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines))
}

export function loadPreferences(): AudioPreferences {
  try {
    const preferences = { ...defaultPreferences, ...JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}') }
    // Compatibilidad con la primera versión, que usaba un pack sintético llamado starter.
    if (!preferences.activeSoundPackId || preferences.activeSoundPackId === 'starter') preferences.activeSoundPackId = 'default'
    return preferences
  } catch { return defaultPreferences }
}

export function savePreferences(preferences: AudioPreferences) {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
}
