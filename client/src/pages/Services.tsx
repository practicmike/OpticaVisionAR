import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Eye, Glasses, Camera, UserRound, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/helpers';

const Services = () => {
  const { t } = useTranslation();
  
  // Fetch services
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/services'],
  });

  // Helper function to get icon component based on icon name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'eye':
        return <Eye className="text-primary" size={32} />;
      case 'glasses':
        return <Glasses className="text-primary" size={32} />;
      case 'camera':
        return <Camera className="text-primary" size={32} />;
      case 'user-md':
        return <UserRound className="text-primary" size={32} />;
      default:
        return <Eye className="text-primary" size={32} />;
    }
  };

  return (
    <>
      {/* Services Hero */}
      <section className="bg-primary text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-bold text-3xl md:text-4xl mb-4">{t('servicesPage.hero.title')}</h1>
            <p className="text-lg opacity-90 mb-6">{t('servicesPage.hero.subtitle')}</p>
            <Link href="/appointments">
              <Button className="bg-secondary hover:bg-secondary/90 text-white">
                {t('servicesPage.hero.bookAppointment')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Services Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-bold text-2xl md:text-3xl text-[#333333] mb-3">{t('servicesPage.main.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('servicesPage.main.subtitle')}</p>
          </div>
          
          <div className="max-w-5xl mx-auto grid gap-8">
            {isLoadingServices ? (
              // Loading skeleton
              Array(4).fill(0).map((_, index) => (
                <Card key={index} className="shadow-md">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-3 gap-0">
                      <div className="md:col-span-1 bg-gray-200 h-full min-h-[200px]"></div>
                      <div className="md:col-span-2 p-6">
                        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-100 rounded w-3/4 mb-4"></div>
                        <div className="flex items-center justify-between">
                          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              services?.map((service: any, index: number) => (
                <Card key={service.id} className="shadow-md overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-3 gap-0">
                      <div className="md:col-span-1 bg-primary/5 p-8 flex items-center justify-center">
                        <div className="text-center">
                          {getIconComponent(service.icon)}
                          {service.price > 0 && (
                            <div className="mt-4 font-bold text-xl text-primary">
                              {formatCurrency(service.price)}
                            </div>
                          )}
                          {service.price === 0 && (
                            <div className="mt-4 font-bold text-xl text-secondary">
                              {t('servicesPage.free')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-2 p-6">
                        <h3 className="font-bold text-xl mb-3">
                          {t('common.currentLanguage') === 'es' ? service.nameEs : service.nameEn}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {t('common.currentLanguage') === 'es' ? service.descriptionEs : service.descriptionEn}
                        </p>
                        <div className="flex flex-wrap gap-3 mb-4">
                          <span className="inline-flex items-center text-sm bg-gray-100 px-3 py-1 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {t('servicesPage.duration', { minutes: service.durationMinutes })}
                          </span>
                          {index === 0 && (
                            <span className="inline-flex items-center text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                              {t('servicesPage.recommended')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {t('servicesPage.availableAt')}
                          </div>
                          <Link href={`/appointments?service=${service.id}`}>
                            <Button className="bg-primary hover:bg-primary/90 text-white">
                              {t('servicesPage.bookNow')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-bold text-2xl md:text-3xl text-[#333333] mb-3">{t('servicesPage.whyChoose.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('servicesPage.whyChoose.subtitle')}</p>
          </div>
          
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="bg-primary/10 rounded-full p-3 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{t(`servicesPage.whyChoose.reasons.${item}.title`)}</h3>
                      <p className="text-gray-600">{t(`servicesPage.whyChoose.reasons.${item}.description`)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-bold text-2xl md:text-3xl text-[#333333] mb-3">{t('servicesPage.faq.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('servicesPage.faq.subtitle')}</p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="mb-4 border-b pb-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{t(`servicesPage.faq.questions.${item}.question`)}</h3>
                  <ChevronRight className="h-5 w-5 text-primary" />
                </div>
                <p className="text-gray-600 mt-2">{t(`servicesPage.faq.questions.${item}.answer`)}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">{t('servicesPage.moreQuestions')}</p>
            <Link href="/contact">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                {t('servicesPage.contactUs')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-bold text-2xl md:text-3xl mb-4">{t('servicesPage.cta.title')}</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">{t('servicesPage.cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/appointments">
              <Button className="bg-secondary hover:bg-secondary/90 text-white py-3 px-6">
                {t('servicesPage.cta.bookAppointment')}
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 py-3 px-6">
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
