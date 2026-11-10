import { describe, expect, it } from 'vitest';
import type { Player } from '@/engine/types';
import { chooseMove } from '@/games/tictactoe/ai';
import { ticTacToe } from '@/games/tictactoe/rules';

type Result = 'expert-win' | 'expert-loss' | 'draw';

function randomMove(moves: number[]): number {
  const index = Math.floor(Math.random() * moves.length);
  return moves[index] ?? -1;
}

function playGame(expertSide: Player): Result {
  let state = ticTacToe.initialState();
  while (!ticTacToe.isTerminal(state)) {
    const moves = ticTacToe.legalMoves(state);
    const move = state.turn === expertSide ? chooseMove(state, 'expert') : randomMove(moves);
    if (move === null || move < 0) throw new Error('No move available before the game ended');
    state = ticTacToe.applyMove(state, move);
  }
  const result = ticTacToe.winner(state);
  if (result === 'draw') return 'draw';
  return result === expertSide ? 'expert-win' : 'expert-loss';
}

describe('Expert computer opponent', () => {
  it('never loses to a random player over 100 games', () => {
    const results = Array.from({ length: 100 }, (_, game) => playGame(game % 2 === 0 ? 0 : 1));
    expect(results.filter((result) => result === 'expert-loss')).toHaveLength(0);
  });
});
