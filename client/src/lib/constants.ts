// Application Constants

// Language options
export const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' }
];

// Service icons mapping
export const SERVICE_ICONS = {
  eye: 'eye',
  glasses: 'glasses',
  camera: 'camera',
  'user-md': 'user-md'
};

// Frame filter options
export const FRAME_FILTERS = {
  styles: ['Rectangle', 'Round', 'Oval', 'Cat-eye', 'Square', 'Aviator'],
  materials: ['Acetate', 'Metal', 'Titanium', 'Plastic', 'Carbon Fiber'],
  colors: ['Black', 'Brown', 'Blue', 'Red', 'Gold', 'Silver', 'Transparent', 'Multicolor']
};

// Blog categories
export const BLOG_CATEGORIES = [
  { id: 'all', labelEn: 'All Topics', labelEs: 'Todos los Temas' },
  { id: 'health', labelEn: 'Eye Health', labelEs: 'Salud Visual' },
  { id: 'tips', labelEn: 'Care Tips', labelEs: 'Consejos de Cuidado' },
  { id: 'trends', labelEn: 'Trends', labelEs: 'Tendencias' },
  { id: 'children', labelEn: 'Children\'s Vision', labelEs: 'Visión Infantil' },
  { id: 'technology', labelEn: 'Technology', labelEs: 'Tecnología' }
];

// Map API key (example, should be replaced with actual key from environment variables)
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Social media URLs
export const SOCIAL_MEDIA = {
  facebook: 'https://facebook.com/opticascardani',
  instagram: 'https://instagram.com/opticascardani',
  twitter: 'https://twitter.com/opticascardani',
  youtube: 'https://youtube.com/opticascardani'
};

// App routes
export const ROUTES = {
  HOME: '/',
  SERVICES: '/services',
  PRODUCTS: '/products',
  APPOINTMENTS: '/appointments',
  VIRTUAL_TRY_ON: '/virtual-try-on',
  BLOG: '/blog',
  CONTACT: '/contact',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS: '/terms'
};

// Currency formatting options
export const CURRENCY_FORMAT_OPTIONS = { 
  style: 'currency', 
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
};

// Days of week
export const DAYS_OF_WEEK = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
};

// Months
export const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
};
