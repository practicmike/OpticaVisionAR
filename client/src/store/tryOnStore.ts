import { create } from 'zustand';

interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

/**
 * UI-level try-on state. The per-frame head pose is NOT stored here: it lives
 * in src/ar/tracking.ts and is read directly by the renderer, so camera
 * frames don't re-render React components.
 */
interface TryOnState {
  isFaceDetected: boolean;

  // User fine-tuning, relative to the head (world units / radians / factor).
  adjustments: {
    position: Vector3Like;
    rotation: Vector3Like;
    scale: number;
  };

  isCapturingScreenshot: boolean;
  screenshot: string | null;

  setFaceDetected: (detected: boolean) => void;
  updateAdjustment: (type: 'position' | 'rotation' | 'scale', value: any) => void;
  resetAdjustments: () => void;
  captureScreenshot: () => void;
  setScreenshot: (dataUrl: string | null) => void;
}

const defaultAdjustments = () => ({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1,
});

export const useTryOnStore = create<TryOnState>((set) => ({
  isFaceDetected: false,
  adjustments: defaultAdjustments(),
  isCapturingScreenshot: false,
  screenshot: null,

  setFaceDetected: (detected) =>
    set((state) => (state.isFaceDetected === detected ? state : { isFaceDetected: detected })),

  updateAdjustment: (type, value) => set((state) => {
    if (type === 'position' || type === 'rotation') {
      return {
        adjustments: {
          ...state.adjustments,
          [type]: { ...state.adjustments[type], ...value },
        },
      };
    }
    if (type === 'scale') {
      return { adjustments: { ...state.adjustments, scale: value } };
    }
    return state;
  }),

  resetAdjustments: () => set({ adjustments: defaultAdjustments() }),

  captureScreenshot: () => set({ isCapturingScreenshot: true }),

  setScreenshot: (dataUrl) => set({ screenshot: dataUrl, isCapturingScreenshot: false }),
}));
