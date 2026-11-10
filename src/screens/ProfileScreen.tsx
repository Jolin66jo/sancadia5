import { Award, LogOut, Trophy } from 'lucide-react';
import ScreenHeader from '@/components/ScreenHeader';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ButtonLink from '@/components/ButtonLink';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const emailInitial = (user?.email ?? '?').charAt(0).toUpperCase();

  return (
    <>
      <ScreenHeader title="Profile" backTo="/" />
      <div className="grid gap-4 pb-4">
        <Card className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-2xl font-bold text-primary">
            {emailInitial}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{user ? user.email : 'Guest'}</h2>
            <p className="text-sm text-subtle">{user ? 'Signed in' : 'Not signed in'}</p>
          </div>
        </Card>

        <Card className="grid gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Trophy className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Stats</h2>
              <p className="text-sm text-subtle">Overall level and match history.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Award className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Achievements</h2>
              <p className="text-sm text-subtle">Unlocked rewards and badges.</p>
            </div>
          </div>
          <p className="text-sm text-subtle">Coming soon. Your progress will be tracked here.</p>
        </Card>

        {user ? (
          <Button variant="secondary" onClick={() => signOut()}>
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Log out
          </Button>
        ) : (
          <ButtonLink to="/login" variant="secondary">
            Log in / Sign up
          </ButtonLink>
        )}
      </div>
    </>
  );
}
