import MatchFlow from '@/games/MatchFlow';
import CheckersMatch from '@/games/checkers/CheckersMatch';

export default function CheckersGame() {
  return <MatchFlow renderMatch={(config) => <CheckersMatch config={config} />} />;
}
