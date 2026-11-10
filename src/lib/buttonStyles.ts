export type ButtonVariant = 'primary' | 'secondary' | 'danger';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary-hover',
  secondary: 'bg-surface text-foreground shadow-sm ring-1 ring-border hover:bg-primary-soft',
  danger: 'bg-danger text-danger-foreground shadow-md shadow-danger/20 hover:opacity-90',
};

export function buttonStyles(variant: ButtonVariant = 'primary', extra?: string) {
  return [base, variants[variant], extra].filter(Boolean).join(' ');
}
