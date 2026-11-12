import { Gamepad2, LogIn, Play, Settings } from 'lucide-react';
import ButtonLink from '@/components/ButtonLink';
import { usePublishedContent } from '@/hooks/usePublishedContent';
import useTranslation from '@/hooks/useTranslation';

const homeContentTypes = ['campaign', 'daily_challenge'] as const;

export default function HomeScreen() {
  const { t } = useTranslation();
  const { content, loading } = usePublishedContent(homeContentTypes);
  const campaigns = content.filter((item) => item.content_type === 'campaign');
  const challenges = content.filter((item) => item.content_type === 'daily_challenge');

  return (
    <div className="flex flex-1 flex-col gap-5 py-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary text-primary-foreground shadow-xl shadow-primary/20">
          <Gamepad2 className="h-12 w-12" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h1 className="mt-8 text-4xl font-bold tracking-tight">Sancadia</h1>
        <p className="mt-2 text-lg font-medium text-subtle">{t('home.tagline')}</p>
      </div>
      <div className="grid gap-3">
        <ButtonLink to="/games" className="h-14 text-lg">
          <Play className="h-5 w-5 fill-current" aria-hidden="true" />
          {t('home.play')}
        </ButtonLink>
        <ButtonLink to="/settings" variant="secondary">
          <Settings className="h-5 w-5" aria-hidden="true" />
          {t('nav.settings')}
        </ButtonLink>
        <ButtonLink to="/login" variant="secondary">
          <LogIn className="h-5 w-5" aria-hidden="true" />
          {t('home.login')}
        </ButtonLink>
      </div>
      {(loading || campaigns.length > 0 || challenges.length > 0) && (
        <section className="grid gap-3" aria-label={t('home.campaigns')}>
          {loading && (
            <p role="status" className="text-sm text-subtle">
              {t('home.loading')}
            </p>
          )}
          {challenges.map((challenge) => (
            <article
              key={challenge.id}
              className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                {t('home.dailyChallenge')}
              </p>
              <h2 className="mt-1 break-words font-bold [overflow-wrap:anywhere]">
                {challenge.title}
              </h2>
              {challenge.description && (
                <p className="mt-1 break-words text-sm text-subtle [overflow-wrap:anywhere]">
                  {challenge.description}
                </p>
              )}
            </article>
          ))}
          {campaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                {t('home.campaign')}
              </p>
              <h2 className="mt-1 break-words font-bold [overflow-wrap:anywhere]">
                {campaign.title}
              </h2>
              {campaign.description && (
                <p className="mt-1 break-words text-sm text-subtle [overflow-wrap:anywhere]">
                  {campaign.description}
                </p>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
