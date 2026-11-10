import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import GameOverDialog from '@/components/GameOverDialog';
import Scoreboard from '@/components/Scoreboard';
import ThinkingDots from '@/components/ThinkingDots';
import { chooseMove } from '@/games/checkers/ai';
import { SIZE, checkers, legalMovesFor } from '@/games/checkers/rules';
import type { MatchConfig } from '@/games/matchConfig';
import { describeResult, scoreEntries, statusText } from '@/games/matchOutcome';
import { useEngineMatch } from '@/games/useEngineMatch';

const pieceColor = ['bg-primary', 'bg-accent'] as const;

function samePos(a: readonly [number, number], r: number, c: number): boolean {
  return a[0] === r && a[1] === c;
}

export default function CheckersMatch({ config }: { config: MatchConfig }) {
  const navigate = useNavigate();
  const match = useEngineMatch({ engine: checkers, config, chooseMove });
  const { state, result, over, turn, humanSide, computerTurn, scores, dialogOpen, pointsEarned } =
    match;
  const [selected, setSelected] = useState<[number, number] | null>(null);

  const allLegal = legalMovesFor(state);
  const selectableOrigins = Array.from(
    new Set(allLegal.map((m) => `${m.from[0]},${m.from[1]}`)),
  ).map((key) => key.split(',').map(Number) as [number, number]);

  const movesFromSelected = selected
    ? allLegal.filter((m) => samePos(m.from, selected[0], selected[1]))
    : [];

  const destinations = new Set(movesFromSelected.map((m) => `${m.to[0]},${m.to[1]}`));

  const handleCellTap = (row: number, col: number) => {
    if (computerTurn || over) return;
    const destKey = `${row},${col}`;
    if (selected && destinations.has(destKey)) {
      const move = movesFromSelected.find((m) => samePos(m.to, row, col));
      if (move) {
        match.playMove(move);
        setSelected(null);
        return;
      }
    }
    const piece = state.board[row]?.[col] ?? null;
    if (
      piece !== null &&
      piece.player === turn &&
      selectableOrigins.some(([r, c]) => r === row && c === col)
    ) {
      setSelected([row, col]);
    } else {
      setSelected(null);
    }
  };

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

      <div
        role="group"
        aria-label="Checkers board"
        className="grid gap-1 rounded-3xl bg-board-line p-2 shadow-lg"
        style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: SIZE * SIZE }, (_, index) => {
          const row = Math.floor(index / SIZE);
          const col = index % SIZE;
          const dark = (row + col) % 2 === 1;
          const piece = state.board[row]?.[col] ?? null;
          const canSelect =
            !computerTurn && !over && selectableOrigins.some(([r, c]) => r === row && c === col);
          const isSelected = selected !== null && samePos(selected, row, col);
          const isDest = destinations.has(`${row},${col}`);
          const isCapture =
            isDest && movesFromSelected.find((m) => samePos(m.to, row, col))?.captures.length;
          return (
            <button
              key={index}
              type="button"
              disabled={computerTurn || over}
              onClick={() => handleCellTap(row, col)}
              className={`relative flex aspect-square min-h-10 items-center justify-center transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                dark ? 'bg-board-dark' : 'bg-board-light'
              } ${canSelect ? 'cursor-pointer hover:brightness-110' : ''} ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
            >
              {piece !== null && (
                <span
                  className={`relative flex h-[78%] w-[78%] items-center justify-center rounded-full shadow-md ${pieceColor[piece.player]} ${
                    piece.type === 'king' ? 'ring-2 ring-yellow-300' : ''
                  }`}
                >
                  {piece.type === 'king' && (
                    <span className="text-xs font-bold text-white/90">K</span>
                  )}
                </span>
              )}
              {isDest && (
                <span
                  className={`absolute inset-0 flex items-center justify-center rounded-lg ${
                    isCapture
                      ? 'bg-danger/30 ring-2 ring-danger/60'
                      : 'bg-primary/20 ring-2 ring-primary/50'
                  }`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      <Button
        variant="secondary"
        onClick={() => {
          match.restart();
          setSelected(null);
        }}
      >
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
          onPlayAgain={() => {
            match.restart();
            setSelected(null);
          }}
          onBackToMenu={() => navigate('/games')}
          onClose={match.closeDialog}
        />
      )}
    </div>
  );
}
