// Virtual scrolling utility for large document handling
// 대용량 문서 처리와 성능 최적화

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  threshold?: number;
}

export interface VirtualScrollState {
  scrollTop: number;
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  totalItems: number;
  offsetY: number;
}

export class VirtualScrollManager {
  private options: Required<VirtualScrollOptions>;
  private state: VirtualScrollState;
  private listeners: Set<(state: VirtualScrollState) => void> = new Set();

  constructor(options: VirtualScrollOptions) {
    this.options = {
      overscan: 5,
      threshold: 1000, // Enable virtual scrolling for documents with more than 1000 lines
      ...options,
    };

    this.state = {
      scrollTop: 0,
      startIndex: 0,
      endIndex: 0,
      visibleItems: 0,
      totalItems: 0,
      offsetY: 0,
    };

    this.calculateVisibleRange();
  }

  public updateScrollTop(scrollTop: number): void {
    this.state.scrollTop = scrollTop;
    this.calculateVisibleRange();
    this.notifyListeners();
  }

  public updateTotalItems(totalItems: number): void {
    this.state.totalItems = totalItems;
    this.calculateVisibleRange();
    this.notifyListeners();
  }

  public updateContainerHeight(height: number): void {
    this.options.containerHeight = height;
    this.calculateVisibleRange();
    this.notifyListeners();
  }

  private calculateVisibleRange(): void {
    const { itemHeight, containerHeight, overscan } = this.options;
    const { scrollTop, totalItems } = this.state;

    // Calculate how many items can fit in the container
    const visibleItems = Math.ceil(containerHeight / itemHeight);

    // Calculate start and end indices with overscan
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan,
    );
    const endIndex = Math.min(
      totalItems - 1,
      startIndex + visibleItems + overscan * 2,
    );

    // Calculate offset for positioning
    const offsetY = startIndex * itemHeight;

    this.state = {
      ...this.state,
      startIndex,
      endIndex,
      visibleItems,
      offsetY,
    };
  }

  public shouldUseVirtualScrolling(): boolean {
    return this.state.totalItems > this.options.threshold;
  }

  public getState(): VirtualScrollState {
    return { ...this.state };
  }

  public subscribe(listener: (state: VirtualScrollState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  public getVisibleRange(): { start: number; end: number } {
    return {
      start: this.state.startIndex,
      end: this.state.endIndex,
    };
  }

  public getTotalHeight(): number {
    return this.state.totalItems * this.options.itemHeight;
  }

  public getItemPosition(index: number): number {
    return index * this.options.itemHeight;
  }
}

// Utility function to split content into lines for virtual scrolling
export function splitContentIntoLines(content: string): string[] {
  return content.split("\n");
}

// Utility function to calculate optimal line height based on font size
export function calculateLineHeight(fontSize: number): number {
  return Math.ceil(fontSize * 1.5); // 1.5 line height ratio
}

// Factory function for creating virtual scroll managers
export function createVirtualScrollManager(
  options: VirtualScrollOptions,
): VirtualScrollManager {
  return new VirtualScrollManager(options);
}
