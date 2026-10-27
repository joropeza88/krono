export class CameraManager {
  private stream?: MediaStream;
  async start(video: HTMLVideoElement, facingMode: "user" | "environment" = "user") {
    this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: facingMode }, width: { ideal: 640 }, height: { ideal: 480 } } });
    video.srcObject = this.stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
  }
  stop() { this.stream?.getTracks().forEach((track) => track.stop()); this.stream = undefined; }
  get active() { return Boolean(this.stream); }
}
