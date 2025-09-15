// Input responsiveness optimization utilities
// 연속 타이핑 시 지연 없는 반응성 보장과 DOM 조작 최적화

import {
  debounce,
  throttle,
  frameThrottle,
  adaptiveDebounce,
} from "./debounce.js";

export interface InputOptimizationOptions {
  enableBatching?: boolean;
  batchSize?: number;
  maxBatchDelay?: number;
  enableVirtualCursor?: boolean;
  enableSmartDebouncing?: boolean;
  inputLatencyTarget?: number; // Target latency in ms
}

export interface InputBatch {
  operations: InputOperation[];
  timestamp: number;
  batchId: string;
}

export interface InputOperation {
  type: "insert" | "delete" | "replace";
  position: number;
  content: string;
  length?: number;
  timestamp: number;
}

export class InputOptimizer {
  private options: Required<InputOptimizationOptions>;
  private pendingOperations: InputOperation[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastInputTime = 0;
  private inputFrequency = 0;
  private frameId: number | null = null;
  private listeners: Set<(batch: InputBatch) => void> = new Set();

  constructor(options: InputOptimizationOptions = {}) {
    this.options = {
      enableBatching: true,
      batchSize: 10,
      maxBatchDelay: 16, // 60fps target
      enableVirtualCursor: true,
      enableSmartDebouncing: true,
      inputLatencyTarget: 16,
      ...options,
    };
  }

  public processInput(operation: Omit<InputOperation, "timestamp">): void {
    const now = performance.now();
    const fullOperation: InputOperation = {
      ...operation,
      timestamp: now,
    };

    // Update input frequency tracking
    this.updateInputFrequency(now);

    if (this.options.enableBatching) {
      this.addToBatch(fullOperation);
    } else {
      this.processImmediately(fullOperation);
    }
  }

  private updateInputFrequency(now: number): void {
    const timeSinceLastInput = now - this.lastInputTime;

    if (timeSinceLastInput < 100) {
      // Fast typing
      this.inputFrequency = Math.min(this.inputFrequency + 0.1, 1);
    } else {
      this.inputFrequency = Math.max(this.inputFrequency - 0.05, 0);
    }

    this.lastInputTime = now;
  }

  private addToBatch(operation: InputOperation): void {
    this.pendingOperations.push(operation);

    // Process batch if it's full or if we're typing slowly
    if (
      this.pendingOperations.length >= this.options.batchSize ||
      this.inputFrequency < 0.3
    ) {
      this.processBatch();
      return;
    }

    // Set up batch timeout if not already set
    if (!this.batchTimeout) {
      const delay = this.calculateBatchDelay();
      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, delay);
    }
  }

  private calculateBatchDelay(): number {
    // Adaptive delay based on input frequency
    const baseDelay = this.options.maxBatchDelay;
    const frequencyMultiplier = 1 - this.inputFrequency * 0.5; // Reduce delay for fast typing
    return Math.max(baseDelay * frequencyMultiplier, 8); // Minimum 8ms delay
  }

  private processBatch(): void {
    if (this.pendingOperations.length === 0) return;

    const batch: InputBatch = {
      operations: [...this.pendingOperations],
      timestamp: performance.now(),
      batchId: this.generateBatchId(),
    };

    this.pendingOperations = [];

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // Use requestAnimationFrame for smooth processing
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }

    this.frameId = requestAnimationFrame(() => {
      this.notifyListeners(batch);
      this.frameId = null;
    });
  }

  private processImmediately(operation: InputOperation): void {
    const batch: InputBatch = {
      operations: [operation],
      timestamp: operation.timestamp,
      batchId: this.generateBatchId(),
    };

    this.notifyListeners(batch);
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyListeners(batch: InputBatch): void {
    this.listeners.forEach((listener) => {
      try {
        listener(batch);
      } catch (error) {
        console.error("Error in input batch listener:", error);
      }
    });
  }

  public onBatch(listener: (batch: InputBatch) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public flush(): void {
    if (this.pendingOperations.length > 0) {
      this.processBatch();
    }
  }

  public getInputFrequency(): number {
    return this.inputFrequency;
  }

  public updateOptions(newOptions: Partial<InputOptimizationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  public destroy(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
    this.listeners.clear();
    this.pendingOperations = [];
  }
}

// DOM optimization utilities
export class DOMOptimizer {
  private mutationQueue: (() => void)[] = [];
  private isProcessing = false;
  private frameId: number | null = null;

  public queueMutation(mutation: () => void): void {
    this.mutationQueue.push(mutation);
    this.scheduleBatch();
  }

  private scheduleBatch(): void {
    if (this.isProcessing || this.frameId) return;

    this.frameId = requestAnimationFrame(() => {
      this.processMutations();
      this.frameId = null;
    });
  }

  private processMutations(): void {
    if (this.mutationQueue.length === 0) return;

    this.isProcessing = true;

    // Process all queued mutations in a single frame
    const mutations = [...this.mutationQueue];
    this.mutationQueue = [];

    try {
      mutations.forEach((mutation) => mutation());
    } catch (error) {
      console.error("Error processing DOM mutations:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  public flush(): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.processMutations();
  }

  public destroy(): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
    this.mutationQueue = [];
  }
}

// Smart cursor management for responsive input
export class VirtualCursor {
  private element: HTMLTextAreaElement | HTMLInputElement;
  private virtualPosition = 0;
  private actualPosition = 0;
  private updateScheduled = false;

  constructor(element: HTMLTextAreaElement | HTMLInputElement) {
    this.element = element;
    this.actualPosition = element.selectionStart || 0;
    this.virtualPosition = this.actualPosition;
  }

  public setPosition(position: number): void {
    this.virtualPosition = position;
    this.scheduleUpdate();
  }

  public getPosition(): number {
    return this.virtualPosition;
  }

  public moveBy(delta: number): void {
    this.virtualPosition = Math.max(0, this.virtualPosition + delta);
    this.scheduleUpdate();
  }

  private scheduleUpdate(): void {
    if (this.updateScheduled) return;

    this.updateScheduled = true;
    requestAnimationFrame(() => {
      this.updateActualPosition();
      this.updateScheduled = false;
    });
  }

  private updateActualPosition(): void {
    if (this.actualPosition !== this.virtualPosition) {
      this.element.selectionStart = this.virtualPosition;
      this.element.selectionEnd = this.virtualPosition;
      this.actualPosition = this.virtualPosition;
    }
  }

  public sync(): void {
    this.actualPosition = this.element.selectionStart || 0;
    this.virtualPosition = this.actualPosition;
  }

  public destroy(): void {
    // Clean up any pending updates
    this.updateScheduled = false;
  }
}

// Factory functions
export function createInputOptimizer(
  options?: InputOptimizationOptions,
): InputOptimizer {
  return new InputOptimizer(options);
}

export function createDOMOptimizer(): DOMOptimizer {
  return new DOMOptimizer();
}

export function createVirtualCursor(
  element: HTMLTextAreaElement | HTMLInputElement,
): VirtualCursor {
  return new VirtualCursor(element);
}

// Utility function to create optimized input handlers
export function createOptimizedInputHandler<T extends HTMLElement>(
  element: T,
  handler: (event: Event) => void,
  options: {
    debounceMs?: number;
    throttleMs?: number;
    useAdaptive?: boolean;
    useFrameThrottle?: boolean;
  } = {},
): () => void {
  const {
    debounceMs,
    throttleMs,
    useAdaptive = false,
    useFrameThrottle = false,
  } = options;

  let optimizedHandler = handler;

  if (useFrameThrottle) {
    optimizedHandler = frameThrottle(handler);
  } else if (throttleMs) {
    optimizedHandler = throttle(handler, throttleMs);
  } else if (useAdaptive) {
    optimizedHandler = adaptiveDebounce(handler, 16, 100);
  } else if (debounceMs) {
    optimizedHandler = debounce(handler, debounceMs);
  }

  element.addEventListener("input", optimizedHandler);

  return () => {
    element.removeEventListener("input", optimizedHandler);
  };
}
