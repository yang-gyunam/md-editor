// Test setup for Svelte 5 components
import "@testing-library/jest-dom";

// Export to make this a module
export {};

// Mock ResizeObserver
if (typeof globalThis.ResizeObserver === "undefined") {
  (globalThis as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock IntersectionObserver
if (typeof globalThis.IntersectionObserver === "undefined") {
  (globalThis as any).IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock requestAnimationFrame and cancelAnimationFrame
if (typeof globalThis.requestAnimationFrame === "undefined") {
  (globalThis as any).requestAnimationFrame = (callback: any) => {
    return setTimeout(callback, 16);
  };
}

if (typeof globalThis.cancelAnimationFrame === "undefined") {
  (globalThis as any).cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}

// Mock crypto.randomUUID for tests
if (globalThis.crypto && !globalThis.crypto.randomUUID) {
  (globalThis.crypto as any).randomUUID = () => {
    return "test-uuid-" + Math.random().toString(36).substring(2, 9);
  };
}

// Mock prompt for tests
if (typeof globalThis.prompt === "undefined") {
  (globalThis as any).prompt = (_message?: string, defaultText?: string) =>
    defaultText || null;
}

// Mock performance.now if not available
if (!globalThis.performance || !globalThis.performance.now) {
  (globalThis as any).performance = {
    ...globalThis.performance,
    now: () => Date.now(),
  };
}

// Mock DataTransfer for clipboard tests
if (typeof globalThis.DataTransfer === "undefined") {
  (globalThis as any).DataTransfer = class DataTransfer {
    items: any[] = [];
    types: string[] = [];

    setData(format: string, data: string) {
      this.items.push({ format, data });
      if (!this.types.includes(format)) {
        this.types.push(format);
      }
    }

    getData(format: string) {
      const item = this.items.find((i: any) => i.format === format);
      return item ? item.data : "";
    }
  };
}

// Mock Touch for touch events
if (typeof globalThis.Touch === "undefined") {
  (globalThis as any).Touch = class Touch {
    identifier: number;
    target: EventTarget;
    clientX: number;
    clientY: number;

    constructor(init: any) {
      this.identifier = init.identifier || 0;
      this.target = init.target;
      this.clientX = init.clientX || 0;
      this.clientY = init.clientY || 0;
    }
  };
}
