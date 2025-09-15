// Tests for keyboard shortcut system
// 키보드 단축키 시스템 테스트

import { describe, it, expect, beforeEach, vi } from "vitest";
import { KeyboardShortcutService } from "./keyboardShortcuts.js";
import { KeyboardManager, DEFAULT_SHORTCUTS } from "./keyboard.js";
import type { EditorInstance, Snippet } from "../types/index.js";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock editor instance
const createMockEditor = (): EditorInstance => ({
  getValue: vi.fn(() => "test content"),
  setValue: vi.fn(),
  getMode: vi.fn(() => "markdown"),
  setMode: vi.fn(),
  getSelection: vi.fn(() => ({ start: 0, end: 0, text: "" })),
  setSelection: vi.fn(),
  setCursor: vi.fn(),
  focus: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
});

describe("KeyboardManager", () => {
  let keyboardManager: KeyboardManager;

  beforeEach(() => {
    keyboardManager = new KeyboardManager();
  });

  it("should register and handle basic shortcuts", () => {
    const callback = vi.fn();
    const shortcut = { key: "b", ctrl: true };

    const success = keyboardManager.register(shortcut, callback);
    expect(success).toBe(true);

    // Simulate Ctrl+B keydown
    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
    });

    const handled = keyboardManager.handleKeyDown(event);
    expect(handled).toBe(true);
    expect(callback).toHaveBeenCalled();
  });

  it("should detect conflicts when registering shortcuts", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const shortcut = { key: "b", ctrl: true };

    // Register first shortcut
    keyboardManager.register(shortcut, callback1, 1);

    // Register conflicting shortcut with lower priority
    const success = keyboardManager.register(shortcut, callback2, 0);
    expect(success).toBe(false);

    const conflicts = keyboardManager.getConflicts();
    expect(conflicts).toHaveLength(1);
  });

  it("should handle platform-specific shortcuts", () => {
    const isMac = KeyboardManager.isMac();
    const shortcut = KeyboardManager.createPlatformShortcut("b");

    if (isMac) {
      expect(shortcut.meta).toBe(true);
      expect(shortcut.ctrl).toBe(false);
    } else {
      expect(shortcut.ctrl).toBe(true);
      expect(shortcut.meta).toBe(false);
    }
  });

  it("should format shortcuts for display", () => {
    const shortcut = { key: "b", ctrl: true };
    const formatted = KeyboardManager.formatShortcut(shortcut);

    expect(formatted).toMatch(/B/);
    expect(formatted).toMatch(/Ctrl|⌘/);
  });
});

describe("KeyboardShortcutService", () => {
  let service: KeyboardShortcutService;
  let mockEditor: EditorInstance;

  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();

    service = new KeyboardShortcutService();
    mockEditor = createMockEditor();
    service.setEditorInstance(mockEditor);
  });

  it("should initialize with default actions", () => {
    const actions = service.getActions();
    expect(actions.length).toBeGreaterThan(0);

    const boldAction = actions.find((a) => a.id === "bold");
    expect(boldAction).toBeDefined();
    expect(boldAction?.defaultShortcut).toEqual(DEFAULT_SHORTCUTS.BOLD);
  });

  it("should handle bold formatting shortcut", () => {
    mockEditor.getSelection = vi.fn(() => ({ start: 0, end: 4, text: "test" }));
    mockEditor.getMode = vi.fn(() => "markdown");
    mockEditor.getValue = vi.fn(() => "test content");

    // Simulate Ctrl+B
    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: !KeyboardManager.isMac(),
      metaKey: KeyboardManager.isMac(),
    });

    const handled = service.handleKeyDown(event);
    expect(handled).toBe(true);
    expect(mockEditor.setValue).toHaveBeenCalledWith("**test** content");
  });

  it("should handle italic formatting shortcut", () => {
    mockEditor.getSelection = vi.fn(() => ({ start: 0, end: 4, text: "test" }));
    mockEditor.getMode = vi.fn(() => "markdown");
    mockEditor.getValue = vi.fn(() => "test content");

    // Simulate Ctrl+I
    const event = new KeyboardEvent("keydown", {
      key: "i",
      ctrlKey: !KeyboardManager.isMac(),
      metaKey: KeyboardManager.isMac(),
    });

    const handled = service.handleKeyDown(event);
    expect(handled).toBe(true);
    expect(mockEditor.setValue).toHaveBeenCalledWith("_test_ content");
  });

  it("should handle link insertion shortcut", () => {
    mockEditor.getSelection = vi.fn(() => ({ start: 0, end: 4, text: "test" }));
    mockEditor.getMode = vi.fn(() => "markdown");
    mockEditor.getValue = vi.fn(() => "test content");

    // Mock prompt
    global.prompt = vi.fn(() => "https://example.com");

    // Simulate Ctrl+K
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: !KeyboardManager.isMac(),
      metaKey: KeyboardManager.isMac(),
    });

    const handled = service.handleKeyDown(event);
    expect(handled).toBe(true);
    expect(mockEditor.setValue).toHaveBeenCalledWith(
      "[test](https://example.com) content",
    );
  });

  it("should handle tab indentation", () => {
    mockEditor.getSelection = vi.fn(() => ({ start: 0, end: 4, text: "test" }));
    mockEditor.getValue = vi.fn(() => "test\nline2");

    // Simulate Tab
    const event = new KeyboardEvent("keydown", { key: "tab" });

    const handled = service.handleKeyDown(event);
    expect(handled).toBe(true);
    // Should indent the full line containing the selection
    expect(mockEditor.setValue).toHaveBeenCalledWith("  test\nline2");
  });

  it("should add and remove custom shortcuts", () => {
    const shortcut = { key: "h", ctrl: true };
    const success = service.addCustomShortcut("bold", shortcut);

    expect(success).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalled();

    service.removeCustomShortcut("bold");
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
  });

  it("should add and remove custom snippets", () => {
    const snippet: Snippet = {
      id: "test-snippet",
      name: "Test Snippet",
      shortcut: "ctrl+shift+t",
      content: "Hello ${name}!",
      variables: [{ name: "name", placeholder: "Enter name" }],
    };

    const success = service.addCustomSnippet(snippet);
    expect(success).toBe(true);

    service.removeCustomSnippet("test-snippet");
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("should save and load settings", () => {
    const settings = {
      shortcuts: { bold: { key: "b", alt: true } },
      enabled: true,
      customSnippets: [],
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(settings));

    const newService = new KeyboardShortcutService();
    const loadedSettings = newService.getSettings();

    expect(loadedSettings.shortcuts.bold).toEqual({ key: "b", alt: true });
  });

  it("should handle conflicts resolution", () => {
    const shortcut1 = { key: "b", ctrl: true };
    const shortcut2 = { key: "b", ctrl: true };

    service.addCustomShortcut("bold", shortcut1);
    service.addCustomShortcut("italic", shortcut2);

    const conflicts = service.getConflicts();
    expect(conflicts.length).toBeGreaterThan(0);

    service.resolveConflict("ctrl+b", true);
    const resolvedConflicts = service.getConflicts();
    expect(resolvedConflicts.length).toBeLessThan(conflicts.length);
  });

  it("should reset to defaults", () => {
    service.addCustomShortcut("bold", { key: "x", ctrl: true });
    service.resetToDefaults();

    const settings = service.getSettings();
    expect(Object.keys(settings.shortcuts)).toHaveLength(0);
    expect(settings.customSnippets).toHaveLength(0);
  });

  it("should enable and disable shortcuts", () => {
    service.setEnabled(false);

    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
    });

    const handled = service.handleKeyDown(event);
    expect(handled).toBe(false);

    service.setEnabled(true);
    const handledAfterEnable = service.handleKeyDown(event);
    expect(handledAfterEnable).toBe(true);
  });
});
