import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import Card from '@/components/Card';
import useTranslation from '@/hooks/useTranslation';

interface SettingsSectionProps {
  title: string;
  description?: string;
  open?: boolean;
  children: ReactNode;
}

export default function SettingsSection({
  title,
  description,
  open = false,
  children,
}: SettingsSectionProps) {
  const { tText } = useTranslation();
  return (
    <Card className="!p-0 overflow-hidden">
      <details open={open} className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 p-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary/40 [&::-webkit-details-marker]:hidden">
          <div className="grid gap-1">
            <span role="heading" aria-level={2} className="text-lg font-bold text-foreground">
              {tText(title)}
            </span>
            {description && <span className="text-sm text-subtle">{tText(description)}</span>}
          </div>
          <ChevronDown
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-subtle transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="px-4 pb-4">{children}</div>
      </details>
    </Card>
  );
}
