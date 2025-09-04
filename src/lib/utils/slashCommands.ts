// Slash command handling utilities

import type { Template } from "../types/index.js";
import { processTemplate } from "./template.js";

export interface SlashCommandState {
  active: boolean;
  position: number;
  query: string;
  cursorPosition: { x: number; y: number };
}

export interface SlashCommandResult {
  shouldShow: boolean;
  query: string;
  position: number;
  cursorPosition: { x: number; y: number };
}

/**
 * Detect slash command in text input
 */
export function detectSlashCommand(
  text: string,
  cursorPosition: number,
  textareaElement?: HTMLTextAreaElement,
): SlashCommandResult {
  // Find the last slash before cursor position
  let slashIndex = -1;
  for (let i = cursorPosition - 1; i >= 0; i--) {
    const char = text[i];
    if (char === "/") {
      // Check if this slash is at the start of line or after whitespace
      const prevChar = i > 0 ? text[i - 1] : "\n";
      if (prevChar === "\n" || /\s/.test(prevChar)) {
        slashIndex = i;
        break;
      }
    } else if (char === "\n" || char === " ") {
      // Stop searching if we hit a newline or space
      break;
    }
  }

  const shouldShow = slashIndex !== -1 && slashIndex < cursorPosition;
  const query = shouldShow ? text.slice(slashIndex + 1, cursorPosition) : "";

  // Calculate cursor position for popup placement
  let screenPosition = { x: 0, y: 0 };
  if (textareaElement && shouldShow) {
    screenPosition = getTextareaCaretPosition(textareaElement, slashIndex);
  }

  return {
    shouldShow,
    query,
    position: slashIndex,
    cursorPosition: screenPosition,
  };
}

/**
 * Insert template at slash command position
 */
export function insertTemplateAtSlashCommand(
  text: string,
  template: Template,
  slashPosition: number,
  queryLength: number,
  variables?: Record<string, string>,
): { newText: string; newCursorPosition: number } {
  const processed = processTemplate(template, variables);

  // Remove the slash and query text
  const beforeSlash = text.slice(0, slashPosition);
  const afterQuery = text.slice(slashPosition + 1 + queryLength);

  // Insert the processed template content
  const newText = beforeSlash + processed.content + afterQuery;

  // Calculate new cursor position
  let newCursorPosition = slashPosition + processed.content.length;
  if (processed.cursorPosition !== undefined) {
    newCursorPosition = slashPosition + processed.cursorPosition;
  }

  return {
    newText,
    newCursorPosition,
  };
}

/**
 * Get the screen position of a character in a textarea
 */
function getTextareaCaretPosition(
  textarea: HTMLTextAreaElement,
  position: number,
): { x: number; y: number } {
  // Create a temporary div to measure text
  const div = document.createElement("div");
  const style = getComputedStyle(textarea);

  // Copy textarea styles to div
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  div.style.font = style.font;
  div.style.padding = style.padding;
  div.style.border = style.border;
  div.style.width = style.width;
  div.style.height = style.height;
  div.style.lineHeight = style.lineHeight;

  document.body.appendChild(div);

  try {
    // Get text up to the position
    const textBeforePosition = textarea.value.substring(0, position);
    div.textContent = textBeforePosition;

    // Create a span for the character at position
    const span = document.createElement("span");
    span.textContent = textarea.value.charAt(position) || ".";
    div.appendChild(span);

    // Get textarea position
    const textareaRect = textarea.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();

    return {
      x: textareaRect.left + (spanRect.left - div.getBoundingClientRect().left),
      y:
        textareaRect.top +
        (spanRect.top - div.getBoundingClientRect().top) +
        20, // Add some offset
    };
  } finally {
    document.body.removeChild(div);
  }
}

/**
 * Check if slash commands are enabled in current context
 */
export function shouldEnableSlashCommands(
  mode: "html" | "markdown",
  settings: { enableSlashCommands: boolean },
): boolean {
  return settings.enableSlashCommands;
}

/**
 * Get filtered templates for slash command
 */
export function getSlashCommandTemplates(
  templates: Template[],
  query: string,
  mode: "html" | "markdown",
): Template[] {
  let filtered = templates;

  // Filter by mode if needed (could be extended to have mode-specific templates)
  // For now, we show all templates regardless of mode

  // Filter by query
  if (query.trim()) {
    const lowercaseQuery = query.toLowerCase();
    filtered = filtered.filter(
      (template) =>
        template.name.toLowerCase().includes(lowercaseQuery) ||
        template.description?.toLowerCase().includes(lowercaseQuery) ||
        template.category?.toLowerCase().includes(lowercaseQuery),
    );
  }

  return filtered;
}
