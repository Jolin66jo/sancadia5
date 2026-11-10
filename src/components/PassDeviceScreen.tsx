import Button from '@/components/Button';

export default function PassDeviceScreen({
  onContinue,
  title = 'Pass the device to Player 2',
  description = 'Tap when ready so the secret stays hidden from view.',
}: {
  onContinue: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-surface p-6 text-center shadow-soft">
      <div className="text-5xl" aria-hidden="true">
        📱
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-primary">{title}</h2>
        <p className="text-subtle">{description}</p>
      </div>
      <Button onClick={onContinue}>Continue</Button>
    </div>
  );
}
