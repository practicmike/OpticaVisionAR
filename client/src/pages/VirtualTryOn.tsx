import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { FaWhatsapp } from 'react-icons/fa';
import { whatsappUrl } from '@shared/business';
import PageHeader from '@/components/brand/PageHeader';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTryOn } from '@/hooks/use-try-on';
import { formatCurrency } from '@/lib/helpers';
import GlassesRenderer from '@/components/GlassesRenderer';
import GlassesAdjustmentControls from '@/components/GlassesAdjustmentControls';
import SocialShareButtons from '@/components/SocialShareButtons';
import { useTryOnStore } from '@/store/tryOnStore';
import { useFrameFacets, useCatalogLabel } from '@/lib/catalog';

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
    handleCaptureScreenshot,
    cleanup
  } = useTryOn();
  const isFaceDetected = useTryOnStore((s) => s.isFaceDetected);
  const facets = useFrameFacets();
  const label = useCatalogLabel();
  const isTryOnActive = (isWebcamActive || !!uploadedImage) && !!selectedFrame;
  // Selfie view: the camera is shown mirrored, like a real mirror. Video and
  // glasses layer are flipped together, so tracking stays aligned.
  const mirrorStyle = method === 'webcam' ? { transform: 'scaleX(-1)' } : undefined;

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <>
      <PageHeader title={t('virtualTryOnPage.hero.title')} subtitle={t('virtualTryOnPage.hero.subtitle')} />

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
                  <video
                    ref={webcamRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    style={{ display: method === 'webcam' && isWebcamActive ? 'block' : 'none', ...mirrorStyle }}
                  />
                  
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
                        style={mirrorStyle}
                      />
                      <GlassesRenderer
                        frame={selectedFrame}
                        canvasRef={renderCanvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        mirrored={method === 'webcam'}
                      />
                    </>
                  )}
                  
                  {isTryOnActive && !isFaceDetected && (
                    <div
                      role="status"
                      className="absolute bottom-3 left-3 right-3 rounded-md bg-black/70 px-3 py-2 text-center text-sm text-white"
                    >
                      {method === 'upload'
                        ? t('virtualTryOnPage.tracking.noFaceInPhoto')
                        : t('virtualTryOnPage.tracking.searching')}
                    </div>
                  )}

                  {!isWebcamActive && !uploadedImage && (
                    <div className="text-center p-6">
                      <Camera className="mx-auto text-gray-400 h-12 w-12 mb-3" />
                      <p className="text-gray-500">{t('virtualTryOnPage.tryOnSection.placeholder')}</p>
                    </div>
                  )}
                </div>
                
                {isTryOnActive && (
                  <div className="mt-6 space-y-4">
                    <SocialShareButtons onCaptureScreenshot={handleCaptureScreenshot} />
                    <GlassesAdjustmentControls />
                  </div>
                )}

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
                        <div className="relative">
                          <img
                            src={frame.imageUrl}
                            alt={t('common.currentLanguage') === 'es' ? frame.nameEs : frame.nameEn}
                            className="w-full h-32 object-contain bg-[#f4f4f2]"
                          />
                        </div>
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
                        {facets.styles.map((value) => (
                          <SelectItem key={value} value={value}>{label('style', value)}</SelectItem>
                        ))}
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
                        {facets.materials.map((value) => (
                          <SelectItem key={value} value={value}>{label('material', value)}</SelectItem>
                        ))}
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
                        {facets.colors.map((value) => (
                          <SelectItem key={value} value={value}>{label('color', value)}</SelectItem>
                        ))}
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
                      {label('material', selectedFrame.material)} • {label('color', selectedFrame.color)} • {label('style', selectedFrame.style)}
                    </p>
                    <a
                      href={whatsappUrl(t('virtualTryOnPage.framesSection.askMessage', { frame: t('common.currentLanguage') === 'es' ? selectedFrame.nameEs : selectedFrame.nameEn }))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-whatsapp px-4 py-2 font-semibold text-white transition-colors hover:bg-whatsapp/90"
                    >
                      <FaWhatsapp className="h-5 w-5" aria-hidden="true" />
                      {t('virtualTryOnPage.framesSection.askOnWhatsapp')}
                    </a>
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
            <h2 className="font-bold text-2xl md:text-3xl text-primary mb-3">{t('virtualTryOnPage.instructions.title')}</h2>
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
            <h2 className="font-bold text-2xl md:text-3xl text-primary mb-3">{t('products.featuredTitle')}</h2>
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
                        <span className="font-bold text-foreground">{formatCurrency(frame.price)}</span>
                        <Button variant="outline" onClick={() => selectFrame(frame.id)}>
                          {t('productsPage.tryOnButton')}
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
              <Link href="/products">
                {t('products.viewFullCatalog')} <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Required by the CC BY 4.0 licence of these two Sketchfab models. */}
          <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-gray-500">
            {t('virtualTryOnPage.credits')}{' '}
            <a className="underline" href="https://sketchfab.com/3d-models/sun-glasses-d5a6f061531f4ead97daedbfc027ab03" target="_blank" rel="noopener noreferrer">"Sun Glasses"</a>{' '}
            (righthere21y),{' '}
            <a className="underline" href="https://sketchfab.com/3d-models/glasses-4b8a1e54f3084c63828fe8c324198aec" target="_blank" rel="noopener noreferrer">"Glasses"</a>{' '}
            (AlbertVictory) ·{' '}
            <a className="underline" href="https://creativecommons.org/licenses/by/4.0/deed.es" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
          </p>
        </div>
      </section>
    </>
  );
};

export default VirtualTryOn;
