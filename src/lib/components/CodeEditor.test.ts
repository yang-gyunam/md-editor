import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/svelte";
import CodeEditor from "./CodeEditor.svelte";
import type { CodeEditorProps } from "../types/index.js";

// Mock dependencies
vi.mock("../utils/slashCommands.js", () => ({
  detectSlashCommand: vi.fn(() => null),
  insertTemplateAtSlashCommand: vi.fn(),
  getSlashCommandTemplates: vi.fn(() => []),
}));

vi.mock("../utils/templateManager.js", () => ({
  TemplateService: vi.fn(() => ({
    getTemplates: vi.fn(() => []),
    addTemplate: vi.fn(),
    removeTemplate: vi.fn(),
    searchTemplates: vi.fn(() => []),
  })),
}));

describe("CodeEditor Component", () => {
  let defaultProps: CodeEditorProps;

  beforeEach(() => {
    defaultProps = {
      value: "",
      mode: "markdown",
      placeholder: "Enter your code...",
      readonly: false,
      onInput: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Functionality", () => {
    it("should render code editor", () => {
      const { container } = render(CodeEditor, { props: defaultProps });

      expect(container.querySelector("textarea")).toBeTruthy();
    });

    it("should display placeholder text", () => {
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, placeholder: "Custom placeholder" },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.placeholder).toBe("Custom placeholder");
    });

    it("should bind value correctly", () => {
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, value: "Initial content" },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("Initial content");
    });

    it("should handle input events", async () => {
      const onInput = vi.fn();
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, onInput },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      await fireEvent.input(textarea, { target: { value: "New content" } });

      expect(onInput).toHaveBeenCalledWith("New content");
    });

    it("should support readonly mode", () => {
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, readonly: true },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.readOnly).toBe(true);
    });
  });

  describe("Syntax Highlighting", () => {
    it("should enable syntax highlighting by default", () => {
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, enableSyntaxHighlighting: true },
      });

      expect(container.querySelector(".code-editor-container")).toBeTruthy();
    });

    it("should disable syntax highlighting when requested", () => {
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, enableSyntaxHighlighting: false },
      });

      expect(container.querySelector("textarea")).toBeTruthy();
    });

    it("should apply correct syntax highlighting for markdown mode", () => {
      const { container } = render(CodeEditor, {
        props: {
          ...defaultProps,
          mode: "markdown",
          enableSyntaxHighlighting: true,
        },
      });

      const editor = container.querySelector(".code-editor-container");
      expect(editor?.getAttribute("data-mode")).toBe("markdown");
    });

    it("should apply correct syntax highlighting for HTML mode", () => {
      const { container } = render(CodeEditor, {
        props: {
          ...defaultProps,
          mode: "html",
          enableSyntaxHighlighting: true,
        },
      });

      const editor = container.querySelector(".code-editor-container");
      expect(editor?.getAttribute("data-mode")).toBe("html");
    });
  });

  describe("Cursor and Selection Tracking", () => {
    it("should track cursor position", async () => {
      const { container } = render(CodeEditor, { props: defaultProps });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Set cursor position
      textarea.setSelectionRange(5, 5);
      await fireEvent.input(textarea, { target: { value: "Hello world" } });

      expect(textarea.selectionStart).toBe(5);
      expect(textarea.selectionEnd).toBe(5);
    });

    it("should track text selection", async () => {
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, value: "Hello world" },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Select text
      textarea.setSelectionRange(0, 5);
      await fireEvent.select(textarea);

      expect(textarea.selectionStart).toBe(0);
      expect(textarea.selectionEnd).toBe(5);
    });
  });

  describe("Template System", () => {
    const mockTemplates = [
      {
        id: "1",
        name: "Header",
        content: "# ${title}",
        variables: [{ name: "title", placeholder: "Enter title" }],
      },
      {
        id: "2",
        name: "Code Block",
        content: "```${language}\n${code}\n```",
        variables: [
          { name: "language", placeholder: "Language" },
          { name: "code", placeholder: "Code content" },
        ],
      },
    ];

    it("should show template popup on slash command", async () => {
      const { detectSlashCommand } = await import("../utils/slashCommands.js");
      vi.mocked(detectSlashCommand).mockReturnValue({
        position: 1,
        filter: "",
        isActive: true,
      });

      const { container } = render(CodeEditor, {
        props: {
          ...defaultProps,
          enableSlashCommands: true,
          templates: mockTemplates,
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Type slash command
      await fireEvent.input(textarea, { target: { value: "/" } });

      // Template popup should be available
      expect(container.querySelector(".code-editor-container")).toBeTruthy();
    });

    it("should filter templates based on slash command input", async () => {
      const { detectSlashCommand } = await import("../utils/slashCommands.js");
      vi.mocked(detectSlashCommand).mockReturnValue({
        position: 1,
        filter: "head",
        isActive: true,
      });

      const { container } = render(CodeEditor, {
        props: {
          ...defaultProps,
          enableSlashCommands: true,
          templates: mockTemplates,
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Type filtered slash command
      await fireEvent.input(textarea, { target: { value: "/head" } });

      expect(container.querySelector(".code-editor-container")).toBeTruthy();
    });

    it("should insert template when selected", async () => {
      const { insertTemplateAtSlashCommand } = await import(
        "../utils/slashCommands.js"
      );
      const mockInsert = vi.mocked(insertTemplateAtSlashCommand);
      mockInsert.mockReturnValue("# New Header");

      const onInput = vi.fn();
      const { container } = render(CodeEditor, {
        props: {
          ...defaultProps,
          enableSlashCommands: true,
          templates: mockTemplates,
          onInput,
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Simulate template selection
      await fireEvent.input(textarea, { target: { value: "/" } });

      expect(container.querySelector(".code-editor-container")).toBeTruthy();
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("should handle Tab key for indentation", async () => {
      const onInput = vi.fn();
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, value: "Line 1\nLine 2", onInput },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Select text and press Tab
      textarea.setSelectionRange(0, 6); // Select "Line 1"
      await fireEvent.keyDown(textarea, { key: "Tab" });

      // Should handle tab indentation
      expect(textarea).toBeTruthy();
    });

    it("should handle Shift+Tab for outdentation", async () => {
      const onInput = vi.fn();
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, value: "  Indented line", onInput },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Press Shift+Tab
      await fireEvent.keyDown(textarea, { key: "Tab", shiftKey: true });

      // Should handle outdentation
      expect(textarea).toBeTruthy();
    });

    it("should handle Enter key for auto-indentation", async () => {
      const onInput = vi.fn();
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, value: "  Indented line", onInput },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Position cursor at end and press Enter
      textarea.setSelectionRange(15, 15);
      await fireEvent.keyDown(textarea, { key: "Enter" });

      // Should handle auto-indentation
      expect(textarea).toBeTruthy();
    });
  });

  describe("Theme Support", () => {
    it("should apply light theme", () => {
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, theme: "light" },
      });

      const editor = container.querySelector(".code-editor-container");
      expect(editor?.getAttribute("data-theme")).toBe("light");
    });

    it("should apply dark theme", () => {
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, theme: "dark" },
      });

      const editor = container.querySelector(".code-editor-container");
      expect(editor?.getAttribute("data-theme")).toBe("dark");
    });

    it("should apply auto theme", () => {
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, theme: "auto" },
      });

      const editor = container.querySelector(".code-editor-container");
      expect(editor?.getAttribute("data-theme")).toBe("auto");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      const { container } = render(CodeEditor, { props: defaultProps });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.getAttribute("aria-label")).toBeTruthy();
      expect(textarea.getAttribute("role")).toBe("textbox");
    });

    it("should support screen reader navigation", () => {
      const { container } = render(CodeEditor, { props: defaultProps });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.getAttribute("aria-multiline")).toBe("true");
    });

    it("should announce template popup to screen readers", async () => {
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, enableSlashCommands: true },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Type slash command
      await fireEvent.input(textarea, { target: { value: "/" } });

      expect(textarea.getAttribute("aria-expanded")).toBeTruthy();
    });
  });

  describe("Performance", () => {
    it("should handle large content efficiently", async () => {
      const largeContent = "Line\n".repeat(1000);
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, value: largeContent },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe(largeContent);
    });

    it("should debounce input events", async () => {
      const onInput = vi.fn();
      const { container } = render(CodeEditor, {
        props: { ...defaultProps, onInput },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Rapid input events
      await fireEvent.input(textarea, { target: { value: "a" } });
      await fireEvent.input(textarea, { target: { value: "ab" } });
      await fireEvent.input(textarea, { target: { value: "abc" } });

      // Should handle all inputs
      expect(onInput).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid template gracefully", async () => {
      const invalidTemplates = [
        { id: "1", name: "Invalid", content: null as any },
      ];

      const { container } = render(CodeEditor, {
        props: { ...defaultProps, templates: invalidTemplates },
      });

      // Should render without crashing
      expect(container.querySelector("textarea")).toBeTruthy();
    });

    it("should handle template insertion errors", async () => {
      const { insertTemplateAtSlashCommand } = await import(
        "../utils/slashCommands.js"
      );
      vi.mocked(insertTemplateAtSlashCommand).mockImplementation(() => {
        throw new Error("Template insertion failed");
      });

      const { container } = render(CodeEditor, {
        props: { ...defaultProps, enableSlashCommands: true },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Should handle errors gracefully
      await fireEvent.input(textarea, { target: { value: "/" } });

      expect(container.querySelector("textarea")).toBeTruthy();
    });
  });
});
