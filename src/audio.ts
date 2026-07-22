import type { AudioPreferences } from './types'

let context: AudioContext | undefined
let previousMotivation = -1

function getContext() {
  context ??= new AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

function tone(frequency: number, seconds: number, volume: number, type: OscillatorType = 'sine') {
  const ctx = getContext()
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.16), ctx.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start()
  oscillator.stop(ctx.currentTime + seconds + 0.03)
}

export function playCue(kind: 'countdown' | 'exercise' | 'rest' | 'complete', preferences: AudioPreferences) {
  if (!preferences.enabled) return
  const volume = preferences.volume
  if (kind === 'countdown') tone(880, 0.1, volume, 'square')
  if (kind === 'exercise') { tone(660, 0.16, volume, 'triangle'); window.setTimeout(() => tone(990, 0.22, volume, 'triangle'), 150) }
  if (kind === 'rest') tone(440, 0.3, volume, 'sine')
  if (kind === 'complete') [523, 659, 784].forEach((pitch, index) => window.setTimeout(() => tone(pitch, 0.25, volume, 'triangle'), index * 140))
}

export function playMotivation(preferences: AudioPreferences) {
  if (!preferences.enabled || !preferences.motivationalSoundsEnabled) return
  const options = [740, 830, 932, 1046]
  let choice = Math.floor(Math.random() * options.length)
  if (options.length > 1 && choice === previousMotivation) choice = (choice + 1) % options.length
  previousMotivation = choice
  tone(options[choice], 0.2, preferences.volume, 'triangle')
}
