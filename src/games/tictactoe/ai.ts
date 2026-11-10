import { getDifficultySettings, pickAiMove, type Difficulty } from '@/engine/difficulty';
import { ticTacToe, type TicTacToeMove, type TicTacToeState } from '@/games/tictactoe/rules';

const DEPTH_CAPS = {
  maxDepthCap: { beginner: 1, professional: 3, expert: Infinity },
};

export function chooseMove(state: TicTacToeState, difficulty: Difficulty): TicTacToeMove | null {
  return pickAiMove(ticTacToe, state, getDifficultySettings(difficulty, DEPTH_CAPS));
}
