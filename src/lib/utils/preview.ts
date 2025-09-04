// Preview update management utilities

import { debounce } from "./debounce.js";

export interface PreviewUpdateOptions {
  debounceMs?: number;
  enableMemoization?: boolean;
  maxCacheSize?: number;
}

export interface PreviewCache {
  content: string;
  mode: "html" | "markdown";
  result: string;
  timestamp: number;
}

export class PreviewUpdateManager {
  private cache = new Map<string, PreviewCache>();
  private maxCacheSize: number;
  private enableMemoization: boolean;
  private debouncedUpdate: (
    content: string,
    mode: "html" | "markdown",
    callback: (result: string) => void,
  ) => void;

  constructor(
    private processor: (content: string, mode: "html" | "markdown") => string,
    options: PreviewUpdateOptions = {},
  ) {
    this.maxCacheSize = options.maxCacheSize ?? 50;
    this.enableMemoization = options.enableMemoization ?? true;

    // Create debounced update function
    this.debouncedUpdate = debounce(
      (
        content: string,
        mode: "html" | "markdown",
        callback: (result: string) => void,
      ) => {
        const result = this.processWithCache(content, mode);
        callback(result);
      },
      options.debounceMs ?? 300,
    );
  }

  private getCacheKey(content: string, mode: "html" | "markdown"): string {
    // Create a simple hash of content + mode for cache key
    let hash = 0;
    const str = content + mode;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private processWithCache(content: string, mode: "html" | "markdown"): string {
    if (!this.enableMemoization) {
      return this.processor(content, mode);
    }

    const cacheKey = this.getCacheKey(content, mode);
    const cached = this.cache.get(cacheKey);

    // Check if we have a valid cache entry
    if (cached && cached.content === content && cached.mode === mode) {
      // Update timestamp for LRU
      cached.timestamp = Date.now();
      return cached.result;
    }

    // Process content
    const result = this.processor(content, mode);

    // Store in cache
    this.cache.set(cacheKey, {
      content,
      mode,
      result,
      timestamp: Date.now(),
    });

    // Clean up cache if it's too large
    this.cleanupCache();

    return result;
  }

  private cleanupCache(): void {
    if (this.cache.size <= this.maxCacheSize) {
      return;
    }

    // Convert to array and sort by timestamp (oldest first)
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp,
    );

    // Remove oldest entries until we're under the limit
    const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  public updatePreview(
    content: string,
    mode: "html" | "markdown",
    callback: (result: string) => void,
  ): void {
    this.debouncedUpdate(content, mode, callback);
  }

  public updatePreviewImmediate(
    content: string,
    mode: "html" | "markdown",
  ): string {
    return this.processWithCache(content, mode);
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }
}

// Factory function for creating preview update managers
export function createPreviewUpdateManager(
  processor: (content: string, mode: "html" | "markdown") => string,
  options?: PreviewUpdateOptions,
): PreviewUpdateManager {
  return new PreviewUpdateManager(processor, options);
}
