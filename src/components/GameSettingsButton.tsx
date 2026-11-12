import { Settings } from 'lucide-react';
import ButtonLink from '@/components/ButtonLink';
import useTranslation from '@/hooks/useTranslation';

export default function GameSettingsButton({
  gameId,
  className,
}: {
  gameId: string;
  className?: string;
}) {
  const { tText } = useTranslation();
  return (
    <ButtonLink
      to={`/games/${gameId}/settings`}
      variant="secondary"
      aria-label={tText('Game settings')}
      className={className}
    >
      <Settings className="h-4 w-4" aria-hidden="true" />
      {tText('Game settings')}
    </ButtonLink>
  );
}
