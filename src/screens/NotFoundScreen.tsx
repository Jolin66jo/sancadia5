import { Compass } from 'lucide-react';
import ButtonLink from '@/components/ButtonLink';
import useTranslation from '@/hooks/useTranslation';

export default function NotFoundScreen() {
  const { tText } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary-soft text-primary">
        <Compass className="h-12 w-12" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{tText('Page not found')}</h1>
        <p className="mt-3 text-subtle">
          {tText("The page you're looking for doesn't exist or has moved.")}
        </p>
      </div>
      <ButtonLink to="/" className="w-full">
        {tText('Back to home')}
      </ButtonLink>
    </div>
  );
}
