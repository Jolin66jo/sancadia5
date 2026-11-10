import { useState, type ReactNode } from 'react';
import MatchSetup from '@/components/MatchSetup';
import type { MatchConfig } from '@/games/matchConfig';

export default function MatchFlow({
  renderMatch,
}: {
  renderMatch: (config: MatchConfig) => ReactNode;
}) {
  const [config, setConfig] = useState<MatchConfig | null>(null);

  if (!config) return <MatchSetup onStart={setConfig} />;
  return <>{renderMatch(config)}</>;
}
