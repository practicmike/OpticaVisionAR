import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Camera } from '@mediapipe/camera_utils';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { useTryOnStore } from '@/store/tryOnStore';
import {
  initFaceMesh,
  initCamera,
  drawFaceMesh,
  extractFacialMeasurements,
  getGlassesPosition
} from '@/utils/faceDetection';

export const useTryOn = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Refs
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const renderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  
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

  // Handle FaceMesh results
  const onFaceMeshResults = useCallback((results: Results) => {
    if (!canvasRef.current) return;
    
    // Set canvas dimensions to match video or image
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
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
      
      // Draw the face mesh for debugging/visualization
      drawFaceMesh(results, canvas);
    } else {
      // No face detected
      setFaceDetected(false);
      
      // Clear canvas 
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [setFaceDetected, setFaceMeshPoints, setFacialMeasurements, setGlassesPosition, setGlassesRotation, setGlassesScale]);

  // Initialize FaceMesh when the component mounts
  useEffect(() => {
    const setupFaceMesh = async () => {
      if (!faceMeshRef.current) {
        const faceMeshInstance = await initFaceMesh(onFaceMeshResults);
        faceMeshRef.current = faceMeshInstance;
      }
    };
    
    setupFaceMesh();
    
    // Cleanup
    return () => {
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, [onFaceMeshResults]);

  // Start webcam with FaceMesh
  const startWebcam = useCallback(async () => {
    setMethod('webcam');
    setUploadedImage(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }
      });
      
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        
        // Update canvas size based on video dimensions
        const updateDimensions = () => {
          if (webcamRef.current) {
            const { videoWidth, videoHeight } = webcamRef.current;
            
            if (videoWidth && videoHeight) {
              setCanvasSize({ width: videoWidth, height: videoHeight });
              
              if (canvasRef.current) {
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
              }
              
              if (renderCanvasRef.current) {
                renderCanvasRef.current.width = videoWidth;
                renderCanvasRef.current.height = videoHeight;
              }
            }
          }
        };
        
        webcamRef.current.onloadedmetadata = updateDimensions;
        setIsWebcamActive(true);
        
        // Initialize camera controller for FaceMesh
        if (faceMeshRef.current && !cameraRef.current) {
          const cameraInstance = initCamera(webcamRef.current, faceMeshRef.current);
          cameraRef.current = cameraInstance;
          await cameraInstance.start();
        }
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
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    if (webcamRef.current && webcamRef.current.srcObject) {
      const stream = webcamRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => track.stop());
      webcamRef.current.srcObject = null;
      setIsWebcamActive(false);
    }
    
    // Clear face detection state
    setFaceDetected(false);
  }, [setFaceDetected]);

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
      
      // Process the uploaded image with FaceMesh
      // Note: In a real implementation, you would need to process the static image
      // with FaceMesh. This is more complex and may require custom implementation
      // or using a separate library for static image processing.
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
    if (isWebcamActive) {
      stopWebcam();
    }
    
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }
    
    setUploadedImage(null);
    setSelectedFrameId(null);
    setFaceDetected(false);
  }, [isWebcamActive, stopWebcam, setFaceDetected]);

  return {
    webcamRef,
    canvasRef,
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
