import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { CatalogFrame } from '@shared/schema';

/**
 * Sunglasses are either listed under the "Sunglasses" style or named as sun
 * frames (e.g. "Wayfarer Solar Negro": style Wayfarer, tinted lenses).
 */
export const isSunglasses = (frame: Pick<CatalogFrame, 'style' | 'nameEn' | 'nameEs'>) =>
  frame.style === 'Sunglasses' || /\b(sun|solar)\b/i.test(`${frame.nameEn} ${frame.nameEs}`);

const uniqueSorted = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));

/**
 * Filter options built from the whole catalog (not from the filtered list,
 * which would leave only the selected value), so no option ever leads to an
 * empty result.
 */
export const useFrameFacets = () => {
  const { data } = useQuery<CatalogFrame[]>({ queryKey: ['/api/frames'] });
  const frames = Array.isArray(data) ? data : [];
  return {
    styles: uniqueSorted(frames.map((f) => f.style)),
    materials: uniqueSorted(frames.map((f) => f.material)),
    colors: uniqueSorted(frames.map((f) => f.color)),
  };
};

/** Catalog values are stored in English; show them in the UI language. */
export const useCatalogLabel = () => {
  const { t } = useTranslation();
  return (kind: 'style' | 'material' | 'color', value: string) =>
    t(`catalogValues.${kind}.${value}`, { defaultValue: value });
};
