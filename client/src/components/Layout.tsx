import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingWhatsApp from './brand/FloatingWhatsApp';
import { useLocation } from 'wouter';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout = ({ children, title, description }: LayoutProps) => {
  const { t, i18n } = useTranslation();
  const defaultTitle = t('seo.defaultTitle');
  const defaultDescription = t('seo.defaultDescription');
  
  // New page -> start at the top (wouter keeps the previous scroll position).
  const [location] = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0 });
  }, [location]);

  // Set HTML lang attribute based on current language
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Construct page title
  const pageTitle = title 
    ? `${title} | ${defaultTitle}` 
    : defaultTitle;

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={description || defaultDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description || defaultDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description || defaultDescription} />
      </Helmet>
      
      <Navbar />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Layout;
