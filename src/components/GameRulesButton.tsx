import { BookOpen } from 'lucide-react';
import ButtonLink from '@/components/ButtonLink';
import useTranslation from '@/hooks/useTranslation';

export default function GameRulesButton({
  gameId,
  gameName,
  className,
}: {
  gameId: string;
  gameName: string;
  className?: string;
}) {
  const { tText } = useTranslation();
  return (
    <ButtonLink
      to={`/games/${gameId}/rules`}
      variant="secondary"
      aria-label={tText('How to play {game}', { game: gameName })}
      className={className}
    >
      <BookOpen className="h-4 w-4" aria-hidden="true" />
      {tText('Rules')}
    </ButtonLink>
  );
}
