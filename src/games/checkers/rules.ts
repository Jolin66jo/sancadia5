import type { GameEngine, Player, Winner } from '@/engine/types';

export const SIZE = 8;

export type PieceType = 'man' | 'king';
export type Occupant = { readonly player: Player; readonly type: PieceType } | null;
export type Board = readonly (readonly Occupant[])[];

export interface CheckersState {
  readonly board: Board;
  readonly turn: Player;
  readonly mustContinueFrom: readonly [number, number] | null;
}

export interface CheckersMove {
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  readonly captures: readonly (readonly [number, number])[];
}

const FORWARD: Record<Player, readonly number[]> = { 0: [-1], 1: [1] };
const ALL_ROWS = [-1, 1];

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function isDark(r: number, c: number): boolean {
  return (r + c) % 2 === 1;
}

function cloneBoard(board: Board): Occupant[][] {
  return board.map((row) => [...row]);
}

function pieceRows(piece: PieceType, player: Player): readonly number[] {
  return piece === 'king' ? ALL_ROWS : FORWARD[player];
}

function deepJumps(
  board: Board,
  startR: number,
  startC: number,
  row: number,
  col: number,
  piece: PieceType,
  player: Player,
  captured: readonly (readonly [number, number])[],
): CheckersMove[] {
  const results: CheckersMove[] = [];
  for (const dr of pieceRows(piece, player)) {
    for (const dc of [-1, 1]) {
      const midR = row + dr;
      const midC = col + dc;
      const landR = row + dr * 2;
      const landC = col + dc * 2;
      if (!inBounds(landR, landC)) continue;
      const midRow = board[midR];
      if (!midRow) continue;
      const mid = midRow[midC] ?? null;
      if (mid === null || mid.player === player) continue;
      const landRow = board[landR];
      if (!landRow) continue;
      if (landRow[landC] !== null) continue;

      const tempBoard = cloneBoard(board);
      const boardRow = tempBoard[row];
      if (boardRow) boardRow[col] = null;
      const midBoardRow = tempBoard[midR];
      if (midBoardRow) midBoardRow[midC] = null;
      const landBoardRow = tempBoard[landR];
      if (landBoardRow) landBoardRow[landC] = { player, type: piece };
      const newCaptured = [...captured, [midR, midC] as const];
      const deeper = deepJumps(tempBoard, startR, startC, landR, landC, piece, player, newCaptured);
      if (deeper.length === 0) {
        results.push({ from: [startR, startC], to: [landR, landC], captures: newCaptured });
      } else {
        results.push(...deeper);
      }
    }
  }
  return results;
}

function allJumpsForPiece(
  board: Board,
  row: number,
  col: number,
  piece: PieceType,
  player: Player,
): CheckersMove[] {
  const occupant = board[row]?.[col] ?? null;
  if (occupant === null || occupant.player !== player) return [];
  return deepJumps(board, row, col, row, col, piece, player, []);
}

function simpleMovesForPiece(
  board: Board,
  row: number,
  col: number,
  piece: PieceType,
  player: Player,
): CheckersMove[] {
  const moves: CheckersMove[] = [];
  for (const dr of pieceRows(piece, player)) {
    for (const dc of [-1, 1]) {
      const nr = row + dr;
      const nc = col + dc;
      if (!inBounds(nr, nc)) continue;
      const targetRow = board[nr];
      if (!targetRow) continue;
      if (targetRow[nc] !== null) continue;
      moves.push({ from: [row, col], to: [nr, nc], captures: [] });
    }
  }
  return moves;
}

function allJumpsOnBoard(board: Board, player: Player): CheckersMove[] {
  const jumps: CheckersMove[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const occ = board[r]?.[c] ?? null;
      if (occ === null || occ.player !== player) continue;
      jumps.push(...allJumpsForPiece(board, r, c, occ.type, player));
    }
  }
  return jumps;
}

export function legalMovesFor(state: CheckersState): CheckersMove[] {
  if (state.mustContinueFrom !== null) {
    const [r, c] = state.mustContinueFrom;
    const occ = state.board[r]?.[c] ?? null;
    if (occ !== null) {
      const jumps = allJumpsForPiece(state.board, r, c, occ.type, state.turn);
      if (jumps.length > 0) return jumps;
    }
    return [];
  }

  const allJumps = allJumpsOnBoard(state.board, state.turn);
  if (allJumps.length > 0) return allJumps;

  const moves: CheckersMove[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const occ = state.board[r]?.[c] ?? null;
      if (occ === null || occ.player !== state.turn) continue;
      moves.push(...simpleMovesForPiece(state.board, r, c, occ.type, state.turn));
    }
  }
  return moves;
}

function maybePromote(occupant: Occupant, row: number): Occupant {
  if (occupant === null) return null;
  if (occupant.type === 'king') return occupant;
  if (occupant.player === 0 && row === 0) return { player: occupant.player, type: 'king' };
  if (occupant.player === 1 && row === SIZE - 1) return { player: occupant.player, type: 'king' };
  return occupant;
}

function resultOf(state: CheckersState): Winner {
  const pieces = [0, 0];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const occ = state.board[r]?.[c] ?? null;
      if (occ !== null) {
        const playerIndex = occ.player;
        if (playerIndex === 0 || playerIndex === 1) {
          pieces[playerIndex] = (pieces[playerIndex] ?? 0) + 1;
        }
      }
    }
  }
  const p0 = pieces[0] ?? 0;
  const p1 = pieces[1] ?? 0;
  if (p0 === 0) return 1;
  if (p1 === 0) return 0;
  if (legalMovesFor(state).length === 0) {
    return state.turn === 0 ? 1 : 0;
  }
  return null;
}

export function applyMoveInternal(state: CheckersState, move: CheckersMove): CheckersState {
  const board = cloneBoard(state.board);
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  const fromRow = board[fr];
  if (!fromRow) throw new Error(`Invalid move from row: ${fr}`);
  const occupant = fromRow[fc] ?? null;
  fromRow[fc] = null;
  for (const [cr, cc] of move.captures) {
    const captureRow = board[cr];
    if (captureRow) captureRow[cc] = null;
  }
  const targetRow = board[tr];
  if (!targetRow) throw new Error(`Invalid move to row: ${tr}`);
  const promoted = maybePromote(occupant, tr);
  targetRow[tc] = promoted;

  const wasMan = occupant !== null && occupant.type === 'man';
  const justPromoted = wasMan && promoted !== null && promoted.type === 'king';

  if (move.captures.length > 0 && !justPromoted) {
    const moreJumps = allJumpsForPiece(board, tr, tc, promoted?.type ?? 'man', state.turn);
    if (moreJumps.length > 0) {
      return { board, turn: state.turn, mustContinueFrom: [tr, tc] };
    }
  }

  const nextTurn: Player = state.turn === 0 ? 1 : 0;
  return { board, turn: nextTurn, mustContinueFrom: null };
}

export function movesEqual(a: CheckersMove, b: CheckersMove): boolean {
  if (a.from[0] !== b.from[0] || a.from[1] !== b.from[1]) return false;
  if (a.to[0] !== b.to[0] || a.to[1] !== b.to[1]) return false;
  if (a.captures.length !== b.captures.length) return false;
  return a.captures.every((ca, i) => {
    const other = b.captures[i];
    if (!other) return false;
    return ca[0] === other[0] && ca[1] === other[1];
  });
}

export const checkers: GameEngine<CheckersState, CheckersMove> = {
  id: 'checkers',
  initialState: () => {
    const board: Occupant[][] = Array.from({ length: SIZE }, () =>
      Array<Occupant>(SIZE).fill(null),
    );
    for (let r = 0; r < SIZE; r++) {
      const row = board[r];
      if (!row) continue;
      for (let c = 0; c < SIZE; c++) {
        if (!isDark(r, c)) continue;
        if (r < 3) row[c] = { player: 1, type: 'man' };
        else if (r > 4) row[c] = { player: 0, type: 'man' };
      }
    }
    return { board, turn: 0, mustContinueFrom: null };
  },
  currentPlayer: (state) => state.turn,
  legalMoves: legalMovesFor,
  movesEqual,
  applyMove: (state, move) => {
    if (!legalMovesFor(state).some((m) => movesEqual(m, move))) {
      throw new Error('Illegal move');
    }
    return applyMoveInternal(state, move);
  },
  isTerminal: (state) => resultOf(state) !== null,
  winner: (state) => resultOf(state),
};
