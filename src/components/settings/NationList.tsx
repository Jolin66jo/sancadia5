import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { nations, type NationId } from '@/games/nations';

interface NationListProps {
  selected: NationId;
  onSelect: (nation: NationId) => void;
}

export default function NationList({ selected, onSelect }: NationListProps) {
  return (
    <ul
      aria-label="Nations"
      data-status="active"
      className="grid grid-cols-2 gap-2 pb-4 sm:grid-cols-3"
    >
      {nations.map((nation) => {
        const isSelected = selected === nation.id;
        return (
          <li
            key={nation.id}
            className="min-w-0"
          >
            <Link
              to="/games"
              aria-label={
                nation.id === 'all' ? 'Browse games from all nations' : `Browse ${nation.name} games`
              }
              aria-current={isSelected ? 'page' : undefined}
              onClick={() => onSelect(nation.id)}
              className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${
                isSelected ? 'bg-primary-soft text-primary' : 'text-subtle hover:bg-primary-soft'
              }`}
            >
              {isSelected && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}
              <span aria-hidden="true" className="text-lg">
                {nation.flag}
              </span>
              <span className="min-w-0 break-words">{nation.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
