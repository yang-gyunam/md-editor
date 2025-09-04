// Snippet storage and persistence utilities

import type { Snippet, SnippetSettings } from "../types/template.js";
import { DEFAULT_SNIPPET_SETTINGS } from "./snippet.js";

const SNIPPETS_STORAGE_KEY = "html-markdown-editor-snippets";
const SNIPPET_SETTINGS_STORAGE_KEY = "html-markdown-editor-snippet-settings";

/**
 * Load snippets from local storage
 */
export function loadSnippets(): Snippet[] {
  try {
    const stored = localStorage.getItem(SNIPPETS_STORAGE_KEY);
    if (!stored) return getDefaultSnippets();

    const snippets = JSON.parse(stored) as Snippet[];
    return Array.isArray(snippets) ? snippets : getDefaultSnippets();
  } catch (error) {
    console.warn("Failed to load snippets from storage:", error);
    return getDefaultSnippets();
  }
}

/**
 * Save snippets to local storage
 */
export function saveSnippets(snippets: Snippet[]): void {
  try {
    localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(snippets));
  } catch (error) {
    console.error("Failed to save snippets to storage:", error);
  }
}

/**
 * Load snippet settings from local storage
 */
export function loadSnippetSettings(): SnippetSettings {
  try {
    const stored = localStorage.getItem(SNIPPET_SETTINGS_STORAGE_KEY);
    if (!stored) return DEFAULT_SNIPPET_SETTINGS;

    const settings = JSON.parse(stored) as SnippetSettings;
    return { ...DEFAULT_SNIPPET_SETTINGS, ...settings };
  } catch (error) {
    console.warn("Failed to load snippet settings from storage:", error);
    return DEFAULT_SNIPPET_SETTINGS;
  }
}

/**
 * Save snippet settings to local storage
 */
export function saveSnippetSettings(settings: SnippetSettings): void {
  try {
    localStorage.setItem(
      SNIPPET_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  } catch (error) {
    console.error("Failed to save snippet settings to storage:", error);
  }
}

/**
 * Get default snippets for initial setup
 */
export function getDefaultSnippets(): Snippet[] {
  return [
    {
      id: "snippet_bold",
      name: "Bold Text",
      description: "Make text bold",
      shortcut: "Ctrl+B",
      content: "**${1:bold text}**",
      category: "Markdown",
      createdAt: Date.now(),
      useCount: 0,
    },
    {
      id: "snippet_italic",
      name: "Italic Text",
      description: "Make text italic",
      shortcut: "Ctrl+I",
      content: "*${1:italic text}*",
      category: "Markdown",
      createdAt: Date.now(),
      useCount: 0,
    },
    {
      id: "snippet_link",
      name: "Link",
      description: "Insert a link",
      shortcut: "Ctrl+K",
      content: "[${1:link text}](${2:url})",
      category: "Markdown",
      createdAt: Date.now(),
      useCount: 0,
    },
    {
      id: "snippet_code_block",
      name: "Code Block",
      description: "Insert a code block",
      shortcut: "Ctrl+Shift+C",
      content: "```${1:language}\n${2:code}\n```",
      category: "Markdown",
      createdAt: Date.now(),
      useCount: 0,
    },
    {
      id: "snippet_table",
      name: "Table",
      description: "Insert a markdown table",
      shortcut: "Ctrl+T",
      content:
        "| ${1:Header 1} | ${2:Header 2} |\n|-------------|-------------|\n| ${3:Cell 1}  | ${4:Cell 2}  |",
      category: "Markdown",
      createdAt: Date.now(),
      useCount: 0,
    },
    {
      id: "snippet_html_div",
      name: "HTML Div",
      description: "Insert a div element",
      shortcut: "Ctrl+D",
      content: '<div${1: class="${2:class-name}"}>\n  ${3:content}\n</div>',
      category: "HTML",
      createdAt: Date.now(),
      useCount: 0,
    },
    {
      id: "snippet_html_button",
      name: "HTML Button",
      description: "Insert a button element",
      shortcut: "Ctrl+Shift+B",
      content:
        '<button${1: type="${2:button}"} ${3:onclick="${4:handleClick()}"}>\n  ${5:Button Text}\n</button>',
      category: "HTML",
      createdAt: Date.now(),
      useCount: 0,
    },
  ];
}

/**
 * Export snippets to JSON format
 */
export function exportSnippets(snippets: Snippet[]): string {
  const exportData = {
    version: "1.0.0",
    timestamp: Date.now(),
    snippets: snippets,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import snippets from JSON format
 */
export function importSnippets(jsonData: string): Snippet[] {
  try {
    const data = JSON.parse(jsonData);

    if (data.snippets && Array.isArray(data.snippets)) {
      return data.snippets.map((snippet: Record<string, unknown>) => ({
        id:
          snippet.id ||
          `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: snippet.name || "Imported Snippet",
        description: snippet.description,
        shortcut: snippet.shortcut || "",
        content: snippet.content || "",
        category: snippet.category || "General",
        createdAt: snippet.createdAt || Date.now(),
        useCount: snippet.useCount || 0,
        lastUsed: snippet.lastUsed,
      }));
    }

    throw new Error("Invalid snippet format");
  } catch (error) {
    throw new Error(
      `Failed to import snippets: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Clear all snippets from storage
 */
export function clearSnippets(): void {
  try {
    localStorage.removeItem(SNIPPETS_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear snippets from storage:", error);
  }
}

/**
 * Clear snippet settings from storage
 */
export function clearSnippetSettings(): void {
  try {
    localStorage.removeItem(SNIPPET_SETTINGS_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear snippet settings from storage:", error);
  }
}
