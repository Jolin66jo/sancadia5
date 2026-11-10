import type { ReactNode } from 'react';

interface GameBoardProps {
  label: string;
  rows: number;
  cols: number;
  renderCell: (row: number, col: number) => ReactNode;
  onCellTap: (row: number, col: number) => void;
  onCellEnter?: (row: number, col: number) => void;
  onBoardLeave?: () => void;
  disabled?: boolean;
  gridClassName?: string;
  cellClassName?: string;
  getCellLabel?: (row: number, col: number) => string;
}

export default function GameBoard({
  label,
  rows,
  cols,
  renderCell,
  onCellTap,
  onCellEnter,
  onBoardLeave,
  disabled = false,
  gridClassName = '',
  cellClassName = '',
  getCellLabel,
}: GameBoardProps) {
  const defaultGridClass = gridClassName ? '' : 'gap-2 rounded-3xl p-2';
  const defaultCellClass = cellClassName ? '' : 'min-h-11 rounded-2xl text-5xl';

  return (
    <div
      role="group"
      aria-label={label}
      onPointerLeave={onBoardLeave}
      className={`grid bg-board-line shadow-lg ${defaultGridClass} ${gridClassName}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: rows * cols }, (_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        return (
          <button
            key={index}
            type="button"
            disabled={disabled}
            aria-label={getCellLabel?.(row, col)}
            onClick={() => onCellTap(row, col)}
            onPointerEnter={onCellEnter ? () => onCellEnter(row, col) : undefined}
            className={`relative flex aspect-square items-center justify-center bg-board-light font-bold transition duration-200 hover:bg-board-dark/40 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:hover:bg-board-light disabled:active:scale-100 ${defaultCellClass} ${cellClassName}`}
          >
            {renderCell(row, col)}
          </button>
        );
      })}
    </div>
  );
}
