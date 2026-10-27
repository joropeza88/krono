/**
 * Gestor de actualizaciones para PWA basado en Service Worker.
 *
 * Es independiente de Vue: copia este archivo a otro proyecto y crea una UI
 * que se suscriba con `subscribe`. El service worker debe escuchar el mensaje
 * `{ type: "SKIP_WAITING" }` y llamar a `self.skipWaiting()`.
 */
export type PwaUpdateState = { available: boolean; updating: boolean };
type Listener = (state: PwaUpdateState) => void;

export class PwaUpdateService {
  private registration?: ServiceWorkerRegistration;
  private listeners = new Set<Listener>();
  private state: PwaUpdateState = { available: false, updating: false };
  private intervalId?: number;
  private started = false;
  private hasNewAppBundle = false;

  constructor(
    private readonly workerUrl = "/sw.js",
    private readonly checkIntervalMs = 60 * 60 * 1000,
  ) {}

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  async start() {
    if (this.started || !("serviceWorker" in navigator)) return;
    this.started = true;
    // Evita que el navegador reutilice una copia HTTP antigua de sw.js al buscar actualizaciones.
    this.registration = await navigator.serviceWorker.register(this.workerUrl, { updateViaCache: "none" });
    this.watchRegistration(this.registration);
    this.watchController();
    this.intervalId = window.setInterval(() => void this.checkForUpdate(), this.checkIntervalMs);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    await this.checkForUpdate();
  }

  async checkForUpdate() {
    try {
      await this.registration?.update();
      if (this.registration?.waiting && navigator.serviceWorker.controller) this.publish({ available: true });
      if (!this.registration?.waiting && await this.hasPublishedBundleChanged()) {
        this.hasNewAppBundle = true;
        this.publish({ available: true });
      }
    } catch (error) {
      // La app sigue operativa offline; la siguiente comprobación podrá reintentarlo.
      console.warn("No se pudo comprobar la actualización de la PWA.", error);
    }
  }

  applyUpdate() {
    const worker = this.registration?.waiting;
    this.publish({ updating: true });
    if (worker) {
      worker.postMessage({ type: "SKIP_WAITING" });
      return;
    }
    if (this.hasNewAppBundle) window.location.reload();
  }

  dispose() {
    if (this.intervalId) window.clearInterval(this.intervalId);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.listeners.clear();
    this.started = false;
  }

  private watchRegistration(registration: ServiceWorkerRegistration) {
    if (registration.waiting && navigator.serviceWorker.controller) this.publish({ available: true });
    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) this.publish({ available: true });
      });
    });
  }

  private watchController() {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (this.state.updating) window.location.reload();
    });
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === "visible") void this.checkForUpdate();
  };

  /** Detecta un build nuevo por el nombre hash del módulo principal de Vite. */
  private async hasPublishedBundleChanged() {
    const currentScript = document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src;
    if (!currentScript) return false;
    const response = await fetch(`/index.html?__pwa_update_check=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return false;
    const nextDocument = new DOMParser().parseFromString(await response.text(), "text/html");
    const nextScript = nextDocument.querySelector<HTMLScriptElement>('script[type="module"][src]')?.src;
    return Boolean(nextScript && new URL(nextScript, window.location.origin).href !== currentScript);
  }

  private publish(change: Partial<PwaUpdateState>) {
    this.state = { ...this.state, ...change };
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const pwaUpdateService = new PwaUpdateService();
