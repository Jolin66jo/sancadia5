import { describe, expect, it } from 'vitest';
import {
  SHIP_SIZES,
  SIZE,
  allShipsSunk,
  canPlace,
  emptyGrid,
  placeShip,
  randomPlacement,
  shoot,
  shipsRemaining,
} from '@/games/battleships/rules';

describe('ship placement', () => {
  it('places ships without mutating the original grid', () => {
    const grid = emptyGrid();
    const next = placeShip(grid, 1, 2, 3, true);
    expect(grid[1]?.slice(2, 5)).toEqual(['empty', 'empty', 'empty']);
    expect(next[1]?.slice(2, 5)).toEqual(['ship', 'ship', 'ship']);
  });

  it('rejects overlaps, out-of-bounds placements, and invalid sizes', () => {
    const grid = placeShip(emptyGrid(), 0, 0, 3, true);
    expect(canPlace(grid, 0, 2, 2, true)).toBe(false);
    expect(canPlace(grid, SIZE - 1, SIZE - 1, 2, true)).toBe(false);
    expect(canPlace(grid, -1, 0, 2, true)).toBe(false);
    expect(canPlace(grid, 2, 2, 0, true)).toBe(false);
    expect(() => placeShip(grid, 0, 2, 2, true)).toThrow();
  });

  it('creates a complete non-overlapping fleet', () => {
    const { grid, ships } = randomPlacement();
    expect(ships.map((ship) => ship.size)).toEqual([...SHIP_SIZES]);
    expect(grid.flat().filter((cell) => cell === 'ship')).toHaveLength(
      SHIP_SIZES.reduce((sum, size) => sum + size, 0),
    );
    expect(shipsRemaining(grid, ships)).toBe(SHIP_SIZES.length);
  });
});

describe('shots', () => {
  it('marks a miss and a hit, and reports when a ship is sunk', () => {
    const placement = { row: 3, col: 2, size: 2, horizontal: true };
    const grid = placeShip(
      emptyGrid(),
      placement.row,
      placement.col,
      placement.size,
      placement.horizontal,
    );
    const first = shoot(grid, [placement], 3, 2);
    expect(first.grid[3]?.[2]).toBe('hit');
    expect(first.result).toEqual({ hit: true, sunk: false, shipIndex: null });
    expect(grid[3]?.[2]).toBe('ship');

    const second = shoot(first.grid, [placement], 3, 3);
    expect(second.result).toEqual({ hit: true, sunk: true, shipIndex: 0 });
    expect(allShipsSunk(second.grid)).toBe(true);
    expect(shipsRemaining(second.grid, [placement])).toBe(0);

    const miss = shoot(second.grid, [placement], 0, 0);
    expect(miss.result.hit).toBe(false);
    expect(miss.grid[0]?.[0]).toBe('miss');
  });

  it('does not count a repeated shot and rejects coordinates outside the board', () => {
    const placement = { row: 1, col: 1, size: 2, horizontal: true };
    const grid = placeShip(
      emptyGrid(),
      placement.row,
      placement.col,
      placement.size,
      placement.horizontal,
    );
    const hit = shoot(grid, [placement], 1, 1);
    expect(shoot(hit.grid, [placement], 1, 1).result).toEqual({
      hit: false,
      sunk: false,
      shipIndex: null,
    });
    expect(() => shoot(grid, [placement], SIZE, 0)).toThrow();
  });
});
