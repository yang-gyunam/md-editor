// Accessibility utilities for keyboard navigation and ARIA support

export interface AccessibilityConfig {
  enableKeyboardNavigation: boolean;
  enableScreenReaderSupport: boolean;
  enableFocusManagement: boolean;
  announceChanges: boolean;
  customKeyBindings?: Record<string, string>;
}

export interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  role?: string;
  ariaLabel?: string;
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

/**
 * Manages keyboard navigation and focus within the editor
 */
export class AccessibilityManager {
  private focusableElements: FocusableElement[] = [];
  private currentFocusIndex = -1;
  private keyboardShortcuts: Map<string, KeyboardShortcut> = new Map();
  private announcer: HTMLElement | null = null;
  private config: AccessibilityConfig;

  constructor(
    config: AccessibilityConfig = {
      enableKeyboardNavigation: true,
      enableScreenReaderSupport: true,
      enableFocusManagement: true,
      announceChanges: true,
    },
  ) {
    this.config = config;
    this.initializeAnnouncer();
  }

  /**
   * Initialize screen reader announcer element
   */
  private initializeAnnouncer(): void {
    if (!this.config.enableScreenReaderSupport) return;

    this.announcer = document.createElement("div");
    this.announcer.setAttribute("aria-live", "polite");
    this.announcer.setAttribute("aria-atomic", "true");
    this.announcer.className = "sr-only";
    this.announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(this.announcer);
  }

  /**
   * Register a focusable element
   */
  registerFocusableElement(
    element: HTMLElement,
    options: Partial<FocusableElement> = {},
  ): void {
    if (!this.config.enableFocusManagement) return;

    const focusableElement: FocusableElement = {
      element,
      tabIndex: options.tabIndex ?? 0,
      role: options.role,
      ariaLabel: options.ariaLabel,
    };

    // Set ARIA attributes
    if (focusableElement.role) {
      element.setAttribute("role", focusableElement.role);
    }
    if (focusableElement.ariaLabel) {
      element.setAttribute("aria-label", focusableElement.ariaLabel);
    }

    // Ensure element is focusable
    if (element.tabIndex < 0) {
      element.tabIndex = focusableElement.tabIndex;
    }

    this.focusableElements.push(focusableElement);
  }

  /**
   * Remove a focusable element
   */
  unregisterFocusableElement(element: HTMLElement): void {
    const index = this.focusableElements.findIndex(
      (fe) => fe.element === element,
    );
    if (index > -1) {
      this.focusableElements.splice(index, 1);
      if (this.currentFocusIndex >= index && this.currentFocusIndex > 0) {
        this.currentFocusIndex--;
      }
    }
  }

  /**
   * Register a keyboard shortcut
   */
  registerKeyboardShortcut(shortcut: KeyboardShortcut): void {
    if (!this.config.enableKeyboardNavigation) return;

    const key = this.getShortcutKey(shortcut);
    this.keyboardShortcuts.set(key, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregisterKeyboardShortcut(shortcut: Partial<KeyboardShortcut>): void {
    const key = this.getShortcutKey(shortcut as KeyboardShortcut);
    this.keyboardShortcuts.delete(key);
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.config.enableKeyboardNavigation) return false;

    // Check for registered shortcuts
    const shortcutKey = this.getShortcutKeyFromEvent(event);
    const shortcut = this.keyboardShortcuts.get(shortcutKey);

    if (shortcut) {
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      shortcut.action();
      return true;
    }

    // Handle tab navigation
    if (event.key === "Tab" && this.focusableElements.length > 0) {
      return this.handleTabNavigation(event);
    }

    return false;
  }

  /**
   * Handle tab navigation between focusable elements
   */
  private handleTabNavigation(event: KeyboardEvent): boolean {
    const direction = event.shiftKey ? -1 : 1;
    const nextIndex = this.getNextFocusIndex(direction);

    if (nextIndex !== -1) {
      event.preventDefault();
      this.focusElement(nextIndex);
      return true;
    }

    return false;
  }

  /**
   * Get next focus index
   */
  private getNextFocusIndex(direction: number): number {
    if (this.focusableElements.length === 0) return -1;

    let nextIndex = this.currentFocusIndex + direction;

    if (nextIndex >= this.focusableElements.length) {
      nextIndex = 0;
    } else if (nextIndex < 0) {
      nextIndex = this.focusableElements.length - 1;
    }

    return nextIndex;
  }

  /**
   * Focus an element by index
   */
  focusElement(index: number): void {
    if (index < 0 || index >= this.focusableElements.length) return;

    const focusableElement = this.focusableElements[index];
    focusableElement.element.focus();
    this.currentFocusIndex = index;

    // Announce focus change to screen readers
    if (focusableElement.ariaLabel) {
      this.announce(`Focused: ${focusableElement.ariaLabel}`);
    }
  }

  /**
   * Focus the first focusable element
   */
  focusFirst(): void {
    if (this.focusableElements.length > 0) {
      this.focusElement(0);
    }
  }

  /**
   * Focus the last focusable element
   */
  focusLast(): void {
    if (this.focusableElements.length > 0) {
      this.focusElement(this.focusableElements.length - 1);
    }
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: "polite" | "assertive" = "polite"): void {
    if (!this.config.announceChanges || !this.announcer) return;

    this.announcer.setAttribute("aria-live", priority);
    this.announcer.textContent = message;

    // Clear the message after a short delay to allow for re-announcements
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = "";
      }
    }, 1000);
  }

  /**
   * Get shortcut key string from shortcut object
   */
  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const modifiers = [];
    if (shortcut.ctrlKey) modifiers.push("ctrl");
    if (shortcut.metaKey) modifiers.push("meta");
    if (shortcut.shiftKey) modifiers.push("shift");
    if (shortcut.altKey) modifiers.push("alt");

    return [...modifiers, shortcut.key.toLowerCase()].join("+");
  }

  /**
   * Get shortcut key string from keyboard event
   */
  private getShortcutKeyFromEvent(event: KeyboardEvent): string {
    const modifiers = [];
    if (event.ctrlKey) modifiers.push("ctrl");
    if (event.metaKey) modifiers.push("meta");
    if (event.shiftKey) modifiers.push("shift");
    if (event.altKey) modifiers.push("alt");

    return [...modifiers, event.key.toLowerCase()].join("+");
  }

  /**
   * Get all registered keyboard shortcuts for help/documentation
   */
  getKeyboardShortcuts(): KeyboardShortcut[] {
    return Array.from(this.keyboardShortcuts.values());
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.announcer && this.announcer.parentNode) {
      this.announcer.parentNode.removeChild(this.announcer);
    }
    this.focusableElements = [];
    this.keyboardShortcuts.clear();
  }
}

/**
 * Create ARIA attributes for an element
 */
export function createAriaAttributes(options: {
  label?: string;
  describedBy?: string;
  expanded?: boolean;
  hasPopup?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";
  controls?: string;
  live?: "off" | "polite" | "assertive";
  atomic?: boolean;
  relevant?: string;
  role?: string;
}): Record<string, string> {
  const attributes: Record<string, string> = {};

  if (options.label) attributes["aria-label"] = options.label;
  if (options.describedBy) attributes["aria-describedby"] = options.describedBy;
  if (options.expanded !== undefined)
    attributes["aria-expanded"] = String(options.expanded);
  if (options.hasPopup) attributes["aria-haspopup"] = String(options.hasPopup);
  if (options.controls) attributes["aria-controls"] = options.controls;
  if (options.live) attributes["aria-live"] = options.live;
  if (options.atomic !== undefined)
    attributes["aria-atomic"] = String(options.atomic);
  if (options.relevant) attributes["aria-relevant"] = options.relevant;
  if (options.role) attributes["role"] = options.role;

  return attributes;
}

/**
 * Check if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;
  if (element.hasAttribute("disabled")) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;

  return true;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    "button:not([disabled])",
    "input:not([disabled])",
    "textarea:not([disabled])",
    "select:not([disabled])",
    "a[href]",
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(", ");

  const elements = Array.from(
    container.querySelectorAll(focusableSelectors),
  ) as HTMLElement[];
  return elements.filter(isFocusable);
}

/**
 * Trap focus within a container
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return () => {};

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== "Tab") return;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  container.addEventListener("keydown", handleKeyDown);
  firstElement.focus();

  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
}
