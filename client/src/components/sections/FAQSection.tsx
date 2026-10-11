import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import SectionHeading from '@/components/brand/SectionHeading';

/** Frequently asked questions (texts in i18n `faq.items`). */
const FAQSection = () => {
  const { t } = useTranslation();
  const items = t('faq.items', { returnObjects: true }) as { q: string; a: string }[];
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <SectionHeading title={t('faq.title')} subtitle={t('faq.subtitle')} />
        <Accordion type="single" collapsible className="space-y-3">
          {(Array.isArray(items) ? items : []).map((item, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="rounded-xl border bg-card px-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <AccordionTrigger className="text-left font-heading text-base font-semibold text-primary hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
