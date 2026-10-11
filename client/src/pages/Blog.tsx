import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Calendar, Clock, Search, ChevronRight, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { BLOG_CATEGORIES } from '@/lib/constants';

const Blog = () => {
  const { t } = useTranslation();
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch blog posts
  const { data: blogPosts, isLoading: isLoadingBlogPosts } = useQuery({
    queryKey: ['/api/blog-posts', { published: true }],
  });

  // Filter posts based on category and search term
  const filteredPosts = blogPosts?.filter((post: any) => {
    const title = t('common.currentLanguage') === 'es' ? post.titleEs.toLowerCase() : post.titleEn.toLowerCase();
    const content = t('common.currentLanguage') === 'es' ? post.contentEs.toLowerCase() : post.contentEn.toLowerCase();
    const postCategory = t('common.currentLanguage') === 'es' ? post.categoryEs.toLowerCase() : post.categoryEn.toLowerCase();
    
    const matchesSearch = searchTerm === '' || 
      title.includes(searchTerm.toLowerCase()) ||
      content.includes(searchTerm.toLowerCase());
    
    const matchesCategory = category === 'all' || 
      postCategory.includes(category.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // Calculate estimated reading time (1 minute per 200 words)
  const getReadingTime = (content: string) => {
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / 200);
    return minutes;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(
      t('common.currentLanguage') === 'es' ? 'es-MX' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  return (
    <>
      {/* Blog Hero */}
      <section className="bg-gradient-to-br from-[#1A365D] via-primary to-[#2B6CB0] text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-bold text-3xl md:text-5xl mb-3 !text-white">{t('blogPage.hero.title')}</h1>
            <p className="text-lg opacity-90 mb-6">{t('blogPage.hero.subtitle')}</p>
            
            <div className="relative max-w-md mx-auto">
              <Input
                className="pl-10 bg-white/20 border-white/20 placeholder-white/70 text-white"
                placeholder={t('blogPage.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" />
            </div>
          </div>
        </div>
      </section>

      {/* Blog Categories */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="all" onValueChange={setCategory} className="max-w-4xl mx-auto">
            <div className="flex justify-center overflow-x-auto pb-2">
              <TabsList>
                {BLOG_CATEGORIES.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    {t('common.currentLanguage') === 'es' ? cat.labelEs : cat.labelEn}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {isLoadingBlogPosts ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <Spinner className="h-12 w-12 text-primary" />
              </div>
            ) : filteredPosts?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post: any) => (
                  <Card 
                    key={post.id} 
                    id={`post-${post.id}`}
                    className="overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img 
                      src={post.imageUrl} 
                      alt={t('common.currentLanguage') === 'es' ? post.titleEs : post.titleEn} 
                      className="w-full h-48 object-cover" 
                    />
                    <CardContent className="p-5">
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatDate(post.publishDate)}</span>
                        </div>
                        <Badge variant="outline" className="text-primary">
                          {t('common.currentLanguage') === 'es' ? post.categoryEs : post.categoryEn}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {t('common.currentLanguage') === 'es' ? post.titleEs : post.titleEn}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {t('common.currentLanguage') === 'es' ? post.contentEs : post.contentEn}
                      </p>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            {t('blogPage.readingTime', { 
                              minutes: getReadingTime(
                                t('common.currentLanguage') === 'es' ? post.contentEs : post.contentEn
                              ) 
                            })}
                          </span>
                        </div>
                        <Button variant="link" className="text-primary p-0 h-auto">
                          {t('blogPage.readMore')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm 
                    ? t('blogPage.search.noResults', { term: searchTerm }) 
                    : t('blogPage.noArticles.title')}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {t('blogPage.noArticles.message')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {filteredPosts?.length > 0 && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <Card className="overflow-hidden shadow-md">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  <div className="lg:order-2">
                    <img 
                      src={filteredPosts[0].imageUrl} 
                      alt={t('common.currentLanguage') === 'es' ? filteredPosts[0].titleEs : filteredPosts[0].titleEn}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="p-8 lg:order-1 flex flex-col justify-center">
                    <Badge variant="outline" className="text-primary mb-2 w-fit">
                      {t('common.currentLanguage') === 'es' ? filteredPosts[0].categoryEs : filteredPosts[0].categoryEn}
                    </Badge>
                    <h3 className="font-bold text-2xl mb-4">
                      {t('common.currentLanguage') === 'es' ? filteredPosts[0].titleEs : filteredPosts[0].titleEn}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {t('common.currentLanguage') === 'es' ? filteredPosts[0].contentEs : filteredPosts[0].contentEn}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(filteredPosts[0].publishDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{t('blogPage.shareArticle')}:</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <Facebook className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <Twitter className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-12 md:py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-bold text-2xl md:text-3xl mb-4">{t('appointmentsPage.confirmation.success.title')}</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">{t('servicesPage.cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/appointments">
              <Button className="bg-secondary hover:bg-secondary/90 text-white py-3 px-6">
                {t('servicesPage.cta.bookAppointment')}
              </Button>
            </Link>
            <Link href="/virtual-try-on">
              <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 py-3 px-6">
                {t('productsPage.tryOn.button')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Blog;
