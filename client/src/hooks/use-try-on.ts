import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { FaceMesh, Results } from '@mediapipe/face_mesh';
import { useTryOnStore } from '@/store/tryOnStore';
import {
  initFaceMesh,
  startCamera,
  classifyTryOnError,
  type CameraHandle,
} from '@/utils/faceDetection';
import { faceTracker } from '@/ar/tracking';

export const useTryOn = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Refs
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const renderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<CameraHandle | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const faceMeshPromiseRef = useRef<Promise<FaceMesh> | null>(null);
  
  // Local state
  const [method, setMethod] = useState<'webcam' | 'upload' | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });
  const [filters, setFilters] = useState({
    style: 'all',
    material: 'all',
    color: 'all'
  });

  // Width/height of the frame being analysed (camera or photo); the pose
  // math needs it to keep x and y in the same units.
  const sourceAspectRef = useRef(4 / 3);

  // Store access through selectors: only these values re-render the page.
  const setFaceDetected = useTryOnStore((s) => s.setFaceDetected);
  const captureScreenshot = useTryOnStore((s) => s.captureScreenshot);
  const setScreenshot = useTryOnStore((s) => s.setScreenshot);
  const isCapturingScreenshot = useTryOnStore((s) => s.isCapturingScreenshot);

  // Mirror tracker visibility into the store (changes rarely, unlike the pose).
  useEffect(() => {
    const unsubscribe = faceTracker.subscribe(setFaceDetected);
    return () => {
      unsubscribe();
    };
  }, [setFaceDetected]);

  // Fetch frames
  const { data: frames, isLoading: isLoadingFrames } = useQuery({
    queryKey: ['/api/frames', filters],
  });

  useEffect(() => {
    if (!Array.isArray(frames) || frames.length === 0) return;
    if (!frames.some((frame: any) => frame.id === selectedFrameId)) {
      setSelectedFrameId(frames[0].id);
    }
  }, [frames, selectedFrameId]);

  // Detector output goes straight to the tracker (no React state per frame).
  const onFaceMeshResults = useCallback((results: Results) => {
    const landmarks = results.multiFaceLandmarks?.[0] ?? null;
    faceTracker.update(landmarks, sourceAspectRef.current);
  }, []);

  const ensureFaceMesh = useCallback(async () => {
    if (faceMeshRef.current) return faceMeshRef.current;

    if (!faceMeshPromiseRef.current) {
      faceMeshPromiseRef.current = initFaceMesh(onFaceMeshResults);
    }

    let faceMesh: FaceMesh;
    try {
      faceMesh = await faceMeshPromiseRef.current;
    } catch (error) {
      // Allow a retry on the next click instead of caching the failure.
      faceMeshPromiseRef.current = null;
      throw error;
    }
    faceMeshRef.current = faceMesh;
    return faceMesh;
  }, [onFaceMeshResults]);

  // Tell the user what actually went wrong (permission, no camera, busy
  // camera, or the tracking model failing to load).
  const showTryOnError = useCallback((error: unknown) => {
    const kind = classifyTryOnError(error);
    toast({
      title: t(`virtualTryOnPage.errors.${kind}.title`),
      description: t(`virtualTryOnPage.errors.${kind}.message`),
      variant: 'destructive',
    });
  }, [t, toast]);

  // Start webcam with FaceMesh
  const startWebcam = useCallback(async () => {
    setMethod('webcam');
    setUploadedImage(null);
    setScreenshot(null);
    faceTracker.reset();
    
    try {
      const video = webcamRef.current;
      if (!video) throw new Error('The camera preview is not ready.');

      // Wait for FaceMesh before starting the camera. Starting too early used
      // to leave the video running without ever starting face tracking.
      const faceMesh = await ensureFaceMesh();
      setIsWebcamActive(true);
      cameraRef.current = await startCamera(video, faceMesh);

      const updateDimensions = () => {
        if (video.videoWidth && video.videoHeight) {
          sourceAspectRef.current = video.videoWidth / video.videoHeight;
          setCanvasSize({ width: video.videoWidth, height: video.videoHeight });
        }
      };
      video.addEventListener('loadedmetadata', updateDimensions, { once: true });
      updateDimensions();
    } catch (error) {
      console.error('Error accessing webcam:', error);
      cameraRef.current?.stop();
      cameraRef.current = null;
      if (webcamRef.current?.srcObject) {
        (webcamRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        webcamRef.current.srcObject = null;
      }
      showTryOnError(error);
      setIsWebcamActive(false);
    }
  }, [ensureFaceMesh, setScreenshot, showTryOnError]);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    if (webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => track.stop());
      webcamRef.current.srcObject = null;
    }
    
    // Clear face detection state
    setIsWebcamActive(false);
    faceTracker.reset();
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Stop webcam if active
    stopWebcam();
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSource = e.target?.result;
      if (typeof imageSource !== 'string') return;

      faceTracker.reset();
      setScreenshot(null);
      setUploadedImage(imageSource);
      setMethod('upload');

      const image = new Image();
      image.onload = async () => {
        sourceAspectRef.current = image.naturalWidth / image.naturalHeight;
        setCanvasSize({ width: image.naturalWidth, height: image.naturalHeight });
        try {
          const faceMesh = await ensureFaceMesh();
          await faceMesh.send({ image });
        } catch (error) {
          console.error('Error detecting a face in the uploaded photo:', error);
          showTryOnError(error);
        }
      };
      image.src = imageSource;
    };
    reader.readAsDataURL(file);
    // Allow choosing the same file again.
    event.target.value = '';
  }, [ensureFaceMesh, setScreenshot, stopWebcam, showTryOnError]);

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

  // Photo of the try-on: camera frame (or uploaded photo) + glasses layer,
  // composed at full resolution. The selfie view is mirrored on screen, so
  // the photo is mirrored too: it matches what the customer saw.
  const handleCaptureScreenshot = useCallback(async () => {
    const overlay = renderCanvasRef.current;
    if (!overlay) return;
    captureScreenshot();
    try {
      let source: CanvasImageSource;
      let width: number;
      let height: number;
      const mirrored = method === 'webcam';
      if (method === 'webcam' && webcamRef.current?.videoWidth) {
        source = webcamRef.current;
        width = webcamRef.current.videoWidth;
        height = webcamRef.current.videoHeight;
      } else if (uploadedImage) {
        const img = new Image();
        img.src = uploadedImage;
        await img.decode();
        source = img;
        width = img.naturalWidth;
        height = img.naturalHeight;
      } else {
        setScreenshot(null);
        return;
      }

      const out = document.createElement('canvas');
      out.width = width;
      out.height = height;
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('2D canvas not available');
      if (mirrored) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(source, 0, 0, width, height);
      ctx.drawImage(overlay, 0, 0, width, height);
      setScreenshot(out.toDataURL('image/jpeg', 0.92));
    } catch (error) {
      console.error('Could not capture the try-on photo:', error);
      setScreenshot(null);
    }
  }, [captureScreenshot, setScreenshot, method, uploadedImage]);

  // Get the selected frame data
  const framesArray = Array.isArray(frames) ? frames : [];
  const selectedFrame = framesArray.find((frame: any) => frame.id === selectedFrameId) || null;

  // Clean up on component unmount
  const cleanup = useCallback(() => {
    stopWebcam();
    
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }
    faceMeshPromiseRef.current = null;
    
    setUploadedImage(null);
    setSelectedFrameId(null);
    setScreenshot(null);
    faceTracker.reset();
  }, [stopWebcam, setScreenshot]);

  return {
    webcamRef,
    fileInputRef,
    renderCanvasRef,
    method,
    isWebcamActive,
    uploadedImage,
    frames: framesArray,
    selectedFrame,
    filters,
    isLoadingFrames,
    canvasSize,
    isCapturingScreenshot,
    startWebcam,
    stopWebcam,
    handleFileUpload,
    triggerFileUpload,
    selectFrame,
    updateFilter,
    clearFilters,
    handleCaptureScreenshot,
    cleanup
  };
};
