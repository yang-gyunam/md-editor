// Enhanced keyboard shortcut utilities for HTML/Markdown editor
// 키보드 단축키 시스템

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description?: string;
  category?: string;
}

export interface ShortcutConflict {
  existing: KeyboardShortcut;
  new: KeyboardShortcut;
  key: string;
}

export interface KeyboardShortcutAction {
  shortcut: KeyboardShortcut;
  callback: () => void;
  enabled: boolean;
  priority: number; // Higher priority shortcuts override lower ones
}

/**
 * Enhanced keyboard manager with conflict detection and custom shortcuts
 * 사용자 정의 단축키 시스템
 */
export class KeyboardManager {
  private shortcuts = new Map<string, any>();
  private conflicts: ShortcutConflict[] = [];

  /**
   * Register a keyboard shortcut with conflict detection
   * 사용자 정의 키 조합 등록 시스템
   */
  register(id: string, shortcut: any, options?: { force?: boolean }): boolean {
    // Check for conflicts by looking for existing shortcuts with same key combination
    const existingConflict = this.findConflictingShortcut(shortcut);

    if (existingConflict && !options?.force) {
      return false; // Conflict detected, registration failed
    }

    this.shortcuts.set(id, shortcut);
    return true;
  }

  /**
   * Find conflicting shortcut
   */
  private findConflictingShortcut(shortcut: any): string | null {
    for (const [id, existing] of this.shortcuts) {
      if (this.areShortcutsEqual(existing, shortcut)) {
        return id;
      }
    }
    return null;
  }

  /**
   * Check if two shortcuts are equal (same key combination)
   */
  private areShortcutsEqual(a: any, b: any): boolean {
    return (
      a.key === b.key &&
      !!a.ctrlKey === !!b.ctrlKey &&
      !!a.metaKey === !!b.metaKey &&
      !!a.shiftKey === !!b.shiftKey &&
      !!a.altKey === !!b.altKey
    );
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(id: string): boolean {
    return this.shortcuts.delete(id);
  }

  /**
   * Enable or disable a shortcut without removing it
   */
  setEnabled(shortcut: KeyboardShortcut, enabled: boolean): void {
    const key = this.serializeShortcut(shortcut);
    const action = this.shortcuts.get(key);
    if (action) {
      action.enabled = enabled;
    }
  }

  /**
   * Handle keyboard events with enhanced logic
   * 기본 키보드 단축키
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    const shortcut: KeyboardShortcut = {
      key: event.key.toLowerCase(),
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey,
    };

    const key = this.serializeShortcut(shortcut);
    const action = this.shortcuts.get(key);

    if (action && action.enabled) {
      event.preventDefault();
      action.callback();
      return true;
    }

    return false;
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): KeyboardShortcutAction[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get conflicts for resolution
   * 키 충돌 감지 및 해결 로직
   */
  getConflicts(): ShortcutConflict[] {
    return [...this.conflicts];
  }

  /**
   * Resolve a conflict by choosing which shortcut to keep
   */
  resolveConflict(conflictKey: string, keepNew: boolean): void {
    const conflict = this.conflicts.find((c) => c.key === conflictKey);
    if (!conflict) return;

    if (keepNew) {
      // Keep the new shortcut, disable the existing one
      const existing = this.shortcuts.get(conflictKey);
      if (existing) {
        existing.enabled = false;
      }
    }

    // Remove from conflicts list
    this.conflicts = this.conflicts.filter((c) => c.key !== conflictKey);
  }

  /**
   * Clear all conflicts
   */
  clearConflicts(): void {
    this.conflicts = [];
  }

  /**
   * Serialize shortcut to string key
   */
  private serializeShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push("ctrl");
    if (shortcut.meta) parts.push("meta");
    if (shortcut.shift) parts.push("shift");
    if (shortcut.alt) parts.push("alt");

    parts.push(shortcut.key);

    return parts.join("+");
  }

  /**
   * Parse shortcut string back to KeyboardShortcut object
   */
  parseShortcut(shortcutString: string): KeyboardShortcut {
    const parts = shortcutString.split("+");
    const key = parts.pop() || "";

    return {
      key,
      ctrl: parts.includes("ctrl"),
      meta: parts.includes("meta"),
      shift: parts.includes("shift"),
      alt: parts.includes("alt"),
    };
  }

  /**
   * Check if platform is Mac
   */
  static isMac(): boolean {
    return (
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().indexOf("MAC") >= 0
    );
  }

  /**
   * Get the appropriate modifier key for the platform
   */
  static getModifierKey(): "ctrl" | "meta" {
    return KeyboardManager.isMac() ? "meta" : "ctrl";
  }

  /**
   * Create a platform-appropriate shortcut
   * Ctrl+B/Cmd+B, Ctrl+I/Cmd+I 구현
   */
  static createPlatformShortcut(
    key: string,
    useModifier: boolean = true,
  ): KeyboardShortcut {
    const isMac = KeyboardManager.isMac();
    return {
      key: key.toLowerCase(),
      ctrl: useModifier && !isMac,
      meta: useModifier && isMac,
    };
  }

  /**
   * Format shortcut for display
   */
  static formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    const isMac = KeyboardManager.isMac();

    if (shortcut.ctrl) parts.push(isMac ? "⌃" : "Ctrl");
    if (shortcut.meta) parts.push(isMac ? "⌘" : "Meta");
    if (shortcut.shift) parts.push(isMac ? "⇧" : "Shift");
    if (shortcut.alt) parts.push(isMac ? "⌥" : "Alt");

    // Format key name
    const keyName =
      shortcut.key.charAt(0).toUpperCase() + shortcut.key.slice(1);
    parts.push(keyName);

    return parts.join(isMac ? "" : "+");
  }
}

/**
 * Default keyboard shortcuts for the editor
 * 기본 키보드 단축키
 */
export const DEFAULT_SHORTCUTS = {
  // Formatting shortcuts
  BOLD: KeyboardManager.createPlatformShortcut("b"),
  ITALIC: KeyboardManager.createPlatformShortcut("i"),
  LINK: KeyboardManager.createPlatformShortcut("k"),

  // Navigation shortcuts
  TAB: { key: "tab" },
  SHIFT_TAB: { key: "tab", shift: true },

  // Editor shortcuts
  UNDO: KeyboardManager.createPlatformShortcut("z"),
  REDO: KeyboardManager.createPlatformShortcut("y"),

  // Mode switching
  SWITCH_MODE: { key: "m", alt: true },

  // Snippet shortcuts
  SNIPPET_TRIGGER: KeyboardManager.createPlatformShortcut(" "), // Ctrl/Cmd + Space
} as const;

/**
 * Shortcut categories for organization
 */
export const SHORTCUT_CATEGORIES = {
  FORMATTING: "formatting",
  NAVIGATION: "navigation",
  EDITOR: "editor",
  CUSTOM: "custom",
} as const;
/**
 * Get default keyboard shortcuts for the editor
 * 기본 키보드 단축키
 */
export function getDefaultKeyboardShortcuts(): any[] {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return [
    {
      key: "b",
      ctrlKey: !isMac,
      metaKey: isMac,
      description: "Bold text",
      category: "formatting",
    },
    {
      key: "i",
      ctrlKey: !isMac,
      metaKey: isMac,
      description: "Italic text",
      category: "formatting",
    },
    {
      key: "k",
      ctrlKey: !isMac,
      metaKey: isMac,
      description: "Insert link",
      category: "formatting",
    },
    {
      key: "z",
      ctrlKey: !isMac,
      metaKey: isMac,
      description: "Undo",
      category: "editing",
    },
    {
      key: "y",
      ctrlKey: !isMac,
      metaKey: isMac,
      description: "Redo",
      category: "editing",
    },
    {
      key: "Tab",
      description: "Indent selected lines",
      category: "editing",
    },
    {
      key: "1",
      ctrlKey: !isMac,
      metaKey: isMac,
      description: "Header 1",
      category: "formatting",
    },
    {
      key: "2",
      ctrlKey: !isMac,
      metaKey: isMac,
      description: "Header 2",
      category: "formatting",
    },
    {
      key: "3",
      ctrlKey: !isMac,
      metaKey: isMac,
      description: "Header 3",
      category: "formatting",
    },
    {
      key: "l",
      ctrlKey: !isMac,
      metaKey: isMac,
      description: "Unordered list",
      category: "formatting",
    },
    {
      key: "l",
      ctrlKey: !isMac,
      metaKey: isMac,
      shiftKey: true,
      description: "Ordered list",
      category: "formatting",
    },
    {
      key: "`",
      ctrlKey: !isMac,
      metaKey: isMac,
      description: "Inline code",
      category: "formatting",
    },
    {
      key: "`",
      ctrlKey: !isMac,
      metaKey: isMac,
      shiftKey: true,
      description: "Code block",
      category: "formatting",
    },
  ];
}

/**
 * Parse keyboard shortcut string into KeyboardShortcut object
 * Examples: "Ctrl+B", "Cmd+Shift+K", "Alt+Enter"
 */
export function parseKeyboardShortcut(shortcutString: string): any {
  const parts = shortcutString
    .toLowerCase()
    .split("+")
    .map((p) => p.trim());
  const shortcut: any = {
    key: "",
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
  };

  for (const part of parts) {
    switch (part) {
      case "ctrl":
        shortcut.ctrlKey = true;
        break;
      case "cmd":
      case "meta":
        shortcut.metaKey = true;
        break;
      case "shift":
        shortcut.shiftKey = true;
        break;
      case "alt":
        shortcut.altKey = true;
        break;
      default:
        // This should be the key
        shortcut.key = part;
        break;
    }
  }

  return shortcut;
}

/**
 * Convert KeyboardShortcut object to string representation
 */
export function serializeKeyboardShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.meta) parts.push("Cmd");
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");

  parts.push(shortcut.key.toUpperCase());

  return parts.join("+");
}

/**
 * Check if two keyboard shortcuts are equivalent
 */
export function areShortcutsEqual(
  a: KeyboardShortcut,
  b: KeyboardShortcut,
): boolean {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    !!a.ctrl === !!b.ctrl &&
    !!a.meta === !!b.meta &&
    !!a.shift === !!b.shift &&
    !!a.alt === !!b.alt
  );
}

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut,
): boolean {
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    !!event.ctrlKey === !!shortcut.ctrl &&
    !!event.metaKey === !!shortcut.meta &&
    !!event.shiftKey === !!shortcut.shift &&
    !!event.altKey === !!shortcut.alt
  );
}
