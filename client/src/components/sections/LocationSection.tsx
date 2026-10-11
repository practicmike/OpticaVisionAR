import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Navigation, Clock } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import SectionHeading from '@/components/brand/SectionHeading';
import OpeningHours from '@/components/brand/OpeningHours';
import { BUSINESS, mapsEmbedUrl, mapsLinkUrl, whatsappUrl } from '@shared/business';

/** Address, contact actions, weekly hours and an embedded map. */
const LocationSection = ({ withHeading = true }: { withHeading?: boolean }) => {
  const { t } = useTranslation();
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        {withHeading && <SectionHeading title={t('location.title')} subtitle={t('location.subtitle')} />}
        <div className="card-elevated grid overflow-hidden lg:grid-cols-2">
          <div className="p-6 md:p-10">
            <div className="mb-6 flex items-start gap-3">
              <MapPin className="mt-1 h-6 w-6 shrink-0 text-secondary" aria-hidden="true" />
              <div>
                <p className="font-heading text-lg font-semibold text-primary">{BUSINESS.address}</p>
                <p className="text-muted-foreground">{BUSINESS.city}</p>
              </div>
            </div>
            <div className="mb-8 flex flex-wrap gap-3">
              <a href={mapsLinkUrl()} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2"><Navigation className="h-4 w-4" />{t('location.directions')}</Button>
              </a>
              <a href={`tel:${BUSINESS.phoneE164}`}>
                <Button variant="outline" className="gap-2"><Phone className="h-4 w-4" />{BUSINESS.phoneDisplay}</Button>
              </a>
              <a href={whatsappUrl(t('whatsapp.defaultMessage'))} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2 bg-whatsapp text-white hover:bg-whatsapp/90"><FaWhatsapp className="h-4 w-4" />{t('location.whatsapp')}</Button>
              </a>
            </div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-secondary" aria-hidden="true" />
              {t('location.hoursTitle')}
            </h3>
            <OpeningHours />
          </div>
          <div className="min-h-[320px] bg-muted">
            <iframe
              title={t('location.mapTitle')}
              src={mapsEmbedUrl()}
              className="h-full min-h-[320px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
