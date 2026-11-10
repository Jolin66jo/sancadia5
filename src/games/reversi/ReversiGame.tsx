import MatchFlow from '@/games/MatchFlow';
import ReversiMatch from '@/games/reversi/ReversiMatch';

export default function ReversiGame() {
  return <MatchFlow renderMatch={(config) => <ReversiMatch config={config} />} />;
}
