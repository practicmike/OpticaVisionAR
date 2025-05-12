import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Eye, Glasses, Camera, UserRound, Star, QuoteIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/helpers';

const Home = () => {
  const { t } = useTranslation();

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
            src="https://images.unsplash.com/photo-1596511880657-c5a7a22e5c03?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&h=650&q=80" 
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
                    className="w-full h-48 object-cover" 
                  />
                  <CardContent className="p-4">
                    <span className="text-sm text-primary font-medium">{frame.style}</span>
                    <h3 className="font-semibold text-lg mt-1">
                      {t('common.currentLanguage') === 'es' ? frame.nameEs : frame.nameEn}
                    </h3>
                    <p className="text-gray-600 text-sm mt-2">
                      {t('products.materialColor', { material: frame.material, color: frame.color })}
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
