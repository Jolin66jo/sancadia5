export function vibrate(enabled: boolean, pattern: number | number[]) {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function')
    return;
  navigator.vibrate(pattern);
}

export const HAPTICS = {
  move: 12,
  gameEnd: [40, 60, 40],
};
