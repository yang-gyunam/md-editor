// Tests for keyboard shortcut settings component
// Custom keyboard shortcut system tests

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/svelte";
import KeyboardShortcutSettings from "./KeyboardShortcutSettings.svelte";
import type {
  ShortcutAction,
  ShortcutSettings,
} from "../utils/keyboardShortcuts.js";
import type { ShortcutConflict } from "../utils/keyboard.js";
import type { Snippet } from "../types/index.js";

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid-" + Math.random().toString(36).substr(2, 9),
  },
});

describe("KeyboardShortcutSettings", () => {
  const mockActions: ShortcutAction[] = [
    {
      id: "bold",
      name: "Bold",
      description: "Make text bold",
      category: "formatting",
      defaultShortcut: { key: "b", ctrl: true },
      action: vi.fn(),
    },
    {
      id: "italic",
      name: "Italic",
      description: "Make text italic",
      category: "formatting",
      defaultShortcut: { key: "i", ctrl: true },
      action: vi.fn(),
    },
    {
      id: "undo",
      name: "Undo",
      description: "Undo last action",
      category: "editor",
      defaultShortcut: { key: "z", ctrl: true },
      action: vi.fn(),
    },
  ];

  const mockSettings: ShortcutSettings = {
    shortcuts: {},
    enabled: true,
    customSnippets: [],
  };

  const mockConflicts: ShortcutConflict[] = [
    {
      existing: { key: "b", ctrl: true },
      new: { key: "b", ctrl: true },
      key: "ctrl+b",
    },
  ];

  const defaultProps = {
    actions: mockActions,
    settings: mockSettings,
    conflicts: [],
    onSettingsChange: vi.fn(),
    onConflictResolve: vi.fn(),
    onAddSnippet: vi.fn(),
    onRemoveSnippet: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render settings dialog with actions grouped by category", () => {
    render(KeyboardShortcutSettings, { props: defaultProps });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();

    // Check for category headers
    expect(screen.getByText("Formatting Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Editor Shortcuts")).toBeInTheDocument();

    // Check for action names
    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText("Italic")).toBeInTheDocument();
    expect(screen.getByText("Undo")).toBeInTheDocument();
  });

  it("should display default shortcuts correctly", () => {
    render(KeyboardShortcutSettings, { props: defaultProps });

    // Should show formatted shortcuts (platform-specific)
    const shortcuts = screen.getAllByText(/Ctrl\+B|⌘B/);
    expect(shortcuts.length).toBeGreaterThan(0);
  });

  it("should allow editing shortcuts", async () => {
    render(KeyboardShortcutSettings, { props: defaultProps });

    // Find and click edit button for bold action
    const editButtons = screen.getAllByText("Edit");
    await fireEvent.click(editButtons[0]);

    // Should show shortcut editor
    expect(screen.getByText("Record")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("should record new keyboard shortcuts", async () => {
    render(KeyboardShortcutSettings, { props: defaultProps });

    // Start editing
    const editButtons = screen.getAllByText("Edit");
    await fireEvent.click(editButtons[0]);

    // Click record button
    const recordButton = screen.getByText("Record");
    await fireEvent.click(recordButton);

    expect(screen.getByText("Recording...")).toBeInTheDocument();

    // Simulate key press
    await fireEvent.keyDown(document, { key: "x", ctrlKey: true });

    // Should show the recorded shortcut
    expect(screen.getByText(/Ctrl\+X|⌘X/)).toBeInTheDocument();
  });

  it("should save custom shortcuts", async () => {
    const onSettingsChange = vi.fn();
    render(KeyboardShortcutSettings, {
      props: { ...defaultProps, onSettingsChange },
    });

    // Start editing and record a shortcut
    const editButtons = screen.getAllByText("Edit");
    await fireEvent.click(editButtons[0]);

    const recordButton = screen.getByText("Record");
    await fireEvent.click(recordButton);

    await fireEvent.keyDown(document, { key: "x", ctrlKey: true });

    // Save the shortcut
    const saveButton = screen.getByText("Save");
    await fireEvent.click(saveButton);

    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        shortcuts: expect.objectContaining({
          bold: { key: "x", ctrl: true, meta: false, shift: false, alt: false },
        }),
      }),
    );
  });

  it("should display and resolve conflicts", () => {
    render(KeyboardShortcutSettings, {
      props: { ...defaultProps, conflicts: mockConflicts },
    });

    expect(screen.getByText("Shortcut Conflicts")).toBeInTheDocument();
    expect(screen.getByText("Keep Existing")).toBeInTheDocument();
    expect(screen.getByText("Use New")).toBeInTheDocument();
  });

  it("should handle conflict resolution", async () => {
    const onConflictResolve = vi.fn();
    render(KeyboardShortcutSettings, {
      props: { ...defaultProps, conflicts: mockConflicts, onConflictResolve },
    });

    const useNewButton = screen.getByText("Use New");
    await fireEvent.click(useNewButton);

    expect(onConflictResolve).toHaveBeenCalledWith("ctrl+b", true);
  });

  it("should allow adding custom snippets", async () => {
    const onAddSnippet = vi.fn();
    render(KeyboardShortcutSettings, {
      props: { ...defaultProps, onAddSnippet },
    });

    // Click add snippet button
    const addButton = screen.getByText("Add Snippet");
    await fireEvent.click(addButton);

    // Fill in snippet form
    const nameInput = screen.getByLabelText("Name");
    const shortcutInput = screen.getByLabelText("Keyboard Shortcut");
    const contentInput = screen.getByLabelText("Content");

    await fireEvent.input(nameInput, { target: { value: "Test Snippet" } });
    await fireEvent.input(shortcutInput, { target: { value: "ctrl+shift+t" } });
    await fireEvent.input(contentInput, {
      target: { value: "Hello ${name}!" },
    });

    // Save snippet
    const saveButton = screen.getByText("Save Snippet");
    await fireEvent.click(saveButton);

    expect(onAddSnippet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Snippet",
        shortcut: "ctrl+shift+t",
        content: "Hello ${name}!",
        variables: [],
      }),
    );
  });

  it("should allow adding snippet variables", async () => {
    render(KeyboardShortcutSettings, { props: defaultProps });

    // Open snippet form
    const addButton = screen.getByText("Add Snippet");
    await fireEvent.click(addButton);

    // Add a variable
    const addVariableButton = screen.getByText("Add Variable");
    await fireEvent.click(addVariableButton);

    // Should show variable input fields
    expect(screen.getByPlaceholderText("Variable name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Placeholder text")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Default value")).toBeInTheDocument();
  });

  it("should display existing custom snippets", () => {
    const settingsWithSnippets: ShortcutSettings = {
      ...mockSettings,
      customSnippets: [
        {
          id: "test-snippet",
          name: "Test Snippet",
          shortcut: "ctrl+shift+t",
          content: "Hello world!",
          variables: [],
        },
      ],
    };

    render(KeyboardShortcutSettings, {
      props: { ...defaultProps, settings: settingsWithSnippets },
    });

    expect(screen.getByText("Test Snippet")).toBeInTheDocument();
    expect(screen.getByText("ctrl+shift+t")).toBeInTheDocument();
    expect(screen.getByText("Hello world!...")).toBeInTheDocument();
  });

  it("should allow removing custom snippets", async () => {
    const onRemoveSnippet = vi.fn();
    const settingsWithSnippets: ShortcutSettings = {
      ...mockSettings,
      customSnippets: [
        {
          id: "test-snippet",
          name: "Test Snippet",
          shortcut: "ctrl+shift+t",
          content: "Hello world!",
          variables: [],
        },
      ],
    };

    render(KeyboardShortcutSettings, {
      props: {
        ...defaultProps,
        settings: settingsWithSnippets,
        onRemoveSnippet,
      },
    });

    const removeButton = screen.getByText("Remove");
    await fireEvent.click(removeButton);

    expect(onRemoveSnippet).toHaveBeenCalledWith("test-snippet");
  });

  it("should toggle shortcuts enabled/disabled", async () => {
    const onSettingsChange = vi.fn();
    render(KeyboardShortcutSettings, {
      props: { ...defaultProps, onSettingsChange },
    });

    const enableCheckbox = screen.getByLabelText("Enable keyboard shortcuts");
    await fireEvent.click(enableCheckbox);

    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it("should close when close button is clicked", async () => {
    const onClose = vi.fn();
    render(KeyboardShortcutSettings, {
      props: { ...defaultProps, onClose },
    });

    const closeButton = screen.getByLabelText("Close settings");
    await fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("should handle keyboard events for shortcut recording", async () => {
    render(KeyboardShortcutSettings, { props: defaultProps });

    // Start editing and recording
    const editButtons = screen.getAllByText("Edit");
    await fireEvent.click(editButtons[0]);

    const recordButton = screen.getByText("Record");
    await fireEvent.click(recordButton);

    // Test various key combinations
    await fireEvent.keyDown(window, {
      key: "b",
      ctrlKey: true,
      shiftKey: true,
    });

    expect(screen.getByText(/Ctrl\+Shift\+B|⌘⇧B/)).toBeInTheDocument();
  });

  it("should prevent default behavior during key recording", async () => {
    render(KeyboardShortcutSettings, { props: defaultProps });

    const editButtons = screen.getAllByText("Edit");
    await fireEvent.click(editButtons[0]);

    const recordButton = screen.getByText("Record");
    await fireEvent.click(recordButton);

    const keyEvent = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = vi.spyOn(keyEvent, "preventDefault");
    const stopPropagationSpy = vi.spyOn(keyEvent, "stopPropagation");

    window.dispatchEvent(keyEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});
