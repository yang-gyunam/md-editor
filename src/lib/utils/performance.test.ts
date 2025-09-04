// Performance optimization tests
// 성능 최적화 테스트

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createPerformanceMonitor,
  type PerformanceMonitor,
} from "./performanceMonitor.js";
import {
  createInputOptimizer,
  createDOMOptimizer,
  createVirtualCursor,
  type InputOptimizer,
  type DOMOptimizer,
} from "./inputOptimization.js";
import {
  createVirtualScrollManager,
  splitContentIntoLines,
  calculateLineHeight,
} from "./virtualScroll.js";
import {
  createLargeContentManager,
  createMemoryOptimizer,
  isLargeContent,
} from "./memoryOptimization.js";
import {
  debounce,
  throttle,
  adaptiveDebounce,
  frameThrottle,
} from "./debounce.js";

describe("Performance Monitor", () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = createPerformanceMonitor(10, {
      maxRenderTime: 500,
      maxInputLatency: 16,
      memoryWarningThreshold: 80,
    });
  });

  it("should measure render time correctly", () => {
    const endTiming = monitor.startTiming("test-operation");

    // Simulate some work
    const start = performance.now();
    while (performance.now() - start < 10) {
      // Busy wait for 10ms
    }

    const metric = endTiming();

    expect(metric.operation).toBe("test-operation");
    expect(metric.renderTime).toBeGreaterThan(5);
    expect(metric.renderTime).toBeLessThan(50);
  });

  it("should trigger warnings for slow operations", () => {
    const warningCallback = vi.fn();
    monitor.onPerformanceWarning(warningCallback);

    const endTiming = monitor.startTiming("slow-operation");

    // Simulate slow operation
    const start = performance.now();
    while (performance.now() - start < 600) {
      // Busy wait for 600ms (exceeds 500ms threshold)
    }

    const metric = endTiming();

    expect(warningCallback).toHaveBeenCalledWith(metric, "maxRenderTime");
  });

  it("should calculate average render times", () => {
    // Add multiple metrics
    for (let i = 0; i < 5; i++) {
      const endTiming = monitor.startTiming("test");
      setTimeout(() => {}, 10); // Small delay
      endTiming();
    }

    const average = monitor.getAverageRenderTime("test");
    expect(average).toBeGreaterThan(0);
  });
});

describe("Input Optimizer", () => {
  let optimizer: InputOptimizer;

  beforeEach(() => {
    // Mock requestAnimationFrame for Node.js environment
    global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
    global.cancelAnimationFrame = vi.fn();

    optimizer = createInputOptimizer({
      enableBatching: true,
      batchSize: 3,
      maxBatchDelay: 50,
    });
  });

  afterEach(() => {
    optimizer.destroy();
    vi.restoreAllMocks();
  });

  it("should batch input operations", (done) => {
    const batchCallback = vi.fn();
    optimizer.onBatch(batchCallback);

    // Add operations to batch
    optimizer.processInput({ type: "insert", position: 0, content: "a" });
    optimizer.processInput({ type: "insert", position: 1, content: "b" });
    optimizer.processInput({ type: "insert", position: 2, content: "c" });

    // Should trigger batch processing
    setTimeout(() => {
      expect(batchCallback).toHaveBeenCalled();
      const batch = batchCallback.mock.calls[0][0];
      expect(batch.operations).toHaveLength(3);
      done();
    }, 100);
  });

  it("should adapt to input frequency", () => {
    // Simulate fast typing
    for (let i = 0; i < 10; i++) {
      optimizer.processInput({ type: "insert", position: i, content: "x" });
    }

    const frequency = optimizer.getInputFrequency();
    expect(frequency).toBeGreaterThan(0);
  });
});

describe("Virtual Scrolling", () => {
  it("should calculate visible range correctly", () => {
    const manager = createVirtualScrollManager({
      itemHeight: 20,
      containerHeight: 400,
      overscan: 2,
    });

    manager.updateTotalItems(1000);
    manager.updateScrollTop(200);

    const state = manager.getState();
    expect(state.startIndex).toBeGreaterThanOrEqual(0);
    expect(state.endIndex).toBeGreaterThan(state.startIndex);
    expect(state.offsetY).toBe(state.startIndex * 20);
  });

  it("should determine when to use virtual scrolling", () => {
    const manager = createVirtualScrollManager({
      itemHeight: 20,
      containerHeight: 400,
      threshold: 100,
    });

    manager.updateTotalItems(50);
    expect(manager.shouldUseVirtualScrolling()).toBe(false);

    manager.updateTotalItems(200);
    expect(manager.shouldUseVirtualScrolling()).toBe(true);
  });

  it("should split content into lines correctly", () => {
    const content = "Line 1\nLine 2\nLine 3";
    const lines = splitContentIntoLines(content);

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("Line 1");
    expect(lines[1]).toBe("Line 2");
    expect(lines[2]).toBe("Line 3");
  });

  it("should calculate line height based on font size", () => {
    const lineHeight = calculateLineHeight(14);
    expect(lineHeight).toBe(21); // 14 * 1.5 = 21
  });
});

describe("Memory Optimization", () => {
  it("should detect large content correctly", () => {
    const smallContent = "Small content";
    const largeContent = "x".repeat(100001);

    expect(isLargeContent(smallContent, 100000)).toBe(false);
    expect(isLargeContent(largeContent, 100000)).toBe(true);
  });

  it("should manage large content in chunks", () => {
    const manager = createLargeContentManager(100);
    const content = "x".repeat(500);

    manager.setContent(content);

    expect(manager.getTotalLength()).toBe(500);
    expect(manager.getChunkCount()).toBe(5);

    const chunk = manager.getChunk(0);
    expect(chunk).toHaveLength(100);
  });

  it("should retrieve content ranges correctly", () => {
    const manager = createLargeContentManager(10);
    const content = "0123456789abcdefghij";

    manager.setContent(content);

    const range = manager.getContentRange(5, 15);
    expect(range).toBe("56789abcde");
  });
});

describe("Debounce Utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should debounce function calls", () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should throttle function calls", () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should adapt debounce delay based on frequency", () => {
    const fn = vi.fn();
    const adaptiveFn = adaptiveDebounce(fn, 10, 100);

    // Fast calls should use shorter delay
    for (let i = 0; i < 10; i++) {
      adaptiveFn();
    }

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalled();
  });
});

describe("DOM Optimizer", () => {
  let optimizer: DOMOptimizer;

  beforeEach(() => {
    // Mock requestAnimationFrame for Node.js environment
    global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
    global.cancelAnimationFrame = vi.fn();

    optimizer = createDOMOptimizer();
  });

  afterEach(() => {
    optimizer.destroy();
    vi.restoreAllMocks();
  });

  it("should queue and batch DOM mutations", (done) => {
    const mutations = [vi.fn(), vi.fn(), vi.fn()];

    mutations.forEach((mutation) => {
      optimizer.queueMutation(mutation);
    });

    // Mutations should be batched and executed in next frame
    setTimeout(() => {
      mutations.forEach((mutation) => {
        expect(mutation).toHaveBeenCalled();
      });
      done();
    }, 50);
  });
});

describe("Virtual Cursor", () => {
  let textarea: HTMLTextAreaElement;
  let cursor: ReturnType<typeof createVirtualCursor>;

  beforeEach(() => {
    // Mock DOM environment
    global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));

    // Create mock textarea
    textarea = {
      value: "Hello World",
      selectionStart: 0,
      selectionEnd: 0,
    } as HTMLTextAreaElement;

    cursor = createVirtualCursor(textarea);
  });

  afterEach(() => {
    cursor?.destroy();
    vi.restoreAllMocks();
  });

  it("should track cursor position", () => {
    cursor.setPosition(5);
    expect(cursor.getPosition()).toBe(5);
  });

  it("should move cursor by delta", () => {
    cursor.setPosition(5);
    cursor.moveBy(3);
    expect(cursor.getPosition()).toBe(8);
  });

  it("should not allow negative positions", () => {
    cursor.setPosition(5);
    cursor.moveBy(-10);
    expect(cursor.getPosition()).toBe(0);
  });
});

describe("Performance Integration", () => {
  it("should meet 500ms render time requirement", () => {
    const monitor = createPerformanceMonitor();

    const endTiming = monitor.startTiming("render-test");

    // Simulate typical rendering work
    const content = "x".repeat(10000);
    const lines = splitContentIntoLines(content);
    const processed = lines.map((line) => line.toUpperCase()).join("\n");

    const metric = endTiming();

    // Should complete well under 500ms for typical content
    expect(metric.renderTime).toBeLessThan(500);
  });

  it("should maintain 60fps input latency", () => {
    const monitor = createPerformanceMonitor();

    const metric = monitor.measureInputLatency("typing-test", () => {
      // Simulate typical input processing
      const content = "Hello World";
      const processed = content.split("").reverse().join("");
    });

    // Should complete under 16ms for 60fps
    expect(metric.inputLatency).toBeLessThan(16);
  });
});
