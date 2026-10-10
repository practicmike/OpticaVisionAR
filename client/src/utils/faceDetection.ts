import * as facemeshModule from '@mediapipe/face_mesh';
import type { FaceMesh, Results, NormalizedLandmarkList } from '@mediapipe/face_mesh';

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

/**
 * Error categories shown to the user. Previously every failure (including the
 * model not loading) was reported as "camera not available".
 */
export type TryOnErrorKind =
  | 'insecure'      // page not served over HTTPS
  | 'unsupported'   // browser has no camera API
  | 'denied'        // user or OS blocked the camera
  | 'notFound'      // no camera on the device
  | 'inUse'         // camera busy (another app / tab)
  | 'model';        // face-tracking model failed to load

export class TryOnError extends Error {
  constructor(public kind: TryOnErrorKind, cause?: unknown) {
    super(kind);
    this.name = 'TryOnError';
    if (cause) (this as any).cause = cause;
  }
}

export const classifyTryOnError = (error: unknown): TryOnErrorKind => {
  if (error instanceof TryOnError) return error.kind;
  const name = (error as { name?: string } | null)?.name;
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'denied';
    case 'NotFoundError':
    case 'OverconstrainedError':
    case 'DevicesNotFoundError':
      return 'notFound';
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'inUse';
    default:
      return 'model';
  }
};

// The model files are copied from node_modules into the site at build time
// (see vite.config.ts), so the version always matches the JS package and the
// try-on doesn't depend on a third-party CDN being reachable.
declare const __FACE_MESH_ASSETS__: string;
const FACE_MESH_ASSETS = __FACE_MESH_ASSETS__;

// @mediapipe/face_mesh is a Closure-compiled script that registers FaceMesh on
// globalThis instead of exporting it. Vite's dev server papers over that, but
// the production bundle gets an empty module object, so `new FaceMesh()` threw
// and the UI reported it as a camera problem. Resolve it from either place.
const resolveFaceMeshConstructor = (): (new (config: any) => FaceMesh) => {
  const ctor = (facemeshModule as any)?.FaceMesh ?? (globalThis as any).FaceMesh;
  if (typeof ctor !== 'function') {
    throw new TryOnError('model', new Error('MediaPipe FaceMesh constructor not found'));
  }
  return ctor;
};

// Initialize the FaceMesh model and wait until its WASM/model files are loaded,
// so loading failures surface here instead of on the first frame.
export const initFaceMesh = async (
  onResults: (results: Results) => void
): Promise<FaceMesh> => {
  try {
    const FaceMeshCtor = resolveFaceMeshConstructor();
    const faceMeshInstance = new FaceMeshCtor({
      locateFile: (file: string) => `${FACE_MESH_ASSETS}${file}`,
    });

    faceMeshInstance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMeshInstance.onResults(onResults);
    await faceMeshInstance.initialize();
    return faceMeshInstance;
  } catch (error) {
    throw error instanceof TryOnError ? error : new TryOnError('model', error);
  }
};

export interface CameraHandle {
  stop: () => void;
}

/**
 * Opens the front camera with the native API and feeds frames to FaceMesh.
 * Replaces @mediapipe/camera_utils, which has the same bundling defect and
 * hid the real getUserMedia error.
 */
export const startCamera = async (
  videoElement: HTMLVideoElement,
  faceMeshInstance: FaceMesh,
): Promise<CameraHandle> => {
  if (!window.isSecureContext) throw new TryOnError('insecure');
  if (!navigator.mediaDevices?.getUserMedia) throw new TryOnError('unsupported');

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
  });

  videoElement.srcObject = stream;
  videoElement.muted = true;
  videoElement.playsInline = true;
  await videoElement.play();

  let running = true;
  let busy = false;
  let frameHandle = 0;

  const loop = async () => {
    if (!running) return;
    // Skip frames while the model is still processing the previous one,
    // instead of queueing them (which builds up lag on slow phones).
    if (!busy && videoElement.readyState >= 2) {
      busy = true;
      try {
        await faceMeshInstance.send({ image: videoElement });
      } catch (error) {
        console.error('FaceMesh frame error:', error);
      } finally {
        busy = false;
      }
    }
    if (running) frameHandle = requestAnimationFrame(loop);
  };
  frameHandle = requestAnimationFrame(loop);

  return {
    stop: () => {
      running = false;
      cancelAnimationFrame(frameHandle);
      stream.getTracks().forEach((track) => track.stop());
      if (videoElement.srcObject === stream) videoElement.srcObject = null;
    },
  };
};

// Extract key facial measurements from landmarks
export const extractFacialMeasurements = (landmarks: NormalizedLandmarkList) => {
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
export const getGlassesPosition = (landmarks: NormalizedLandmarkList) => {
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