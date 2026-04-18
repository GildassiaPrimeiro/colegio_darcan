type Fn<TArgs extends unknown[]> = (...args: TArgs) => void;

export default function throttle<TArgs extends unknown[]>(fn: Fn<TArgs>, wait = 0): Fn<TArgs> {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let trailingArgs: TArgs | undefined;

  return (...args: TArgs) => {
    const now = Date.now();
    const remaining = wait - (now - lastCall);

    trailingArgs = args;

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      lastCall = now;
      fn(...args);
      trailingArgs = undefined;
      return;
    }

    if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = undefined;
        if (trailingArgs) {
          fn(...trailingArgs);
          trailingArgs = undefined;
        }
      }, remaining);
    }
  };
}
