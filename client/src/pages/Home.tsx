import { useTranslation } from 'react-i18next';
import { useCatalogLabel } from '@/lib/catalog';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Eye, Glasses, Camera, UserRound, Star, QuoteIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/helpers';

const Home = () => {
  const { t } = useTranslation();
  const label = useCatalogLabel();

  // Fetch services
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/services'],
  });

  // Fetch testimonials
  const { data: testimonials, isLoading: isLoadingTestimonials } = useQuery({
    queryKey: ['/api/testimonials', { approved: true }],
  });

  // Fetch blog posts
  const { data: blogPosts, isLoading: isLoadingBlogPosts } = useQuery({
    queryKey: ['/api/blog-posts', { published: true }],
  });

  // Fetch frames
  const { data: frames, isLoading: isLoadingFrames } = useQuery({
    queryKey: ['/api/frames'],
  });

  // Helper function to get icon component based on icon name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'eye':
        return <Eye className="text-primary" size={24} />;
      case 'glasses':
        return <Glasses className="text-primary" size={24} />;
      case 'camera':
        return <Camera className="text-primary" size={24} />;
      case 'user-md':
        return <UserRound className="text-primary" size={24} />;
      default:
        return <Eye className="text-primary" size={24} />;
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-primary text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="data:image/jpeg;base64,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" 
            alt={t('hero.imageAlt')} 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-bold text-3xl md:text-4xl lg:text-5xl mb-4">{t('hero.title')}</h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">{t('hero.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/appointments">
                <Button className="bg-secondary hover:bg-secondary/90 text-white py-3 px-6">
                  {t('hero.bookAppointment')}
                </Button>
              </Link>
              <Link href="/virtual-try-on">
                <Button variant="outline" className="bg-white hover:bg-gray-100 text-primary py-3 px-6">
                  {t('hero.virtualTryOn')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 md:py-16 bg-white" id="services">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-bold text-2xl md:text-3xl text-[#333333] mb-3">{t('services.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('services.subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingServices ? (
              // Loading skeleton
              Array(4).fill(0).map((_, index) => (
                <Card key={index} className="shadow-md">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6 mt-1"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              services?.map((service: any) => (
                <Card key={service.id} className="shadow-md transition-transform hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      {getIconComponent(service.icon)}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {t('common.currentLanguage') === 'es' ? service.nameEs : service.nameEn}
                    </h3>
                    <p className="text-gray-600">
                      {t('common.currentLanguage') === 'es' ? service.descriptionEs : service.descriptionEn}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Virtual Try-On Section Preview */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-bold text-2xl md:text-3xl text-[#333333] mb-3">{t('virtualTryOn.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('virtualTryOn.subtitle')}</p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="font-semibold text-xl mb-4">{t('virtualTryOn.tryBeforeBuy')}</h3>
              <p className="text-gray-600 mb-6">{t('virtualTryOn.description')}</p>
              <ul className="space-y-3 mb-6">
                {[1, 2, 3].map((item) => (
                  <li key={item} className="flex items-start">
                    <span className="text-secondary mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span>{t(`virtualTryOn.benefits.${item}`)}</span>
                  </li>
                ))}
              </ul>
              <Link href="/virtual-try-on">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  {t('virtualTryOn.tryNow')}
                </Button>
              </Link>
            </div>
            <div className="order-1 lg:order-2 bg-white p-4 rounded-lg shadow-md">
              <img 
                src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80" 
                alt={t('virtualTryOn.imageAlt')} 
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-bold text-2xl md:text-3xl text-[#333333] mb-3">{t('products.featuredTitle')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('products.featuredSubtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingFrames ? (
              // Loading skeleton
              Array(4).fill(0).map((_, index) => (
                <Card key={index} className="shadow-sm">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                    <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-full mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              frames?.slice(0, 4).map((frame: any) => (
                <Card key={frame.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <img 
                    src={frame.imageUrl} 
                    alt={t('common.currentLanguage') === 'es' ? frame.nameEs : frame.nameEn} 
                    className="w-full h-48 object-contain bg-[#f4f4f2]" 
                  />
                  <CardContent className="p-4">
                    <span className="text-sm text-primary font-medium">{label('style', frame.style)}</span>
                    <h3 className="font-semibold text-lg mt-1">
                      {t('common.currentLanguage') === 'es' ? frame.nameEs : frame.nameEn}
                    </h3>
                    <p className="text-gray-600 text-sm mt-2">
                      {t('products.materialColor', { material: label('material', frame.material), color: label('color', frame.color).toLowerCase() })}
                    </p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="font-bold text-[#333333]">{formatCurrency(frame.price)}</span>
                      <Link href={`/products#frame-${frame.id}`}>
                        <Button variant="link" className="text-primary p-0 h-auto">
                          {t('products.viewDetails')}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          <div className="text-center mt-10">
            <Link href="/products">
              <Button variant="link" className="text-primary flex items-center mx-auto">
                {t('products.viewFullCatalog')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-bold text-2xl md:text-3xl text-[#333333] mb-3">{t('testimonials.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('testimonials.subtitle')}</p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoadingTestimonials ? (
                // Loading skeleton
                Array(3).fill(0).map((_, index) => (
                  <Card key={index} className="bg-gray-50">
                    <CardContent className="p-6">
                      <div className="h-24 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-300 mr-3"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                testimonials?.slice(0, 3).map((testimonial: any) => (
                  <Card key={testimonial.id} className="bg-gray-50 relative">
                    <CardContent className="p-6">
                      <div className="text-accent text-2xl absolute -top-3 -left-2">
                        <QuoteIcon />
                      </div>
                      <p className="text-gray-700 mb-4">
                        {t('common.currentLanguage') === 'es' ? testimonial.commentEs : testimonial.commentEn}
                      </p>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center text-primary">
                          {testimonial.imageUrl ? (
                            <img 
                              src={testimonial.imageUrl} 
                              alt={testimonial.name} 
                              className="w-full h-full rounded-full object-cover" 
                            />
                          ) : (
                            testimonial.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{testimonial.name}</h4>
                          <div className="text-accent flex">
                            {Array(5).fill(0).map((_, i) => (
                              <Star 
                                key={i} 
                                className="h-4 w-4" 
                                fill={i < testimonial.rating ? "currentColor" : "none"} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-bold text-2xl md:text-3xl text-[#333333] mb-3">{t('blog.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('blog.subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {isLoadingBlogPosts ? (
              // Loading skeleton
              Array(3).fill(0).map((_, index) => (
                <Card key={index} className="shadow-sm">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <CardContent className="p-5">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mr-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-4/5 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-full mb-1"></div>
                    <div className="h-4 bg-gray-100 rounded w-full mb-1"></div>
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              blogPosts?.slice(0, 3).map((post: any) => (
                <Card key={post.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <img 
                    src={post.imageUrl} 
                    alt={t('common.currentLanguage') === 'es' ? post.titleEs : post.titleEn} 
                    className="w-full h-48 object-cover" 
                  />
                  <CardContent className="p-5">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <span className="mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {new Date(post.publishDate).toLocaleDateString(
                          t('common.currentLanguage') === 'es' ? 'es-MX' : 'en-US', 
                          { year: 'numeric', month: 'long', day: 'numeric' }
                        )}
                      </span>
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        {t('common.currentLanguage') === 'es' ? post.categoryEs : post.categoryEn}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {t('common.currentLanguage') === 'es' ? post.titleEs : post.titleEn}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {t('common.currentLanguage') === 'es' ? post.contentEs : post.contentEn}
                    </p>
                    <Link href={`/blog#post-${post.id}`}>
                      <Button variant="link" className="mt-4 text-primary p-0 h-auto">
                        {t('blog.readMore')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          <div className="text-center mt-10">
            <Link href="/blog">
              <Button variant="link" className="text-primary flex items-center mx-auto">
                {t('blog.viewAllArticles')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-primary rounded-lg p-8 text-center text-white">
            <h2 className="font-bold text-2xl md:text-3xl mb-4">{t('newsletter.title')}</h2>
            <p className="mb-6 opacity-90">{t('newsletter.subtitle')}</p>
            <form className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto">
              <input 
                type="email" 
                placeholder={t('newsletter.emailPlaceholder')} 
                className="flex-1 p-3 rounded-md border-0 focus:ring-2 focus:ring-secondary focus:outline-none text-gray-900"
                aria-label={t('newsletter.emailAriaLabel')}
              />
              <Button type="submit" className="bg-secondary hover:bg-secondary/90 text-white">
                {t('newsletter.subscribe')}
              </Button>
            </form>
            <p className="mt-4 text-sm opacity-75">{t('newsletter.privacy')}</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
