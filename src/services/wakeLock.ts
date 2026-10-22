let sentinel: WakeLockSentinel | undefined;

export async function requestScreenWakeLock() {
  if (
    document.visibilityState !== "visible" ||
    !("wakeLock" in navigator) ||
    (sentinel && !sentinel.released)
  )
    return;

  try {
    const nextSentinel = await navigator.wakeLock.request("screen");
    if (document.visibilityState !== "visible") {
      await nextSentinel.release();
      return;
    }

    sentinel = nextSentinel;
    sentinel.addEventListener("release", () => {
      if (sentinel === nextSentinel) sentinel = undefined;
    });
  } catch (error) {
    console.warn("No se pudo mantener la pantalla encendida.", error);
  }
}

export async function releaseScreenWakeLock() {
  const current = sentinel;
  sentinel = undefined;
  if (current && !current.released) await current.release();
}
