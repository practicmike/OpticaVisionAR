import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceIcon } from '@/lib/service-icon';
import type { Service } from '@shared/schema';

/**
 * Service cards: bookable services link to the booking form with the service
 * preselected; walk-in services (frame adjustment) show a "no appointment
 * needed" note instead of a button.
 */
const ServicesGrid = () => {
  const { t, i18n } = useTranslation();
  const isEs = !i18n.language?.startsWith('en');
  const { data: services, isLoading } = useQuery<Service[]>({ queryKey: ['/api/services'] });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-elevated h-56 animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
      {(services ?? []).map((service) => (
        <article key={service.id} className="card-elevated flex flex-col p-6 md:p-8">
          <div className="mb-4 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md">
              <ServiceIcon name={service.icon} className="h-6 w-6" />
            </span>
            <h3 className="pt-1 text-xl font-semibold leading-snug">{isEs ? service.nameEs : service.nameEn}</h3>
          </div>
          <p className="mb-6 flex-1 leading-relaxed text-muted-foreground">{isEs ? service.descriptionEs : service.descriptionEn}</p>
          {service.requiresAppointment ? (
            <Link href={`/appointments?service=${service.id}`}>
              <Button className="gap-2 bg-secondary text-white hover:bg-secondary/90">
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                {t('hero.ctaAppointment')}
              </Button>
            </Link>
          ) : (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
              <p className="mb-1 flex items-center gap-2 font-semibold">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {t('walkIn.badge')}
              </p>
              <p>{t('walkIn.note')}</p>
            </div>
          )}
        </article>
      ))}
    </div>
  );
};

export default ServicesGrid;
