// Tests for slash command utilities

import { describe, it, expect } from "vitest";
import {
  detectSlashCommand,
  insertTemplateAtSlashCommand,
  getSlashCommandTemplates,
} from "./slashCommands.js";
import type { Template } from "../types/index.js";

describe("Slash Command Detection", () => {
  it("should detect slash command at start of line", () => {
    const text = "/template";
    const result = detectSlashCommand(text, 9);

    expect(result.shouldShow).toBe(true);
    expect(result.query).toBe("template");
    expect(result.position).toBe(0);
  });

  it("should detect slash command after whitespace", () => {
    const text = "Hello world\n/temp";
    const result = detectSlashCommand(text, 17);

    expect(result.shouldShow).toBe(true);
    expect(result.query).toBe("temp");
    expect(result.position).toBe(12);
  });

  it("should not detect slash in middle of word", () => {
    const text = "Hello/world";
    const result = detectSlashCommand(text, 11);

    expect(result.shouldShow).toBe(false);
  });

  it("should not detect slash after non-whitespace", () => {
    const text = "abc/template";
    const result = detectSlashCommand(text, 12);

    expect(result.shouldShow).toBe(false);
  });

  it("should handle empty query", () => {
    const text = "Hello\n/";
    const result = detectSlashCommand(text, 7);

    expect(result.shouldShow).toBe(true);
    expect(result.query).toBe("");
    expect(result.position).toBe(6);
  });

  it("should stop at newline", () => {
    const text = "Hello\n/temp\nworld";
    const result = detectSlashCommand(text, 17);

    expect(result.shouldShow).toBe(false);
  });
});

describe("Template Insertion", () => {
  const template: Template = {
    id: "test",
    name: "Test Template",
    content: "Hello {{name}}!{{cursor}}",
  };

  it("should insert template at slash position", () => {
    const text = "Start /temp end";
    const result = insertTemplateAtSlashCommand(text, template, 6, 4);

    expect(result.newText).toBe("Start Hello {{name}}! end");
    expect(result.newCursorPosition).toBe(21); // After the exclamation mark
  });

  it("should handle template with variables", () => {
    const templateWithVars: Template = {
      id: "test",
      name: "Test Template",
      content: "Hello {{name}}!",
      variables: [{ name: "name", placeholder: "World" }],
    };

    const text = "/greet";
    const result = insertTemplateAtSlashCommand(text, templateWithVars, 0, 5, {
      name: "John",
    });

    expect(result.newText).toBe("Hello John!");
    expect(result.newCursorPosition).toBe(11);
  });

  it("should handle cursor position marker", () => {
    const text = "/test";
    const result = insertTemplateAtSlashCommand(text, template, 0, 4);

    expect(result.newText).toBe("Hello {{name}}!");
    expect(result.newCursorPosition).toBe(15); // At cursor marker position
  });
});

describe("Template Filtering", () => {
  const templates: Template[] = [
    {
      id: "1",
      name: "Header Template",
      description: "Create a header",
      content: "# {{title}}",
      category: "Markdown",
    },
    {
      id: "2",
      name: "Code Block",
      description: "Insert code block",
      content: "```{{lang}}\n{{code}}\n```",
      category: "Code",
    },
    {
      id: "3",
      name: "HTML Div",
      description: "Create div element",
      content: "<div>{{content}}</div>",
      category: "HTML",
    },
  ];

  it("should return all templates when no query", () => {
    const result = getSlashCommandTemplates(templates, "", "markdown");
    expect(result).toHaveLength(3);
  });

  it("should filter by name", () => {
    const result = getSlashCommandTemplates(templates, "header", "markdown");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Header Template");
  });

  it("should filter by description", () => {
    const result = getSlashCommandTemplates(templates, "code", "markdown");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Code Block");
  });

  it("should filter by category", () => {
    const result = getSlashCommandTemplates(templates, "html", "markdown");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("HTML Div");
  });

  it("should be case insensitive", () => {
    const result = getSlashCommandTemplates(templates, "HEADER", "markdown");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Header Template");
  });

  it("should return empty array for no matches", () => {
    const result = getSlashCommandTemplates(
      templates,
      "nonexistent",
      "markdown",
    );
    expect(result).toHaveLength(0);
  });
});
