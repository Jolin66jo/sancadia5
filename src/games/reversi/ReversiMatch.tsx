import { RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import GameBoard from '@/components/GameBoard';
import GameOverDialog from '@/components/GameOverDialog';
import Scoreboard from '@/components/Scoreboard';
import ThinkingDots from '@/components/ThinkingDots';
import { chooseMove } from '@/games/reversi/ai';
import { SIZE, legalMovesFor, reversi, scoreOf, type ReversiMove } from '@/games/reversi/rules';
import type { MatchConfig } from '@/games/matchConfig';
import { describeResult, scoreEntries, statusText } from '@/games/matchOutcome';
import { useEngineMatch } from '@/games/useEngineMatch';

const discTone = ['bg-primary', 'bg-accent'] as const;

function eqMove(a: ReversiMove, r: number, c: number): boolean {
  return a[0] === r && a[1] === c;
}

export default function ReversiMatch({ config }: { config: MatchConfig }) {
  const navigate = useNavigate();
  const match = useEngineMatch({ engine: reversi, config, chooseMove });
  const { state, result, over, turn, humanSide, computerTurn, scores, dialogOpen, pointsEarned } =
    match;

  const legal = legalMovesFor(state);
  const isLegal = (r: number, c: number) => legal.some((m) => eqMove(m, r, c));
  const [score0, score1] = scoreOf(state.board);
  const summary = result === null ? null : describeResult(result, config, humanSide);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Scoreboard entries={scoreEntries(config, humanSide, scores)} />

      <div className="flex items-center justify-around rounded-2xl bg-surface px-4 py-3 shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-2">
          <span className={`h-5 w-5 rounded-full ${discTone[0]}`} />
          <span className="font-semibold">{config.mode === 'two-player' ? 'Player 1' : 'You'}</span>
          <span className="text-2xl font-bold text-primary">{score0}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-accent">{score1}</span>
          <span className="font-semibold">
            {config.mode === 'two-player' ? 'Player 2' : 'Computer'}
          </span>
          <span className={`h-5 w-5 rounded-full ${discTone[1]}`} />
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="flex min-h-11 items-center justify-center gap-3"
      >
        <p className="font-semibold">{statusText(result, turn, config, humanSide)}</p>
        {computerTurn && <ThinkingDots />}
      </div>

      <GameBoard
        label="Reversi board"
        rows={SIZE}
        cols={SIZE}
        disabled={computerTurn || over}
        onCellTap={(row, col) => match.playMove([row, col] as ReversiMove)}
        renderCell={(row, col) => {
          const cell = state.board[row]?.[col] ?? null;
          const canPlay = isLegal(row, col) && !computerTurn && !over;
          return (
            <>
              {cell !== null && (
                <span
                  className={`relative h-[82%] w-[82%] rounded-full shadow-md transition duration-200 ${
                    discTone[cell]
                  } ${turn === cell && !over ? 'ring-2 ring-foreground/30' : ''}`}
                />
              )}
              {cell === null && canPlay && (
                <span className="relative h-[40%] w-[40%] rounded-full bg-foreground/15 transition hover:bg-foreground/25" />
              )}
            </>
          );
        }}
      />

      <Button variant="secondary" onClick={match.restart}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Restart
      </Button>

      {summary && (
        <GameOverDialog
          open={dialogOpen}
          outcome={summary.outcome}
          headline={summary.headline}
          message={summary.message}
          pointsEarned={config.mode === 'computer' ? pointsEarned : undefined}
          onPlayAgain={match.restart}
          onBackToMenu={() => navigate('/games')}
          onClose={match.closeDialog}
        />
      )}
    </div>
  );
}
