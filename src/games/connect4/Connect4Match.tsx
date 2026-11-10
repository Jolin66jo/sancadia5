import { useState, type CSSProperties } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import GameBoard from '@/components/GameBoard';
import GameOverDialog from '@/components/GameOverDialog';
import Scoreboard from '@/components/Scoreboard';
import ThinkingDots from '@/components/ThinkingDots';
import { chooseMove } from '@/games/connect4/ai';
import { COLS, ROWS, connect4, findWin, landingRow } from '@/games/connect4/rules';
import type { MatchConfig } from '@/games/matchConfig';
import { describeResult, scoreEntries, statusText } from '@/games/matchOutcome';
import { useEngineMatch } from '@/games/useEngineMatch';

const discTone = ['bg-primary', 'bg-accent'] as const;

export default function Connect4Match({ config }: { config: MatchConfig }) {
  const navigate = useNavigate();
  const match = useEngineMatch({ engine: connect4, config, chooseMove });
  const { state, result, over, turn, humanSide, computerTurn, scores, dialogOpen, pointsEarned } =
    match;
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  const inputLocked = computerTurn || over;
  const legal = connect4.legalMoves(state);
  const winCells = findWin(state.board)?.cells ?? [];
  const isWinCell = (boardRow: number, col: number) =>
    winCells.some(([r, c]) => r === boardRow && c === col);
  const previewRow = hoverCol !== null && !inputLocked ? landingRow(state.board, hoverCol) : null;
  const summary = result === null ? null : describeResult(result, config, humanSide);

  const selectColumn = (col: number) => {
    if (!inputLocked) match.playMove(col);
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

      <div
        role="group"
        aria-label="Choose a column"
        onPointerLeave={() => setHoverCol(null)}
        className="grid grid-cols-7 gap-2 px-2"
      >
        {Array.from({ length: COLS }, (_, col) => {
          const open = legal.includes(col);
          const active = open && hoverCol === col && !inputLocked;
          return (
            <button
              key={col}
              type="button"
              disabled={!open || inputLocked}
              aria-label={`Drop in column ${col + 1}`}
              onPointerEnter={() => setHoverCol(col)}
              onClick={() => selectColumn(col)}
              className={`flex min-h-11 items-center justify-center rounded-xl transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:opacity-40 ${
                active
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-primary-soft text-primary'
              }`}
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-200 ${active ? 'translate-y-0.5' : ''}`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      <GameBoard
        label="Connect 4 board"
        rows={ROWS}
        cols={COLS}
        disabled={inputLocked}
        onCellTap={(_row, col) => selectColumn(col)}
        onCellEnter={(_row, col) => setHoverCol(col)}
        onBoardLeave={() => setHoverCol(null)}
        getCellLabel={(displayRow, col) => {
          const cell = state.board[ROWS - 1 - displayRow]?.[col] ?? null;
          return `Row ${displayRow + 1}, column ${col + 1}, ${cell === null ? 'empty' : cell === 0 ? 'player one disc' : 'player two disc'}`;
        }}
        renderCell={(displayRow, col) => {
          const boardRow = ROWS - 1 - displayRow;
          const cell = state.board[boardRow]?.[col] ?? null;
          const won = isWinCell(boardRow, col);
          const columnLit = hoverCol === col && legal.includes(col) && !inputLocked;
          const preview = previewRow === boardRow && hoverCol === col && cell === null;
          return (
            <>
              {columnLit && (
                <span
                  className="absolute inset-0 rounded-2xl bg-primary-soft/60"
                  aria-hidden="true"
                />
              )}
              {cell !== null && (
                <span
                  className={`relative h-[80%] w-[80%] animate-drop-piece rounded-full shadow-inner ${discTone[cell]} ${
                    won ? 'ring-4 ring-foreground' : ''
                  }`}
                  style={{ '--drop-from': `-${(displayRow + 1.5) * 125}%` } as CSSProperties}
                >
                  <span className="sr-only">{cell === 0 ? '1' : '2'}</span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center text-sm font-black text-white/90"
                  >
                    {cell === 0 ? '1' : '2'}
                  </span>
                </span>
              )}
              {preview && (
                <span
                  className="relative h-[80%] w-[80%] rounded-full bg-primary/25"
                  aria-hidden="true"
                />
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
