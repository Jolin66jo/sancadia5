import { useCallback } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { playSound, type SoundEffect } from '@/lib/audio';
import { vibrate } from '@/lib/haptics';

const VIBRATION: Record<SoundEffect, number | number[]> = {
  tap: 8,
  place: 12,
  win: [40, 60, 40],
  lose: [60, 40],
  draw: 30,
  error: 20,
};

export function supportsVibration(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function useFeedback() {
  const { settings } = useSettings();

  const emit = useCallback(
    (effect: SoundEffect) => {
      if (settings.soundEnabled) playSound(effect, settings.volume);
      vibrate(settings.vibrationEnabled, VIBRATION[effect]);
    },
    [settings.soundEnabled, settings.vibrationEnabled, settings.volume],
  );

  const tap = useCallback(() => emit('tap'), [emit]);
  const place = useCallback(() => emit('place'), [emit]);
  const win = useCallback(() => emit('win'), [emit]);
  const lose = useCallback(() => emit('lose'), [emit]);
  const draw = useCallback(() => emit('draw'), [emit]);

  return { tap, place, win, lose, draw };
}
