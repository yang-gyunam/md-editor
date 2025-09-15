// Memory optimization utilities for large document handling
// 메모리 사용량 최적화

export interface MemoryStats {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  memoryUsagePercentage?: number;
}

export interface MemoryOptimizationOptions {
  maxHistorySize?: number;
  maxCacheSize?: number;
  gcThreshold?: number; // Memory usage percentage to trigger cleanup
  cleanupInterval?: number; // Interval in ms to check memory usage
}

export class MemoryOptimizer {
  private options: Required<MemoryOptimizationOptions>;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private memoryCheckCallbacks: Set<(stats: MemoryStats) => void> = new Set();

  constructor(options: MemoryOptimizationOptions = {}) {
    this.options = {
      maxHistorySize: 50,
      maxCacheSize: 100,
      gcThreshold: 80, // 80% memory usage
      cleanupInterval: 30000, // 30 seconds
      ...options,
    };

    this.startMemoryMonitoring();
  }

  private startMemoryMonitoring(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      const stats = this.getMemoryStats();
      this.notifyMemoryCheckCallbacks(stats);

      if (
        stats.memoryUsagePercentage &&
        stats.memoryUsagePercentage > this.options.gcThreshold
      ) {
        this.triggerCleanup();
      }
    }, this.options.cleanupInterval);
  }

  public getMemoryStats(): MemoryStats {
    if ("memory" in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        memoryUsagePercentage: memory.jsHeapSizeLimit
          ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
          : undefined,
      };
    }
    return {};
  }

  public triggerCleanup(): void {
    // Trigger garbage collection if available (Chrome DevTools)
    if ("gc" in window && typeof (window as any).gc === "function") {
      try {
        (window as any).gc();
      } catch (e) {
        // Ignore errors - gc might not be available
      }
    }

    // Notify listeners that cleanup was triggered
    this.notifyMemoryCheckCallbacks(this.getMemoryStats());
  }

  public onMemoryCheck(callback: (stats: MemoryStats) => void): () => void {
    this.memoryCheckCallbacks.add(callback);
    return () => this.memoryCheckCallbacks.delete(callback);
  }

  private notifyMemoryCheckCallbacks(stats: MemoryStats): void {
    this.memoryCheckCallbacks.forEach((callback) => callback(stats));
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.memoryCheckCallbacks.clear();
  }

  public getOptions(): Required<MemoryOptimizationOptions> {
    return { ...this.options };
  }
}

// Utility class for managing large text content efficiently
export class LargeContentManager {
  private chunks: Map<number, string> = new Map();
  private chunkSize: number;
  private totalLength: number = 0;
  private memoryOptimizer: MemoryOptimizer;

  constructor(
    chunkSize: number = 10000,
    memoryOptions?: MemoryOptimizationOptions,
  ) {
    this.chunkSize = chunkSize;
    this.memoryOptimizer = new MemoryOptimizer(memoryOptions);

    // Clean up unused chunks when memory usage is high
    this.memoryOptimizer.onMemoryCheck((stats) => {
      if (stats.memoryUsagePercentage && stats.memoryUsagePercentage > 70) {
        this.cleanupUnusedChunks();
      }
    });
  }

  public setContent(content: string): void {
    this.chunks.clear();
    this.totalLength = content.length;

    // Split content into chunks
    for (let i = 0; i < content.length; i += this.chunkSize) {
      const chunkIndex = Math.floor(i / this.chunkSize);
      const chunk = content.slice(i, i + this.chunkSize);
      this.chunks.set(chunkIndex, chunk);
    }
  }

  public getChunk(index: number): string | undefined {
    return this.chunks.get(index);
  }

  public getContentRange(start: number, end: number): string {
    const startChunk = Math.floor(start / this.chunkSize);
    const endChunk = Math.floor(end / this.chunkSize);

    let result = "";
    for (let i = startChunk; i <= endChunk; i++) {
      const chunk = this.chunks.get(i);
      if (chunk) {
        const chunkStart = i * this.chunkSize;
        const chunkEnd = chunkStart + chunk.length;

        // Calculate the portion of this chunk we need
        const rangeStart = Math.max(0, start - chunkStart);
        const rangeEnd = Math.min(chunk.length, end - chunkStart);

        if (rangeStart < rangeEnd) {
          result += chunk.slice(rangeStart, rangeEnd);
        }
      }
    }

    return result;
  }

  public getTotalLength(): number {
    return this.totalLength;
  }

  public getChunkCount(): number {
    return Math.ceil(this.totalLength / this.chunkSize);
  }

  private cleanupUnusedChunks(): void {
    // Keep only recently accessed chunks (this is a simple implementation)
    // In a real scenario, you'd track access times and remove least recently used chunks
    const maxChunksToKeep = Math.min(50, this.chunks.size);

    if (this.chunks.size > maxChunksToKeep) {
      const chunkIndices = Array.from(this.chunks.keys()).sort((a, b) => b - a);
      const chunksToRemove = chunkIndices.slice(maxChunksToKeep);

      chunksToRemove.forEach((index) => this.chunks.delete(index));
    }
  }

  public getMemoryStats(): MemoryStats {
    return this.memoryOptimizer.getMemoryStats();
  }

  public destroy(): void {
    this.chunks.clear();
    this.memoryOptimizer.destroy();
  }
}

// Utility function to estimate content size in bytes
export function estimateContentSize(content: string): number {
  // Rough estimation: each character is approximately 2 bytes in UTF-16
  return content.length * 2;
}

// Utility function to check if content is considered "large"
export function isLargeContent(
  content: string,
  threshold: number = 100000,
): boolean {
  return content.length > threshold;
}

// Factory function for creating memory optimizers
export function createMemoryOptimizer(
  options?: MemoryOptimizationOptions,
): MemoryOptimizer {
  return new MemoryOptimizer(options);
}

// Factory function for creating large content managers
export function createLargeContentManager(
  chunkSize?: number,
  memoryOptions?: MemoryOptimizationOptions,
): LargeContentManager {
  return new LargeContentManager(chunkSize, memoryOptions);
}
