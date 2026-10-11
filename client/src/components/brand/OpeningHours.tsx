import { useTranslation } from 'react-i18next';
import { OPENING_HOURS, WEEK_ORDER, formatHour12 } from '@shared/business';
import { businessWeekday } from '@/lib/business-time';

interface OpeningHoursProps {
  /** compact = for dark footer, two-tone text */
  variant?: 'table' | 'compact';
}

const weekdayName = (lang: string, day: number) =>
  // 2023-01-01 was a Sunday: offset by `day` to get each weekday name.
  new Intl.DateTimeFormat(lang, { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2023, 0, 1 + day)));

/** Weekly schedule from shared/business.ts, with today highlighted. */
const OpeningHours = ({ variant = 'table' }: OpeningHoursProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en-US' : 'es-MX';
  const today = businessWeekday();

  return (
    <ul className={variant === 'table' ? 'divide-y divide-border' : 'space-y-1 text-sm'}>
      {WEEK_ORDER.map((day) => {
        const h = OPENING_HOURS[day];
        const isToday = day === today;
        const name = weekdayName(lang, day);
        return (
          <li
            key={day}
            className={
              variant === 'table'
                ? `flex justify-between gap-4 py-2 ${isToday ? 'font-semibold text-primary' : 'text-foreground'}`
                : `flex justify-between gap-4 ${isToday ? 'font-semibold text-white' : 'text-white/75'}`
            }
          >
            <span className="capitalize">
              {name}
              {isToday && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase ${variant === 'table' ? 'bg-secondary/15 text-secondary' : 'bg-white/20'}`}>
                  {t('location.today')}
                </span>
              )}
            </span>
            <span className="tabular-nums">{h ? `${formatHour12(h.open)} – ${formatHour12(h.close)}` : '—'}</span>
          </li>
        );
      })}
    </ul>
  );
};

export default OpeningHours;
