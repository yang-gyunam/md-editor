// Integration test for keyboard shortcuts in the main editor
// Keyboard shortcut system integration tests

import { describe, it, expect, beforeEach, vi } from "vitest";
import { KeyboardShortcutService } from "../utils/keyboardShortcuts.js";
import type { EditorInstance } from "../types/index.js";

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

// Mock prompt for link insertion
global.prompt = vi.fn();

describe("Keyboard Shortcuts Integration", () => {
  let keyboardService: KeyboardShortcutService;
  let mockEditor: EditorInstance;

  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    global.prompt = vi.fn();

    keyboardService = new KeyboardShortcutService();

    mockEditor = {
      getValue: vi.fn(() => "test content"),
      setValue: vi.fn(),
      getMode: vi.fn(() => "markdown"),
      setMode: vi.fn(),
      getSelection: vi.fn(() => ({ start: 0, end: 4, text: "test" })),
      setSelection: vi.fn(),
      setCursor: vi.fn(),
      focus: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
    };

    keyboardService.setEditorInstance(mockEditor);
  });

  it("should integrate keyboard shortcuts with editor instance", () => {
    // Verify service is initialized with default actions
    const actions = keyboardService.getActions();
    expect(actions.length).toBeGreaterThan(0);

    // Verify editor instance is set
    expect(mockEditor).toBeDefined();
  });

  it("should handle bold shortcut integration", () => {
    // Simulate Ctrl+B keydown event
    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    const handled = keyboardService.handleKeyDown(event);

    expect(handled).toBe(true);
    expect(mockEditor.setValue).toHaveBeenCalledWith("**test** content");
    expect(mockEditor.setCursor).toHaveBeenCalled();
  });

  it("should handle italic shortcut integration", () => {
    // Simulate Ctrl+I keydown event
    const event = new KeyboardEvent("keydown", {
      key: "i",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    const handled = keyboardService.handleKeyDown(event);

    expect(handled).toBe(true);
    expect(mockEditor.setValue).toHaveBeenCalledWith("_test_ content");
    expect(mockEditor.setCursor).toHaveBeenCalled();
  });

  it("should handle link insertion shortcut integration", () => {
    global.prompt = vi.fn(() => "https://example.com");

    // Simulate Ctrl+K keydown event
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    const handled = keyboardService.handleKeyDown(event);

    expect(handled).toBe(true);
    expect(global.prompt).toHaveBeenCalledWith("Enter link URL:", "https://");
    expect(mockEditor.setValue).toHaveBeenCalledWith(
      "[test](https://example.com) content",
    );
    expect(mockEditor.setCursor).toHaveBeenCalled();
  });

  it("should handle tab indentation integration", () => {
    mockEditor.getSelection = vi.fn(() => ({ start: 0, end: 4, text: "test" }));
    mockEditor.getValue = vi.fn(() => "test\nline2");

    // Simulate Tab keydown event
    const event = new KeyboardEvent("keydown", {
      key: "tab",
      bubbles: true,
      cancelable: true,
    });

    const handled = keyboardService.handleKeyDown(event);

    expect(handled).toBe(true);
    expect(mockEditor.setValue).toHaveBeenCalledWith("  test\nline2");
  });

  it("should handle HTML mode formatting", () => {
    mockEditor.getMode = vi.fn(() => "html");

    // Simulate Ctrl+B in HTML mode
    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    const handled = keyboardService.handleKeyDown(event);

    expect(handled).toBe(true);
    expect(mockEditor.setValue).toHaveBeenCalledWith(
      "<strong>test</strong> content",
    );
  });

  it("should handle undo/redo shortcuts", () => {
    // Test undo
    const undoEvent = new KeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    const undoHandled = keyboardService.handleKeyDown(undoEvent);
    expect(undoHandled).toBe(true);
    expect(mockEditor.undo).toHaveBeenCalled();

    // Test redo
    const redoEvent = new KeyboardEvent("keydown", {
      key: "y",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    const redoHandled = keyboardService.handleKeyDown(redoEvent);
    expect(redoHandled).toBe(true);
    expect(mockEditor.redo).toHaveBeenCalled();
  });

  it("should handle custom shortcuts", () => {
    // Add a custom shortcut
    const customShortcut = { key: "h", ctrl: true };
    const success = keyboardService.addCustomShortcut("bold", customShortcut);

    expect(success).toBe(true);

    // Test the custom shortcut
    const event = new KeyboardEvent("keydown", {
      key: "h",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    const handled = keyboardService.handleKeyDown(event);
    expect(handled).toBe(true);
    expect(mockEditor.setValue).toHaveBeenCalledWith("**test** content");
  });

  it("should persist settings", () => {
    // Add custom shortcut
    keyboardService.addCustomShortcut("bold", { key: "h", ctrl: true });

    // Verify localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "editor-keyboard-shortcuts",
      expect.stringContaining('"shortcuts"'),
    );
  });

  it("should handle disabled shortcuts", () => {
    // Disable shortcuts
    keyboardService.setEnabled(false);

    // Try to use a shortcut
    const event = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    const handled = keyboardService.handleKeyDown(event);
    expect(handled).toBe(false);
    expect(mockEditor.setValue).not.toHaveBeenCalled();
  });

  it("should handle non-matching shortcuts", () => {
    // Try a shortcut that doesn't exist
    const event = new KeyboardEvent("keydown", {
      key: "x",
      ctrlKey: true,
      altKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });

    const handled = keyboardService.handleKeyDown(event);
    expect(handled).toBe(false);
    expect(mockEditor.setValue).not.toHaveBeenCalled();
  });
});
