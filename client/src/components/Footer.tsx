import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Instagram, Facebook, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoImage from '../assets/logo.jpg';

const Footer = () => {
  const { t } = useTranslation();
  
  const quickLinks = [
    { path: '/', label: t('footer.links.home') },
    { path: '/services', label: t('footer.links.services') },
    { path: '/products', label: t('footer.links.products') },
    { path: '/appointments', label: t('footer.links.appointments') },
    { path: '/virtual-try-on', label: t('footer.links.virtualTryOn') },
    { path: '/blog', label: t('footer.links.blog') },
  ];
  
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand and social links */}
          <div>
            <div className="flex items-center mb-4">
              <img 
                src={logoImage} 
                alt="Ópticas Cardani Logo" 
                className="h-10 mr-2"
              />
            </div>
            <p className="text-gray-400 mb-4">{t('footer.tagline')}</p>
            <div className="flex space-x-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Contact information */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-3">
              <li className="flex">
                <span className="text-secondary mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-gray-400">{t('footer.locations')}</span>
              </li>
              <li className="flex">
                <span className="text-secondary mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </span>
                <span className="text-gray-400">(462) 123-4567</span>
              </li>
              <li className="flex">
                <span className="text-secondary mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </span>
                <span className="text-gray-400">contacto@opticascardani.com</span>
              </li>
            </ul>
          </div>
          
          {/* Hours and CTA */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.hours')}</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">{t('footer.weekdayHours')}</li>
              <li className="text-gray-400">{t('footer.saturdayHours')}</li>
              <li className="text-gray-400">{t('footer.sundayHours')}</li>
            </ul>
            <div className="mt-4">
              <Link href="/appointments">
                <Button className="bg-secondary hover:bg-secondary/90 text-white">
                  {t('footer.bookAppointment')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Ópticas Cardani. {t('footer.rightsReserved')}</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy-policy" className="hover:text-gray-400 transition-colors">
              {t('footer.privacyPolicy')}
            </Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
