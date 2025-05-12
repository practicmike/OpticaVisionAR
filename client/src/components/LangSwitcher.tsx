import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

const LangSwitcher = () => {
  const { i18n } = useTranslation();
  const { changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const languages = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' }
  ];
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const handleLanguageSelect = (langCode: string) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={toggleDropdown}
        className="flex items-center gap-1 text-base hover:bg-transparent hover:text-primary"
      >
        <span className="uppercase">{currentLanguage.code}</span>
        <ChevronDown size={14} />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 bg-white shadow-md rounded-md py-2 w-32 z-10">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                lang.code === i18n.language ? 'text-primary font-semibold' : 'text-gray-700'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LangSwitcher;
