import * as facemesh from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

// Key facial landmarks indices for glasses placement
export const FACIAL_LANDMARKS = {
  // Eyes landmarks
  leftEye: [33, 133, 157, 158, 159, 160, 161, 173, 246],
  rightEye: [263, 362, 384, 385, 386, 387, 388, 398, 466],
  
  // Nose landmarks
  noseBridge: [168, 6, 197, 195, 5],
  noseTip: [1, 2, 3, 4],
  
  // Face contour
  leftCheek: [127, 234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152],
  rightCheek: [356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152],
  
  // Eyebrows
  leftEyebrow: [70, 63, 105, 66, 107],
  rightEyebrow: [300, 293, 334, 296, 336],
  
  // Temple points (important for glasses width)
  leftTemple: [234, 93, 132, 58, 172],
  rightTemple: [454, 323, 361, 288, 397],
  
  // Bridge points (where glasses sit)
  bridge: [168, 6, 197, 195, 5],
};

// Initialize the FaceMesh model
export const initFaceMesh = async (
  onResults: (results: facemesh.Results) => void
): Promise<facemesh.FaceMesh> => {
  const faceMeshInstance = new facemesh.FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMeshInstance.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  faceMeshInstance.onResults(onResults);
  
  return faceMeshInstance;
};

// Initialize camera
export const initCamera = (
  videoElement: HTMLVideoElement,
  faceMeshInstance: facemesh.FaceMesh
): Camera => {
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await faceMeshInstance.send({image: videoElement});
    },
    width: 640,
    height: 480
  });
  
  return camera;
};

// Draw face mesh on canvas for debugging purposes
export const drawFaceMesh = (
  results: facemesh.Results,
  canvasElement: HTMLCanvasElement
) => {
  const canvasCtx = canvasElement.getContext('2d');
  if (!canvasCtx) return;
  
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Draw the face mesh
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      drawConnectors(
        canvasCtx, landmarks, facemesh.FACEMESH_TESSELATION,
        {color: '#C0C0C070', lineWidth: 1}
      );
      drawConnectors(
        canvasCtx, landmarks, facemesh.FACEMESH_RIGHT_EYE,
        {color: '#FF3030', lineWidth: 2}
      );
      drawConnectors(
        canvasCtx, landmarks, facemesh.FACEMESH_RIGHT_EYEBROW,
        {color: '#FF3030', lineWidth: 2}
      );
      drawConnectors(
        canvasCtx, landmarks, facemesh.FACEMESH_LEFT_EYE,
        {color: '#30FF30', lineWidth: 2}
      );
      drawConnectors(
        canvasCtx, landmarks, facemesh.FACEMESH_LEFT_EYEBROW,
        {color: '#30FF30', lineWidth: 2}
      );
      drawConnectors(
        canvasCtx, landmarks, facemesh.FACEMESH_FACE_OVAL,
        {color: '#E0E0E0', lineWidth: 2}
      );
      drawConnectors(
        canvasCtx, landmarks, facemesh.FACEMESH_LIPS,
        {color: '#E0E0E0', lineWidth: 2}
      );
    }
  }
  
  canvasCtx.restore();
};

// Extract key facial measurements from landmarks
export const extractFacialMeasurements = (landmarks: facemesh.NormalizedLandmarkList) => {
  if (!landmarks || landmarks.length === 0) {
    return null;
  }
  
  // Convert normalized landmarks to actual coordinates
  const points = landmarks.map(landmark => ({
    x: landmark.x,
    y: landmark.y,
    z: landmark.z
  }));
  
  // Calculate interpupillary distance (distance between eyes)
  const leftEyeIndex = 33; // Left eye center
  const rightEyeIndex = 263; // Right eye center
  const interpupillaryDistance = calculateDistance(
    points[leftEyeIndex], 
    points[rightEyeIndex]
  );
  
  // Calculate face width
  const leftTempleIndex = 234; // Left temple
  const rightTempleIndex = 454; // Right temple
  const faceWidth = calculateDistance(
    points[leftTempleIndex], 
    points[rightTempleIndex]
  );
  
  // Calculate face height
  const foreheadIndex = 10; // Forehead center
  const chinIndex = 152; // Chin center
  const faceHeight = calculateDistance(
    points[foreheadIndex], 
    points[chinIndex]
  );
  
  return {
    interpupillaryDistance,
    faceWidth,
    faceHeight
  };
};

// Helper function to calculate distance between points
const calculateDistance = (pointA: {x: number, y: number, z: number}, pointB: {x: number, y: number, z: number}) => {
  return Math.sqrt(
    Math.pow(pointB.x - pointA.x, 2) +
    Math.pow(pointB.y - pointA.y, 2) +
    Math.pow(pointB.z - pointA.z, 2)
  );
};

// Function to get specific landmark positions needed for glasses placement
export const getGlassesPosition = (landmarks: facemesh.NormalizedLandmarkList) => {
  if (!landmarks || landmarks.length === 0) {
    return null;
  }
  
  // Get bridge of nose position (where glasses would sit)
  const bridgeIndex = 6; // Nose bridge
  const bridge = landmarks[bridgeIndex];
  
  // Calculate rotation angles from face orientation
  // This is simplified; in a real application, you'd need more sophisticated pose estimation
  const leftEyeIndex = 33;
  const rightEyeIndex = 263;
  const leftEye = landmarks[leftEyeIndex];
  const rightEye = landmarks[rightEyeIndex];
  
  // Calculate approximate rotation around Y-axis (based on eye position difference)
  const yRotation = Math.atan2(
    rightEye.z - leftEye.z,
    rightEye.x - leftEye.x
  );
  
  // Calculate approximate rotation around X-axis (based on eye vertical position)
  const xRotation = Math.atan2(
    rightEye.y - leftEye.y,
    rightEye.x - leftEye.x
  );
  
  // Calculate Scale based on interpupillary distance
  const interpupillaryDistance = calculateDistance(
    landmarks[leftEyeIndex],
    landmarks[rightEyeIndex]
  );
  
  return {
    position: {
      x: bridge.x,
      y: bridge.y,
      z: bridge.z
    },
    rotation: {
      x: xRotation,
      y: yRotation,
      z: 0
    },
    scale: interpupillaryDistance
  };
};