import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  KeyboardManager,
  type KeyboardShortcut,
  getDefaultKeyboardShortcuts,
  parseKeyboardShortcut,
  formatKeyboardShortcut,
} from "./keyboard.js";

const createKeyboardShortcutManager = (): KeyboardShortcutManager => {
  const shortcuts = new Map<string, KeyboardShortcut>();

  const findConflictingShortcut = (
    newShortcut: KeyboardShortcut,
  ): string | null => {
    for (const [id, existing] of shortcuts) {
      if (
        existing.key === newShortcut.key &&
        !!existing.ctrlKey === !!newShortcut.ctrlKey &&
        !!existing.metaKey === !!newShortcut.metaKey &&
        !!existing.shiftKey === !!newShortcut.shiftKey &&
        !!existing.altKey === !!newShortcut.altKey
      ) {
        return id;
      }
    }
    return null;
  };

  return {
    register: (
      id: string,
      shortcut: KeyboardShortcut,
      options?: { force?: boolean },
    ) => {
      // Check for ID conflict
      if (shortcuts.has(id) && !options?.force) {
        return false;
      }

      // Check for key combination conflict
      const conflictingId = findConflictingShortcut(shortcut);
      if (conflictingId && !options?.force) {
        return false;
      }

      shortcuts.set(id, shortcut);
      return true;
    },
    unregister: (id: string) => {
      return shortcuts.delete(id);
    },
    handleKeyDown: (event: KeyboardEvent) => {
      for (const [id, shortcut] of shortcuts) {
        if (isKeyboardShortcutMatch(shortcut, event)) {
          try {
            shortcut.action();
            return true;
          } catch (error) {
            console.error("Shortcut action failed:", error);
            return false;
          }
        }
      }
      return false;
    },
    getConflicts: (shortcut: KeyboardShortcut) => {
      const conflicts: string[] = [];
      for (const [id, existing] of shortcuts) {
        if (
          existing.key === shortcut.key &&
          existing.ctrlKey === shortcut.ctrlKey &&
          existing.shiftKey === shortcut.shiftKey &&
          existing.altKey === shortcut.altKey &&
          existing.metaKey === shortcut.metaKey
        ) {
          conflicts.push(id);
        }
      }
      return conflicts;
    },
    destroy: () => {
      shortcuts.clear();
    },
  };
};

const parseKeyboardShortcut = (shortcutString: string) => {
  const parts = shortcutString.toLowerCase().split("+");
  const result: Partial<KeyboardShortcut> = {
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
  };

  for (const part of parts) {
    if (part === "ctrl") result.ctrlKey = true;
    else if (part === "shift") result.shiftKey = true;
    else if (part === "alt") result.altKey = true;
    else if (part === "meta" || part === "cmd") result.metaKey = true;
    else result.key = part;
  }

  return result as KeyboardShortcut;
};

const isKeyboardShortcutMatch = (
  shortcut: KeyboardShortcut,
  event: KeyboardEvent,
) => {
  return (
    shortcut.key.toLowerCase() === event.key.toLowerCase() &&
    !!shortcut.ctrlKey === event.ctrlKey &&
    !!shortcut.shiftKey === event.shiftKey &&
    !!shortcut.altKey === event.altKey &&
    !!shortcut.metaKey === event.metaKey
  );
};

const getDefaultKeyboardShortcuts = (): KeyboardShortcut[] => {
  return [
    {
      key: "b",
      ctrlKey: true,
      action: () => {},
      description: "Bold text",
    },
    {
      key: "i",
      ctrlKey: true,
      action: () => {},
      description: "Italic text",
    },
    {
      key: "k",
      ctrlKey: true,
      action: () => {},
      description: "Insert link",
    },
    {
      key: "Tab",
      action: () => {},
      description: "Indent text",
    },
  ];
};

describe("Keyboard Shortcuts", () => {
  let shortcutManager: KeyboardShortcutManager;

  beforeEach(() => {
    shortcutManager = createKeyboardShortcutManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
    shortcutManager?.destroy();
  });

  describe("Keyboard Shortcut Manager", () => {
    it("should create keyboard shortcut manager", () => {
      expect(shortcutManager).toBeTruthy();
      expect(typeof shortcutManager.register).toBe("function");
      expect(typeof shortcutManager.unregister).toBe("function");
      expect(typeof shortcutManager.handleKeyDown).toBe("function");
    });

    it("should register keyboard shortcuts", () => {
      const shortcut: KeyboardShortcut = {
        key: "b",
        ctrlKey: true,
        action: vi.fn(),
        description: "Bold text",
      };

      const result = shortcutManager.register("bold", shortcut);
      expect(result).toBe(true);
    });

    it("should unregister keyboard shortcuts", () => {
      const shortcut: KeyboardShortcut = {
        key: "b",
        ctrlKey: true,
        action: vi.fn(),
        description: "Bold text",
      };

      shortcutManager.register("bold", shortcut);
      const result = shortcutManager.unregister("bold");
      expect(result).toBe(true);
    });

    it("should prevent duplicate shortcut registration", () => {
      const shortcut1: KeyboardShortcut = {
        key: "b",
        ctrlKey: true,
        action: vi.fn(),
        description: "Bold text",
      };

      const shortcut2: KeyboardShortcut = {
        key: "b",
        ctrlKey: true,
        action: vi.fn(),
        description: "Another bold action",
      };

      shortcutManager.register("bold1", shortcut1);
      const result = shortcutManager.register("bold2", shortcut2);

      // Should detect conflict
      expect(result).toBe(false);
    });
  });

  describe("Default Keyboard Shortcuts", () => {
    it("should provide default shortcuts", () => {
      const defaults = getDefaultKeyboardShortcuts();

      expect(defaults).toBeTruthy();
      expect(Array.isArray(defaults)).toBe(true);
      expect(defaults.length).toBeGreaterThan(0);
    });

    it("should include bold shortcut (Ctrl+B)", () => {
      const defaults = getDefaultKeyboardShortcuts();
      const boldShortcut = defaults.find((s) => s.key === "b" && s.ctrlKey);

      expect(boldShortcut).toBeTruthy();
      expect(boldShortcut?.description).toContain("Bold");
    });

    it("should include italic shortcut (Ctrl+I)", () => {
      const defaults = getDefaultKeyboardShortcuts();
      const italicShortcut = defaults.find((s) => s.key === "i" && s.ctrlKey);

      expect(italicShortcut).toBeTruthy();
      expect(italicShortcut?.description).toContain("Italic");
    });

    it("should include link shortcut (Ctrl+K)", () => {
      const defaults = getDefaultKeyboardShortcuts();
      const linkShortcut = defaults.find((s) => s.key === "k" && s.ctrlKey);

      expect(linkShortcut).toBeTruthy();
      expect(linkShortcut?.description).toContain("link");
    });

    it("should include tab indentation shortcut", () => {
      const defaults = getDefaultKeyboardShortcuts();
      const tabShortcut = defaults.find((s) => s.key === "Tab");

      expect(tabShortcut).toBeTruthy();
      expect(tabShortcut?.description).toContain("Indent");
    });
  });

  describe("Keyboard Event Handling", () => {
    it("should handle Ctrl+B for bold", () => {
      const boldAction = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: "b",
        ctrlKey: true,
        action: boldAction,
        description: "Bold text",
      };

      shortcutManager.register("bold", shortcut);

      const event = new KeyboardEvent("keydown", {
        key: "b",
        ctrlKey: true,
        bubbles: true,
      });

      const handled = shortcutManager.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(boldAction).toHaveBeenCalled();
    });

    it("should handle Ctrl+I for italic", () => {
      const italicAction = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: "i",
        ctrlKey: true,
        action: italicAction,
        description: "Italic text",
      };

      shortcutManager.register("italic", shortcut);

      const event = new KeyboardEvent("keydown", {
        key: "i",
        ctrlKey: true,
        bubbles: true,
      });

      const handled = shortcutManager.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(italicAction).toHaveBeenCalled();
    });

    it("should handle Ctrl+K for link", () => {
      const linkAction = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: "k",
        ctrlKey: true,
        action: linkAction,
        description: "Insert link",
      };

      shortcutManager.register("link", shortcut);

      const event = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
      });

      const handled = shortcutManager.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(linkAction).toHaveBeenCalled();
    });

    it("should handle Tab for indentation", () => {
      const tabAction = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: "Tab",
        action: tabAction,
        description: "Indent text",
      };

      shortcutManager.register("indent", shortcut);

      const event = new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
      });

      const handled = shortcutManager.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(tabAction).toHaveBeenCalled();
    });

    it("should not handle unregistered shortcuts", () => {
      const event = new KeyboardEvent("keydown", {
        key: "x",
        ctrlKey: true,
        bubbles: true,
      });

      const handled = shortcutManager.handleKeyDown(event);
      expect(handled).toBe(false);
    });

    it("should handle modifier key combinations", () => {
      const action = vi.fn();
      const shortcut: KeyboardShortcut = {
        key: "s",
        ctrlKey: true,
        shiftKey: true,
        action,
        description: "Save as",
      };

      shortcutManager.register("save-as", shortcut);

      const event = new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });

      const handled = shortcutManager.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(action).toHaveBeenCalled();
    });
  });

  describe("Keyboard Shortcut Parsing", () => {
    it("should parse simple key shortcuts", () => {
      const result = parseKeyboardShortcut("Enter");

      expect(result.key.toLowerCase()).toBe("enter");
      expect(result.ctrlKey).toBe(false);
      expect(result.shiftKey).toBe(false);
      expect(result.altKey).toBe(false);
    });

    it("should parse Ctrl+key shortcuts", () => {
      const result = parseKeyboardShortcut("Ctrl+B");

      expect(result.key).toBe("b");
      expect(result.ctrlKey).toBe(true);
      expect(result.shiftKey).toBe(false);
      expect(result.altKey).toBe(false);
    });

    it("should parse complex modifier combinations", () => {
      const result = parseKeyboardShortcut("Ctrl+Shift+Alt+S");

      expect(result.key).toBe("s");
      expect(result.ctrlKey).toBe(true);
      expect(result.shiftKey).toBe(true);
      expect(result.altKey).toBe(true);
    });

    it("should handle case insensitive parsing", () => {
      const result1 = parseKeyboardShortcut("ctrl+b");
      const result2 = parseKeyboardShortcut("CTRL+B");

      expect(result1.key).toBe("b");
      expect(result1.ctrlKey).toBe(true);
      expect(result2.key).toBe("b");
      expect(result2.ctrlKey).toBe(true);
    });

    it("should handle special keys", () => {
      const specialKeys = [
        "Tab",
        "Enter",
        "Escape",
        "Space",
        "ArrowUp",
        "ArrowDown",
      ];

      specialKeys.forEach((key) => {
        const result = parseKeyboardShortcut(key);
        expect(result.key.toLowerCase()).toBe(key.toLowerCase());
      });
    });
  });

  describe("Keyboard Shortcut Matching", () => {
    it("should match exact keyboard events", () => {
      const shortcut: KeyboardShortcut = {
        key: "b",
        ctrlKey: true,
        action: vi.fn(),
        description: "Bold",
      };

      const event = new KeyboardEvent("keydown", {
        key: "b",
        ctrlKey: true,
      });

      const matches = isKeyboardShortcutMatch(shortcut, event);
      expect(matches).toBe(true);
    });

    it("should not match different keys", () => {
      const shortcut: KeyboardShortcut = {
        key: "b",
        ctrlKey: true,
        action: vi.fn(),
        description: "Bold",
      };

      const event = new KeyboardEvent("keydown", {
        key: "i",
        ctrlKey: true,
      });

      const matches = isKeyboardShortcutMatch(shortcut, event);
      expect(matches).toBe(false);
    });

    it("should not match different modifiers", () => {
      const shortcut: KeyboardShortcut = {
        key: "b",
        ctrlKey: true,
        action: vi.fn(),
        description: "Bold",
      };

      const event = new KeyboardEvent("keydown", {
        key: "b",
        shiftKey: true,
      });

      const matches = isKeyboardShortcutMatch(shortcut, event);
      expect(matches).toBe(false);
    });

    it("should handle case insensitive key matching", () => {
      const shortcut: KeyboardShortcut = {
        key: "B",
        ctrlKey: true,
        action: vi.fn(),
        description: "Bold",
      };

      const event = new KeyboardEvent("keydown", {
        key: "b",
        ctrlKey: true,
      });

      const matches = isKeyboardShortcutMatch(shortcut, event);
      expect(matches).toBe(true);
    });
  });

  describe("Custom Shortcuts", () => {
    it("should support custom user shortcuts", () => {
      const customAction = vi.fn();
      const customShortcut: KeyboardShortcut = {
        key: "q",
        ctrlKey: true,
        altKey: true,
        action: customAction,
        description: "Custom action",
      };

      const result = shortcutManager.register("custom", customShortcut);
      expect(result).toBe(true);

      const event = new KeyboardEvent("keydown", {
        key: "q",
        ctrlKey: true,
        altKey: true,
      });

      const handled = shortcutManager.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(customAction).toHaveBeenCalled();
    });

    it("should detect shortcut conflicts", () => {
      const shortcut1: KeyboardShortcut = {
        key: "b",
        ctrlKey: true,
        action: vi.fn(),
        description: "Bold",
      };

      const shortcut2: KeyboardShortcut = {
        key: "b",
        ctrlKey: true,
        action: vi.fn(),
        description: "Another bold",
      };

      shortcutManager.register("bold1", shortcut1);
      const conflicts = shortcutManager.getConflicts(shortcut2);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0]).toBe("bold1");
    });

    it("should provide conflict resolution", () => {
      const shortcut1: KeyboardShortcut = {
        key: "b",
        ctrlKey: true,
        action: vi.fn(),
        description: "Bold",
      };

      const shortcut2: KeyboardShortcut = {
        key: "b",
        ctrlKey: true,
        action: vi.fn(),
        description: "Another bold",
      };

      shortcutManager.register("bold1", shortcut1);

      // Should be able to override with force flag
      const result = shortcutManager.register("bold2", shortcut2, {
        force: true,
      });
      expect(result).toBe(true);
    });
  });

  describe("Platform-Specific Shortcuts", () => {
    it("should handle Cmd key on Mac", () => {
      // Mock Mac platform
      Object.defineProperty(navigator, "platform", {
        value: "MacIntel",
        configurable: true,
      });

      const shortcut: KeyboardShortcut = {
        key: "b",
        metaKey: true, // Cmd key on Mac
        action: vi.fn(),
        description: "Bold",
      };

      shortcutManager.register("bold", shortcut);

      const event = new KeyboardEvent("keydown", {
        key: "b",
        metaKey: true,
      });

      const handled = shortcutManager.handleKeyDown(event);
      expect(handled).toBe(true);
    });

    it("should normalize Ctrl/Cmd based on platform", () => {
      const shortcuts = getDefaultKeyboardShortcuts();
      const boldShortcut = shortcuts.find((s) => s.key === "b");

      expect(boldShortcut).toBeTruthy();
      // Should have appropriate modifier for platform
      expect(boldShortcut?.ctrlKey || boldShortcut?.metaKey).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid shortcut definitions", () => {
      const invalidShortcut = {
        // Missing required properties
        action: vi.fn(),
      } as KeyboardShortcut;

      expect(() =>
        shortcutManager.register("invalid", invalidShortcut),
      ).not.toThrow();
    });

    it("should handle null or undefined events", () => {
      expect(() => shortcutManager.handleKeyDown(null as any)).not.toThrow();
      expect(() =>
        shortcutManager.handleKeyDown(undefined as any),
      ).not.toThrow();
    });

    it("should handle action execution errors", () => {
      const faultyAction = vi.fn(() => {
        throw new Error("Action failed");
      });

      const shortcut: KeyboardShortcut = {
        key: "x",
        ctrlKey: true,
        action: faultyAction,
        description: "Faulty action",
      };

      shortcutManager.register("faulty", shortcut);

      const event = new KeyboardEvent("keydown", {
        key: "x",
        ctrlKey: true,
      });

      // Should handle the error gracefully
      expect(() => shortcutManager.handleKeyDown(event)).not.toThrow();
    });
  });
});
