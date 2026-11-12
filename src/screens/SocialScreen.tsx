import { MessageCircle, Users } from 'lucide-react';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import useTranslation from '@/hooks/useTranslation';

export default function SocialScreen() {
  const { tText } = useTranslation();
  return (
    <>
      <ScreenHeader title={tText('Social')} backTo="/" />
      <div className="grid gap-4 pb-4">
        <Card className="grid gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Users className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold">{tText('Friends')}</h2>
              <p className="text-sm text-subtle">
                {tText('Your friends list and party lobbies.')}
              </p>
            </div>
          </div>
          <p className="text-sm text-subtle">
            {tText("Coming soon. You'll be able to add friends, start parties, and chat here.")}
          </p>
        </Card>
        <Card className="grid gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <MessageCircle className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold">{tText('Leaderboards')}</h2>
              <p className="text-sm text-subtle">{tText('Local and global rankings.')}</p>
            </div>
          </div>
          <p className="text-sm text-subtle">
            {tText('Coming soon. Climb the boards across every game.')}
          </p>
        </Card>
      </div>
    </>
  );
}
