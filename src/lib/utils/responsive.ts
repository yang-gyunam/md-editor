// Responsive design and mobile support utilities

export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
  breakpoint: "mobile" | "tablet" | "desktop" | "wide";
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: "portrait" | "landscape";
  pixelRatio: number;
  touchSupported: boolean;
}

export interface ResponsiveConfig {
  enableMobileOptimizations: boolean;
  enableTouchOptimizations: boolean;
  mobileBreakpoint: number;
  tabletBreakpoint: number;
  adaptiveLayout: boolean;
  touchTargetSize: number;
}

/**
 * Manages responsive behavior and mobile optimizations
 */
export class ResponsiveManager {
  private config: ResponsiveConfig;
  private breakpoints: BreakpointConfig;
  private viewportInfo: ViewportInfo;
  private resizeObserver: ResizeObserver | null = null;
  private callbacks: Map<string, (viewport: ViewportInfo) => void> = new Map();

  constructor(
    config: Partial<ResponsiveConfig> = {},
    breakpoints: Partial<BreakpointConfig> = {},
  ) {
    this.config = {
      enableMobileOptimizations: true,
      enableTouchOptimizations: true,
      mobileBreakpoint: 768,
      tabletBreakpoint: 1024,
      adaptiveLayout: true,
      touchTargetSize: 44,
      ...config,
    };

    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1440,
      wide: 1920,
      ...breakpoints,
    };

    this.viewportInfo = this.getCurrentViewportInfo();
    this.initializeResponsiveFeatures();
  }

  /**
   * Initialize responsive features
   */
  private initializeResponsiveFeatures(): void {
    // Listen for viewport changes
    window.addEventListener("resize", this.handleResize.bind(this));
    window.addEventListener(
      "orientationchange",
      this.handleOrientationChange.bind(this),
    );

    // Initialize ResizeObserver for container-based responsive behavior
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(
        this.handleContainerResize.bind(this),
      );
    }
  }

  /**
   * Get current viewport information (private method)
   */
  private getCurrentViewportInfo(): ViewportInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    const touchSupported =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    let breakpoint: ViewportInfo["breakpoint"] = "desktop";
    if (width < this.breakpoints.mobile) {
      breakpoint = "mobile";
    } else if (width < this.breakpoints.tablet) {
      breakpoint = "tablet";
    } else if (width >= this.breakpoints.wide) {
      breakpoint = "wide";
    }

    return {
      width,
      height,
      breakpoint,
      isMobile: breakpoint === "mobile",
      isTablet: breakpoint === "tablet",
      isDesktop: breakpoint === "desktop" || breakpoint === "wide",
      orientation: width > height ? "landscape" : "portrait",
      pixelRatio,
      touchSupported,
    };
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    const newViewportInfo = this.getCurrentViewportInfo();
    const breakpointChanged =
      newViewportInfo.breakpoint !== this.viewportInfo.breakpoint;
    const orientationChanged =
      newViewportInfo.orientation !== this.viewportInfo.orientation;

    this.viewportInfo = newViewportInfo;

    if (breakpointChanged || orientationChanged) {
      this.notifyCallbacks();
    }
  }

  /**
   * Handle orientation change
   */
  private handleOrientationChange(): void {
    // Delay to allow viewport to update
    setTimeout(() => {
      this.handleResize();
    }, 100);
  }

  /**
   * Handle container resize
   */
  private handleContainerResize(entries: ResizeObserverEntry[]): void {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      // Emit container-specific resize events
      this.notifyCallbacks({ width, height });
    }
  }

  /**
   * Get current viewport information
   */
  getViewportInfo(): ViewportInfo {
    return { ...this.viewportInfo };
  }

  /**
   * Check if current viewport matches breakpoint
   */
  isBreakpoint(breakpoint: keyof BreakpointConfig): boolean {
    return this.viewportInfo.breakpoint === breakpoint;
  }

  /**
   * Check if viewport is at or below a breakpoint
   */
  isAtOrBelow(breakpoint: keyof BreakpointConfig): boolean {
    const breakpointOrder = ["mobile", "tablet", "desktop", "wide"];
    const currentIndex = breakpointOrder.indexOf(this.viewportInfo.breakpoint);
    const targetIndex = breakpointOrder.indexOf(breakpoint);
    return currentIndex <= targetIndex;
  }

  /**
   * Check if viewport is at or above a breakpoint
   */
  isAtOrAbove(breakpoint: keyof BreakpointConfig): boolean {
    const breakpointOrder = ["mobile", "tablet", "desktop", "wide"];
    const currentIndex = breakpointOrder.indexOf(this.viewportInfo.breakpoint);
    const targetIndex = breakpointOrder.indexOf(breakpoint);
    return currentIndex >= targetIndex;
  }

  /**
   * Get mobile-optimized configuration
   */
  getMobileConfig(): Record<string, any> {
    if (!this.config.enableMobileOptimizations || !this.viewportInfo.isMobile) {
      return {};
    }

    return {
      showPreview: false, // Hide preview on mobile to save space
      showToolbar: true,
      compactMode: true,
      touchOptimized: true,
      virtualScrolling: true,
      debounceMs: 500, // Longer debounce on mobile
      fontSize: "16px", // Prevent zoom on iOS
      lineHeight: 1.4,
      padding: "12px",
      minTouchTarget: this.config.touchTargetSize,
    };
  }

  /**
   * Get tablet-optimized configuration
   */
  getTabletConfig(): Record<string, any> {
    if (!this.viewportInfo.isTablet) {
      return {};
    }

    return {
      showPreview: true,
      showToolbar: true,
      compactMode: false,
      touchOptimized: this.viewportInfo.touchSupported,
      splitView: this.viewportInfo.orientation === "landscape",
      debounceMs: 300,
      fontSize: "14px",
      lineHeight: 1.5,
      padding: "16px",
    };
  }

  /**
   * Get touch-optimized configuration
   */
  getTouchConfig(): Record<string, any> {
    if (
      !this.config.enableTouchOptimizations ||
      !this.viewportInfo.touchSupported
    ) {
      return {};
    }

    return {
      minTouchTarget: this.config.touchTargetSize,
      touchScrolling: true,
      preventZoom: true,
      hapticFeedback: true,
      gestureSupport: true,
      longPressDelay: 500,
      tapDelay: 0,
    };
  }

  /**
   * Get adaptive layout configuration
   */
  getAdaptiveLayout(): {
    layout: "single" | "split" | "stacked";
    previewPosition: "right" | "bottom" | "hidden";
    toolbarPosition: "top" | "bottom" | "floating";
  } {
    if (!this.config.adaptiveLayout) {
      return {
        layout: "split",
        previewPosition: "right",
        toolbarPosition: "top",
      };
    }

    if (this.viewportInfo.isMobile) {
      return {
        layout: "single",
        previewPosition: "hidden",
        toolbarPosition: "bottom",
      };
    }

    if (this.viewportInfo.isTablet) {
      return {
        layout:
          this.viewportInfo.orientation === "landscape" ? "split" : "stacked",
        previewPosition:
          this.viewportInfo.orientation === "landscape" ? "right" : "bottom",
        toolbarPosition: "top",
      };
    }

    return {
      layout: "split",
      previewPosition: "right",
      toolbarPosition: "top",
    };
  }

  /**
   * Observe container for responsive behavior
   */
  observeContainer(container: HTMLElement): void {
    if (this.resizeObserver) {
      this.resizeObserver.observe(container);
    }
  }

  /**
   * Stop observing container
   */
  unobserveContainer(container: HTMLElement): void {
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(container);
    }
  }

  /**
   * Register callback for viewport changes
   */
  onViewportChange(
    id: string,
    callback: (viewport: ViewportInfo) => void,
  ): void {
    this.callbacks.set(id, callback);
  }

  /**
   * Unregister viewport change callback
   */
  offViewportChange(id: string): void {
    this.callbacks.delete(id);
  }

  /**
   * Notify callbacks of viewport changes
   */
  private notifyCallbacks(containerInfo?: {
    width: number;
    height: number;
  }): void {
    for (const callback of this.callbacks.values()) {
      try {
        callback(this.viewportInfo);
      } catch (e) {
        console.error("Error in viewport change callback:", e);
      }
    }
  }

  /**
   * Apply mobile optimizations to an element
   */
  applyMobileOptimizations(element: HTMLElement): void {
    if (!this.config.enableMobileOptimizations || !this.viewportInfo.isMobile) {
      return;
    }

    // Prevent zoom on input focus (iOS)
    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      element.style.fontSize = "16px";
    }

    // Ensure touch targets are large enough
    const computedStyle = window.getComputedStyle(element);
    const minSize = this.config.touchTargetSize;

    if (parseInt(computedStyle.height) < minSize) {
      element.style.minHeight = `${minSize}px`;
    }
    if (parseInt(computedStyle.width) < minSize) {
      element.style.minWidth = `${minSize}px`;
    }

    // Add touch-friendly padding
    if (!computedStyle.padding || computedStyle.padding === "0px") {
      element.style.padding = "12px";
    }
  }

  /**
   * Apply touch optimizations to an element
   */
  applyTouchOptimizations(element: HTMLElement): void {
    if (
      !this.config.enableTouchOptimizations ||
      !this.viewportInfo.touchSupported
    ) {
      return;
    }

    // Enable smooth scrolling
    element.style.webkitOverflowScrolling = "touch";
    element.style.scrollBehavior = "smooth";

    // Prevent text selection on touch
    if (element.tagName === "BUTTON") {
      element.style.webkitUserSelect = "none";
      element.style.userSelect = "none";
    }

    // Add touch feedback
    element.style.webkitTapHighlightColor = "rgba(0, 0, 0, 0.1)";
  }

  /**
   * Get CSS media queries for breakpoints
   */
  getMediaQueries(): Record<string, string> {
    return {
      mobile: `(max-width: ${this.breakpoints.mobile - 1}px)`,
      tablet: `(min-width: ${this.breakpoints.mobile}px) and (max-width: ${this.breakpoints.tablet - 1}px)`,
      desktop: `(min-width: ${this.breakpoints.tablet}px) and (max-width: ${this.breakpoints.wide - 1}px)`,
      wide: `(min-width: ${this.breakpoints.wide}px)`,
      mobileAndTablet: `(max-width: ${this.breakpoints.tablet - 1}px)`,
      tabletAndDesktop: `(min-width: ${this.breakpoints.mobile}px)`,
      touch: "(hover: none) and (pointer: coarse)",
      noTouch: "(hover: hover) and (pointer: fine)",
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    window.removeEventListener("resize", this.handleResize.bind(this));
    window.removeEventListener(
      "orientationchange",
      this.handleOrientationChange.bind(this),
    );

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.callbacks.clear();
  }
}

/**
 * Create responsive CSS custom properties
 */
export function createResponsiveProperties(
  responsiveManager: ResponsiveManager,
): Record<string, string> {
  const viewport = responsiveManager.getViewportInfo();
  const mobileConfig = responsiveManager.getMobileConfig();
  const tabletConfig = responsiveManager.getTabletConfig();
  const touchConfig = responsiveManager.getTouchConfig();

  return {
    "--viewport-width": `${viewport.width}px`,
    "--viewport-height": `${viewport.height}px`,
    "--breakpoint": viewport.breakpoint,
    "--is-mobile": viewport.isMobile ? "1" : "0",
    "--is-tablet": viewport.isTablet ? "1" : "0",
    "--is-desktop": viewport.isDesktop ? "1" : "0",
    "--is-touch": viewport.touchSupported ? "1" : "0",
    "--orientation": viewport.orientation,
    "--pixel-ratio": viewport.pixelRatio.toString(),
    "--touch-target-size": `${touchConfig.minTouchTarget || 44}px`,
    "--mobile-font-size": mobileConfig.fontSize || "16px",
    "--mobile-padding": mobileConfig.padding || "12px",
  };
}
