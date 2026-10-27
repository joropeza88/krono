import type { Landmark } from "./types";

export const POSE = { LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12, LEFT_WRIST: 15, RIGHT_WRIST: 16, LEFT_HIP: 23, RIGHT_HIP: 24, LEFT_KNEE: 25, RIGHT_KNEE: 26, LEFT_ANKLE: 27, RIGHT_ANKLE: 28 } as const;

export function isVisible(...points: Array<Landmark | undefined>) {
  return points.every((point) => point && (point.visibility ?? 1) >= 0.55);
}

export function angle(a: Landmark, b: Landmark, c: Landmark) {
  const abx = a.x - b.x, aby = a.y - b.y, cbx = c.x - b.x, cby = c.y - b.y;
  const magnitude = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (!magnitude) return 0;
  return Math.acos(Math.max(-1, Math.min(1, (abx * cbx + aby * cby) / magnitude))) * 180 / Math.PI;
}

export function distance(a: Landmark, b: Landmark) { return Math.hypot(a.x - b.x, a.y - b.y); }
