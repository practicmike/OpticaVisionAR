import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export const useTryOn = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [method, setMethod] = useState<'webcam' | 'upload' | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    style: 'all',
    material: 'all',
    color: 'all'
  });

  // Fetch frames
  const { data: frames, isLoading: isLoadingFrames } = useQuery({
    queryKey: ['/api/frames', filters],
  });

  // Start webcam
  const startWebcam = useCallback(async () => {
    setMethod('webcam');
    setUploadedImage(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }
      });
      
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        setIsWebcamActive(true);
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      toast({
        title: t('virtualTryOnPage.noCamera.title'),
        description: t('virtualTryOnPage.noCamera.message'),
        variant: 'destructive',
      });
      setIsWebcamActive(false);
    }
  }, [t, toast]);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => track.stop());
      webcamRef.current.srcObject = null;
      setIsWebcamActive(false);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Stop webcam if active
    if (isWebcamActive) {
      stopWebcam();
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setMethod('upload');
    };
    reader.readAsDataURL(file);
  }, [isWebcamActive, stopWebcam]);

  // Trigger file input click
  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Select a frame
  const selectFrame = useCallback((frameId: number) => {
    setSelectedFrameId(frameId);
  }, []);

  // Update filters
  const updateFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      style: 'all',
      material: 'all',
      color: 'all'
    });
  }, []);

  // Get the selected frame data
  const selectedFrame = frames?.find((frame: any) => frame.id === selectedFrameId) || null;

  // Clean up on component unmount
  const cleanup = useCallback(() => {
    if (isWebcamActive) {
      stopWebcam();
    }
    setUploadedImage(null);
    setSelectedFrameId(null);
  }, [isWebcamActive, stopWebcam]);

  return {
    webcamRef,
    canvasRef,
    fileInputRef,
    method,
    isWebcamActive,
    uploadedImage,
    frames,
    selectedFrame,
    filters,
    isLoadingFrames,
    startWebcam,
    stopWebcam,
    handleFileUpload,
    triggerFileUpload,
    selectFrame,
    updateFilter,
    clearFilters,
    cleanup
  };
};
