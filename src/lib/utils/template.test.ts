// Tests for template processing utilities

import { describe, it, expect } from "vitest";
import {
  processTemplate,
  extractTemplateVariables,
  validateTemplate,
  getDefaultTemplates,
} from "./template.js";
import type { Template } from "../types/index.js";

describe("Template Processing", () => {
  it("should process template with variables", () => {
    const template: Template = {
      id: "test",
      name: "Test Template",
      content: "Hello {{name}}, welcome to {{place}}!",
      variables: [
        { name: "name", placeholder: "Your name" },
        { name: "place", placeholder: "Location" },
      ],
    };

    const result = processTemplate(template, { name: "John", place: "GitHub" });
    expect(result.content).toBe("Hello John, welcome to GitHub!");
    expect(result.placeholders).toHaveLength(0);
  });

  it("should handle cursor position marker", () => {
    const template: Template = {
      id: "test",
      name: "Test Template",
      content: "Start{{cursor}} End",
    };

    const result = processTemplate(template);
    expect(result.content).toBe("Start End");
    expect(result.cursorPosition).toBe(5);
  });

  it("should create placeholders for missing variables", () => {
    const template: Template = {
      id: "test",
      name: "Test Template",
      content: "Hello {{name}}!",
      variables: [{ name: "name", placeholder: "Your name" }],
    };

    const result = processTemplate(template);
    expect(result.content).toBe("Hello Your name!");
    expect(result.placeholders).toHaveLength(1);
    expect(result.placeholders[0].variable.name).toBe("name");
  });

  it("should use default values when provided", () => {
    const template: Template = {
      id: "test",
      name: "Test Template",
      content: "Language: {{lang}}",
      variables: [
        { name: "lang", placeholder: "language", defaultValue: "javascript" },
      ],
    };

    const result = processTemplate(template);
    expect(result.content).toBe("Language: javascript");
    expect(result.placeholders).toHaveLength(0);
  });
});

describe("Template Variable Extraction", () => {
  it("should extract variables from template content", () => {
    const content =
      "Hello {{name}}, your age is {{age}} and you live in {{city}}.";
    const variables = extractTemplateVariables(content);
    expect(variables).toEqual(["name", "age", "city"]);
  });

  it("should ignore cursor marker", () => {
    const content = "Start {{name}}{{cursor}} End";
    const variables = extractTemplateVariables(content);
    expect(variables).toEqual(["name"]);
  });

  it("should handle duplicate variables", () => {
    const content = "{{name}} and {{name}} again";
    const variables = extractTemplateVariables(content);
    expect(variables).toEqual(["name"]);
  });
});

describe("Template Validation", () => {
  it("should validate correct template", () => {
    const content = "Hello {{name}}, welcome to {{place}}!";
    const result = validateTemplate(content);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should detect unmatched braces", () => {
    const content = "Hello {{name}, welcome to {{place}}!";
    const result = validateTemplate(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Unmatched template variable braces");
  });

  it("should detect empty variable names", () => {
    const content = "Hello {{}}, welcome!";
    const result = validateTemplate(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Empty variable name found");
  });
});

describe("Default Templates", () => {
  it("should provide default templates", () => {
    const templates = getDefaultTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toHaveProperty("id");
    expect(templates[0]).toHaveProperty("name");
    expect(templates[0]).toHaveProperty("content");
  });

  it("should have valid template content", () => {
    const templates = getDefaultTemplates();
    templates.forEach((template) => {
      const validation = validateTemplate(template.content);
      expect(validation.valid).toBe(true);
    });
  });
});
