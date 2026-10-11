import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

/** Newsletter signup that actually saves the email (POST /api/subscriptions). */
const NewsletterSection = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const subscribe = useMutation({
    mutationFn: (value: string) => apiRequest('POST', '/api/subscriptions', { email: value }),
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError(t('newsletter.invalid'));
      return;
    }
    setError('');
    subscribe.mutate(value);
  };

  return (
    <section className="relative overflow-hidden bg-[#1A365D] py-16 text-white md:py-20">
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/5" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-secondary/10" aria-hidden="true" />
      <div className="container relative mx-auto max-w-2xl px-4 text-center">
        <Mail className="mx-auto mb-4 h-10 w-10 text-secondary" aria-hidden="true" />
        <h2 className="mb-3 text-3xl font-bold !text-white md:text-4xl">{t('newsletter.title')}</h2>
        <p className="mb-8 text-lg text-white/80">{t('newsletter.subtitle')}</p>
        {subscribe.isSuccess ? (
          <p className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3" role="status">
            <CheckCircle2 className="h-5 w-5 text-secondary" aria-hidden="true" />
            {t('newsletter.success')}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row" noValidate>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('newsletter.emailPlaceholder')}
              aria-label={t('newsletter.emailAriaLabel')}
              aria-invalid={!!error}
              className="h-12 flex-1 rounded-lg border-0 px-4 text-foreground shadow focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <Button type="submit" size="lg" disabled={subscribe.isPending} className="h-12 bg-secondary px-8 text-white hover:bg-secondary/90">
              {t('newsletter.subscribe')}
            </Button>
          </form>
        )}
        {(error || subscribe.isError) && (
          <p className="mt-3 text-sm text-red-200" role="alert">{error || t('common.error', { defaultValue: 'Error' })}</p>
        )}
        <p className="mt-6 text-sm text-white/60">{t('newsletter.privacy')}</p>
      </div>
    </section>
  );
};

export default NewsletterSection;
