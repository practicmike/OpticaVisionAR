import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

/** Compact ES | EN pill toggle. */
const LangToggle = () => {
  const { i18n } = useTranslation();
  const { changeLanguage } = useLanguage();
  const current = i18n.language?.startsWith('en') ? 'en' : 'es';
  return (
    <div className="inline-flex rounded-full bg-muted p-1 text-xs font-semibold" role="group" aria-label="Idioma / Language">
      {(['es', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => changeLanguage(code)}
          aria-pressed={current === code}
          className={`rounded-full px-3 py-1 uppercase transition-colors ${
            current === code ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-primary'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
};

export default LangToggle;
