import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTryOn } from '@/hooks/use-try-on';
import { formatCurrency } from '@/lib/helpers';
import GlassesRenderer from '@/components/GlassesRenderer';

const VirtualTryOn = () => {
  const { t } = useTranslation();
  const { 
    webcamRef, 
    renderCanvasRef,
    fileInputRef,
    method,
    isWebcamActive,
    uploadedImage,
    frames,
    selectedFrame,
    filters,
    isLoadingFrames,
    canvasSize,
    startWebcam,
    stopWebcam,
    handleFileUpload,
    triggerFileUpload,
    selectFrame,
    updateFilter,
    clearFilters,
    cleanup
  } = useTryOn();

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <>
      {/* Virtual Try-On Hero */}
      <section className="bg-primary text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-bold text-3xl md:text-4xl mb-4">{t('virtualTryOnPage.hero.title')}</h1>
            <p className="text-lg opacity-90 mb-6">{t('virtualTryOnPage.hero.subtitle')}</p>
          </div>
        </div>
      </section>

      {/* Main Try-On Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Camera/Upload Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-xl mb-6 text-center">{t('virtualTryOnPage.tryOnSection.title')}</h3>
                
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <Button
                    className={`flex-1 ${method === 'webcam' ? 'bg-primary text-white' : 'bg-white text-primary border-primary'}`}
                    onClick={startWebcam}
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    {t('virtualTryOnPage.tryOnSection.useWebcam')}
                  </Button>
                  <Button
                    className={`flex-1 ${method === 'upload' ? 'bg-primary text-white' : 'bg-white text-primary border-primary'}`}
                    onClick={triggerFileUpload}
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    {t('virtualTryOnPage.tryOnSection.uploadPhoto')}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg h-72 flex items-center justify-center relative">
                  {method === 'webcam' && (
                    <video
                      ref={webcamRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      style={{ display: isWebcamActive ? 'block' : 'none' }}
                    />
                  )}
                  
                  {method === 'upload' && uploadedImage && (
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    />
                  )}
                  
                  {(isWebcamActive || uploadedImage) && selectedFrame && (
                    <>
                      <canvas
                        ref={renderCanvasRef}
                        className="absolute inset-0 w-full h-full object-cover rounded-lg pointer-events-none"
                      />
                      <GlassesRenderer
                        frame={selectedFrame}
                        canvasRef={renderCanvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                      />
                    </>
                  )}
                  
                  {!isWebcamActive && !uploadedImage && (
                    <div className="text-center p-6">
                      <Camera className="mx-auto text-gray-400 h-12 w-12 mb-3" />
                      <p className="text-gray-500">{t('virtualTryOnPage.tryOnSection.placeholder')}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-3">{t('virtualTryOnPage.tryOnSection.tips')}</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="text-secondary mt-1 mr-2 h-4 w-4" />
                      <span>{t('virtualTryOnPage.tryOnSection.tip1')}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-secondary mt-1 mr-2 h-4 w-4" />
                      <span>{t('virtualTryOnPage.tryOnSection.tip2')}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="text-secondary mt-1 mr-2 h-4 w-4" />
                      <span>{t('virtualTryOnPage.tryOnSection.tip3')}</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Frames Selection */}
              <div>
                <h3 className="font-semibold text-xl mb-6 text-center">{t('virtualTryOnPage.framesSection.title')}</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {isLoadingFrames ? (
                    // Loading skeleton
                    Array(6).fill(0).map((_, index) => (
                      <Card key={index} className="overflow-hidden">
                        <div className="h-32 bg-gray-200 animate-pulse"></div>
                        <CardContent className="p-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    frames.map((frame: any) => (
                      <Card 
                        key={frame.id} 
                        className={`cursor-pointer hover:shadow-md transition-shadow overflow-hidden ${
                          selectedFrame?.id === frame.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => selectFrame(frame.id)}
                      >
                        <img 
                          src={frame.imageUrl} 
                          alt={t('common.currentLanguage') === 'es' ? frame.nameEs : frame.nameEn} 
                          className="w-full h-32 object-cover" 
                        />
                        <CardContent className="p-2 bg-white">
                          <span className="text-sm font-medium">
                            {t('common.currentLanguage') === 'es' ? frame.nameEs : frame.nameEn}
                          </span>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mt-6">
                  <h4 className="font-medium mb-3">{t('virtualTryOnPage.framesSection.filter')}:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select 
                      value={filters.style}
                      onValueChange={(value) => updateFilter('style', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('virtualTryOnPage.framesSection.allStyles')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('virtualTryOnPage.framesSection.allStyles')}</SelectItem>
                        <SelectItem value="Rectangle">Rectangle</SelectItem>
                        <SelectItem value="Round">Round</SelectItem>
                        <SelectItem value="Oval">Oval</SelectItem>
                        <SelectItem value="Cat-eye">Cat-eye</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={filters.material}
                      onValueChange={(value) => updateFilter('material', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('virtualTryOnPage.framesSection.allMaterials')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('virtualTryOnPage.framesSection.allMaterials')}</SelectItem>
                        <SelectItem value="Acetate">Acetate</SelectItem>
                        <SelectItem value="Metal">Metal</SelectItem>
                        <SelectItem value="Titanium">Titanium</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={filters.color}
                      onValueChange={(value) => updateFilter('color', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('virtualTryOnPage.framesSection.allColors')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('virtualTryOnPage.framesSection.allColors')}</SelectItem>
                        <SelectItem value="Black">Black</SelectItem>
                        <SelectItem value="Brown">Brown</SelectItem>
                        <SelectItem value="Blue">Blue</SelectItem>
                        <SelectItem value="Red">Red</SelectItem>
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Transparent">Transparent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedFrame && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">
                        {t('common.currentLanguage') === 'es' ? selectedFrame.nameEs : selectedFrame.nameEn}
                      </h4>
                      <span className="font-bold">{formatCurrency(selectedFrame.price)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {selectedFrame.material} • {selectedFrame.color} • {selectedFrame.style}
                    </p>
                    <Button className="w-full bg-secondary hover:bg-secondary/90 text-white">
                      {t('virtualTryOnPage.framesSection.viewInStore')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-bold text-2xl md:text-3xl text-[#333333] mb-3">{t('virtualTryOnPage.instructions.title')}</h2>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((step) => (
                <Card key={step} className="relative">
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                    {step}
                  </div>
                  <CardContent className="pt-8 p-6">
                    <h3 className="font-semibold text-lg mb-2">{t(`virtualTryOnPage.instructions.step${step}.title`)}</h3>
                    <p className="text-gray-600">{t(`virtualTryOnPage.instructions.step${step}.description`)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Frames */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-bold text-2xl md:text-3xl text-[#333333] mb-3">{t('products.featuredTitle')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('products.featuredSubtitle')}</p>
          </div>
          
          <Tabs defaultValue="all" className="w-full max-w-5xl mx-auto">
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="all">{t('productsPage.categories.all')}</TabsTrigger>
                <TabsTrigger value="eyeglasses">{t('productsPage.categories.eyeglasses')}</TabsTrigger>
                <TabsTrigger value="sunglasses">{t('productsPage.categories.sunglasses')}</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                frames.slice(0, 4).map((frame: any) => (
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
                        <Button variant="outline" onClick={() => selectFrame(frame.id)}>
                          {t('productsPage.tryOn')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="eyeglasses">
              {/* Content for eyeglasses tab */}
            </TabsContent>
            
            <TabsContent value="sunglasses">
              {/* Content for sunglasses tab */}
            </TabsContent>
          </Tabs>
          
          <div className="text-center mt-10">
            <Button asChild variant="link" className="text-primary inline-flex items-center">
              <a href="/products">
                {t('products.viewFullCatalog')} <ChevronRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default VirtualTryOn;
