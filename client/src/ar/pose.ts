import type { Quat } from './oneEuro';

/**
 * Head pose from MediaPipe FaceMesh landmarks, in the renderer's world space.
 *
 * World space (see GlassesRenderer): orthographic camera, image width = 4
 * units, x right, y up, z toward the camera. Landmarks are normalized to the
 * image (x / width, y / height, z roughly in x units), so y must be scaled by
 * height/width. The previous code mixed normalized x and y directly, which
 * made the glasses change size when the head tilted.
 */

export interface LandmarkLike {
  x: number;
  y: number;
  z: number;
}

export interface HeadPose {
  /** Nose bridge, where the glasses sit. */
  position: { x: number; y: number; z: number };
  /** Full 3D head orientation (yaw, pitch and roll). */
  quaternion: Quat;
  /** Outer eye-corner distance (3D, world units): drives the glasses size. */
  eyeSpan: number;
  /** Temple-to-temple face width (3D, world units): sizes the head occluder. */
  faceWidth: number;
  /**
   * Midpoint between the temples relative to the nose bridge, in the head's
   * own frame (y up the face, z out of the face; z is negative = behind the
   * bridge). Places the head occluder that hides the far temple arm.
   */
  templeOffset: { y: number; z: number };
}

// MediaPipe FaceMesh indices (canonical face model).
export const LANDMARK = {
  noseBridge: 6,
  rightEyeOuter: 33, // subject's right eye, image-left in an unmirrored frame
  leftEyeOuter: 263,
  forehead: 10,
  chin: 152,
  rightTemple: 234,
  leftTemple: 454,
} as const;

const WORLD_WIDTH = 4;

type Vec3 = [number, number, number];

const toWorld = (l: LandmarkLike, aspect: number): Vec3 => [
  (l.x - 0.5) * WORLD_WIDTH,
  ((0.5 - l.y) * WORLD_WIDTH) / aspect,
  -l.z * WORLD_WIDTH,
];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const length = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
const normalize = (a: Vec3): Vec3 => scale(a, 1 / (length(a) || 1));
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/** Rotation matrix with columns (x, y, z) -> quaternion [x, y, z, w]. */
const basisToQuaternion = (x: Vec3, y: Vec3, z: Vec3): Quat => {
  const m00 = x[0], m01 = y[0], m02 = z[0];
  const m10 = x[1], m11 = y[1], m12 = z[1];
  const m20 = x[2], m21 = y[2], m22 = z[2];
  const trace = m00 + m11 + m22;
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1);
    return [(m21 - m12) * s, (m02 - m20) * s, (m10 - m01) * s, 0.25 / s];
  }
  if (m00 > m11 && m00 > m22) {
    const s = 2 * Math.sqrt(1 + m00 - m11 - m22);
    return [0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s];
  }
  if (m11 > m22) {
    const s = 2 * Math.sqrt(1 + m11 - m00 - m22);
    return [(m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s];
  }
  const s = 2 * Math.sqrt(1 + m22 - m00 - m11);
  return [(m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s];
};

/**
 * @param aspect image width / height of the frame the landmarks come from.
 */
export const computeHeadPose = (
  landmarks: ArrayLike<LandmarkLike>,
  aspect: number,
): HeadPose | null => {
  if (!landmarks || landmarks.length < 455 || !(aspect > 0)) return null;
  const p = (index: number) => toWorld(landmarks[index], aspect);

  const eyeR = p(LANDMARK.rightEyeOuter);
  const eyeL = p(LANDMARK.leftEyeOuter);
  const across = sub(eyeL, eyeR); // points to image-right for a frontal face
  const up = sub(p(LANDMARK.forehead), p(LANDMARK.chin));

  const eyeSpan = length(across);
  if (!(eyeSpan > 1e-4) || !(length(up) > 1e-4)) return null;

  // Orthonormal head frame: x across the eyes, y up the face, z out of the face.
  const xAxis = normalize(across);
  const yAxis = normalize(sub(up, scale(xAxis, dot(up, xAxis))));
  const zAxis = cross(xAxis, yAxis);

  const bridge = p(LANDMARK.noseBridge);
  const templeR = p(LANDMARK.rightTemple);
  const templeL = p(LANDMARK.leftTemple);
  const templeMid = scale([templeR[0] + templeL[0], templeR[1] + templeL[1], templeR[2] + templeL[2]], 0.5);
  const toTemples = sub(templeMid, bridge);
  return {
    position: { x: bridge[0], y: bridge[1], z: bridge[2] },
    quaternion: basisToQuaternion(xAxis, yAxis, zAxis),
    eyeSpan,
    faceWidth: length(sub(templeL, templeR)),
    templeOffset: { y: dot(toTemples, yAxis), z: dot(toTemples, zAxis) },
  };
};
