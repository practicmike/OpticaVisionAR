import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LangSwitcher from './LangSwitcher';
import { useIsMobile } from '@/hooks/use-mobile';
import logoImg from '../assets/logo.jpg';

const Navbar = () => {
  const { t } = useTranslation();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/services', label: t('nav.services') },
    { path: '/products', label: t('nav.products') },
    { path: '/appointments', label: t('nav.appointments') },
    { path: '/blog', label: t('nav.blog') },
    { path: '/contact', label: t('nav.contact') },
  ];
  
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center justify-between w-full md:w-auto mb-4 md:mb-0">
            <Link href="/" className="flex items-center">
              <img 
                src={logoImg} 
                alt="Ópticas Cardani Logo" 
                className="h-10 mr-2 rounded"
              />
              <span className="text-primary font-bold text-xl">Ópticas Cardani</span>
            </Link>
            
            {isMobile && (
              <button 
                onClick={toggleMobileMenu}
                className="md:hidden focus:outline-none"
                aria-label={mobileMenuOpen ? t('aria.closeMenu') : t('aria.openMenu')}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>
          
          <nav className={`${
            isMobile ? (mobileMenuOpen ? 'flex' : 'hidden') : 'flex'
          } md:flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-6 w-full md:w-auto text-sm font-medium`}>
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={closeMobileMenu}
                className={`py-2 uppercase transition-colors ${
                  location === item.path
                    ? 'text-primary font-semibold'
                    : 'text-[#333333] hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          <div className={`${
            isMobile ? (mobileMenuOpen ? 'flex' : 'hidden') : 'flex'
          } md:flex items-center space-x-4 mt-4 md:mt-0`}>
            <LangSwitcher />
            
            <Link href="/appointments">
              <Button className="bg-secondary hover:bg-secondary/90 text-white">
                {t('nav.bookAppointment')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
