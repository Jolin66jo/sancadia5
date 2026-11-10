import type { HTMLAttributes } from 'react';

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border ${className ?? ''}`.trim()}
      {...props}
    />
  );
}
