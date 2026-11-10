import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import GameBoard from '@/components/GameBoard';
import GameOverDialog from '@/components/GameOverDialog';
import Scoreboard from '@/components/Scoreboard';
import ThinkingDots from '@/components/ThinkingDots';
import { chooseMove } from '@/games/gomoku/ai';
import { gomoku, SIZE, findWin, type GomokuMove } from '@/games/gomoku/rules';
import type { MatchConfig } from '@/games/matchConfig';
import { describeResult, scoreEntries, statusText } from '@/games/matchOutcome';
import { useEngineMatch } from '@/games/useEngineMatch';

export default function GomokuGame({ config }: { config: MatchConfig }) {
  const navigate = useNavigate();
  const match = useEngineMatch({ engine: gomoku, config, chooseMove });
  const { state, result, over, turn, humanSide, computerTurn, scores, dialogOpen, pointsEarned } =
    match;
  const [preview, setPreview] = useState<GomokuMove | null>(null);
  const [lastMove, setLastMove] = useState<GomokuMove | null>(null);
  const previousBoard = useRef(state.board);

  useEffect(() => {
    let move: GomokuMove | null = null;
    for (let row = 0; row < SIZE && move === null; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (
          (previousBoard.current[row]?.[col] ?? null) === null &&
          (state.board[row]?.[col] ?? null) !== null
        ) {
          move = { row, col };
          break;
        }
      }
    }
    previousBoard.current = state.board;
    setLastMove(move);
  }, [state.board]);

  const winningCells = findWin(state.board)?.cells ?? [];
  const isWinningCell = (row: number, col: number) =>
    winningCells.some((cell) => cell.row === row && cell.col === col);
  const summary = result === null ? null : describeResult(result, config, humanSide);

  const restart = () => {
    match.restart();
    setPreview(null);
    setLastMove(null);
  };

  const selectCell = (row: number, col: number) => {
    if (computerTurn || over || (state.board[row]?.[col] ?? null) !== null) return;
    if (preview?.row === row && preview.col === col) {
      match.playMove({ row, col });
      setLastMove({ row, col });
      setPreview(null);
      return;
    }
    setPreview({ row, col });
  };

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

      <p className="text-center text-sm text-subtle">
        {preview
          ? 'Tap the highlighted cell again to place your stone.'
          : 'Tap an empty cell twice to place a stone.'}
      </p>

      <GameBoard
        label="Gomoku board"
        rows={SIZE}
        cols={SIZE}
        disabled={computerTurn || over}
        onCellTap={selectCell}
        getCellLabel={(row, col) => {
          const owner = state.board[row]?.[col] ?? null;
          const piece = owner === null ? 'Empty' : owner === 0 ? 'Black stone' : 'White stone';
          return `${piece}, row ${row + 1}, column ${col + 1}`;
        }}
        gridClassName="gap-0.5 rounded-xl p-1"
        cellClassName="min-h-0 rounded-sm"
        renderCell={(row, col) => {
          const cell = state.board[row]?.[col] ?? null;
          const isPreview = preview?.row === row && preview.col === col;
          const isLastMove = lastMove?.row === row && lastMove.col === col;
          const isWinning = isWinningCell(row, col);
          return (
            <>
              {cell !== null && (
                <span
                  className={`relative h-[70%] w-[70%] rounded-full shadow-sm ${cell === 0 ? 'bg-primary' : 'bg-accent'} ${
                    isLastMove ? 'ring-2 ring-foreground' : ''
                  } ${isWinning ? 'ring-2 ring-danger' : ''}`}
                  aria-label={cell === 0 ? 'Black stone' : 'White stone'}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-full w-full items-center justify-center text-[0.55rem] font-black ${cell === 0 ? 'text-primary-foreground' : 'text-foreground'}`}
                  >
                    {cell === 0 ? 'X' : 'O'}
                  </span>
                </span>
              )}
              {isPreview && cell === null && (
                <span
                  className="relative h-[70%] w-[70%] rounded-full bg-primary/40 ring-2 ring-primary"
                  aria-hidden="true"
                />
              )}
            </>
          );
        }}
      />

      <Button variant="secondary" onClick={restart}>
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
          onPlayAgain={restart}
          onBackToMenu={() => navigate('/games')}
          onClose={match.closeDialog}
        />
      )}
    </div>
  );
}
