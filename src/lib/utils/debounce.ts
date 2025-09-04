// Debounce utility for performance optimization
// 디바운스된 업데이트 시스템과 입력 반응성 최적화

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Advanced debounce with immediate execution option
export function advancedDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    immediate?: boolean;
    maxWait?: number;
    leading?: boolean;
    trailing?: boolean;
  } = {},
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const maxTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;

  const {
    immediate = false,
    maxWait,
    leading = false,
    trailing = true,
  } = options;

  function invokeFunc(args: Parameters<T>) {
    lastInvokeTime = Date.now();
    return func(...args);
  }

  function leadingEdge(args: Parameters<T>) {
    lastInvokeTime = Date.now();
    timeout = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(args) : undefined;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeout = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timeout = null;

    if (trailing && lastCallTime) {
      return invokeFunc(lastArgs);
    }
    lastCallTime = 0;
    return undefined;
  }

  let lastArgs: Parameters<T>;

  return (...args: Parameters<T>) => {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastCallTime = time;

    if (isInvoking) {
      if (timeout === null) {
        return leadingEdge(lastArgs);
      }
      if (maxWait !== undefined) {
        timeout = setTimeout(timerExpired, wait);
        return invokeFunc(lastArgs);
      }
    }
    if (timeout === null) {
      timeout = setTimeout(timerExpired, wait);
    }
  };
}

// Adaptive debounce that adjusts delay based on input frequency
export function adaptiveDebounce<T extends (...args: any[]) => any>(
  func: T,
  minWait: number = 50,
  maxWait: number = 300,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  let lastCallTime = 0;
  let callCount = 0;
  let resetTimeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    // Reset call count if there's been a pause in input
    clearTimeout(resetTimeout);
    resetTimeout = setTimeout(() => {
      callCount = 0;
    }, 1000);

    // Increase call count
    callCount++;
    lastCallTime = now;

    // Calculate adaptive wait time based on input frequency
    const inputFrequency = Math.min(callCount / 10, 1); // Normalize to 0-1
    const adaptiveWait = minWait + (maxWait - minWait) * (1 - inputFrequency);

    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), adaptiveWait);
  };
}

// Frame-based throttle for smooth animations
export function frameThrottle<T extends (...args: any[]) => any>(
  func: T,
): (...args: Parameters<T>) => void {
  let frameId: number | null = null;
  let lastArgs: Parameters<T>;

  return (...args: Parameters<T>) => {
    lastArgs = args;

    if (frameId === null) {
      frameId = requestAnimationFrame(() => {
        func(...lastArgs);
        frameId = null;
      });
    }
  };
}

// Idle callback debounce for non-critical updates
export function idleDebounce<T extends (...args: any[]) => any>(
  func: T,
  timeout: number = 5000,
): (...args: Parameters<T>) => void {
  let debounceTimeout: ReturnType<typeof setTimeout>;
  let lastArgs: Parameters<T>;

  return (...args: Parameters<T>) => {
    lastArgs = args;

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => func(...lastArgs), { timeout });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => func(...lastArgs), 0);
      }
    }, 100);
  };
}
