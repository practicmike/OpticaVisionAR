import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Menu, X, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LangToggle from '@/components/brand/LangToggle';

const Navbar = () => {
  const { t } = useTranslation();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close the mobile menu on navigation; add a shadow once the page scrolls.
  useEffect(() => setMobileMenuOpen(false), [location]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/services', label: t('nav.services') },
    { path: '/products', label: t('nav.products') },
    { path: '/virtual-try-on', label: t('footer.links.virtualTryOn') },
    { path: '/blog', label: t('nav.blog') },
    { path: '/contact', label: t('nav.contact') },
  ];

  const isActive = (path: string) => (path === '/' ? location === '/' : location.startsWith(path));

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 transition-shadow ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 md:h-20">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Ópticas Cardani">
          <img src="/brand/logo-mark.png" alt="" className="h-9 w-auto md:h-10" width={62} height={40} />
          <span className="leading-tight">
            <span className="block font-heading text-lg font-bold text-primary md:text-xl">Ópticas Cardani</span>
            <span className="block text-xs text-muted-foreground">{t('brand.tagline')}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.path) ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {item.label}
              {isActive(item.path) && (
                <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-secondary" aria-hidden="true" />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LangToggle />
          <Link href="/appointments">
            <Button className="gap-2 shadow-md">
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              {t('nav.bookAppointment')}
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="rounded-md p-2 text-primary lg:hidden"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? t('aria.closeMenu') : t('aria.openMenu')}
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t bg-white lg:hidden">
          <nav className="container mx-auto flex flex-col px-4 py-3" aria-label="Principal">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`rounded-md px-3 py-3 text-base font-medium ${
                  isActive(item.path) ? 'bg-primary/5 text-primary' : 'text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex items-center justify-between gap-3 border-t pt-4">
              <LangToggle />
              <Link href="/appointments">
                <Button className="gap-2">
                  <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                  {t('nav.bookAppointment')}
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
