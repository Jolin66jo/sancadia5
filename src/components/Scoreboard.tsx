interface ScoreboardEntry {
  label: string;
  value: number;
}

export default function Scoreboard({ entries }: { entries: ScoreboardEntry[] }) {
  return (
    <div className="grid grid-cols-3 divide-x divide-border rounded-2xl bg-surface shadow-sm ring-1 ring-border">
      {entries.map((entry) => (
        <div key={entry.label} className="py-3 text-center">
          <p className="text-xs font-semibold text-subtle">{entry.label}</p>
          <p className="text-2xl font-bold">{entry.value}</p>
        </div>
      ))}
    </div>
  );
}
