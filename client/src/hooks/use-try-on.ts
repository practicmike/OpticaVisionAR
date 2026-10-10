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
  extractFacialMeasurements,
  getGlassesPosition,
  type CameraHandle,
} from '@/utils/faceDetection';

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

  // Access the global store
  const {
    setFaceDetected,
    setFaceMeshPoints,
    setFacialMeasurements,
    setGlassesPosition,
    setGlassesRotation,
    setGlassesScale,
    captureScreenshot,
    setScreenshot,
    isCapturingScreenshot
  } = useTryOnStore();

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

  // Handle FaceMesh results
  const onFaceMeshResults = useCallback((results: Results) => {
    // Handle face detection results
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      
      // Update face detection state
      setFaceDetected(true);
      
      // Convert landmarks to simple array format for state
      const landmarkPoints = landmarks.map(l => [l.x, l.y, l.z]);
      setFaceMeshPoints(landmarkPoints);
      
      // Extract facial measurements
      const measurements = extractFacialMeasurements(landmarks);
      if (measurements) {
        setFacialMeasurements(measurements);
      }
      
      // Get glasses position, rotation, and scale
      const glassesPlacement = getGlassesPosition(landmarks);
      if (glassesPlacement) {
        setGlassesPosition(glassesPlacement.position);
        setGlassesRotation(glassesPlacement.rotation);
        setGlassesScale({ x: glassesPlacement.scale, y: glassesPlacement.scale, z: glassesPlacement.scale });
      }
    } else {
      // No face detected
      setFaceDetected(false);
    }
  }, [setFaceDetected, setFaceMeshPoints, setFacialMeasurements, setGlassesPosition, setGlassesRotation, setGlassesScale]);

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
    setFaceDetected(false);
    
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
  }, [ensureFaceMesh, setFaceDetected, showTryOnError]);

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
    setFaceDetected(false);
  }, [setFaceDetected]);

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

      setFaceDetected(false);
      setUploadedImage(imageSource);
      setMethod('upload');

      const image = new Image();
      image.onload = async () => {
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
  }, [ensureFaceMesh, setFaceDetected, stopWebcam, showTryOnError]);

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

  // Handle screenshot capture
  const handleCaptureScreenshot = useCallback(() => {
    if (!renderCanvasRef.current) return;
    
    captureScreenshot();
    
    // Create a composite canvas with both video/image and 3D glasses
    const screenshot = renderCanvasRef.current.toDataURL('image/png');
    setScreenshot(screenshot);
  }, [captureScreenshot, setScreenshot]);

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
    setFaceDetected(false);
  }, [stopWebcam, setFaceDetected]);

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
