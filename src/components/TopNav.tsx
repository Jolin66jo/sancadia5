import { Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-center px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <Link
          to="/"
          className="flex items-center gap-2 py-1 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 rounded-xl"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Gamepad2 className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight">Sancadia</span>
        </Link>
      </div>
    </header>
  );
}
