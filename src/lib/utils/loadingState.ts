// Loading state management and user feedback utilities

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  error?: string;
}

export interface LoadingConfig {
  showSpinner: boolean;
  showProgress: boolean;
  showMessage: boolean;
  minDisplayTime: number; // Minimum time to show loading state
  timeout: number; // Maximum time before showing timeout error
}

/**
 * Manages loading states and user feedback
 */
export class LoadingStateManager {
  private loadingStates: Map<string, LoadingState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private config: LoadingConfig;
  private callbacks: Map<string, (state: LoadingState) => void> = new Map();

  constructor(config: Partial<LoadingConfig> = {}) {
    this.config = {
      showSpinner: true,
      showProgress: false,
      showMessage: true,
      minDisplayTime: 300,
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Start a loading operation
   */
  startLoading(
    id: string,
    message?: string,
    options: { timeout?: number; showProgress?: boolean } = {},
  ): void {
    const state: LoadingState = {
      isLoading: true,
      message,
      progress: options.showProgress ? 0 : undefined,
      error: undefined,
    };

    this.loadingStates.set(id, state);
    this.notifyCallback(id, state);

    // Set timeout if specified
    const timeout = options.timeout ?? this.config.timeout;
    if (timeout > 0) {
      const timer = setTimeout(() => {
        this.setError(id, "Operation timed out");
      }, timeout);
      this.timers.set(id, timer);
    }
  }

  /**
   * Update loading progress
   */
  updateProgress(id: string, progress: number, message?: string): void {
    const state = this.loadingStates.get(id);
    if (!state || !state.isLoading) return;

    const updatedState: LoadingState = {
      ...state,
      progress: Math.max(0, Math.min(100, progress)),
      message: message ?? state.message,
    };

    this.loadingStates.set(id, updatedState);
    this.notifyCallback(id, updatedState);
  }

  /**
   * Set loading message
   */
  setMessage(id: string, message: string): void {
    const state = this.loadingStates.get(id);
    if (!state || !state.isLoading) return;

    const updatedState: LoadingState = {
      ...state,
      message,
    };

    this.loadingStates.set(id, updatedState);
    this.notifyCallback(id, updatedState);
  }

  /**
   * Set error state
   */
  setError(id: string, error: string): void {
    const state = this.loadingStates.get(id);
    if (!state) return;

    const updatedState: LoadingState = {
      ...state,
      isLoading: false,
      error,
    };

    this.loadingStates.set(id, updatedState);
    this.clearTimer(id);
    this.notifyCallback(id, updatedState);

    // Auto-clear error after some time
    setTimeout(() => {
      this.clearLoading(id);
    }, 5000);
  }

  /**
   * Complete loading operation
   */
  completeLoading(id: string, message?: string): void {
    const state = this.loadingStates.get(id);
    if (!state) return;

    const completedState: LoadingState = {
      isLoading: false,
      message,
      progress: 100,
      error: undefined,
    };

    this.loadingStates.set(id, completedState);
    this.clearTimer(id);
    this.notifyCallback(id, completedState);

    // Auto-clear completed state after minimum display time
    setTimeout(() => {
      this.clearLoading(id);
    }, this.config.minDisplayTime);
  }

  /**
   * Clear loading state
   */
  clearLoading(id: string): void {
    this.loadingStates.delete(id);
    this.clearTimer(id);
    this.callbacks.delete(id);
  }

  /**
   * Get current loading state
   */
  getLoadingState(id: string): LoadingState | undefined {
    return this.loadingStates.get(id);
  }

  /**
   * Check if operation is loading
   */
  isLoading(id: string): boolean {
    const state = this.loadingStates.get(id);
    return state?.isLoading ?? false;
  }

  /**
   * Register callback for state changes
   */
  onStateChange(id: string, callback: (state: LoadingState) => void): void {
    this.callbacks.set(id, callback);
  }

  /**
   * Clear timer for an operation
   */
  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  /**
   * Notify callback of state change
   */
  private notifyCallback(id: string, state: LoadingState): void {
    const callback = this.callbacks.get(id);
    if (callback) {
      callback(state);
    }
  }

  /**
   * Get all active loading states
   */
  getAllLoadingStates(): Map<string, LoadingState> {
    return new Map(this.loadingStates);
  }

  /**
   * Clear all loading states
   */
  clearAll(): void {
    for (const id of this.loadingStates.keys()) {
      this.clearLoading(id);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clearAll();
  }
}

/**
 * Create a loading wrapper for async operations
 */
export function withLoading<T>(
  loadingManager: LoadingStateManager,
  id: string,
  operation: () => Promise<T>,
  options: {
    message?: string;
    successMessage?: string;
    errorMessage?: string;
    showProgress?: boolean;
    timeout?: number;
  } = {},
): Promise<T> {
  return new Promise((resolve, reject) => {
    loadingManager.startLoading(id, options.message, {
      showProgress: options.showProgress,
      timeout: options.timeout,
    });

    operation()
      .then((result) => {
        loadingManager.completeLoading(id, options.successMessage);
        resolve(result);
      })
      .catch((error) => {
        const errorMessage =
          options.errorMessage ||
          (error instanceof Error ? error.message : "An error occurred");
        loadingManager.setError(id, errorMessage);
        reject(error);
      });
  });
}

/**
 * Debounced loading state for rapid operations
 */
export class DebouncedLoadingState {
  private loadingManager: LoadingStateManager;
  private debounceTimer: NodeJS.Timeout | null = null;
  private debounceMs: number;

  constructor(loadingManager: LoadingStateManager, debounceMs: number = 300) {
    this.loadingManager = loadingManager;
    this.debounceMs = debounceMs;
  }

  /**
   * Start loading with debounce
   */
  startLoading(id: string, message?: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.loadingManager.startLoading(id, message);
      this.debounceTimer = null;
    }, this.debounceMs);
  }

  /**
   * Complete loading immediately
   */
  completeLoading(id: string, message?: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.loadingManager.completeLoading(id, message);
  }

  /**
   * Set error immediately
   */
  setError(id: string, error: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.loadingManager.setError(id, error);
  }
}
