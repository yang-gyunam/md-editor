// Format action utilities for text selection and formatting
// 서식 액션 시스템

import type { FormatAction, EditorInstance } from "../types/index.js";
import {
  isFormatAction,
  isEditorInstance,
  isTextSelection,
} from "./typeGuards.js";

export interface TextSelection {
  start: number;
  end: number;
  text: string;
}

export interface FormatContext {
  content: string;
  selection: TextSelection;
  cursorPosition: number;
}

export interface FormatResult {
  content: string;
  cursorPosition: number;
  selectionStart?: number;
  selectionEnd?: number;
}

/**
 * Apply a format action to text content
 * 서식 버튼 클릭 시 적절한 구문 삽입
 * 선택된 텍스트를 적절한 마크업으로 감싸기
 */
export function applyFormatAction(
  action: FormatAction,
  context: FormatContext,
): FormatResult {
  const { content, selection, cursorPosition } = context;

  switch (action.type) {
    case "wrap":
      return applyWrapAction(action, context);
    case "insert":
      return applyInsertAction(action, context);
    case "replace":
      return applyReplaceAction(action, context);
    default:
      throw new Error(`Unknown format action type: ${action.type}`);
  }
}

/**
 * Apply wrap formatting (e.g., **bold**, _italic_)
 * 선택된 텍스트를 적절한 마크업으로 감싸기
 */
function applyWrapAction(
  action: FormatAction,
  context: FormatContext,
): FormatResult {
  const { content, selection } = context;
  const { before, after = "", placeholder = "" } = action;

  if (selection.text) {
    // Wrap selected text
    const beforeSelection = content.slice(0, selection.start);
    const afterSelection = content.slice(selection.end);
    const wrappedText = before + selection.text + after;

    return {
      content: beforeSelection + wrappedText + afterSelection,
      cursorPosition: selection.end + before.length + after.length,
      selectionStart: selection.start + before.length,
      selectionEnd: selection.end + before.length,
    };
  } else {
    // Insert placeholder text with formatting
    const beforeCursor = content.slice(0, selection.start);
    const afterCursor = content.slice(selection.start);
    const insertText = before + placeholder + after;

    return {
      content: beforeCursor + insertText + afterCursor,
      cursorPosition: selection.start + before.length,
      selectionStart: selection.start + before.length,
      selectionEnd: selection.start + before.length + placeholder.length,
    };
  }
}

/**
 * Apply insert formatting (e.g., # Header, - List item)
 * Markdown 서식 액션 (헤더, 목록)
 */
function applyInsertAction(
  action: FormatAction,
  context: FormatContext,
): FormatResult {
  const { content, selection } = context;
  const { before, placeholder = "" } = action;

  // For insert actions, we typically want to insert at the beginning of a line
  const lines = content.split("\n");
  const beforeCursor = content.slice(0, selection.start);
  const lineStart = beforeCursor.lastIndexOf("\n") + 1;
  const currentLineIndex = beforeCursor.split("\n").length - 1;

  if (selection.text) {
    // If text is selected, apply formatting to each line
    const selectedLines = selection.text.split("\n");
    const formattedLines = selectedLines.map((line) => {
      // Don't add formatting if line already has it
      if (line.trim().startsWith(before.trim())) {
        return line;
      }
      return before + line;
    });

    const beforeSelection = content.slice(0, selection.start);
    const afterSelection = content.slice(selection.end);
    const formattedText = formattedLines.join("\n");

    return {
      content: beforeSelection + formattedText + afterSelection,
      cursorPosition: selection.start + formattedText.length,
    };
  } else {
    // Insert at current line
    const currentLine = lines[currentLineIndex] || "";

    // Check if line already has the formatting
    if (currentLine.trim().startsWith(before.trim())) {
      // Remove formatting
      const newLine = currentLine.replace(
        new RegExp(`^\\s*${escapeRegExp(before.trim())}\\s*`),
        "",
      );
      lines[currentLineIndex] = newLine;

      return {
        content: lines.join("\n"),
        cursorPosition: selection.start - before.length,
      };
    } else {
      // Add formatting
      const insertText = before + placeholder;
      const beforeCursor = content.slice(0, lineStart);
      const afterCursor = content.slice(lineStart);

      return {
        content: beforeCursor + insertText + afterCursor,
        cursorPosition: lineStart + before.length,
        selectionStart: lineStart + before.length,
        selectionEnd: lineStart + before.length + placeholder.length,
      };
    }
  }
}

/**
 * Apply replace formatting (replace current word/selection)
 */
function applyReplaceAction(
  action: FormatAction,
  context: FormatContext,
): FormatResult {
  const { content, selection } = context;
  const { before, placeholder = "" } = action;

  if (selection.text) {
    // Replace selected text
    const beforeSelection = content.slice(0, selection.start);
    const afterSelection = content.slice(selection.end);
    const replacementText = before + placeholder;

    return {
      content: beforeSelection + replacementText + afterSelection,
      cursorPosition: selection.start + replacementText.length,
    };
  } else {
    // Insert at cursor position
    const beforeCursor = content.slice(0, selection.start);
    const afterCursor = content.slice(selection.start);
    const insertText = before + placeholder;

    return {
      content: beforeCursor + insertText + afterCursor,
      cursorPosition: selection.start + before.length,
      selectionStart: selection.start + before.length,
      selectionEnd: selection.start + before.length + placeholder.length,
    };
  }
}

/**
 * Get text selection from editor instance
 */
export function getTextSelection(
  editorInstance: EditorInstance,
): TextSelection {
  return editorInstance.getSelection();
}

/**
 * Apply format result to editor instance
 */
export function applyFormatResult(
  editorInstance: unknown,
  result: FormatResult,
): void {
  if (!isEditorInstance(editorInstance)) {
    throw new Error("Invalid editor instance provided");
  }

  try {
    // Update content if setValue is available
    if (editorInstance.setValue) {
      editorInstance.setValue(result.content);
    }

    // Set cursor position or selection
    if (
      result.selectionStart !== undefined &&
      result.selectionEnd !== undefined
    ) {
      // Set selection if specified
      editorInstance.setCursor(result.selectionStart);
      // TODO: Implement setSelection when available in EditorInstance
    } else {
      editorInstance.setCursor(result.cursorPosition);
    }

    editorInstance.focus();
  } catch (error) {
    console.error("Error applying format result:", error);
    throw new Error("Failed to apply formatting changes to editor");
  }
}

/**
 * Check if a format action can be applied (e.g., for button state)
 */
export function canApplyFormat(
  action: FormatAction,
  context: FormatContext,
): boolean {
  // Basic validation
  if (!context.content || !context.selection) {
    return false;
  }

  // Validate selection bounds
  const { start, end } = context.selection;
  if (start < 0 || end < start || end > context.content.length) {
    return false;
  }

  // Action-specific validation
  switch (action.type) {
    case "wrap":
      // Wrap actions need valid before/after markers
      return Boolean(action.before);

    case "insert":
      // Insert actions need valid before text
      return Boolean(action.before);

    case "replace":
      // Replace actions need valid before text
      return Boolean(action.before);

    default:
      return false;
  }
}

/**
 * Get format action state (e.g., is bold currently applied?)
 */
export function getFormatState(
  action: FormatAction,
  context: FormatContext,
): boolean {
  const { content, selection } = context;

  if (action.type === "wrap") {
    const { before, after = "" } = action;

    if (selection.text) {
      // Check if selected text is already wrapped
      return (
        selection.text.startsWith(before) && selection.text.endsWith(after)
      );
    } else {
      // Check if cursor is within wrapped text
      const beforeCursor = content.slice(0, selection.start);
      const afterCursor = content.slice(selection.start);

      // Look for the format markers around the cursor
      const beforeMatch = beforeCursor.lastIndexOf(before);
      const afterMatch = afterCursor.indexOf(after);

      if (beforeMatch !== -1 && afterMatch !== -1) {
        // Check if there's no other closing marker between cursor and the found one
        const textBetween = beforeCursor.slice(beforeMatch + before.length);
        return !textBetween.includes(after);
      }
    }
  }

  if (action.type === "insert") {
    // Check if current line starts with the format
    const lineInfo = TextSelectionUtils.getCurrentLineInfo(
      content,
      selection.start,
    );
    return lineInfo.lineContent.trim().startsWith(action.before.trim());
  }

  return false;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Smart text selection utilities
 */
export class TextSelectionUtils {
  /**
   * Expand selection to word boundaries
   */
  static expandToWordBoundaries(
    content: string,
    selection: TextSelection,
  ): TextSelection {
    const { start, end } = selection;

    // Find word start
    let wordStart = start;
    while (wordStart > 0 && /\w/.test(content[wordStart - 1])) {
      wordStart--;
    }

    // Find word end
    let wordEnd = end;
    while (wordEnd < content.length && /\w/.test(content[wordEnd])) {
      wordEnd++;
    }

    return {
      start: wordStart,
      end: wordEnd,
      text: content.slice(wordStart, wordEnd),
    };
  }

  /**
   * Expand selection to line boundaries
   */
  static expandToLineBoundaries(
    content: string,
    selection: TextSelection,
  ): TextSelection {
    const { start, end } = selection;

    // Find line start
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;

    // Find line end
    let lineEnd = content.indexOf("\n", end);
    if (lineEnd === -1) lineEnd = content.length;

    return {
      start: lineStart,
      end: lineEnd,
      text: content.slice(lineStart, lineEnd),
    };
  }

  /**
   * Get current line info
   */
  static getCurrentLineInfo(content: string, cursorPosition: number) {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);

    const lineStart = beforeCursor.lastIndexOf("\n") + 1;
    const lineEnd = afterCursor.indexOf("\n");
    const lineEndPos =
      lineEnd === -1 ? content.length : cursorPosition + lineEnd;

    const lineContent = content.slice(lineStart, lineEndPos);
    const lineNumber = beforeCursor.split("\n").length;
    const columnNumber = cursorPosition - lineStart;

    return {
      lineNumber,
      columnNumber,
      lineStart,
      lineEnd: lineEndPos,
      lineContent,
      isEmptyLine: lineContent.trim().length === 0,
    };
  }
}

/**
 * Validate format action and context before applying
 */
export function validateFormatAction(
  action: unknown,
  context: unknown,
): { valid: boolean; error?: string } {
  if (!isFormatAction(action)) {
    return { valid: false, error: "Invalid format action provided" };
  }

  if (!context || typeof context !== "object") {
    return { valid: false, error: "Format context is required" };
  }

  const formatContext = context as FormatContext;
  if (!isTextSelection(formatContext.selection)) {
    return { valid: false, error: "Invalid text selection in context" };
  }

  if (!canApplyFormat(action, formatContext)) {
    return {
      valid: false,
      error: "Format action cannot be applied in current context",
    };
  }

  return { valid: true };
}

/**
 * Safe format action application with error handling
 */
export function safeApplyFormatAction(
  action: FormatAction,
  context: FormatContext,
): { success: boolean; result?: FormatResult; error?: string } {
  try {
    const validation = validateFormatAction(action, context);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const result = applyFormatAction(action, context);
    return { success: true, result };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: `Failed to apply format: ${errorMessage}` };
  }
}

/**
 * Format action presets for common operations
 */
export const FORMAT_PRESETS = {
  // Toggle formatting (apply if not present, remove if present)
  toggleBold: (context: FormatContext, mode: "markdown" | "html") => {
    const action =
      mode === "markdown"
        ? {
            type: "wrap" as const,
            before: "**",
            after: "**",
            placeholder: "bold text",
          }
        : {
            type: "wrap" as const,
            before: "<strong>",
            after: "</strong>",
            placeholder: "bold text",
          };

    const isActive = getFormatState(action, context);
    if (isActive && context.selection.text) {
      // Remove formatting
      const { before, after = "" } = action;
      const unwrappedText = context.selection.text.slice(
        before.length,
        -after.length || undefined,
      );
      return {
        content:
          context.content.slice(0, context.selection.start) +
          unwrappedText +
          context.content.slice(context.selection.end),
        cursorPosition: context.selection.start + unwrappedText.length,
      };
    } else {
      // Apply formatting
      return applyFormatAction(action, context);
    }
  },
};
