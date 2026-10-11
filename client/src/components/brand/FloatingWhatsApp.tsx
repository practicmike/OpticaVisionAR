import { useTranslation } from 'react-i18next';
import { FaWhatsapp } from 'react-icons/fa';
import { whatsappUrl } from '@shared/business';

/** Fixed WhatsApp button (bottom-right on every page). */
const FloatingWhatsApp = () => {
  const { t } = useTranslation();
  return (
    <a
      href={whatsappUrl(t('whatsapp.defaultMessage'))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsapp.floating')}
      title={t('whatsapp.floating')}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-whatsapp/40 print:hidden"
    >
      <FaWhatsapp className="h-7 w-7" aria-hidden="true" />
    </a>
  );
};

export default FloatingWhatsApp;
