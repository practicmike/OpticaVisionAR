import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Mail } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import OpeningHours from '@/components/brand/OpeningHours';
import { BUSINESS, whatsappUrl } from '@shared/business';
import type { Service } from '@shared/schema';

const Footer = () => {
  const { t, i18n } = useTranslation();
  const isEs = !i18n.language?.startsWith('en');
  const { data: services } = useQuery<Service[]>({ queryKey: ['/api/services'] });

  const quickLinks = [
    { path: '/', label: t('footer.links.home') },
    { path: '/services', label: t('footer.links.services') },
    { path: '/products', label: t('footer.links.products') },
    { path: '/virtual-try-on', label: t('footer.links.virtualTryOn') },
    { path: '/appointments', label: t('footer.links.appointments') },
    { path: '/blog', label: t('footer.links.blog') },
    { path: '/contact', label: t('nav.contact') },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow">
                <img src="/brand/logo-mark.png" alt="" className="h-6 w-auto" width={37} height={24} />
              </span>
              <span className="leading-tight">
                <span className="block font-heading text-lg font-bold text-white">Ópticas Cardani</span>
                <span className="block text-xs text-white/70">{t('brand.tagline')}</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-white/80">{t('footer.tagline')}</p>
          </div>

          <div>
            <h3 className="mb-4 text-base font-semibold !text-white">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="text-white/80 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-base font-semibold !text-white">{t('nav.services')}</h3>
            <ul className="space-y-2 text-sm">
              {(services ?? []).map((service) => (
                <li key={service.id}>
                  <Link href="/services" className="text-white/80 transition-colors hover:text-white">
                    {isEs ? service.nameEs : service.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-base font-semibold !text-white">{t('footer.contact')}</h3>
            <ul className="mb-6 space-y-3 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                <span className="text-white/85">{BUSINESS.address}<br />{BUSINESS.city}</span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                <a href={`tel:${BUSINESS.phoneE164}`} className="text-white/85 hover:text-white">{BUSINESS.phoneDisplay}</a>
              </li>
              <li className="flex gap-3">
                <FaWhatsapp className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                <a href={whatsappUrl(t('whatsapp.defaultMessage'))} target="_blank" rel="noopener noreferrer" className="text-white/85 hover:text-white">
                  {t('footer.whatsappAvailable')}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                <a href={`mailto:${BUSINESS.email}`} className="text-white/85 hover:text-white">{BUSINESS.email}</a>
              </li>
            </ul>
            <h4 className="mb-2 text-sm font-semibold !text-white">{t('location.hoursTitle')}</h4>
            <OpeningHours variant="compact" />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 text-sm text-white/70 md:flex-row">
          <p>© {new Date().getFullYear()} Ópticas Cardani. {t('footer.rightsReserved')}</p>
          <Link href="/legal" className="hover:text-white">{t('footer.legal')}</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
