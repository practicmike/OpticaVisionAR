import * as facemeshModule from '@mediapipe/face_mesh';
import type { FaceMesh, Results } from '@mediapipe/face_mesh';

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
