import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/brand/PageHeader';
import SectionHeading from '@/components/brand/SectionHeading';
import ServicesGrid from '@/components/sections/ServicesGrid';
import WhyChooseUs from '@/components/sections/WhyChooseUs';
import LocationSection from '@/components/sections/LocationSection';
import FAQSection from '@/components/sections/FAQSection';

const Services = () => {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('servicesPage.hero.title')} subtitle={t('servicesPage.hero.subtitle')} />

      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <SectionHeading title={t('servicesPage.main.title')} subtitle={t('servicesPage.main.subtitle')} />
          <ServicesGrid />
        </div>
      </section>

      <WhyChooseUs showCta={false} />
      <LocationSection />
      <FAQSection />

      <section className="bg-gradient-to-br from-[#1A365D] to-primary py-16 text-center text-white md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-3xl font-bold !text-white md:text-4xl">{t('servicesPage.cta.title')}</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/85">{t('servicesPage.cta.subtitle')}</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/appointments">
              <Button size="lg" className="w-full gap-2 bg-white text-primary hover:bg-white/90 sm:w-auto">
                <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                {t('servicesPage.cta.bookAppointment')}
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="w-full gap-2 border-2 border-white/80 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                {t('servicesPage.cta.contactUs')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Services;
