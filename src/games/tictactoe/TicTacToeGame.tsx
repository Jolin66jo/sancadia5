import MatchFlow from '@/games/MatchFlow';
import TicTacToeMatch from '@/games/tictactoe/TicTacToeMatch';

export default function TicTacToeGame() {
  return <MatchFlow renderMatch={(config) => <TicTacToeMatch config={config} />} />;
}
