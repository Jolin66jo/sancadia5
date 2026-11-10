import MatchFlow from '@/games/MatchFlow';
import Connect4Match from '@/games/connect4/Connect4Match';

export default function Connect4Game() {
  return <MatchFlow renderMatch={(config) => <Connect4Match config={config} />} />;
}
