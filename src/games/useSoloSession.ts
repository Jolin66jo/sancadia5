import { useCallback, useRef, useState } from 'react';

export type SoloStatus = 'playing' | 'won' | 'lost';

export interface SoloSessionState {
  attempts: number;
  status: SoloStatus;
  recorded: boolean;
}

export function useSoloSession() {
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<SoloStatus>('playing');
  const [recorded, setRecorded] = useState(false);
  const recordedRef = useRef(false);

  const restart = useCallback(() => {
    setAttempts(0);
    setStatus('playing');
    setRecorded(false);
    recordedRef.current = false;
  }, []);

  const markAttempt = useCallback(() => {
    setAttempts((value) => value + 1);
  }, []);

  const recordResult = useCallback((nextStatus: SoloStatus, onRecord?: () => void) => {
    if (recordedRef.current) return false;
    recordedRef.current = true;
    setRecorded(true);
    setStatus(nextStatus);
    onRecord?.();
    return true;
  }, []);

  return { attempts, status, recorded, restart, markAttempt, recordResult };
}
