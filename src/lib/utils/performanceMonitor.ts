// Performance monitoring utilities
// 500ms 이내 렌더링 성능 보장

export interface PerformanceMetrics {
  renderTime: number;
  inputLatency: number;
  memoryUsage?: number;
  timestamp: number;
  operation: string;
}

export interface PerformanceThresholds {
  maxRenderTime: number; // 500ms default
  maxInputLatency: number; // 16ms for 60fps
  memoryWarningThreshold: number; // 80% memory usage
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory: number;
  private thresholds: PerformanceThresholds;
  private warningCallbacks: Set<
    (metric: PerformanceMetrics, threshold: keyof PerformanceThresholds) => void
  > = new Set();

  constructor(
    maxHistory: number = 100,
    thresholds: Partial<PerformanceThresholds> = {},
  ) {
    this.maxMetricsHistory = maxHistory;
    this.thresholds = {
      maxRenderTime: 500, // 500ms as per requirement 5.1
      maxInputLatency: 16, // 60fps target
      memoryWarningThreshold: 80,
      ...thresholds,
    };
  }

  public startTiming(operation: string): () => PerformanceMetrics {
    const startTime = performance.now();
    const startMemory = this.getCurrentMemoryUsage();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      const endMemory = this.getCurrentMemoryUsage();

      const metric: PerformanceMetrics = {
        renderTime,
        inputLatency: 0, // Will be set separately for input operations
        memoryUsage: endMemory,
        timestamp: Date.now(),
        operation,
      };

      this.addMetric(metric);
      this.checkThresholds(metric);

      return metric;
    };
  }

  public measureInputLatency(
    operation: string,
    callback: () => void,
  ): PerformanceMetrics {
    const startTime = performance.now();

    callback();

    const endTime = performance.now();
    const inputLatency = endTime - startTime;

    const metric: PerformanceMetrics = {
      renderTime: 0,
      inputLatency,
      memoryUsage: this.getCurrentMemoryUsage(),
      timestamp: Date.now(),
      operation: `input:${operation}`,
    };

    this.addMetric(metric);
    this.checkThresholds(metric);

    return metric;
  }

  public async measureAsync<T>(
    operation: string,
    asyncCallback: () => Promise<T>,
  ): Promise<{ result: T; metric: PerformanceMetrics }> {
    const startTime = performance.now();
    const startMemory = this.getCurrentMemoryUsage();

    const result = await asyncCallback();

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    const endMemory = this.getCurrentMemoryUsage();

    const metric: PerformanceMetrics = {
      renderTime,
      inputLatency: 0,
      memoryUsage: endMemory,
      timestamp: Date.now(),
      operation: `async:${operation}`,
    };

    this.addMetric(metric);
    this.checkThresholds(metric);

    return { result, metric };
  }

  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  private checkThresholds(metric: PerformanceMetrics): void {
    if (metric.renderTime > this.thresholds.maxRenderTime) {
      this.notifyWarning(metric, "maxRenderTime");
    }

    if (metric.inputLatency > this.thresholds.maxInputLatency) {
      this.notifyWarning(metric, "maxInputLatency");
    }

    if (
      metric.memoryUsage &&
      metric.memoryUsage > this.thresholds.memoryWarningThreshold
    ) {
      this.notifyWarning(metric, "memoryWarningThreshold");
    }
  }

  private notifyWarning(
    metric: PerformanceMetrics,
    threshold: keyof PerformanceThresholds,
  ): void {
    this.warningCallbacks.forEach((callback) => callback(metric, threshold));
  }

  public onPerformanceWarning(
    callback: (
      metric: PerformanceMetrics,
      threshold: keyof PerformanceThresholds,
    ) => void,
  ): () => void {
    this.warningCallbacks.add(callback);
    return () => this.warningCallbacks.delete(callback);
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getAverageRenderTime(operation?: string): number {
    const relevantMetrics = operation
      ? this.metrics.filter((m) => m.operation === operation)
      : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const totalTime = relevantMetrics.reduce((sum, m) => sum + m.renderTime, 0);
    return totalTime / relevantMetrics.length;
  }

  public getAverageInputLatency(operation?: string): number {
    const relevantMetrics = operation
      ? this.metrics.filter(
          (m) =>
            m.operation.startsWith("input:") &&
            (operation ? m.operation.includes(operation) : true),
        )
      : this.metrics.filter((m) => m.operation.startsWith("input:"));

    if (relevantMetrics.length === 0) return 0;

    const totalLatency = relevantMetrics.reduce(
      (sum, m) => sum + m.inputLatency,
      0,
    );
    return totalLatency / relevantMetrics.length;
  }

  public getPerformanceSummary(): {
    averageRenderTime: number;
    averageInputLatency: number;
    slowOperations: PerformanceMetrics[];
    memoryWarnings: PerformanceMetrics[];
  } {
    const slowOperations = this.metrics.filter(
      (m) =>
        m.renderTime > this.thresholds.maxRenderTime ||
        m.inputLatency > this.thresholds.maxInputLatency,
    );

    const memoryWarnings = this.metrics.filter(
      (m) =>
        m.memoryUsage && m.memoryUsage > this.thresholds.memoryWarningThreshold,
    );

    return {
      averageRenderTime: this.getAverageRenderTime(),
      averageInputLatency: this.getAverageInputLatency(),
      slowOperations,
      memoryWarnings,
    };
  }

  private getCurrentMemoryUsage(): number | undefined {
    if ("memory" in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.jsHeapSizeLimit
        ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        : undefined;
    }
    return undefined;
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  public updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  public getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }
}

// Utility function to create a performance monitor with default settings
export function createPerformanceMonitor(
  maxHistory?: number,
  thresholds?: Partial<PerformanceThresholds>,
): PerformanceMonitor {
  return new PerformanceMonitor(maxHistory, thresholds);
}

// Utility function to measure a synchronous operation
export function measurePerformance<T>(
  monitor: PerformanceMonitor,
  operation: string,
  callback: () => T,
): { result: T; metric: PerformanceMetrics } {
  const endTiming = monitor.startTiming(operation);
  const result = callback();
  const metric = endTiming();

  return { result, metric };
}

// Utility function to create a debounced performance-aware function
export function createPerformanceAwareDebounce<
  T extends (...args: any[]) => any,
>(
  func: T,
  wait: number,
  monitor: PerformanceMonitor,
  operationName: string,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      monitor.measureInputLatency(operationName, () => {
        func(...args);
      });
    }, wait);
  };
}
