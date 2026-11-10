export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string | number> {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-2 rounded-2xl bg-background p-1 ring-1 ring-border min-[400px]:auto-cols-fr min-[400px]:grid-flow-col"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${
              selected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-primary-soft'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
