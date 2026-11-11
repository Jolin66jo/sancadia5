import { useEffect, useId, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export default function Dialog({ open, onClose, title, description, icon, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2.5rem)] max-w-sm overflow-y-auto overscroll-contain rounded-3xl bg-surface p-6 text-foreground shadow-xl ring-1 ring-border backdrop:bg-background/70 open:animate-fade-in"
    >
      {icon && <div className="mb-4">{icon}</div>}
      <h2 id={titleId} className="text-xl font-bold">
        {title}
      </h2>
      {description && (
        <p id={descriptionId} className="mt-2 text-subtle">
          {description}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </dialog>
  );
}
