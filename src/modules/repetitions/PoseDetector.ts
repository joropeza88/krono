import type { PoseLandmarks } from "./types";

type VisionModule = typeof import("@mediapipe/tasks-vision");
export class PoseDetector {
  private landmarker?: Awaited<ReturnType<VisionModule["PoseLandmarker"]["createFromOptions"]>>;
  async initialize() {
    if (this.landmarker) return;
    const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks("/mediapipe");
    this.landmarker = await PoseLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: "/models/pose_landmarker_lite.task" }, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.55, minPosePresenceConfidence: 0.55, minTrackingConfidence: 0.55 });
  }
  detect(video: HTMLVideoElement, timestamp: number): PoseLandmarks | undefined {
    return this.landmarker?.detectForVideo(video, timestamp).landmarks[0] as PoseLandmarks | undefined;
  }
  dispose() { this.landmarker?.close(); this.landmarker = undefined; }
}
