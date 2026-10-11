/**
 * One Euro filter: adaptive low-pass filter for noisy real-time signals.
 * Slow movement -> low cutoff (removes jitter); fast movement -> high cutoff
 * (removes lag). Casiez, Roussel & Vogel, CHI 2012.
 * https://doi.org/10.1145/2207676.2208639
 */

const smoothingFactor = (cutoffHz: number, dtSeconds: number) => {
  const tau = 1 / (2 * Math.PI * cutoffHz);
  return 1 / (1 + tau / dtSeconds);
};

const MIN_DT = 1 / 240;
const MAX_DT = 0.5;

export class OneEuroFilter {
  private prevValue: number | null = null;
  private prevDerivative = 0;
  private prevTime = 0;

  constructor(
    private minCutoff = 1.0,
    private beta = 0.0,
    private derivativeCutoff = 1.0,
  ) {}

  filter(value: number, timeMs: number): number {
    if (this.prevValue === null) {
      this.prevValue = value;
      this.prevTime = timeMs;
      return value;
    }
    const dt = Math.min(MAX_DT, Math.max(MIN_DT, (timeMs - this.prevTime) / 1000));
    this.prevTime = timeMs;

    const derivative = (value - this.prevValue) / dt;
    const aD = smoothingFactor(this.derivativeCutoff, dt);
    this.prevDerivative = aD * derivative + (1 - aD) * this.prevDerivative;

    const cutoff = this.minCutoff + this.beta * Math.abs(this.prevDerivative);
    const a = smoothingFactor(cutoff, dt);
    this.prevValue = a * value + (1 - a) * this.prevValue;
    return this.prevValue;
  }

  reset() {
    this.prevValue = null;
    this.prevDerivative = 0;
  }
}

export type Quat = [number, number, number, number]; // x, y, z, w

const normalize = (q: Quat): Quat => {
  const len = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
};

const slerp = (a: Quat, b: Quat, t: number): Quat => {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  let target = b;
  if (dot < 0) {
    dot = -dot;
    target = [-b[0], -b[1], -b[2], -b[3]];
  }
  if (dot > 0.9995) {
    return normalize([
      a[0] + t * (target[0] - a[0]),
      a[1] + t * (target[1] - a[1]),
      a[2] + t * (target[2] - a[2]),
      a[3] + t * (target[3] - a[3]),
    ]);
  }
  const theta = Math.acos(Math.min(1, dot));
  const sinTheta = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sinTheta;
  const wb = Math.sin(t * theta) / sinTheta;
  return [
    wa * a[0] + wb * target[0],
    wa * a[1] + wb * target[1],
    wa * a[2] + wb * target[2],
    wa * a[3] + wb * target[3],
  ];
};

/** One Euro filter applied to rotations: speed = angular speed (rad/s). */
export class QuaternionOneEuroFilter {
  private prev: Quat | null = null;
  private prevSpeed = 0;
  private prevTime = 0;

  constructor(
    private minCutoff = 1.0,
    private beta = 0.0,
    private derivativeCutoff = 1.0,
  ) {}

  filter(q: Quat, timeMs: number): Quat {
    if (!this.prev) {
      this.prev = normalize(q);
      this.prevTime = timeMs;
      return this.prev;
    }
    const dt = Math.min(MAX_DT, Math.max(MIN_DT, (timeMs - this.prevTime) / 1000));
    this.prevTime = timeMs;

    const dot = Math.abs(
      this.prev[0] * q[0] + this.prev[1] * q[1] + this.prev[2] * q[2] + this.prev[3] * q[3],
    );
    const angle = 2 * Math.acos(Math.min(1, dot));
    const aD = smoothingFactor(this.derivativeCutoff, dt);
    this.prevSpeed = aD * (angle / dt) + (1 - aD) * this.prevSpeed;

    const cutoff = this.minCutoff + this.beta * this.prevSpeed;
    this.prev = normalize(slerp(this.prev, normalize(q), smoothingFactor(cutoff, dt)));
    return this.prev;
  }

  reset() {
    this.prev = null;
    this.prevSpeed = 0;
  }
}
