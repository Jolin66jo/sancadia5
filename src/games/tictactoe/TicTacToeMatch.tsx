import { RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import GameBoard from '@/components/GameBoard';
import GameOverDialog from '@/components/GameOverDialog';
import Scoreboard from '@/components/Scoreboard';
import ThinkingDots from '@/components/ThinkingDots';
import type { MatchConfig } from '@/games/matchConfig';
import { describeResult, scoreEntries, statusText } from '@/games/matchOutcome';
import { useEngineMatch } from '@/games/useEngineMatch';
import { chooseMove } from '@/games/tictactoe/ai';
import { findWin, ticTacToe } from '@/games/tictactoe/rules';

const MARKS = ['O', 'X'] as const;

export default function TicTacToeMatch({ config }: { config: MatchConfig }) {
  const navigate = useNavigate();
  const match = useEngineMatch({ engine: ticTacToe, config, chooseMove });
  const { state, result, over, turn, humanSide, computerTurn, scores, dialogOpen, pointsEarned } =
    match;

  const winLine = findWin(state.board)?.line ?? null;
  const summary = result === null ? null : describeResult(result, config, humanSide);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Scoreboard entries={scoreEntries(config, humanSide, scores)} />

      <div
        role="status"
        aria-live="polite"
        className="flex min-h-11 items-center justify-center gap-3"
      >
        <p className="font-semibold">{statusText(result, turn, config, humanSide)}</p>
        {computerTurn && <ThinkingDots />}
      </div>

      <GameBoard
        label="Noughts and Crosses board"
        rows={3}
        cols={3}
        disabled={computerTurn || over}
        onCellTap={(row, col) => match.playMove(row * 3 + col)}
        getCellLabel={(row, col) => {
          const cell = state.board[row * 3 + col] ?? null;
          return `Row ${row + 1}, column ${col + 1}, ${cell === null ? 'empty' : cell === 0 ? 'X' : 'O'}`;
        }}
        renderCell={(row, col) => {
          const index = row * 3 + col;
          const cell = state.board[index] ?? null;
          const highlighted = winLine !== null && winLine.includes(index);
          return (
            <>
              {highlighted && (
                <span
                  className="absolute inset-1.5 animate-fade-in rounded-xl bg-primary-soft"
                  aria-hidden="true"
                />
              )}
              <span className={`relative ${cell === 0 ? 'text-primary' : 'text-accent'}`}>
                {cell === null ? '' : MARKS[cell]}
              </span>
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
