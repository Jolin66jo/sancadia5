import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Anchor, Crosshair, RotateCcw, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import GameOverDialog from '@/components/GameOverDialog';
import Scoreboard from '@/components/Scoreboard';
import ThinkingDots from '@/components/ThinkingDots';
import type { MatchConfig } from '@/games/matchConfig';
import { describeResult, scoreEntries, statusText } from '@/games/matchOutcome';
import { useSettings } from '@/hooks/useSettings';
import { HAPTICS, vibrate } from '@/lib/haptics';
import {
  SHIP_NAMES,
  SHIP_SIZES,
  SIZE,
  allShipsSunk,
  canPlace,
  emptyGrid,
  placeShip,
  randomPlacement,
  shoot,
  shipsRemaining,
  type CellState,
  type Grid,
  type Orientation,
  type ShipPlacement,
} from '@/games/battleships/rules';
import { chooseAiShot, createAiState, updateAiState, type AiState } from '@/games/battleships/ai';

type Player = 0 | 1;
type Fleets = [Grid, Grid];
type ShipFleets = [ShipPlacement[], ShipPlacement[]];

function otherPlayer(player: Player): Player {
  return player === 0 ? 1 : 0;
}

function replacePlayer<T>(pair: [T, T], player: Player, value: T): [T, T] {
  return player === 0 ? [value, pair[1]] : [pair[0], value];
}

const cellColor = (cell: CellState, showShips: boolean): string => {
  if (cell === 'hit') return 'bg-danger text-danger-foreground';
  if (cell === 'miss') return 'bg-foreground/10';
  if (cell === 'ship' && showShips) return 'bg-primary';
  return 'bg-board-light';
};

function Grid2D({
  grid,
  showShips,
  onCellTap,
  disabled,
  label,
}: {
  grid: Grid;
  showShips: boolean;
  onCellTap?: (row: number, col: number) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-1 rounded-2xl bg-board-line p-1.5 shadow-lg"
      style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` } as CSSProperties}
    >
      {Array.from({ length: SIZE * SIZE }, (_, index) => {
        const row = Math.floor(index / SIZE);
        const col = index % SIZE;
        const cell = grid[row]?.[col] ?? 'empty';
        return (
          <button
            key={index}
            type="button"
            disabled={disabled}
            aria-label={`${label}, row ${row + 1}, column ${col + 1}${cell === 'hit' ? ', hit' : cell === 'miss' ? ', miss' : ''}`}
            onClick={onCellTap ? () => onCellTap(row, col) : undefined}
            className={`relative flex aspect-square min-h-8 items-center justify-center rounded transition duration-150 ${cellColor(
              cell,
              showShips,
            )} ${
              !disabled && onCellTap && cell === 'empty'
                ? 'cursor-pointer hover:brightness-110'
                : ''
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
          >
            {cell === 'hit' && (
              <Crosshair className="h-3/5 w-3/5 text-danger-foreground" aria-hidden="true" />
            )}
            {cell === 'miss' && (
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/30" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function BattleshipsMatch({ config }: { config: MatchConfig }) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const vibrationEnabled = settings.vibrationEnabled;
  const isComputer = config.mode === 'computer';
  const humanSide: Player = config.mode === 'computer' && !config.humanFirst ? 1 : 0;
  const computerSide = otherPlayer(humanSide);

  const [phase, setPhase] = useState<'setup' | 'play'>('setup');
  const [grids, setGrids] = useState<Fleets>(() => [emptyGrid(), emptyGrid()]);
  const [fleets, setFleets] = useState<ShipFleets>(() => [[], []]);
  const [aiState, setAiState] = useState<AiState | null>(null);
  const [turn, setTurn] = useState<Player>(0);
  const [result, setResult] = useState<Player | 'draw' | null>(null);
  const [scores, setScores] = useState({ 0: 0, 1: 0, draws: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);

  const [setupPlayer, setSetupPlayer] = useState<Player>(humanSide);
  const [placingIndex, setPlacingIndex] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);

  const over = result !== null;
  const computerTurn = isComputer && !over && turn === computerSide;
  const setupGrid = grids[setupPlayer] ?? emptyGrid();
  const setupShips = fleets[setupPlayer] ?? [];
  const allPlaced = placingIndex >= SHIP_SIZES.length || setupShips.length === SHIP_SIZES.length;

  const finishMatch = useCallback((winner: Player) => {
    setResult(winner);
    setScores((current) => ({ ...current, [winner]: current[winner] + 1 }));
    setDialogOpen(true);
  }, []);

  const restart = () => {
    setPhase('setup');
    setGrids([emptyGrid(), emptyGrid()]);
    setFleets([[], []]);
    setAiState(null);
    setTurn(0);
    setResult(null);
    setSetupPlayer(humanSide);
    setPlacingIndex(0);
    setOrientation('horizontal');
    setHoverCell(null);
    setDialogOpen(false);
  };

  const randomize = () => {
    const placement = randomPlacement();
    setGrids((current) => replacePlayer(current, setupPlayer, placement.grid));
    setFleets((current) => replacePlayer(current, setupPlayer, placement.ships));
    setPlacingIndex(SHIP_SIZES.length);
  };

  const startBattle = () => {
    if (isComputer) {
      if (fleets[humanSide].length !== SHIP_SIZES.length) return;
      const enemy = randomPlacement();
      setGrids((current) => replacePlayer(current, computerSide, enemy.grid));
      setFleets((current) => replacePlayer(current, computerSide, enemy.ships));
      setAiState(createAiState(fleets[humanSide]));
      setTurn(config.mode === 'computer' && !config.humanFirst ? computerSide : humanSide);
    } else {
      if (fleets[0].length !== SHIP_SIZES.length || fleets[1].length !== SHIP_SIZES.length) return;
      setTurn(0);
    }
    setPhase('play');
    vibrate(vibrationEnabled, HAPTICS.move);
  };

  const advanceSetup = () => {
    if (!allPlaced) return;
    if (!isComputer && setupPlayer === 0) {
      setSetupPlayer(1);
      setPlacingIndex(fleets[1].length);
      setOrientation('horizontal');
      setHoverCell(null);
      return;
    }
    startBattle();
  };

  const handleSetupCellTap = (row: number, col: number) => {
    if (allPlaced) return;
    const size = SHIP_SIZES[placingIndex] ?? 0;
    const horizontal = orientation === 'horizontal';
    if (!canPlace(setupGrid, row, col, size, horizontal)) return;
    setGrids((current) =>
      replacePlayer(current, setupPlayer, placeShip(setupGrid, row, col, size, horizontal)),
    );
    setFleets((current) =>
      replacePlayer(current, setupPlayer, [...setupShips, { row, col, size, horizontal }]),
    );
    setPlacingIndex((index) => index + 1);
  };

  const handleAttack = (row: number, col: number) => {
    if (phase !== 'play' || over || computerTurn) return;
    const targetPlayer = isComputer ? computerSide : otherPlayer(turn);
    const targetGrid = grids[targetPlayer] ?? emptyGrid();
    const targetFleet = fleets[targetPlayer] ?? [];
    const cell = targetGrid[row]?.[col] ?? 'empty';
    if (cell === 'hit' || cell === 'miss') return;

    const shot = shoot(targetGrid, targetFleet, row, col);
    setGrids((current) => replacePlayer(current, targetPlayer, shot.grid));
    vibrate(vibrationEnabled, shot.result.sunk ? HAPTICS.gameEnd : HAPTICS.move);

    if (allShipsSunk(shot.grid)) {
      finishMatch(isComputer ? humanSide : turn);
      return;
    }
    setTurn(otherPlayer(turn));
  };

  const handleAiShot = useCallback(() => {
    if (config.mode !== 'computer' || !aiState || !computerTurn) return;
    const shot = chooseAiShot(aiState, config.difficulty);
    const [shotRow, shotCol] = shot;
    if (shotRow === undefined || shotCol === undefined) return;
    const attackedGrid = grids[humanSide] ?? emptyGrid();
    const humanFleet = fleets[humanSide] ?? [];
    const outcome = shoot(attackedGrid, humanFleet, shotRow, shotCol);
    setGrids((current) => replacePlayer(current, humanSide, outcome.grid));
    setAiState(
      updateAiState(aiState, shot, outcome.result.hit ? 'hit' : 'miss', outcome.result.sunk),
    );
    vibrate(vibrationEnabled, outcome.result.sunk ? HAPTICS.gameEnd : HAPTICS.move);

    if (allShipsSunk(outcome.grid)) {
      finishMatch(computerSide);
      return;
    }
    setTurn(humanSide);
  }, [
    aiState,
    computerSide,
    computerTurn,
    config,
    finishMatch,
    fleets,
    grids,
    humanSide,
    vibrationEnabled,
  ]);

  useEffect(() => {
    if (phase !== 'play' || !computerTurn) return;
    const timer = window.setTimeout(handleAiShot, 600 + Math.random() * 400);
    return () => window.clearTimeout(timer);
  }, [computerTurn, handleAiShot, phase]);

  const summary = result === null ? null : describeResult(result, config, humanSide);

  if (phase === 'setup') {
    const shipName = allPlaced ? null : (SHIP_NAMES[placingIndex] ?? 'Ship');
    const currentShipSize = allPlaced ? 0 : (SHIP_SIZES[placingIndex] ?? 0);
    const currentShip = allPlaced ? null : `${shipName} (${currentShipSize})`;
    const canStart = isComputer
      ? (fleets[humanSide] ?? []).length === SHIP_SIZES.length
      : allPlaced;

    return (
      <div className="flex flex-1 flex-col gap-4">
        <h2 className="text-lg font-bold">
          {isComputer ? 'Place your fleet' : `Player ${setupPlayer + 1} — place your fleet`}
        </h2>
        {!isComputer && setupPlayer === 1 && (
          <p className="text-sm text-subtle">
            Pass the device to Player 2 before placing their ships.
          </p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm text-subtle">
            {allPlaced ? 'Fleet ready!' : `Place ${currentShip}`}
          </p>
          <button
            type="button"
            onClick={randomize}
            className="flex min-h-11 items-center gap-1.5 rounded-xl bg-primary-soft px-3 py-2 text-sm font-semibold text-primary transition hover:brightness-95 active:scale-95"
          >
            <Shuffle className="h-4 w-4" aria-hidden="true" />
            Random
          </button>
        </div>

        <div className="flex gap-2">
          {(['horizontal', 'vertical'] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => setOrientation(direction)}
              className={`min-h-11 flex-1 rounded-xl text-sm font-semibold transition ${
                orientation === direction
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface ring-1 ring-border'
              }`}
            >
              {direction === 'horizontal' ? 'Horizontal' : 'Vertical'}
            </button>
          ))}
        </div>

        <div className="flex justify-center" onPointerLeave={() => setHoverCell(null)}>
          <div
            className="grid gap-1 rounded-2xl bg-board-line p-1.5 shadow-lg"
            style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` } as CSSProperties}
          >
            {Array.from({ length: SIZE * SIZE }, (_, index) => {
              const row = Math.floor(index / SIZE);
              const col = index % SIZE;
              const cell = setupGrid[row]?.[col] ?? 'empty';
              const isHover = hoverCell?.[0] === row && hoverCell[1] === col;
              const size = allPlaced ? 0 : (SHIP_SIZES[placingIndex] ?? 0);
              const canFit =
                !allPlaced && canPlace(setupGrid, row, col, size, orientation === 'horizontal');
              const preview = new Set<string>();
              if (isHover && canFit) {
                for (let offset = 0; offset < size; offset++) {
                  const r = orientation === 'horizontal' ? row : row + offset;
                  const c = orientation === 'horizontal' ? col + offset : col;
                  preview.add(`${r},${c}`);
                }
              }
              return (
                <button
                  key={index}
                  type="button"
                  disabled={allPlaced}
                  aria-label={`Place at row ${row + 1}, column ${col + 1}`}
                  onClick={() => handleSetupCellTap(row, col)}
                  onPointerEnter={() => setHoverCell([row, col])}
                  className={`relative flex aspect-square min-h-8 items-center justify-center rounded transition ${
                    cell === 'ship' ? 'bg-primary' : 'bg-board-light'
                  } ${preview.has(`${row},${col}`) ? 'bg-primary/40' : ''} ${
                    isHover && !canFit && !allPlaced ? 'bg-danger/20' : ''
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
                >
                  {cell === 'ship' && (
                    <Anchor className="h-1/2 w-1/2 text-primary-foreground" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Button disabled={!canStart} onClick={advanceSetup} className="mt-auto">
          {!isComputer && setupPlayer === 0 ? 'Continue to Player 2' : 'Start battle'}
        </Button>
      </div>
    );
  }

  const targetPlayer = isComputer ? computerSide : otherPlayer(turn);
  const activePlayer = isComputer ? humanSide : turn;
  const activeGrid = grids[activePlayer] ?? emptyGrid();
  const activeFleet = fleets[activePlayer] ?? [];
  const targetGrid = grids[targetPlayer] ?? emptyGrid();
  const targetFleet = fleets[targetPlayer] ?? [];
  const myShipsLeft = shipsRemaining(activeGrid, activeFleet);
  const targetShipsLeft = shipsRemaining(targetGrid, targetFleet);
  const targetLabel = isComputer ? 'Enemy waters' : `Player ${targetPlayer + 1} waters`;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Scoreboard entries={scoreEntries(config, humanSide, scores)} />

      <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-2.5 shadow-sm ring-1 ring-border">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <Anchor className="h-4 w-4 text-primary" aria-hidden="true" />
          Your fleet: {myShipsLeft}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          Opponent: {targetShipsLeft}
          <Anchor className="h-4 w-4 text-accent" aria-hidden="true" />
        </span>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="flex min-h-11 items-center justify-center gap-3"
      >
        <p className="font-semibold">{statusText(result, turn, config, humanSide)}</p>
        {computerTurn && <ThinkingDots />}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-center text-sm font-semibold text-subtle">
          {computerTurn ? 'Opponent waters' : `${targetLabel} — tap to fire`}
        </p>
        <Grid2D
          grid={grids[targetPlayer]}
          showShips={false}
          onCellTap={handleAttack}
          disabled={computerTurn || over}
          label={targetLabel}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-center text-sm font-semibold text-subtle">Your fleet</p>
        <Grid2D
          grid={grids[activePlayer]}
          showShips
          disabled
          label={`Player ${activePlayer + 1} fleet`}
        />
      </div>

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
          onPlayAgain={restart}
          onBackToMenu={() => navigate('/games')}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
