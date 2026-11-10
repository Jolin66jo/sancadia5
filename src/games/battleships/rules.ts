export const SIZE = 8;

export const SHIP_SIZES = [5, 4, 3, 3, 2] as const;
export const SHIP_NAMES = ['Carrier', 'Battleship', 'Cruiser', 'Submarine', 'Destroyer'] as const;

export type CellState = 'empty' | 'ship' | 'hit' | 'miss';
export type Grid = readonly (readonly CellState[])[];

export interface ShipPlacement {
  readonly row: number;
  readonly col: number;
  readonly size: number;
  readonly horizontal: boolean;
}

export type Orientation = 'horizontal' | 'vertical';

export function emptyGrid(): CellState[][] {
  return Array.from({ length: SIZE }, () => Array<CellState>(SIZE).fill('empty'));
}

export function canPlace(
  grid: Grid,
  row: number,
  col: number,
  size: number,
  horizontal: boolean,
): boolean {
  if (!Number.isInteger(row) || !Number.isInteger(col) || !Number.isInteger(size) || size <= 0)
    return false;
  for (let i = 0; i < size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return false;
    if (grid[r]?.[c] === 'ship') return false;
  }
  return true;
}

export function placeShip(
  grid: Grid,
  row: number,
  col: number,
  size: number,
  horizontal: boolean,
): CellState[][] {
  if (!canPlace(grid, row, col, size, horizontal)) {
    throw new Error('Cannot place ship at the requested position');
  }
  const next = grid.map((r) => [...r]);
  for (let i = 0; i < size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    const rowCells = next[r];
    if (rowCells) {
      rowCells[c] = 'ship';
    }
  }
  return next;
}

export function randomPlacement(): { grid: CellState[][]; ships: ShipPlacement[] } {
  const grid = emptyGrid();
  const ships: ShipPlacement[] = [];
  for (const size of SHIP_SIZES) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      attempts++;
      const horizontal = Math.random() < 0.5;
      const maxRow = horizontal ? SIZE : SIZE - size;
      const maxCol = horizontal ? SIZE - size : SIZE;
      const row = Math.floor(Math.random() * (maxRow + 1));
      const col = Math.floor(Math.random() * (maxCol + 1));
      if (canPlace(grid, row, col, size, horizontal)) {
        const next = placeShip(grid, row, col, size, horizontal);
        for (let r = 0; r < SIZE; r++) {
          const nextRow = next[r];
          if (nextRow) {
            grid[r] = nextRow;
          }
        }
        ships.push({ row, col, size, horizontal });
        placed = true;
      }
    }
    if (!placed) throw new Error(`Could not place ship of size ${size}`);
  }
  return { grid, ships };
}

export interface ShootResult {
  hit: boolean;
  sunk: boolean;
  shipIndex: number | null;
}

export function shoot(
  grid: Grid,
  ships: ShipPlacement[],
  row: number,
  col: number,
): {
  grid: CellState[][];
  result: ShootResult;
} {
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(col) ||
    row < 0 ||
    row >= SIZE ||
    col < 0 ||
    col >= SIZE
  ) {
    throw new Error(`Shot is outside the board: ${row},${col}`);
  }
  const next = grid.map((r) => [...r]);
  const cell = next[row]?.[col] ?? 'empty';
  if (cell === 'hit' || cell === 'miss') {
    return { grid: next, result: { hit: false, sunk: false, shipIndex: null } };
  }
  if (cell === 'ship') {
    const rowCells = next[row];
    if (rowCells) {
      rowCells[col] = 'hit';
    }
    for (let i = 0; i < ships.length; i++) {
      const ship = ships[i];
      if (!ship) continue;
      let allHit = true;
      for (let s = 0; s < ship.size; s++) {
        const r = ship.horizontal ? ship.row : ship.row + s;
        const c = ship.horizontal ? ship.col + s : ship.col;
        if (next[r]?.[c] !== 'hit') {
          allHit = false;
          break;
        }
      }
      if (allHit) {
        return { grid: next, result: { hit: true, sunk: true, shipIndex: i } };
      }
    }
    return { grid: next, result: { hit: true, sunk: false, shipIndex: null } };
  }
  const rowCells = next[row];
  if (rowCells) {
    rowCells[col] = 'miss';
  }
  return { grid: next, result: { hit: false, sunk: false, shipIndex: null } };
}

export function allShipsSunk(grid: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r]?.[c] === 'ship') return false;
    }
  }
  return true;
}

export function shipsRemaining(grid: Grid, ships: ShipPlacement[]): number {
  let count = 0;
  for (const ship of ships) {
    let intact = false;
    for (let s = 0; s < ship.size; s++) {
      const r = ship.horizontal ? ship.row : ship.row + s;
      const c = ship.horizontal ? ship.col + s : ship.col;
      if (grid[r]?.[c] === 'ship') {
        intact = true;
        break;
      }
    }
    if (intact) count++;
  }
  return count;
}
