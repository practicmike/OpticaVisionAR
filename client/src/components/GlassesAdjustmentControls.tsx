import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { 
  MoveHorizontal, 
  MoveVertical, 
  ArrowLeft, 
  ArrowRight, 
  ZoomIn, 
  RotateCcw 
} from 'lucide-react';
import { useTryOnStore } from '@/store/tryOnStore';

const GlassesAdjustmentControls = () => {
  const { t } = useTranslation();
  const adjustments = useTryOnStore((s) => s.adjustments);
  const updateAdjustment = useTryOnStore((s) => s.updateAdjustment);
  const resetAdjustments = useTryOnStore((s) => s.resetAdjustments);
  
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">{t('virtualTryOnPage.adjustments.title')}</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetAdjustments} 
          className="flex items-center gap-1"
        >
          <RotateCcw className="h-4 w-4" />
          <span>{t('virtualTryOnPage.adjustments.reset')}</span>
        </Button>
      </div>
      
      {/* Position Adjustments */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('virtualTryOnPage.adjustments.position')}</h4>
        
        {/* Horizontal Position */}
        <div className="flex items-center gap-2 mb-3">
          <MoveHorizontal className="text-gray-600 h-5 w-5 min-w-[20px]" />
          <div className="flex-1">
            <Slider 
              value={[adjustments.position.x * 100]}
              min={-50}
              max={50}
              step={1}
              onValueChange={(values) => {
                updateAdjustment('position', { x: values[0] / 100 });
              }}
            />
          </div>
          <span className="text-xs text-gray-600 min-w-[30px] text-right">
            {Math.round(adjustments.position.x * 100)}
          </span>
        </div>
        
        {/* Vertical Position */}
        <div className="flex items-center gap-2 mb-3">
          <MoveVertical className="text-gray-600 h-5 w-5 min-w-[20px]" />
          <div className="flex-1">
            <Slider 
              value={[adjustments.position.y * 100]}
              min={-50}
              max={50}
              step={1}
              onValueChange={(values) => {
                updateAdjustment('position', { y: values[0] / 100 });
              }}
            />
          </div>
          <span className="text-xs text-gray-600 min-w-[30px] text-right">
            {Math.round(adjustments.position.y * 100)}
          </span>
        </div>
        
        {/* Depth Position */}
        <div className="flex items-center gap-2">
          <span className="text-gray-600 h-5 w-5 min-w-[20px] flex items-center justify-center">Z</span>
          <div className="flex-1">
            <Slider 
              value={[adjustments.position.z * 100]}
              min={-50}
              max={50}
              step={1}
              onValueChange={(values) => {
                updateAdjustment('position', { z: values[0] / 100 });
              }}
            />
          </div>
          <span className="text-xs text-gray-600 min-w-[30px] text-right">
            {Math.round(adjustments.position.z * 100)}
          </span>
        </div>
      </div>
      
      {/* Rotation Adjustments */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('virtualTryOnPage.adjustments.rotation')}</h4>
        
        {/* X-Axis Rotation (Pitch) */}
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight className="text-gray-600 h-5 w-5 min-w-[20px] rotate-90" />
          <div className="flex-1">
            <Slider 
              value={[adjustments.rotation.x * (180 / Math.PI)]}
              min={-30}
              max={30}
              step={1}
              onValueChange={(values) => {
                updateAdjustment('rotation', { x: values[0] * (Math.PI / 180) });
              }}
            />
          </div>
          <span className="text-xs text-gray-600 min-w-[30px] text-right">
            {Math.round(adjustments.rotation.x * (180 / Math.PI))}°
          </span>
        </div>
        
        {/* Y-Axis Rotation (Yaw) */}
        <div className="flex items-center gap-2 mb-3">
          <ArrowLeft className="text-gray-600 h-5 w-5 min-w-[20px]" />
          <div className="flex-1">
            <Slider 
              value={[adjustments.rotation.y * (180 / Math.PI)]}
              min={-30}
              max={30}
              step={1}
              onValueChange={(values) => {
                updateAdjustment('rotation', { y: values[0] * (Math.PI / 180) });
              }}
            />
          </div>
          <span className="text-xs text-gray-600 min-w-[30px] text-right">
            {Math.round(adjustments.rotation.y * (180 / Math.PI))}°
          </span>
        </div>
        
        {/* Z-Axis Rotation (Roll) */}
        <div className="flex items-center gap-2">
          <RotateCcw className="text-gray-600 h-5 w-5 min-w-[20px]" />
          <div className="flex-1">
            <Slider 
              value={[adjustments.rotation.z * (180 / Math.PI)]}
              min={-30}
              max={30}
              step={1}
              onValueChange={(values) => {
                updateAdjustment('rotation', { z: values[0] * (Math.PI / 180) });
              }}
            />
          </div>
          <span className="text-xs text-gray-600 min-w-[30px] text-right">
            {Math.round(adjustments.rotation.z * (180 / Math.PI))}°
          </span>
        </div>
      </div>
      
      {/* Scale Adjustment */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('virtualTryOnPage.adjustments.scale')}</h4>
        <div className="flex items-center gap-2">
          <ZoomIn className="text-gray-600 h-5 w-5 min-w-[20px]" />
          <div className="flex-1">
            <Slider 
              value={[adjustments.scale * 100]}
              min={70}
              max={130}
              step={1}
              onValueChange={(values) => {
                updateAdjustment('scale', values[0] / 100);
              }}
            />
          </div>
          <span className="text-xs text-gray-600 min-w-[30px] text-right">
            {Math.round(adjustments.scale * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlassesAdjustmentControls;