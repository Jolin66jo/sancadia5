import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { useStats } from "@/hooks/useStats";
import { games } from "@/games/registry";
import type { Difficulty } from "@/engine/difficulty";
import useTranslation from "@/hooks/useTranslation";

const difficulties: Difficulty[] = ["beginner", "professional", "expert"];
const labels: Record<Difficulty, string> = {
  beginner: "Beginner",
  professional: "Professional",
  expert: "Expert",
};

function percentage(wins: number, played: number): string {
  return played === 0 ? "—" : `${Math.round((wins / played) * 100)}%`;
}

export default function StatsScreen() {
  const { stats } = useStats();
  const { tText } = useTranslation();
  const totalPlayed = Object.values(stats.games).reduce(
    (total, game) =>
      total +
      game.twoPlayerPlayed +
      difficulties.reduce(
        (sum, level) =>
          sum + game.computer[level].played + game.puzzle[level].played,
        0,
      ),
    0,
  );

  return (
    <>
      <ScreenHeader title={tText("Stats and points")} backTo="/settings" />
      <div className="grid gap-4 pb-4">
        <Card className="text-center">
          <p className="text-sm font-semibold text-subtle">{tText("Total points")}</p>
          <p className="mt-1 break-words text-4xl font-bold text-primary [overflow-wrap:anywhere]">
            {stats.totalPoints}
          </p>
        </Card>

        {totalPlayed === 0 ? (
          <Card className="text-center">
            <h2 className="text-lg font-bold">{tText("Your arcade stats start here")}</h2>
            <p className="mt-2 text-subtle">
              {tText("Finish a game to see your results, streaks and points.")}
            </p>
          </Card>
        ) : (
          <>
            <h2 className="text-lg font-bold">{tText("Games")}</h2>
            {games.map((game) => {
              const record = stats.games[game.id];
              const computer = record?.computer;
              const played = difficulties.reduce(
                (total, level) => total + (computer?.[level].played ?? 0),
                0,
              );
              const wins = difficulties.reduce(
                (total, level) => total + (computer?.[level].wins ?? 0),
                0,
              );
              const bestStreak = Math.max(
                0,
                ...difficulties.map(
                  (level) => computer?.[level].bestWinStreak ?? 0,
                ),
              );
              const twoPlayerPlayed = record?.twoPlayerPlayed ?? 0;
              const puzzlePlayed = difficulties.reduce(
                (total, level) => total + (record?.puzzle[level].played ?? 0),
                0,
              );
              return (
                <Card key={game.id} className="grid gap-3">
                  <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3 className="min-w-0 break-words font-bold [overflow-wrap:anywhere]">
                      {game.name}
                    </h3>
                    <span className="min-w-0 break-words text-sm text-subtle [overflow-wrap:anywhere]">
                      {played} vs computer · {twoPlayerPlayed} two-player
                    </span>
                  </div>
                  <p className="text-sm text-subtle">
                    Computer win rate: {percentage(wins, played)} · Best streak:{" "}
                    {bestStreak}
                  </p>
                  {puzzlePlayed > 0 && (
                    <div className="grid gap-2 border-t border-border pt-3">
                      <h4 className="text-sm font-bold">{tText("Puzzle results")}</h4>
                      <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
                        {difficulties.map((level) => {
                          const row = record?.puzzle[level];
                          const averageAttempts =
                            row && row.solved > 0
                              ? (row.totalWinningAttempts / row.solved).toFixed(
                                  1,
                                )
                              : "—";
                          return (
                            <div
                              key={level}
                              className="rounded-xl bg-background p-2 text-center"
                            >
                              <p className="text-xs font-semibold">
                                {labels[level]}
                              </p>
                              <p className="mt-1 text-sm">
                                {row?.solved ?? 0} solved · {row?.failed ?? 0}{" "}
                                failed
                              </p>
                              <p className="text-xs text-subtle">
                                Best: {row?.bestAttempts ?? "—"} · Avg:{" "}
                                {averageAttempts}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 border-t border-border pt-3 min-[360px]:grid-cols-3">
                    {difficulties.map((level) => {
                      const row = computer?.[level];
                      return (
                        <div
                          key={level}
                          className="rounded-xl bg-background p-2 text-center"
                        >
                          <p className="text-xs font-semibold">
                            {labels[level]}
                          </p>
                          <p className="mt-1 text-sm">
                            {row?.wins ?? 0}W · {row?.losses ?? 0}L ·{" "}
                            {row?.draws ?? 0}D
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
