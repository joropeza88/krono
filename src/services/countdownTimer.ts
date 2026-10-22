export type CountdownSnapshot = {
  remaining: number;
  duration: number;
};

export function createCountdownTimer(
  onTick: (snapshot: CountdownSnapshot) => void,
  onComplete: () => void,
) {
  let interval: number | undefined;
  let endsAt = 0;
  let duration = 0;
  let remaining = 0;

  function update() {
    remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    onTick({ remaining, duration });
    if (remaining <= 0) {
      stop();
      onComplete();
    }
  }

  function start(seconds: number, deadline = Date.now() + seconds * 1000) {
    stop();
    duration = seconds;
    endsAt = deadline;
    const activeDeadline = endsAt;
    update();
    if (endsAt !== activeDeadline) return;
    interval = window.setInterval(update, 100);
  }

  function pause() {
    stop();
    return remaining;
  }

  function stop() {
    window.clearInterval(interval);
    interval = undefined;
  }

  return {
    start,
    pause,
    stop,
    get deadline() {
      return endsAt;
    },
    get remaining() {
      return remaining;
    },
  };
}
