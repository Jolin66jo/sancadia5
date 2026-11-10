import MatchFlow from '@/games/MatchFlow';
import GomokuGame from '@/games/gomoku/GomokuGame';

export default function GomokuMatch() {
  return <MatchFlow renderMatch={(config) => <GomokuGame config={config} />} />;
}
