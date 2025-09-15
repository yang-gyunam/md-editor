// Type guard utilities for runtime type checking
// 타입 안전성 개선

import type {
  FormatAction,
  EditorInstance,
  Template,
  Snippet,
  EditorMode,
  EditorError,
} from "../types/index.js";

/**
 * Type guard for FormatAction
 */
export function isFormatAction(value: unknown): value is FormatAction {
  if (!value || typeof value !== "object") return false;

  const action = value as Record<string, unknown>;

  return (
    typeof action.type === "string" &&
    ["wrap", "insert", "replace"].includes(action.type) &&
    typeof action.before === "string"
  );
}

/**
 * Type guard for EditorInstance
 */
export function isEditorInstance(value: unknown): value is EditorInstance {
  if (!value || typeof value !== "object") return false;

  const instance = value as Record<string, unknown>;

  return (
    typeof instance.insertText === "function" &&
    typeof instance.wrapSelection === "function" &&
    typeof instance.getSelection === "function" &&
    typeof instance.setCursor === "function" &&
    typeof instance.focus === "function"
  );
}

/**
 * Type guard for Template
 */
export function isTemplate(value: unknown): value is Template {
  if (!value || typeof value !== "object") return false;

  const template = value as Record<string, unknown>;

  return (
    typeof template.id === "string" &&
    typeof template.name === "string" &&
    typeof template.content === "string"
  );
}

/**
 * Type guard for Snippet
 */
export function isSnippet(value: unknown): value is Snippet {
  if (!value || typeof value !== "object") return false;

  const snippet = value as Record<string, unknown>;

  return (
    typeof snippet.id === "string" &&
    typeof snippet.name === "string" &&
    typeof snippet.shortcut === "string" &&
    typeof snippet.content === "string"
  );
}

/**
 * Type guard for EditorMode
 */
export function isEditorMode(value: unknown): value is EditorMode {
  return value === "html" || value === "markdown";
}

/**
 * Type guard for EditorError
 */
export function isEditorError(value: unknown): value is EditorError {
  if (!value || typeof value !== "object") return false;

  const error = value as Record<string, unknown>;

  return (
    typeof error.type === "string" &&
    ["validation", "parsing", "rendering"].includes(error.type) &&
    typeof error.message === "string"
  );
}

/**
 * Type guard for arrays of specific types
 */
export function isArrayOf<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T,
): value is T[] {
  return Array.isArray(value) && value.every(itemGuard);
}

/**
 * Type guard for keyboard event
 */
export function isKeyboardEvent(value: unknown): value is KeyboardEvent {
  return value instanceof KeyboardEvent;
}

/**
 * Type guard for HTML element
 */
export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

/**
 * Type guard for text selection
 */
export function isTextSelection(
  value: unknown,
): value is { start: number; end: number; text: string } {
  if (!value || typeof value !== "object") return false;

  const selection = value as Record<string, unknown>;

  return (
    typeof selection.start === "number" &&
    typeof selection.end === "number" &&
    typeof selection.text === "string" &&
    selection.start >= 0 &&
    selection.end >= selection.start
  );
}

/**
 * Safe type assertion with fallback
 */
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  fallback: T,
  errorMessage?: string,
): T {
  if (guard(value)) {
    return value;
  }

  if (errorMessage) {
    console.warn(errorMessage, value);
  }

  return fallback;
}

/**
 * Safe property access with type checking
 */
export function safeGet<T>(
  obj: unknown,
  key: string,
  guard: (value: unknown) => value is T,
  fallback: T,
): T {
  if (!obj || typeof obj !== "object") return fallback;

  const value = (obj as Record<string, unknown>)[key];
  return guard(value) ? value : fallback;
}
