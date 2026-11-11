import ScreenHeader from '@/components/ScreenHeader';
import GameCard from '@/components/GameCard';
import { getGamesForNation } from '@/games/registry';
import { getNation } from '@/games/nations';
import { useSettings } from '@/hooks/useSettings';

export default function GamesScreen() {
  const { settings } = useSettings();
  const selectedNation = getNation(settings.nation);
  const filteredGames = getGamesForNation(settings.nation);

  return (
    <>
      <ScreenHeader title="Choose a game" backTo="/" />
      <div className="grid gap-3 pb-4">
        <h2 className="text-lg font-bold">Enjoy</h2>
        {filteredGames.length > 0 ? (
          filteredGames.map((game) => <GameCard key={game.id} game={game} />)
        ) : (
          <p className="rounded-2xl bg-surface p-4 text-sm text-subtle ring-1 ring-border">
            No games are available for {selectedNation.name} yet.
          </p>
        )}
      </div>
    </>
  );
}
