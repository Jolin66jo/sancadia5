export type Player = 0 | 1;

export type Winner = Player | 'draw' | null;

export interface GameEngine<State, Move> {
  id: string;
  initialState(): State;
  currentPlayer(state: State): Player;
  legalMoves(state: State): Move[];
  applyMove(state: State, move: Move): State;
  isTerminal(state: State): boolean;
  winner(state: State): Winner;
  movesEqual?(a: Move, b: Move): boolean;
  passTurn?(state: State): State;
  orderMoves?(state: State, moves: Move[]): Move[];
  candidateMoves?(state: State): Move[];
}
