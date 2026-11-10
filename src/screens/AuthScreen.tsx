import { useState, type FormEvent } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import Button from '@/components/Button';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';

type Mode = 'login' | 'signup';

export default function AuthScreen({ initialMode = 'login' }: { initialMode?: Mode }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    const res = mode === 'login' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (res.error) setError(res.error);
  }

  return (
    <>
      <ScreenHeader title={mode === 'login' ? 'Log in' : 'Sign up'} backTo="/" />
      <form onSubmit={submit} className="grid gap-4 pb-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 rounded-2xl bg-surface px-4 py-3 text-foreground shadow-sm ring-1 ring-border outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
            placeholder="you@example.com"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Password</span>
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-11 rounded-2xl bg-surface px-4 py-3 text-foreground shadow-sm ring-1 ring-border outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
            placeholder="At least 6 characters"
          />
        </label>

        {error && (
          <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy} className="mt-2 h-14 text-lg">
          {mode === 'login' ? (
            <LogIn className="h-5 w-5" aria-hidden="true" />
          ) : (
            <UserPlus className="h-5 w-5" aria-hidden="true" />
          )}
          {mode === 'login' ? 'Log in' : 'Create account'}
        </Button>

        <div className="flex items-center justify-center gap-1 pt-1 text-sm text-subtle">
          <span>{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}</span>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
            }}
            className="font-semibold text-primary hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </form>
    </>
  );
}
