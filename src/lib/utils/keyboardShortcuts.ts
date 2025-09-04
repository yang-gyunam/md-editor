// Keyboard shortcut service for HTML/Markdown editor
// 키보드 단축키 시스템
// 사용자 정의 단축키 시스템

import {
  KeyboardManager,
  DEFAULT_SHORTCUTS,
  type KeyboardShortcut,
} from "./keyboard.js";
import {
  applyFormatAction,
  type FormatContext,
  type TextSelection,
} from "./formatActions.js";
import type { EditorInstance, Snippet } from "../types/index.js";

export interface ShortcutAction {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultShortcut?: KeyboardShortcut;
  customShortcut?: KeyboardShortcut;
  action: (editor: EditorInstance) => void;
}

export interface ShortcutSettings {
  shortcuts: Record<string, KeyboardShortcut>;
  enabled: boolean;
  customSnippets: Snippet[];
}

/**
 * Service for managing keyboard shortcuts in the editor
 * 기본 키보드 단축키
 */
export class KeyboardShortcutService {
  private keyboardManager: KeyboardManager;
  private editorInstance: EditorInstance | null = null;
  private actions: Map<string, ShortcutAction> = new Map();
  private settings: ShortcutSettings;

  constructor() {
    this.keyboardManager = new KeyboardManager();
    this.settings = this.loadSettings();
    this.initializeDefaultActions();
    this.registerShortcuts();
  }

  /**
   * Set the editor instance for shortcut actions
   */
  setEditorInstance(editor: EditorInstance): void {
    this.editorInstance = editor;
  }

  /**
   * Initialize default shortcut actions
   * 기본 키보드 단축키
   */
  private initializeDefaultActions(): void {
    const actions: ShortcutAction[] = [
      {
        id: "bold",
        name: "Bold",
        description: "Make text bold",
        category: "formatting",
        defaultShortcut: DEFAULT_SHORTCUTS.BOLD,
        action: (editor) => this.applyFormatting(editor, "bold"),
      },
      {
        id: "italic",
        name: "Italic",
        description: "Make text italic",
        category: "formatting",
        defaultShortcut: DEFAULT_SHORTCUTS.ITALIC,
        action: (editor) => this.applyFormatting(editor, "italic"),
      },
      {
        id: "link",
        name: "Insert Link",
        description: "Insert or edit link",
        category: "formatting",
        defaultShortcut: DEFAULT_SHORTCUTS.LINK,
        action: (editor) => this.insertLink(editor),
      },
      {
        id: "indent",
        name: "Indent",
        description: "Indent selected lines",
        category: "navigation",
        defaultShortcut: DEFAULT_SHORTCUTS.TAB,
        action: (editor) => this.indentText(editor),
      },
      {
        id: "outdent",
        name: "Outdent",
        description: "Outdent selected lines",
        category: "navigation",
        defaultShortcut: DEFAULT_SHORTCUTS.SHIFT_TAB,
        action: (editor) => this.outdentText(editor),
      },
      {
        id: "undo",
        name: "Undo",
        description: "Undo last action",
        category: "editor",
        defaultShortcut: DEFAULT_SHORTCUTS.UNDO,
        action: (editor) => editor.undo(),
      },
      {
        id: "redo",
        name: "Redo",
        description: "Redo last undone action",
        category: "editor",
        defaultShortcut: DEFAULT_SHORTCUTS.REDO,
        action: (editor) => editor.redo(),
      },
    ];

    actions.forEach((action) => {
      this.actions.set(action.id, action);
    });
  }

  /**
   * Register all shortcuts with the keyboard manager
   */
  private registerShortcuts(): void {
    if (!this.settings.enabled) return;

    this.actions.forEach((action, id) => {
      const shortcut = this.settings.shortcuts[id] || action.defaultShortcut;
      if (shortcut) {
        this.keyboardManager.register(
          shortcut,
          () => {
            if (this.editorInstance) {
              action.action(this.editorInstance);
            }
          },
          1, // Default priority
        );
      }
    });

    // Register custom snippet shortcuts
    this.settings.customSnippets.forEach((snippet, index) => {
      if (snippet.shortcut) {
        const shortcut = this.keyboardManager.parseShortcut(snippet.shortcut);
        this.keyboardManager.register(
          shortcut,
          () => this.insertSnippet(snippet),
          2, // Higher priority for custom shortcuts
        );
      }
    });
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    return this.keyboardManager.handleKeyDown(event);
  }

  /**
   * Apply formatting action
   * Ctrl+B/Cmd+B (굵게), Ctrl+I/Cmd+I (기울임꼴)
   */
  private applyFormatting(
    editor: EditorInstance,
    format: "bold" | "italic",
  ): void {
    const selection = editor.getSelection();
    const content = editor.getValue();
    const mode = editor.getMode();

    const formatActions = {
      bold: {
        markdown: {
          type: "wrap" as const,
          before: "**",
          after: "**",
          placeholder: "bold text",
        },
        html: {
          type: "wrap" as const,
          before: "<strong>",
          after: "</strong>",
          placeholder: "bold text",
        },
      },
      italic: {
        markdown: {
          type: "wrap" as const,
          before: "_",
          after: "_",
          placeholder: "italic text",
        },
        html: {
          type: "wrap" as const,
          before: "<em>",
          after: "</em>",
          placeholder: "italic text",
        },
      },
    };

    const action = formatActions[format][mode];
    const context: FormatContext = {
      content,
      selection,
      cursorPosition: selection.start,
    };

    const result = applyFormatAction(action, context);
    editor.setValue(result.content);
    editor.setCursor(result.cursorPosition);

    if (
      result.selectionStart !== undefined &&
      result.selectionEnd !== undefined
    ) {
      editor.setSelection(result.selectionStart, result.selectionEnd);
    }
  }

  /**
   * Insert link
   * Ctrl+K/Cmd+K (링크 삽입)
   */
  private insertLink(editor: EditorInstance): void {
    const selection = editor.getSelection();
    const mode = editor.getMode();

    // Get link URL from user
    const url = prompt("Enter link URL:", "https://");
    if (!url) return;

    const linkText = selection.text || "link text";

    let linkMarkup: string;
    if (mode === "markdown") {
      linkMarkup = `[${linkText}](${url})`;
    } else {
      linkMarkup = `<a href="${url}">${linkText}</a>`;
    }

    const content = editor.getValue();
    const newContent =
      content.slice(0, selection.start) +
      linkMarkup +
      content.slice(selection.end);

    editor.setValue(newContent);

    // Position cursor after the link
    const newCursorPos = selection.start + linkMarkup.length;
    editor.setCursor(newCursorPos);
  }

  /**
   * Indent text
   * Tab 키를 통한 들여쓰기 기능
   */
  private indentText(editor: EditorInstance): void {
    const selection = editor.getSelection();
    const content = editor.getValue();

    if (selection.text) {
      // Indent selected lines - handle multi-line selection properly
      const beforeSelection = content.slice(0, selection.start);
      const afterSelection = content.slice(selection.end);

      // Find the start of the first line in selection
      const lineStart = beforeSelection.lastIndexOf("\n") + 1;
      const selectionWithFullLines = content.slice(lineStart, selection.end);

      const lines = selectionWithFullLines.split("\n");
      const indentedLines = lines.map((line) => "  " + line);
      const indentedText = indentedLines.join("\n");

      const newContent =
        content.slice(0, lineStart) + indentedText + afterSelection;
      editor.setValue(newContent);

      // Update selection to include indented text
      editor.setSelection(lineStart, lineStart + indentedText.length);
    } else {
      // Insert tab at cursor
      const newContent =
        content.slice(0, selection.start) +
        "  " +
        content.slice(selection.start);
      editor.setValue(newContent);
      editor.setCursor(selection.start + 2);
    }
  }

  /**
   * Outdent text
   */
  private outdentText(editor: EditorInstance): void {
    const selection = editor.getSelection();
    const content = editor.getValue();

    if (selection.text) {
      // Outdent selected lines
      const lines = selection.text.split("\n");
      const outdentedLines = lines.map((line) => {
        if (line.startsWith("  ")) {
          return line.slice(2);
        } else if (line.startsWith("\t")) {
          return line.slice(1);
        }
        return line;
      });
      const outdentedText = outdentedLines.join("\n");

      const newContent =
        content.slice(0, selection.start) +
        outdentedText +
        content.slice(selection.end);
      editor.setValue(newContent);

      // Update selection
      editor.setSelection(
        selection.start,
        selection.start + outdentedText.length,
      );
    } else {
      // Remove indentation at cursor position
      const lineStart = content.lastIndexOf("\n", selection.start - 1) + 1;
      const lineEnd = content.indexOf("\n", selection.start);
      const lineEndPos = lineEnd === -1 ? content.length : lineEnd;
      const line = content.slice(lineStart, lineEndPos);

      let newLine = line;
      if (line.startsWith("  ")) {
        newLine = line.slice(2);
      } else if (line.startsWith("\t")) {
        newLine = line.slice(1);
      }

      if (newLine !== line) {
        const newContent =
          content.slice(0, lineStart) + newLine + content.slice(lineEndPos);
        editor.setValue(newContent);
        editor.setCursor(selection.start - (line.length - newLine.length));
      }
    }
  }

  /**
   * Insert snippet
   * 사용자 정의 키 조합으로 스니펫 삽입
   */
  private insertSnippet(snippet: Snippet): void {
    if (!this.editorInstance) return;

    const selection = this.editorInstance.getSelection();
    const content = this.editorInstance.getValue();

    // Process snippet content with variables
    let snippetContent = snippet.content;

    // Replace variables if any
    if (snippet.variables) {
      snippet.variables.forEach((variable) => {
        const value = prompt(
          `Enter value for ${variable.name}:`,
          variable.defaultValue || "",
        );
        if (value !== null) {
          snippetContent = snippetContent.replace(
            new RegExp(`\\$\\{${variable.name}\\}`, "g"),
            value,
          );
        }
      });
    }

    // Insert snippet at cursor position
    const newContent =
      content.slice(0, selection.start) +
      snippetContent +
      content.slice(selection.end);
    this.editorInstance.setValue(newContent);

    // Position cursor
    const cursorOffset = snippet.cursorOffset || snippetContent.length;
    this.editorInstance.setCursor(selection.start + cursorOffset);
  }

  /**
   * Add custom shortcut
   * 사용자 정의 키 조합 등록 시스템
   */
  addCustomShortcut(actionId: string, shortcut: KeyboardShortcut): boolean {
    const conflicts = this.keyboardManager.getConflicts();

    // Check for conflicts
    const success = this.keyboardManager.register(
      shortcut,
      () => {
        const action = this.actions.get(actionId);
        if (action && this.editorInstance) {
          action.action(this.editorInstance);
        }
      },
      2, // Higher priority for custom shortcuts
    );

    if (success) {
      this.settings.shortcuts[actionId] = shortcut;
      this.saveSettings();
    }

    return success;
  }

  /**
   * Remove custom shortcut
   */
  removeCustomShortcut(actionId: string): void {
    const shortcut = this.settings.shortcuts[actionId];
    if (shortcut) {
      this.keyboardManager.unregister(shortcut);
      delete this.settings.shortcuts[actionId];
      this.saveSettings();
    }
  }

  /**
   * Add custom snippet with shortcut
   * 스니펫 설정 저장 및 복원
   */
  addCustomSnippet(snippet: Snippet): boolean {
    if (snippet.shortcut) {
      const shortcut = this.keyboardManager.parseShortcut(snippet.shortcut);
      const success = this.keyboardManager.register(
        shortcut,
        () => this.insertSnippet(snippet),
        2,
      );

      if (success) {
        this.settings.customSnippets.push(snippet);
        this.saveSettings();
        return true;
      }
    }
    return false;
  }

  /**
   * Remove custom snippet
   */
  removeCustomSnippet(snippetId: string): void {
    const snippetIndex = this.settings.customSnippets.findIndex(
      (s) => s.id === snippetId,
    );
    if (snippetIndex > -1) {
      const snippet = this.settings.customSnippets[snippetIndex];
      if (snippet.shortcut) {
        const shortcut = this.keyboardManager.parseShortcut(snippet.shortcut);
        this.keyboardManager.unregister(shortcut);
      }
      this.settings.customSnippets.splice(snippetIndex, 1);
      this.saveSettings();
    }
  }

  /**
   * Get all available actions
   */
  getActions(): ShortcutAction[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get conflicts for resolution
   * 키 충돌 감지 및 해결 로직
   */
  getConflicts() {
    return this.keyboardManager.getConflicts();
  }

  /**
   * Resolve shortcut conflict
   */
  resolveConflict(conflictKey: string, keepNew: boolean): void {
    this.keyboardManager.resolveConflict(conflictKey, keepNew);
  }

  /**
   * Get current settings
   */
  getSettings(): ShortcutSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<ShortcutSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    // Re-register shortcuts with new settings
    this.keyboardManager = new KeyboardManager();
    this.registerShortcuts();
  }

  /**
   * Load settings from localStorage
   * 단축키 설정 저장 및 복원
   */
  private loadSettings(): ShortcutSettings {
    try {
      const stored = localStorage.getItem("editor-keyboard-shortcuts");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to load keyboard shortcut settings:", error);
    }

    return {
      shortcuts: {},
      enabled: true,
      customSnippets: [],
    };
  }

  /**
   * Save settings to localStorage
   * 단축키 설정 저장 및 복원
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(
        "editor-keyboard-shortcuts",
        JSON.stringify(this.settings),
      );
    } catch (error) {
      console.warn("Failed to save keyboard shortcut settings:", error);
    }
  }

  /**
   * Reset to default settings
   */
  resetToDefaults(): void {
    this.settings = {
      shortcuts: {},
      enabled: true,
      customSnippets: [],
    };
    this.saveSettings();

    // Re-register with defaults
    this.keyboardManager = new KeyboardManager();
    this.registerShortcuts();
  }

  /**
   * Enable or disable shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.saveSettings();

    if (enabled) {
      this.registerShortcuts();
    } else {
      // Clear all shortcuts
      this.keyboardManager = new KeyboardManager();
    }
  }
}
