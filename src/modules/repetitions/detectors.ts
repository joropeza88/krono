import { angle, distance, isVisible, POSE } from "./LandmarkUtils";
import type { ExerciseId, ExerciseReading, PoseLandmarks } from "./types";

export interface ExerciseDetector { read(landmarks: PoseLandmarks): ExerciseReading; }

export class SquatDetector implements ExerciseDetector {
  read(points: PoseLandmarks): ExerciseReading {
    const left = [points[POSE.LEFT_HIP], points[POSE.LEFT_KNEE], points[POSE.LEFT_ANKLE]];
    const right = [points[POSE.RIGHT_HIP], points[POSE.RIGHT_KNEE], points[POSE.RIGHT_ANKLE]];
    const candidates = [left, right].filter((side) => isVisible(...side));
    if (!candidates.length) return { state: "tracking-lost", detail: "Muestra cadera, rodilla y tobillo de un lado." };
    const values = candidates.map(([hip, knee, ankle]) => angle(hip!, knee!, ankle!));
    const kneeAngle = Math.max(...values);
    if (kneeAngle >= 160) return { state: "initial", signal: kneeAngle, detail: `Rodilla ${Math.round(kneeAngle)}°` };
    if (kneeAngle <= 110) return { state: "contracted", signal: kneeAngle, detail: `Rodilla ${Math.round(kneeAngle)}°` };
    return { state: "initial", signal: kneeAngle, detail: `Baja un poco más (${Math.round(kneeAngle)}°)` };
  }
}

export class JumpingJackDetector implements ExerciseDetector {
  read(points: PoseLandmarks): ExerciseReading {
    const ls = points[POSE.LEFT_SHOULDER], rs = points[POSE.RIGHT_SHOULDER], lw = points[POSE.LEFT_WRIST], rw = points[POSE.RIGHT_WRIST];
    const la = points[POSE.LEFT_ANKLE], ra = points[POSE.RIGHT_ANKLE], lh = points[POSE.LEFT_HIP], rh = points[POSE.RIGHT_HIP];
    if (!isVisible(ls, rs, lw, rw, la, ra, lh, rh)) return { state: "tracking-lost", detail: "Mantén manos y pies dentro del cuadro." };
    const torso = Math.max(distance(ls!, lh!), distance(rs!, rh!), 0.05);
    const feetOpen = distance(la!, ra!) / torso > 1.3;
    const handsUp = lw!.y < Math.min(ls!.y, rs!.y) && rw!.y < Math.min(ls!.y, rs!.y);
    const feetClosed = distance(la!, ra!) / torso < 0.75;
    const handsDown = lw!.y > ls!.y && rw!.y > rs!.y;
    if (feetOpen && handsUp) return { state: "contracted", signal: distance(la!, ra!) / torso, detail: "Abierto" };
    if (feetClosed && handsDown) return { state: "initial", signal: distance(la!, ra!) / torso, detail: "Cerrado" };
    return { state: "initial", detail: "Abre pies y eleva las manos." };
  }
}

export function createDetector(id: ExerciseId): ExerciseDetector { return id === "squat" ? new SquatDetector() : new JumpingJackDetector(); }
