import { describe, it, expect } from "vitest";
import {
  parsePlaceholders,
  insertSnippet,
  navigateToNextPlaceholder,
  navigateToPreviousPlaceholder,
  filterSnippets,
  sortSnippetsByUsage,
  validateSnippetShortcut,
  generateSnippetId,
  updateSnippetUsage,
} from "./snippet.js";
import type { Snippet } from "../types/template.js";

describe("Snippet Utilities", () => {
  describe("parsePlaceholders", () => {
    it("should parse simple placeholders", () => {
      const content = "Hello ${1:world}!";
      const placeholders = parsePlaceholders(content);

      expect(placeholders).toHaveLength(1);
      expect(placeholders[0]).toEqual({
        name: "placeholder_1",
        start: 6,
        end: 16,
        defaultValue: "world",
        tabIndex: 1,
      });
    });

    it("should parse multiple placeholders", () => {
      const content = "${1:first} and ${2:second}";
      const placeholders = parsePlaceholders(content);

      expect(placeholders).toHaveLength(2);
      expect(placeholders[0].tabIndex).toBe(1);
      expect(placeholders[1].tabIndex).toBe(2);
    });

    it("should parse placeholders without default values", () => {
      const content = "Click ${1} here";
      const placeholders = parsePlaceholders(content);

      expect(placeholders).toHaveLength(1);
      expect(placeholders[0].defaultValue).toBe("");
    });

    it("should sort placeholders by tab index", () => {
      const content = "${3:third} ${1:first} ${2:second}";
      const placeholders = parsePlaceholders(content);

      expect(placeholders.map((p) => p.tabIndex)).toEqual([1, 2, 3]);
    });
  });

  describe("insertSnippet", () => {
    it("should insert snippet at cursor position", () => {
      const originalContent = "Hello world";
      const cursorPosition = 6;
      const snippet: Snippet = {
        id: "test",
        name: "Test",
        shortcut: "",
        content: "beautiful ",
      };

      const result = insertSnippet(originalContent, cursorPosition, snippet);

      expect(result.content).toBe("Hello beautiful world");
      expect(result.cursorPosition).toBe(16);
    });

    it("should handle placeholders in snippet content", () => {
      const originalContent = "Hello ";
      const cursorPosition = 6;
      const snippet: Snippet = {
        id: "test",
        name: "Test",
        shortcut: "",
        content: "${1:name}!",
      };

      const result = insertSnippet(originalContent, cursorPosition, snippet);

      expect(result.content).toBe("Hello name!");
      expect(result.cursorPosition).toBe(6); // At start of first placeholder
      expect(result.placeholders).toHaveLength(1);
    });

    it("should use cursor offset when provided", () => {
      const originalContent = "Hello ";
      const cursorPosition = 6;
      const snippet: Snippet = {
        id: "test",
        name: "Test",
        shortcut: "",
        content: "world",
        cursorOffset: 2,
      };

      const result = insertSnippet(originalContent, cursorPosition, snippet);

      expect(result.content).toBe("Hello world");
      expect(result.cursorPosition).toBe(8); // 6 + 2
    });
  });

  describe("navigateToNextPlaceholder", () => {
    it("should find next placeholder", () => {
      const placeholders = [
        { name: "p1", start: 0, end: 5, tabIndex: 1 },
        { name: "p2", start: 10, end: 15, tabIndex: 2 },
        { name: "p3", start: 20, end: 25, tabIndex: 3 },
      ];

      const nextPosition = navigateToNextPlaceholder(placeholders, 1);
      expect(nextPosition).toBe(10);
    });

    it("should return -1 when no next placeholder", () => {
      const placeholders = [{ name: "p1", start: 0, end: 5, tabIndex: 1 }];

      const nextPosition = navigateToNextPlaceholder(placeholders, 1);
      expect(nextPosition).toBe(-1);
    });
  });

  describe("filterSnippets", () => {
    const snippets: Snippet[] = [
      {
        id: "1",
        name: "Bold Text",
        description: "Make text bold",
        shortcut: "Ctrl+B",
        content: "**${1:text}**",
        category: "Markdown",
      },
      {
        id: "2",
        name: "HTML Div",
        description: "Create a div element",
        shortcut: "Ctrl+D",
        content: "<div>${1:content}</div>",
        category: "HTML",
      },
    ];

    it("should filter by name", () => {
      const filtered = filterSnippets(snippets, "bold");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Bold Text");
    });

    it("should filter by description", () => {
      const filtered = filterSnippets(snippets, "div element");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("HTML Div");
    });

    it("should filter by shortcut", () => {
      const filtered = filterSnippets(snippets, "Ctrl+B");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Bold Text");
    });

    it("should return all snippets for empty search", () => {
      const filtered = filterSnippets(snippets, "");
      expect(filtered).toHaveLength(2);
    });
  });

  describe("sortSnippetsByUsage", () => {
    it("should sort by use count descending", () => {
      const snippets: Snippet[] = [
        { id: "1", name: "A", shortcut: "", content: "", useCount: 1 },
        { id: "2", name: "B", shortcut: "", content: "", useCount: 5 },
        { id: "3", name: "C", shortcut: "", content: "", useCount: 3 },
      ];

      const sorted = sortSnippetsByUsage(snippets);
      expect(sorted.map((s) => s.useCount)).toEqual([5, 3, 1]);
    });

    it("should sort by last used when use count is equal", () => {
      const snippets: Snippet[] = [
        {
          id: "1",
          name: "A",
          shortcut: "",
          content: "",
          useCount: 1,
          lastUsed: 100,
        },
        {
          id: "2",
          name: "B",
          shortcut: "",
          content: "",
          useCount: 1,
          lastUsed: 200,
        },
        {
          id: "3",
          name: "C",
          shortcut: "",
          content: "",
          useCount: 1,
          lastUsed: 150,
        },
      ];

      const sorted = sortSnippetsByUsage(snippets);
      expect(sorted.map((s) => s.lastUsed)).toEqual([200, 150, 100]);
    });

    it("should sort by name when usage is equal", () => {
      const snippets: Snippet[] = [
        { id: "1", name: "C", shortcut: "", content: "" },
        { id: "2", name: "A", shortcut: "", content: "" },
        { id: "3", name: "B", shortcut: "", content: "" },
      ];

      const sorted = sortSnippetsByUsage(snippets);
      expect(sorted.map((s) => s.name)).toEqual(["A", "B", "C"]);
    });
  });

  describe("validateSnippetShortcut", () => {
    const existingShortcuts = ["Ctrl+B", "Ctrl+I", "Ctrl+K"];

    it("should validate unique shortcut", () => {
      const result = validateSnippetShortcut("Ctrl+U", existingShortcuts);
      expect(result.isValid).toBe(true);
    });

    it("should reject empty shortcut", () => {
      const result = validateSnippetShortcut("", existingShortcuts);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Shortcut cannot be empty");
    });

    it("should reject short shortcut", () => {
      const result = validateSnippetShortcut("A", existingShortcuts);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Shortcut must be at least 2 characters long");
    });

    it("should reject duplicate shortcut", () => {
      const result = validateSnippetShortcut("Ctrl+B", existingShortcuts);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Shortcut already exists");
    });

    it("should reject invalid characters", () => {
      const result = validateSnippetShortcut("Ctrl+@", existingShortcuts);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Shortcut contains invalid characters");
    });
  });

  describe("generateSnippetId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateSnippetId();
      const id2 = generateSnippetId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^snippet_\d+_[a-z0-9]+$/);
    });
  });

  describe("updateSnippetUsage", () => {
    it("should increment use count", () => {
      const snippet: Snippet = {
        id: "test",
        name: "Test",
        shortcut: "",
        content: "",
        useCount: 5,
      };

      const updated = updateSnippetUsage(snippet);
      expect(updated.useCount).toBe(6);
      expect(updated.lastUsed).toBeTypeOf("number");
    });

    it("should initialize use count if undefined", () => {
      const snippet: Snippet = {
        id: "test",
        name: "Test",
        shortcut: "",
        content: "",
      };

      const updated = updateSnippetUsage(snippet);
      expect(updated.useCount).toBe(1);
    });
  });
});
