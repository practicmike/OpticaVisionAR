import { useTranslation } from 'react-i18next';
import { 
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  EmailIcon
} from 'react-share';
import { Download, Camera, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTryOnStore } from '@/store/tryOnStore';

interface SocialShareButtonsProps {
  onCaptureScreenshot: () => void;
}

const SocialShareButtons = ({ onCaptureScreenshot }: SocialShareButtonsProps) => {
  const { t } = useTranslation();
  const screenshot = useTryOnStore((s) => s.screenshot);
  const isCapturingScreenshot = useTryOnStore((s) => s.isCapturingScreenshot);
  
  const shareUrl = window.location.href;
  const title = t('virtualTryOnPage.share.title');
  
  // Function to download the screenshot
  const handleDownload = () => {
    if (!screenshot) return;
    
    const link = document.createElement('a');
    link.href = screenshot;
    link.download = 'opticas-cardani-prueba-virtual.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Phones can share the photo itself (WhatsApp, Instagram…) through the
  // native share sheet; the social buttons below only share the page link.
  const shareFile = async () => {
    if (!screenshot) return null;
    const blob = await (await fetch(screenshot)).blob();
    return new File([blob], 'opticas-cardani-prueba-virtual.jpg', { type: blob.type || 'image/jpeg' });
  };
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [new File([], 'x.jpg', { type: 'image/jpeg' })] });
  const handleNativeShare = async () => {
    const file = await shareFile();
    if (!file) return;
    try {
      await navigator.share({ files: [file], title, text: t('virtualTryOnPage.share.emailBody') });
    } catch {
      // User closed the share sheet: nothing to do.
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="font-medium mb-3">{t('virtualTryOnPage.share.title')}</h3>
      
      {/* Capture Screenshot Button */}
      <Button
        variant="outline"
        className="w-full mb-4 flex items-center justify-center gap-2"
        onClick={onCaptureScreenshot}
        disabled={isCapturingScreenshot}
      >
        <Camera className="h-4 w-4" />
        <span>{t('virtualTryOnPage.share.captureScreenshot')}</span>
      </Button>
      
      {screenshot && (
        <>
          {/* Screenshot Preview */}
          <div className="mb-4 border rounded-lg overflow-hidden">
            <img src={screenshot} alt="Try-on Screenshot" className="w-full h-auto" />
          </div>
          
          {/* Download Button */}
          <Button
            variant="outline"
            className="w-full mb-4 flex items-center justify-center gap-2"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            <span>{t('virtualTryOnPage.share.download')}</span>
          </Button>
          
          {canShareFiles && (
            <Button
              className="w-full mb-4 flex items-center justify-center gap-2"
              onClick={handleNativeShare}
            >
              <Share2 className="h-4 w-4" />
              <span>{t('virtualTryOnPage.share.sharePhoto')}</span>
            </Button>
          )}

          {/* Social Share Options */}
          <div className="flex justify-center gap-3 mb-2">
            <FacebookShareButton url={shareUrl} hashtag="#OpticasCardani">
              <FacebookIcon size={40} round />
            </FacebookShareButton>
            
            <TwitterShareButton url={shareUrl} title={title}>
              <TwitterIcon size={40} round />
            </TwitterShareButton>
            
            <WhatsappShareButton url={shareUrl} title={title}>
              <WhatsappIcon size={40} round />
            </WhatsappShareButton>
            
            <EmailShareButton url={shareUrl} subject={title} body={t('virtualTryOnPage.share.emailBody')}>
              <EmailIcon size={40} round />
            </EmailShareButton>
          </div>
        </>
      )}
    </div>
  );
};

export default SocialShareButtons;