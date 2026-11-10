import { MessageCircle, Users } from 'lucide-react';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';

export default function SocialScreen() {
  return (
    <>
      <ScreenHeader title="Social" backTo="/" />
      <div className="grid gap-4 pb-4">
        <Card className="grid gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Users className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Friends</h2>
              <p className="text-sm text-subtle">Your friends list and party lobbies.</p>
            </div>
          </div>
          <p className="text-sm text-subtle">
            Coming soon. You'll be able to add friends, start parties, and chat here.
          </p>
        </Card>
        <Card className="grid gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <MessageCircle className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Leaderboards</h2>
              <p className="text-sm text-subtle">Local and global rankings.</p>
            </div>
          </div>
          <p className="text-sm text-subtle">Coming soon. Climb the boards across every game.</p>
        </Card>
      </div>
    </>
  );
}
