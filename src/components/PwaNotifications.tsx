import { useRegisterSW } from 'virtual:pwa-register/react';
import Button from '@/components/Button';

export default function PwaNotifications() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError(error) {
      console.error('Service worker registration failed:', error);
    },
  });

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-2xl bg-surface p-3 shadow-xl ring-1 ring-border"
    >
      <p className="text-sm font-semibold">{needRefresh ? 'Update available' : 'Offline ready'}</p>
      {needRefresh ? (
        <Button onClick={() => void updateServiceWorker(true)}>Reload</Button>
      ) : (
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Got it
        </Button>
      )}
    </div>
  );
}
