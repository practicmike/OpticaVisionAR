import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarCheck, CheckCircle2, MapPin, Phone, ScanFace, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionHeading from '@/components/brand/SectionHeading';
import WhyChooseUs from '@/components/sections/WhyChooseUs';
import ServicesGrid from '@/components/sections/ServicesGrid';
import LocationSection from '@/components/sections/LocationSection';
import FAQSection from '@/components/sections/FAQSection';
import NewsletterSection from '@/components/sections/NewsletterSection';
import { useCatalogLabel } from '@/lib/catalog';
import { formatCurrency } from '@/lib/helpers';
import { storeStatus } from '@/lib/business-time';
import { BUSINESS } from '@shared/business';
import type { BlogPost, CatalogFrame, Testimonial } from '@shared/schema';

const StoreStatusBadge = () => {
  const { t, i18n } = useTranslation();
  const status = storeStatus();
  let text: string;
  if (status.open) text = t('location.openNow', { time: status.until });
  else if (status.nextDay === 0) text = t('location.opensToday', { time: status.at });
  else if (status.nextDay === 1) text = t('location.opensTomorrow', { time: status.at });
  else {
    const day = new Intl.DateTimeFormat(i18n.language?.startsWith('en') ? 'en-US' : 'es-MX', { weekday: 'long', timeZone: 'America/Mexico_City' })
      .format(new Date(Date.now() + status.nextDay * 86400000));
    text = t('location.opensLater', { day, time: status.at });
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${status.open ? 'bg-green-400' : 'bg-amber-300'}`} aria-hidden="true" />
      {text}
    </span>
  );
};

const Home = () => {
  const { t, i18n } = useTranslation();
  const isEs = !i18n.language?.startsWith('en');
  const label = useCatalogLabel();

  const { data: frames } = useQuery<CatalogFrame[]>({ queryKey: ['/api/frames'] });
  const { data: testimonials } = useQuery<Testimonial[]>({ queryKey: ['/api/testimonials', { approved: true }] });
  const { data: blogPosts } = useQuery<BlogPost[]>({ queryKey: ['/api/blog-posts', { published: true }] });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1A365D] via-primary to-[#2B6CB0] text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" aria-hidden="true" />
        <div className="container relative mx-auto grid items-center gap-10 px-4 py-16 md:py-24 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <h1 className="mb-5 text-4xl font-bold leading-tight !text-white md:text-5xl lg:text-6xl">
              {t('hero.titleStart')} <span className="text-[#90CDF4]">{t('hero.titleAccent')}</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-lg text-white/85 md:text-xl lg:mx-0">{t('hero.subtitle')}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/appointments">
                <Button size="lg" className="w-full gap-2 bg-white text-primary shadow-lg hover:bg-white/90 sm:w-auto">
                  <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                  {t('hero.ctaAppointment')}
                </Button>
              </Link>
              <Link href="/virtual-try-on">
                <Button size="lg" variant="outline" className="w-full gap-2 border-2 border-white/80 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto">
                  <ScanFace className="h-5 w-5" aria-hidden="true" />
                  {t('hero.ctaTryOn')}
                </Button>
              </Link>
            </div>
            <ul className="mt-8 flex flex-col items-center gap-x-6 gap-y-2 text-sm text-white/85 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden="true" />{BUSINESS.city}</li>
              <li><a href={`tel:${BUSINESS.phoneE164}`} className="flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4" aria-hidden="true" />{BUSINESS.phoneDisplay}</a></li>
              <li className="flex items-center gap-2"><Clock className="h-4 w-4" aria-hidden="true" /><StoreStatusBadge /></li>
            </ul>
          </div>
          <Link href="/virtual-try-on" className="group mx-auto block w-full max-w-lg">
            <div className="rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5 transition-transform duration-300 group-hover:-translate-y-1 md:p-8">
              <img
                src="/brand/hero-frame.webp"
                alt={t('virtualTryOn.imageAlt')}
                width={1000}
                height={346}
                className="mx-auto w-full"
                fetchPriority="high"
              />
              <div className="mt-6 flex items-center justify-between gap-4 border-t pt-4">
                <div>
                  <p className="font-heading font-semibold text-primary">{t('virtualTryOn.tryBeforeBuy')}</p>
                  <p className="text-sm text-muted-foreground">{t('hero.ctaTryOn')}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-white transition-transform group-hover:translate-x-1">
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <WhyChooseUs />

      {/* Services */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <SectionHeading title={t('services.title')} subtitle={t('services.subtitle')} />
          <ServicesGrid />
        </div>
      </section>

      {/* Virtual try-on + featured frames */}
      <section className="bg-muted py-16 md:py-24">
        <div className="container mx-auto px-4">
          <SectionHeading title={t('products.featuredTitle')} subtitle={t('products.featuredSubtitle')} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(frames ?? []).slice(0, 4).map((frame) => (
              <Link key={frame.id} href="/virtual-try-on" className="card-elevated group block overflow-hidden">
                <img
                  src={frame.imageUrl}
                  alt={isEs ? frame.nameEs : frame.nameEn}
                  loading="lazy"
                  width={600}
                  height={400}
                  className="h-48 w-full bg-[#f4f4f2] object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <div className="p-5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-secondary">{label('style', frame.style)}</span>
                  <h3 className="mt-1 text-lg font-semibold">{isEs ? frame.nameEs : frame.nameEn}</h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {t('products.materialColor', { material: label('material', frame.material), color: label('color', frame.color).toLowerCase() })}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{frame.price ? formatCurrency(frame.price) : ''}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-secondary">
                      <ScanFace className="h-4 w-4" aria-hidden="true" />{t('productsPage.tryOnButton')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 grid gap-6 rounded-2xl bg-white p-6 shadow-lg md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <h3 className="mb-3 text-2xl font-bold">{t('virtualTryOn.tryBeforeBuy')}</h3>
              <ul className="grid gap-2 sm:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <li key={n} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                    {t(`virtualTryOn.benefits.${n}`)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/virtual-try-on"><Button size="lg" className="w-full gap-2"><ScanFace className="h-5 w-5" />{t('virtualTryOn.tryNow')}</Button></Link>
              <Link href="/products"><Button size="lg" variant="outline" className="w-full gap-2">{t('products.viewAll')}<ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      <LocationSection />

      {/* Reviews: only real, approved ones. Hidden until there are some. */}
      {(testimonials?.length ?? 0) > 0 && (
        <section className="bg-muted py-16 md:py-24">
          <div className="container mx-auto px-4">
            <SectionHeading title={t('testimonials.title')} subtitle={t('testimonials.subtitle')} />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials!.slice(0, 3).map((review) => (
                <figure key={review.id} className="card-elevated p-6">
                  <div className="mb-3 flex gap-0.5" aria-label={`${review.rating}/5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'fill-star text-star' : 'text-border'}`} aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="mb-4 italic text-muted-foreground">“{isEs ? review.commentEs : review.commentEn}”</blockquote>
                  <figcaption className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-white">
                      {review.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                    </span>
                    <span className="font-semibold text-primary">{review.name}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog */}
      {(blogPosts?.length ?? 0) > 0 && (
        <section className="bg-background py-16 md:py-24">
          <div className="container mx-auto px-4">
            <SectionHeading title={t('blog.title')} subtitle={t('blog.subtitle')} />
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
              {blogPosts!.slice(0, 3).map((post) => (
                <article key={post.id} className="card-elevated flex flex-col overflow-hidden">
                  <img src={post.imageUrl} alt="" loading="lazy" className="h-48 w-full bg-muted object-cover" />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex items-center gap-3 text-xs">
                      <span className="rounded-full bg-secondary/10 px-3 py-1 font-semibold text-secondary">{isEs ? post.categoryEs : post.categoryEn}</span>
                      <time className="text-muted-foreground" dateTime={post.publishDate}>
                        {new Date(`${post.publishDate}T12:00:00`).toLocaleDateString(isEs ? 'es-MX' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </time>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{isEs ? post.titleEs : post.titleEn}</h3>
                    <p className="mb-4 line-clamp-3 flex-1 text-sm text-muted-foreground">{isEs ? post.contentEs : post.contentEn}</p>
                    <Link href={`/blog#post-${post.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline">
                      {t('blog.readMore')}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/blog"><Button variant="outline" className="gap-2">{t('blog.viewAllArticles')}<ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </div>
        </section>
      )}

      <FAQSection />
      <NewsletterSection />
    </>
  );
};

export default Home;
