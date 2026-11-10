import type { ReactNode } from 'react';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface SecretEntryProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  error?: string;
  children?: ReactNode;
  onConfirm: () => void;
}

export default function SecretEntry({
  label,
  value,
  onChange,
  maxLength,
  error,
  children,
  onConfirm,
}: SecretEntryProps) {
  return (
    <Card className="grid gap-4 p-4">
      <label className="grid gap-2 text-sm font-semibold text-primary">
        {label}
        <input
          aria-label={label}
          autoComplete="new-password"
          className="min-h-12 rounded-xl border border-border bg-background px-3 text-center text-lg tracking-[0.3em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          type="password"
          value={value}
        />
      </label>
      {children}
      {error && (
        <p aria-live="polite" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button onClick={onConfirm}>Confirm secret</Button>
    </Card>
  );
}
