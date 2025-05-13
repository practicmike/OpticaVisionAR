import { create } from 'zustand';
import * as THREE from 'three';

interface Position {
  x: number;
  y: number;
  z: number;
}

interface Rotation {
  x: number;
  y: number;
  z: number;
}

interface Scale {
  x: number;
  y: number;
  z: number;
}

interface FacialMeasurements {
  interpupillaryDistance: number;
  faceWidth: number;
  faceHeight: number;
}

interface TryOnState {
  // Face detection state
  isFaceDetected: boolean;
  faceMeshPoints: number[][];
  facialMeasurements: FacialMeasurements;
  
  // Glasses positioning
  glassesPosition: Position;
  glassesRotation: Rotation;
  glassesScale: Scale;
  
  // Adjustments
  adjustments: {
    position: Position;
    rotation: Rotation;
    scale: number;
  };
  
  // Media state
  isCapturingScreenshot: boolean;
  screenshot: string | null;
  
  // Actions
  setFaceDetected: (detected: boolean) => void;
  setFaceMeshPoints: (points: number[][]) => void;
  setFacialMeasurements: (measurements: Partial<FacialMeasurements>) => void;
  setGlassesPosition: (position: Partial<Position>) => void;
  setGlassesRotation: (rotation: Partial<Rotation>) => void;
  setGlassesScale: (scale: Partial<Scale>) => void;
  updateAdjustment: (type: 'position' | 'rotation' | 'scale', value: any) => void;
  resetAdjustments: () => void;
  captureScreenshot: () => void;
  setScreenshot: (dataUrl: string | null) => void;
}

const DEFAULT_FACIAL_MEASUREMENTS: FacialMeasurements = {
  interpupillaryDistance: 0,
  faceWidth: 0,
  faceHeight: 0,
};

const DEFAULT_POSITION: Position = { x: 0, y: 0, z: 0 };
const DEFAULT_ROTATION: Rotation = { x: 0, y: 0, z: 0 };
const DEFAULT_SCALE: Scale = { x: 1, y: 1, z: 1 };

export const useTryOnStore = create<TryOnState>((set) => ({
  // Initial state
  isFaceDetected: false,
  faceMeshPoints: [],
  facialMeasurements: DEFAULT_FACIAL_MEASUREMENTS,
  
  glassesPosition: DEFAULT_POSITION,
  glassesRotation: DEFAULT_ROTATION,
  glassesScale: DEFAULT_SCALE,
  
  adjustments: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
  },
  
  isCapturingScreenshot: false,
  screenshot: null,
  
  // Actions
  setFaceDetected: (detected) => set({ isFaceDetected: detected }),
  
  setFaceMeshPoints: (points) => set({ faceMeshPoints: points }),
  
  setFacialMeasurements: (measurements) => set((state) => ({
    facialMeasurements: { ...state.facialMeasurements, ...measurements }
  })),
  
  setGlassesPosition: (position) => set((state) => ({
    glassesPosition: { ...state.glassesPosition, ...position }
  })),
  
  setGlassesRotation: (rotation) => set((state) => ({
    glassesRotation: { ...state.glassesRotation, ...rotation }
  })),
  
  setGlassesScale: (scale) => set((state) => ({
    glassesScale: { ...state.glassesScale, ...scale }
  })),
  
  updateAdjustment: (type, value) => set((state) => {
    if (type === 'position' || type === 'rotation') {
      return {
        adjustments: {
          ...state.adjustments,
          [type]: { ...state.adjustments[type], ...value }
        }
      };
    } else if (type === 'scale') {
      return {
        adjustments: {
          ...state.adjustments,
          scale: value
        }
      };
    }
    return state;
  }),
  
  resetAdjustments: () => set({
    adjustments: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
    }
  }),
  
  captureScreenshot: () => set({ isCapturingScreenshot: true }),
  
  setScreenshot: (dataUrl) => set({
    screenshot: dataUrl,
    isCapturingScreenshot: false
  }),
}));