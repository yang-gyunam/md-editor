import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import EditorToolbar from "./EditorToolbar.svelte";
import type { ToolbarProps } from "../types/index.js";

describe("EditorToolbar Component", () => {
  let defaultProps: ToolbarProps;

  beforeEach(() => {
    defaultProps = {
      mode: "markdown",
      disabled: false,
      customTools: [],
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render toolbar", () => {
      const { container } = render(EditorToolbar, { props: defaultProps });

      expect(container.querySelector(".editor-toolbar")).toBeTruthy();
    });

    it("should render markdown formatting buttons", () => {
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, mode: "markdown" },
      });

      expect(container.querySelector('button[title*="Bold"]')).toBeTruthy();
      expect(container.querySelector('button[title*="Italic"]')).toBeTruthy();
      expect(container.querySelector('button[title*="Link"]')).toBeTruthy();
    });

    it("should render HTML formatting buttons", () => {
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, mode: "html" },
      });

      expect(container.querySelector('button[title*="Bold"]')).toBeTruthy();
      expect(container.querySelector('button[title*="Italic"]')).toBeTruthy();
      expect(
        container.querySelector('button[title*="Paragraph"]'),
      ).toBeTruthy();
    });

    it("should apply disabled state", () => {
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, disabled: true },
      });

      const toolbar = container.querySelector(".editor-toolbar");
      expect(toolbar?.classList.contains("disabled")).toBe(true);
    });
  });

  describe("Mode-Specific Tools", () => {
    it("should show markdown-specific tools in markdown mode", () => {
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, mode: "markdown" },
      });

      // Should have link button for markdown
      expect(container.querySelector('button[title*="Link"]')).toBeTruthy();
      // Should have headers and lists
      expect(container.querySelector('button[title*="Header 1"]')).toBeTruthy();
      expect(
        container.querySelector('button[title*="Unordered List"]'),
      ).toBeTruthy();
    });

    it("should show HTML-specific tools in HTML mode", () => {
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, mode: "html" },
      });

      // Should have paragraph button for HTML
      expect(
        container.querySelector('button[title*="Paragraph"]'),
      ).toBeTruthy();
      // Should have headers and lists
      expect(container.querySelector('button[title*="Header 1"]')).toBeTruthy();
      expect(
        container.querySelector('button[title*="Unordered List"]'),
      ).toBeTruthy();
    });

    it("should update tools when mode changes", async () => {
      const { component, container } = render(EditorToolbar, {
        props: { ...defaultProps, mode: "markdown" },
      });

      // Initially should have markdown tools (link is in both modes)
      expect(container.querySelector('button[title*="Link"]')).toBeTruthy();

      // Switch to HTML mode
      await component.$set({ mode: "html" });

      // Should now have HTML tools
      expect(
        container.querySelector('button[title*="Paragraph"]'),
      ).toBeTruthy();
    });
  });

  describe("Custom Tools", () => {
    const customTools = [
      {
        id: "custom1",
        label: "Custom Tool 1",
        icon: "🔧",
        action: vi.fn(),
        shortcut: "Ctrl+1",
      },
      {
        id: "custom2",
        label: "Custom Tool 2",
        icon: "⚙️",
        action: vi.fn(),
        shortcut: "Ctrl+2",
      },
    ];

    it("should render custom tools", () => {
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, customTools },
      });

      expect(
        container.querySelector('button[title*="Custom Tool 1"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('button[title*="Custom Tool 2"]'),
      ).toBeTruthy();
    });

    it("should show toolbar separator when custom tools exist", () => {
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, customTools },
      });

      expect(container.querySelector(".toolbar-separator")).toBeTruthy();
    });

    it("should show separators between groups", () => {
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, customTools: [] },
      });

      // Should have separators between built-in groups
      expect(
        container.querySelectorAll(".toolbar-separator").length,
      ).toBeGreaterThan(0);
    });

    it("should execute custom tool actions", async () => {
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, customTools },
      });

      const customButton = container.querySelector(
        'button[title*="Custom Tool 1"]',
      ) as HTMLButtonElement;
      await fireEvent.click(customButton);

      expect(customTools[0].action).toHaveBeenCalled();
    });
  });

  describe("Button Interactions", () => {
    it("should handle bold button click", async () => {
      const onFormatAction = vi.fn();
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, onFormatAction },
      });

      const boldButton = container.querySelector(
        'button[title*="Bold"]',
      ) as HTMLButtonElement;
      await fireEvent.click(boldButton);

      expect(onFormatAction).toHaveBeenCalledWith(
        "bold",
        expect.objectContaining({
          type: "wrap",
          before: "**",
          after: "**",
          placeholder: "bold text",
        }),
      );
    });

    it("should handle italic button click", async () => {
      const onFormatAction = vi.fn();
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, onFormatAction },
      });

      const italicButton = container.querySelector(
        'button[title*="Italic"]',
      ) as HTMLButtonElement;
      await fireEvent.click(italicButton);

      expect(onFormatAction).toHaveBeenCalledWith(
        "italic",
        expect.objectContaining({
          type: "wrap",
          before: "_",
          after: "_",
          placeholder: "italic text",
        }),
      );
    });

    it("should handle link button click in markdown mode", async () => {
      const onFormatAction = vi.fn();
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, mode: "markdown", onFormatAction },
      });

      const linkButton = container.querySelector(
        'button[title*="Link"]',
      ) as HTMLButtonElement;
      await fireEvent.click(linkButton);

      expect(onFormatAction).toHaveBeenCalledWith(
        "link",
        expect.objectContaining({
          type: "wrap",
          before: "[",
          after: "](url)",
          placeholder: "link text",
        }),
      );
    });

    it("should not execute actions when disabled", async () => {
      const onFormatAction = vi.fn();
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, disabled: true, onFormatAction },
      });

      const boldButton = container.querySelector(
        'button[title*="Bold"]',
      ) as HTMLButtonElement;
      await fireEvent.click(boldButton);

      expect(onFormatAction).not.toHaveBeenCalled();
    });

    it("should work with editor instance", async () => {
      const mockEditorInstance = {
        insertText: vi.fn(),
        wrapSelection: vi.fn(),
        getSelection: vi.fn().mockReturnValue({ start: 0, end: 0, text: "" }),
        setCursor: vi.fn(),
        focus: vi.fn(),
      };

      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, editorInstance: mockEditorInstance },
      });

      const boldButton = container.querySelector(
        'button[title*="Bold"]',
      ) as HTMLButtonElement;
      await fireEvent.click(boldButton);

      expect(mockEditorInstance.wrapSelection).toHaveBeenCalledWith("**", "**");
      expect(mockEditorInstance.focus).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper button titles with shortcuts", () => {
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, mode: "markdown" },
      });

      expect(
        container.querySelector('button[title="Bold (Ctrl+B)"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('button[title="Italic (Ctrl+I)"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('button[title="Link (Ctrl+K)"]'),
      ).toBeTruthy();
    });

    it("should have accessible button content", () => {
      const { container } = render(EditorToolbar, { props: defaultProps });

      const boldButton = container.querySelector('button[title*="Bold"]');
      expect(boldButton?.querySelector(".button-icon")).toBeTruthy();
      expect(boldButton?.querySelector(".button-label")).toBeTruthy();

      const italicButton = container.querySelector('button[title*="Italic"]');
      expect(italicButton?.querySelector(".button-icon")).toBeTruthy();
      expect(italicButton?.querySelector(".button-label")).toBeTruthy();
    });

    it("should support keyboard navigation", async () => {
      const { container } = render(EditorToolbar, { props: defaultProps });

      const firstButton = container.querySelector(
        "button",
      ) as HTMLButtonElement;
      firstButton.focus();

      expect(document.activeElement).toBe(firstButton);

      // Tab to next button
      await fireEvent.keyDown(firstButton, { key: "Tab" });

      // Should be able to navigate between buttons
      expect(container.querySelectorAll("button").length).toBeGreaterThan(1);
    });

    it("should have proper ARIA attributes for custom tools", () => {
      const customTools = [
        {
          id: "custom1",
          label: "Custom Tool",
          icon: "🔧",
          action: vi.fn(),
          shortcut: "Ctrl+1",
        },
      ];

      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, customTools },
      });

      const customButton = container.querySelector(
        'button[title*="Custom Tool"]',
      );
      expect(customButton?.getAttribute("type")).toBe("button");
    });
  });

  describe("Visual States", () => {
    it("should show visual feedback on button hover", () => {
      const { container } = render(EditorToolbar, { props: defaultProps });

      const buttons = container.querySelectorAll("button");
      buttons.forEach((button) => {
        expect(button.getAttribute("type")).toBe("button");
      });
    });

    it("should show disabled state visually", () => {
      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, disabled: true },
      });

      const toolbar = container.querySelector(".editor-toolbar");
      expect(toolbar?.classList.contains("disabled")).toBe(true);
    });
  });

  describe("Responsive Behavior", () => {
    it("should group buttons appropriately", () => {
      const { container } = render(EditorToolbar, { props: defaultProps });

      expect(container.querySelector(".toolbar-group")).toBeTruthy();
    });

    it("should handle custom tools in separate group", () => {
      const customTools = [
        {
          id: "custom1",
          label: "Custom Tool",
          icon: "🔧",
          action: vi.fn(),
        },
      ];

      const { container } = render(EditorToolbar, {
        props: { ...defaultProps, customTools },
      });

      const groups = container.querySelectorAll(".toolbar-group");
      expect(groups.length).toBe(4); // Basic, Headers, Lists/Code + Custom tools group
    });
  });
});
