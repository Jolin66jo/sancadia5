export type SoundEffect = 'tap' | 'place' | 'win' | 'lose' | 'draw' | 'error';

const NOTES: Record<SoundEffect, readonly number[]> = {
  tap: [520],
  place: [440, 660],
  win: [523, 659, 784],
  lose: [392, 330, 262],
  draw: [440, 392],
  error: [220, 180],
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return null;
  try {
    audioContext ??= new AudioContextConstructor();
    return audioContext;
  } catch {
    return null;
  }
}

export function playSound(effect: SoundEffect, volume: number): void {
  const context = getAudioContext();
  if (!context || volume <= 0) return;

  const now = context.currentTime;
  const notes = NOTES[effect];
  notes.forEach((frequency, index) => {
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.11;
      oscillator.type = effect === 'error' ? 'square' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.12), start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.13);
    } catch {
      // Audio output is optional and may be unavailable in the current browser context.
    }
  });

  if (context.state === 'suspended') void context.resume().catch(() => undefined);
}
