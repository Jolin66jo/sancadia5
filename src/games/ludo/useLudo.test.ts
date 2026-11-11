import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLudo } from '@/games/ludo/useLudo';

describe('Ludo timer cleanup', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('clears a pending die roll when the game unmounts', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { result, unmount } = renderHook(() => useLudo());

    act(() => result.current.roll());
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('clears a pending die roll when a new game starts', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { result } = renderHook(() => useLudo());

    act(() => result.current.roll());
    act(() => result.current.start(4));

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(result.current.tokens).toHaveLength(4);
  });
});
