import { computeHeadPose, type HeadPose, type LandmarkLike } from './pose';
import { OneEuroFilter, QuaternionOneEuroFilter } from './oneEuro';

/**
 * Face-tracking state shared by the detector (use-try-on) and the 3D
 * renderer (GlassesRenderer). It lives outside React on purpose: it changes
 * ~30 times per second, and routing it through React state re-rendered the
 * whole try-on page on every camera frame.
 */

// Tuned in world units (image width = 4). Static head: ~1 Hz cutoff removes
// sensor jitter; moving head: cutoff rises with speed so glasses don't lag.
const POSITION_FILTER = { minCutoff: 1.2, beta: 6, dCutoff: 1 };
const SIZE_FILTER = { minCutoff: 0.8, beta: 4, dCutoff: 1 };
const ROTATION_FILTER = { minCutoff: 1.2, beta: 1.5, dCutoff: 1 };

// Keep showing the glasses through brief detection drops (blink, motion
// blur, hand passing) instead of flickering; hide after this long.
const LOST_FACE_GRACE_MS = 300;

type Listener = (visible: boolean) => void;

class FaceTracker {
  private filters = this.createFilters();
  private pose: HeadPose | null = null;
  private lastSeen = -Infinity;
  private visible = false;
  private listeners = new Set<Listener>();

  private createFilters() {
    const scalar = (c: { minCutoff: number; beta: number; dCutoff: number }) =>
      new OneEuroFilter(c.minCutoff, c.beta, c.dCutoff);
    return {
      x: scalar(POSITION_FILTER),
      y: scalar(POSITION_FILTER),
      z: scalar(POSITION_FILTER),
      eyeSpan: scalar(SIZE_FILTER),
      faceWidth: scalar(SIZE_FILTER),
      templeY: scalar(SIZE_FILTER),
      templeZ: scalar(SIZE_FILTER),
      rotation: new QuaternionOneEuroFilter(
        ROTATION_FILTER.minCutoff,
        ROTATION_FILTER.beta,
        ROTATION_FILTER.dCutoff,
      ),
    };
  }

  /** Feed one detector result. `landmarks` is null when no face was found. */
  update(landmarks: ArrayLike<LandmarkLike> | null, aspect: number, timeMs = performance.now()) {
    const raw = landmarks ? computeHeadPose(landmarks, aspect) : null;

    if (!raw) {
      if (this.visible && timeMs - this.lastSeen > LOST_FACE_GRACE_MS) {
        this.setVisible(false);
      }
      return;
    }

    // Re-acquired after a loss: start the filters fresh so the glasses jump
    // to the face instead of sliding from where it was last seen.
    if (timeMs - this.lastSeen > LOST_FACE_GRACE_MS) this.resetFilters();
    this.lastSeen = timeMs;

    const f = this.filters;
    this.pose = {
      position: {
        x: f.x.filter(raw.position.x, timeMs),
        y: f.y.filter(raw.position.y, timeMs),
        z: f.z.filter(raw.position.z, timeMs),
      },
      quaternion: f.rotation.filter(raw.quaternion, timeMs),
      eyeSpan: f.eyeSpan.filter(raw.eyeSpan, timeMs),
      faceWidth: f.faceWidth.filter(raw.faceWidth, timeMs),
      templeOffset: {
        y: f.templeY.filter(raw.templeOffset.y, timeMs),
        z: f.templeZ.filter(raw.templeOffset.z, timeMs),
      },
    };
    this.setVisible(true);

    // Test hook: automated tests define globalThis.__arDebugLog = [] before
    // the page loads to compare raw vs smoothed poses. Inert otherwise.
    const debugLog = (globalThis as { __arDebugLog?: unknown[] }).__arDebugLog;
    if (Array.isArray(debugLog) && debugLog.length < 5000) {
      debugLog.push({ t: timeMs, raw, smooth: this.pose });
    }
  }

  /** Latest smoothed pose, or null when no face is being tracked. */
  getPose(): HeadPose | null {
    return this.visible ? this.pose : null;
  }

  isVisible() {
    return this.visible;
  }

  /** Called when the source changes (camera started/stopped, new photo). */
  reset() {
    this.resetFilters();
    this.pose = null;
    this.lastSeen = -Infinity;
    this.setVisible(false);
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private resetFilters() {
    this.filters = this.createFilters();
  }

  private setVisible(visible: boolean) {
    if (visible === this.visible) return;
    this.visible = visible;
    this.listeners.forEach((listener) => listener(visible));
  }
}

export const faceTracker = new FaceTracker();
