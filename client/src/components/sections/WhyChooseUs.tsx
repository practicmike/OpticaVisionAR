import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Building2, Zap, Users, Heart, Glasses, ScanFace } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionHeading from '@/components/brand/SectionHeading';

const ITEMS = [
  { key: 'local', Icon: Building2 },
  { key: 'technology', Icon: Zap },
  { key: 'professionals', Icon: Users },
  { key: 'personalized', Icon: Heart },
  { key: 'quality', Icon: Glasses },
  { key: 'tryon', Icon: ScanFace },
] as const;

/** "¿Por qué elegir Ópticas Cardani?" — six trust cards + CTA. */
const WhyChooseUs = ({ showCta = true }: { showCta?: boolean }) => {
  const { t } = useTranslation();
  return (
    <section className="bg-muted py-16 md:py-24">
      <div className="container mx-auto px-4">
        <SectionHeading title={t('whyChoose.title')} subtitle={t('whyChoose.subtitle')} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
          {ITEMS.map(({ key, Icon }) => (
            <div key={key} className="card-elevated group flex gap-4 p-5 text-left md:block md:p-8 md:text-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/5 transition-transform duration-300 group-hover:scale-110 md:mx-auto md:mb-6 md:h-16 md:w-16">
                <Icon className="h-7 w-7 text-primary md:h-9 md:w-9" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold md:mb-3 md:text-xl">{t(`whyChoose.items.${key}.title`)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{t(`whyChoose.items.${key}.description`)}</p>
              </div>
            </div>
          ))}
        </div>
        {showCta && (
          <div className="card-elevated mx-auto mt-12 max-w-2xl p-8 text-center md:mt-16">
            <h3 className="mb-3 text-2xl font-bold">{t('whyChoose.cta.title')}</h3>
            <p className="mb-6 text-muted-foreground">{t('whyChoose.cta.description')}</p>
            <Link href="/appointments">
              <Button size="lg" className="shadow-lg transition-transform hover:scale-105">
                {t('whyChoose.cta.button')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default WhyChooseUs;
