import type { CameraView, ExerciseId } from "./types";

export type Exercise = { id: ExerciseId; name: string; cameraView: CameraView; requiredLandmarks: string[] };
export const exercises: Exercise[] = [
  { id: "squat", name: "Sentadillas", cameraView: "side", requiredLandmarks: ["cadera", "rodilla", "tobillo"] },
  { id: "jumping_jack", name: "Jumping jacks", cameraView: "front", requiredLandmarks: ["hombro", "muñeca", "cadera", "tobillo"] },
];
export function getExercise(id: ExerciseId) { return exercises.find((exercise) => exercise.id === id)!; }
