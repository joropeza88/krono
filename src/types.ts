export type Routine = {
  id: string
  name: string
  exerciseDuration: number
  restDuration: number
  exerciseCount: number
  cycleCount: number
  createdAt: string
  updatedAt: string
}

export type AudioPreferences = {
  enabled: boolean
  volume: number
  motivationalSoundsEnabled: boolean
  activeSoundPackId: string
}

export type Phase = 'ready' | 'countdown' | 'exercise' | 'rest' | 'complete'
