import MatchFlow from '@/games/MatchFlow';
import BattleshipsMatch from '@/games/battleships/BattleshipsMatch';

export default function BattleshipsGame() {
  return <MatchFlow renderMatch={(config) => <BattleshipsMatch config={config} />} />;
}
