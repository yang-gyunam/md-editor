// Snippet management utilities

import type {
  Snippet,
  SnippetPlaceholder,
  SnippetInsertionResult,
  SnippetSettings,
} from "../types/template.js";

/**
 * Default snippet settings
 */
export const DEFAULT_SNIPPET_SETTINGS: SnippetSettings = {
  enableSnippets: true,
  triggerKey: "Ctrl+Space",
  maxRecentSnippets: 10,
  categories: ["General", "HTML", "Markdown", "Code"],
  customShortcuts: {},
};

/**
 * Parse placeholders from snippet content
 * Placeholders are in the format ${1:placeholder} or ${1}
 */
export function parsePlaceholders(content: string): SnippetPlaceholder[] {
  const placeholders: SnippetPlaceholder[] = [];
  const regex = /\$\{(\d+)(?::([^}]*))?\}/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const tabIndex = parseInt(match[1], 10);
    const defaultValue = match[2] || "";

    placeholders.push({
      name: `placeholder_${tabIndex}`,
      start: match.index,
      end: match.index + match[0].length,
      defaultValue,
      tabIndex,
    });
  }

  // Sort by tab index
  return placeholders.sort((a, b) => a.tabIndex - b.tabIndex);
}

/**
 * Insert snippet content at cursor position with placeholder processing
 */
export function insertSnippet(
  originalContent: string,
  cursorPosition: number,
  snippet: Snippet,
): SnippetInsertionResult {
  const placeholders = parsePlaceholders(snippet.content);
  let processedContent = snippet.content;

  // Replace placeholders with their default values
  const adjustedPlaceholders: SnippetPlaceholder[] = [];
  let offset = 0;

  for (const placeholder of placeholders) {
    const replacement = placeholder.defaultValue || "";
    const adjustedStart = placeholder.start + offset;
    const adjustedEnd = placeholder.end + offset;

    processedContent =
      processedContent.slice(0, adjustedStart) +
      replacement +
      processedContent.slice(adjustedEnd);

    // Adjust placeholder positions
    adjustedPlaceholders.push({
      ...placeholder,
      start: cursorPosition + adjustedStart,
      end: cursorPosition + adjustedStart + replacement.length,
    });

    offset += replacement.length - (placeholder.end - placeholder.start);
  }

  // Insert processed content into original content
  const newContent =
    originalContent.slice(0, cursorPosition) +
    processedContent +
    originalContent.slice(cursorPosition);

  // Calculate cursor position
  let newCursorPosition = cursorPosition + processedContent.length;

  // If there are placeholders, position cursor at first placeholder
  if (adjustedPlaceholders.length > 0) {
    const firstPlaceholder = adjustedPlaceholders[0];
    newCursorPosition = firstPlaceholder.start;
  } else if (snippet.cursorOffset !== undefined) {
    newCursorPosition = cursorPosition + snippet.cursorOffset;
  }

  return {
    content: newContent,
    cursorPosition: newCursorPosition,
    placeholders: adjustedPlaceholders,
    activeTabIndex:
      adjustedPlaceholders.length > 0 ? adjustedPlaceholders[0].tabIndex : -1,
  };
}

/**
 * Navigate to next placeholder
 */
export function navigateToNextPlaceholder(
  placeholders: SnippetPlaceholder[],
  currentTabIndex: number,
): number {
  const nextPlaceholder = placeholders.find(
    (p) => p.tabIndex > currentTabIndex,
  );
  return nextPlaceholder ? nextPlaceholder.start : -1;
}

/**
 * Navigate to previous placeholder
 */
export function navigateToPreviousPlaceholder(
  placeholders: SnippetPlaceholder[],
  currentTabIndex: number,
): number {
  const sortedPlaceholders = [...placeholders].sort(
    (a, b) => b.tabIndex - a.tabIndex,
  );
  const prevPlaceholder = sortedPlaceholders.find(
    (p) => p.tabIndex < currentTabIndex,
  );
  return prevPlaceholder ? prevPlaceholder.start : -1;
}

/**
 * Filter snippets by search term
 */
export function filterSnippets(
  snippets: Snippet[],
  searchTerm: string,
): Snippet[] {
  if (!searchTerm.trim()) {
    return snippets;
  }

  const term = searchTerm.toLowerCase();
  return snippets.filter(
    (snippet) =>
      snippet.name.toLowerCase().includes(term) ||
      snippet.description?.toLowerCase().includes(term) ||
      snippet.shortcut.toLowerCase().includes(term) ||
      snippet.content.toLowerCase().includes(term),
  );
}

/**
 * Sort snippets by usage frequency and recency
 */
export function sortSnippetsByUsage(snippets: Snippet[]): Snippet[] {
  return [...snippets].sort((a, b) => {
    // First sort by use count (descending)
    const useCountDiff = (b.useCount || 0) - (a.useCount || 0);
    if (useCountDiff !== 0) return useCountDiff;

    // Then by last used (descending)
    const lastUsedDiff = (b.lastUsed || 0) - (a.lastUsed || 0);
    if (lastUsedDiff !== 0) return lastUsedDiff;

    // Finally by name (ascending)
    return a.name.localeCompare(b.name);
  });
}

/**
 * Validate snippet shortcut
 */
export function validateSnippetShortcut(
  shortcut: string,
  existingShortcuts: string[],
  excludeId?: string,
): { isValid: boolean; error?: string } {
  if (!shortcut.trim()) {
    return { isValid: false, error: "Shortcut cannot be empty" };
  }

  if (shortcut.length < 2) {
    return {
      isValid: false,
      error: "Shortcut must be at least 2 characters long",
    };
  }

  if (existingShortcuts.includes(shortcut)) {
    return { isValid: false, error: "Shortcut already exists" };
  }

  // Check for invalid characters
  if (!/^[a-zA-Z0-9+\-_]+$/.test(shortcut)) {
    return { isValid: false, error: "Shortcut contains invalid characters" };
  }

  return { isValid: true };
}

/**
 * Generate unique snippet ID
 */
export function generateSnippetId(): string {
  return `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Update snippet usage statistics
 */
export function updateSnippetUsage(snippet: Snippet): Snippet {
  return {
    ...snippet,
    useCount: (snippet.useCount || 0) + 1,
    lastUsed: Date.now(),
  };
}
