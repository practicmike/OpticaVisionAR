import { useState } from 'react';
import { isSunglasses, useFrameFacets, useCatalogLabel } from '@/lib/catalog';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/helpers';

const Products = () => {
  const { t } = useTranslation();
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    style: 'all',
    material: 'all',
    color: 'all',
  });
  const [sortBy, setSortBy] = useState('name');
  
  // Fetch frames
  const { data: frames, isLoading: isLoadingFrames } = useQuery({
    queryKey: ['/api/frames', filters],
  });
  
  // Filter frames based on search term and category
  const filteredFrames = frames?.filter((frame: any) => {
    const name = t('common.currentLanguage') === 'es' ? frame.nameEs.toLowerCase() : frame.nameEn.toLowerCase();
    const matchesSearch = searchTerm === '' || name.includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'all' ||
                          (category === 'eyeglasses' && !isSunglasses(frame)) ||
                          (category === 'sunglasses' && isSunglasses(frame));
    return matchesSearch && matchesCategory;
  });
  
  // Sort frames
  const sortedFrames = [...(filteredFrames || [])].sort((a: any, b: any) => {
    if (sortBy === 'name') {
      const nameA = t('common.currentLanguage') === 'es' ? a.nameEs : a.nameEn;
      const nameB = t('common.currentLanguage') === 'es' ? b.nameEs : b.nameEn;
      return nameA.localeCompare(nameB);
    } else if (sortBy === 'price-low') {
      return a.price - b.price;
    } else if (sortBy === 'price-high') {
      return b.price - a.price;
    }
    return 0;
  });
  
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      style: 'all',
      material: 'all',
      color: 'all',
    });
    setSearchTerm('');
  };
  
  // Extract unique values for filter options
  const facets = useFrameFacets();
  const label = useCatalogLabel();
  const styleOptions = facets.styles;
  const materialOptions = facets.materials;
  const colorOptions = facets.colors;

  return (
    <>
      {/* Products Hero */}
      <section className="bg-primary text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-bold text-3xl md:text-4xl mb-4">{t('productsPage.hero.title')}</h1>
            <p className="text-lg opacity-90 mb-6">{t('productsPage.hero.subtitle')}</p>
          </div>
        </div>
      </section>

      {/* Products Main Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="all" onValueChange={setCategory} className="w-full max-w-5xl mx-auto">
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="all">{t('productsPage.categories.all')}</TabsTrigger>
                <TabsTrigger value="eyeglasses">{t('productsPage.categories.eyeglasses')}</TabsTrigger>
                <TabsTrigger value="sunglasses">{t('productsPage.categories.sunglasses')}</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="md:col-span-1">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center">
                      <Filter className="mr-2 h-5 w-5" />
                      {t('productsPage.filters.title')}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium block mb-1">{t('productsPage.filters.style')}</label>
                        <Select value={filters.style} onValueChange={(value) => handleFilterChange('style', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('productsPage.filters.allStyles')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('productsPage.filters.allStyles')}</SelectItem>
                            {styleOptions?.map((style: any) => (
                              <SelectItem key={style} value={style}>{label('style', style)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium block mb-1">{t('productsPage.filters.material')}</label>
                        <Select value={filters.material} onValueChange={(value) => handleFilterChange('material', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('productsPage.filters.allMaterials')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('productsPage.filters.allMaterials')}</SelectItem>
                            {materialOptions?.map((material: any) => (
                              <SelectItem key={material} value={material}>{label('material', material)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium block mb-1">{t('productsPage.filters.color')}</label>
                        <Select value={filters.color} onValueChange={(value) => handleFilterChange('color', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('productsPage.filters.allColors')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('productsPage.filters.allColors')}</SelectItem>
                            {colorOptions?.map((color: any) => (
                              <SelectItem key={color} value={color}>{label('color', color)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button variant="outline" className="w-full" onClick={clearFilters}>
                        {t('productsPage.filters.clearFilters')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-3">
                <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      className="pl-10"
                      placeholder={t('productsPage.search')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">{t('productsPage.sortBy')}</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">{t('productsPage.sortOptions.name')}</SelectItem>
                        <SelectItem value="price-low">{t('productsPage.sortOptions.priceLow')}</SelectItem>
                        <SelectItem value="price-high">{t('productsPage.sortOptions.priceHigh')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {isLoadingFrames ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(6).fill(0).map((_, index) => (
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
                    ))}
                  </div>
                ) : sortedFrames?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedFrames.map((frame: any) => (
                      <Card 
                        key={frame.id} 
                        id={`frame-${frame.id}`}
                        className="overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
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
                            <Button className="text-primary bg-primary/10 hover:bg-primary/20">
                              {t('productsPage.tryOnButton')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold mb-2">{t('productsPage.noResults.title')}</h3>
                    <p className="text-gray-600 max-w-md mx-auto">{t('productsPage.noResults.message')}</p>
                  </div>
                )}
              </div>
            </div>
          </Tabs>
        </div>
      </section>

      {/* Try On CTA */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-bold text-2xl md:text-3xl text-[#333333] mb-4">{t('productsPage.tryOn.title')}</h2>
              <p className="text-gray-600 mb-6">{t('productsPage.tryOn.description')}</p>
              <ul className="space-y-3 mb-6">
                {[1, 2, 3].map((item) => (
                  <li key={item} className="flex items-start">
                    <span className="text-secondary mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span>{t(`productsPage.tryOn.benefits.${item}`)}</span>
                  </li>
                ))}
              </ul>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                {t('productsPage.tryOn.button')}
              </Button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <img 
                src="https://images.unsplash.com/photo-1614715838608-dd527c46231d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1100&h=750&q=80" 
                alt={t('productsPage.tryOn.imageAlt')} 
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Products;
