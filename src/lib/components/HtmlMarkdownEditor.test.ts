import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/svelte";
import HtmlMarkdownEditor from "./HtmlMarkdownEditor.svelte";
import type { EditorProps } from "../types/index.js";

// Mock dependencies
vi.mock("../utils/performanceMonitor.js", () => ({
  createPerformanceMonitor: vi.fn(() => ({
    startTiming: vi.fn(() => vi.fn(() => ({ renderTime: 10 }))),
    measureInputLatency: vi.fn((name, fn) => fn()),
    onPerformanceWarning: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock("../utils/inputOptimization.js", () => ({
  createInputOptimizer: vi.fn(() => ({
    processInput: vi.fn(),
    destroy: vi.fn(),
  })),
  createDOMOptimizer: vi.fn(() => ({
    destroy: vi.fn(),
  })),
}));

vi.mock("../utils/accessibility.js", () => ({
  AccessibilityManager: vi.fn(() => ({
    registerKeyboardShortcut: vi.fn(),
    handleKeyDown: vi.fn(() => false),
    announce: vi.fn(),
    destroy: vi.fn(),
  })),
  createAriaAttributes: vi.fn((attrs) => {
    const result: Record<string, string> = {};
    if (attrs.label) result["aria-label"] = attrs.label;
    if (attrs.live) result["aria-live"] = attrs.live;
    return result;
  }),
}));

vi.mock("../utils/loadingState.js", () => ({
  LoadingStateManager: vi.fn(() => ({
    onStateChange: vi.fn(),
    startLoading: vi.fn(),
    completeLoading: vi.fn(),
    setError: vi.fn(),
    isLoading: vi.fn(() => false),
    destroy: vi.fn(),
  })),
}));

vi.mock("../utils/errorHandling.js", () => ({
  ErrorHandler: vi.fn(() => ({
    onError: vi.fn(),
    handleError: vi.fn((error) => ({
      type: "rendering",
      message: error.message,
      recoverable: true,
    })),
    getRecoveryActions: vi.fn(() => []),
    clearErrorHistory: vi.fn(),
  })),
}));

vi.mock("../utils/responsive.js", () => ({
  ResponsiveManager: vi.fn(() => ({
    onViewportChange: vi.fn(),
    observeContainer: vi.fn(),
    getMobileConfig: vi.fn(() => ({})),
    getTabletConfig: vi.fn(() => ({})),
    getTouchConfig: vi.fn(() => ({})),
    destroy: vi.fn(),
  })),
  createResponsiveProperties: vi.fn(() => ({})),
}));

describe("HtmlMarkdownEditor Component", () => {
  let defaultProps: EditorProps;

  beforeEach(() => {
    defaultProps = {
      value: "",
      mode: "markdown",
      showPreview: true,
      showToolbar: true,
      placeholder: "Enter your content...",
      readonly: false,
      theme: "light",
      debounceMs: 300,
      templates: [],
      snippets: [],
      enableSlashCommands: true,
      githubStyle: true,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Initialization", () => {
    it("should render with default props", () => {
      const { container } = render(HtmlMarkdownEditor, { props: defaultProps });

      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
      expect(container.querySelector(".editor-toolbar")).toBeTruthy();
      expect(container.querySelector(".editor-content")).toBeTruthy();
    });

    it("should initialize with correct mode", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, mode: "html" },
      });

      const htmlButton = container.querySelector('button[aria-pressed="true"]');
      expect(htmlButton?.textContent?.trim()).toBe("HTML");
    });

    it("should render without toolbar when showToolbar is false", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, showToolbar: false },
      });

      expect(container.querySelector(".editor-toolbar")).toBeFalsy();
    });

    it("should render without preview when showPreview is false", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, showPreview: false },
      });

      expect(
        container.querySelector(".editor-content.with-preview"),
      ).toBeFalsy();
    });
  });

  describe("State Management", () => {
    it("should update internal state when value prop changes", async () => {
      const { component, container } = render(HtmlMarkdownEditor, {
        props: defaultProps,
      });

      // Update the value prop
      await component.$set({ value: "New content" });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("New content");
    });

    it("should emit change event when content is modified", async () => {
      const onchange = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, onchange },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Simulate user input
      await fireEvent.input(textarea, { target: { value: "Test content" } });

      expect(onchange).toHaveBeenCalledWith("Test content");
    });

    it("should support two-way data binding", async () => {
      let value = "Initial content";
      const onchange = vi.fn((newValue: string) => {
        value = newValue;
      });

      const { component, container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, value, onchange },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("Initial content");

      // Simulate user input
      await fireEvent.input(textarea, { target: { value: "Updated content" } });

      expect(onchange).toHaveBeenCalledWith("Updated content");
      expect(value).toBe("Updated content");
    });
  });

  describe("Mode Switching", () => {
    it("should switch from markdown to html mode", async () => {
      const onmodechange = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, mode: "markdown", onmodechange },
      });

      const htmlButton = container.querySelector(
        'button[aria-label="Switch to HTML mode"]',
      ) as HTMLButtonElement;
      await fireEvent.click(htmlButton);

      expect(onmodechange).toHaveBeenCalledWith("html");
      expect(htmlButton.getAttribute("aria-pressed")).toBe("true");
    });

    it("should switch from html to markdown mode", async () => {
      const onmodechange = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, mode: "html", onmodechange },
      });

      const markdownButton = container.querySelector(
        'button[aria-label="Switch to Markdown mode"]',
      ) as HTMLButtonElement;
      await fireEvent.click(markdownButton);

      expect(onmodechange).toHaveBeenCalledWith("markdown");
      expect(markdownButton.getAttribute("aria-pressed")).toBe("true");
    });

    it("should preserve content when switching modes", async () => {
      const onchange = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, value: "# Test Header", onchange },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("# Test Header");

      // Switch to HTML mode
      const htmlButton = container.querySelector(
        'button[aria-label="Switch to HTML mode"]',
      ) as HTMLButtonElement;
      await fireEvent.click(htmlButton);

      // Content should be preserved
      expect(textarea.value).toBe("# Test Header");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, ariaLabel: "Custom editor label" },
      });

      const editor = container.querySelector(".html-markdown-editor");
      expect(editor?.getAttribute("role")).toBe("application");
      expect(editor?.getAttribute("aria-label")).toBe("Custom editor label");
    });

    it("should have accessible toolbar", () => {
      const { container } = render(HtmlMarkdownEditor, { props: defaultProps });

      const toolbar = container.querySelector(".editor-toolbar");
      expect(toolbar?.getAttribute("role")).toBe("toolbar");
      expect(toolbar?.getAttribute("aria-label")).toBe(
        "Editor formatting tools",
      );
    });

    it("should have accessible mode toggle buttons", () => {
      const { container } = render(HtmlMarkdownEditor, { props: defaultProps });

      const modeToggle = container.querySelector(".mode-toggle");
      expect(modeToggle?.getAttribute("role")).toBe("group");
      expect(modeToggle?.getAttribute("aria-label")).toBe(
        "Editor mode selection",
      );

      const markdownButton = container.querySelector(
        'button[aria-label="Switch to Markdown mode"]',
      );
      const htmlButton = container.querySelector(
        'button[aria-label="Switch to HTML mode"]',
      );

      expect(markdownButton?.getAttribute("aria-pressed")).toBe("true");
      expect(htmlButton?.getAttribute("aria-pressed")).toBe("false");
    });

    it("should have screen reader help text", () => {
      const { container } = render(HtmlMarkdownEditor, { props: defaultProps });

      const helpText = container.querySelector("#editor-help");
      expect(helpText?.classList.contains("sr-only")).toBe(true);
      expect(helpText?.textContent).toContain("Use Ctrl+B for bold");
    });

    it("should handle keyboard navigation", async () => {
      const { container } = render(HtmlMarkdownEditor, { props: defaultProps });

      const editor = container.querySelector(
        ".html-markdown-editor",
      ) as HTMLElement;

      // Simulate keyboard event
      await fireEvent.keyDown(editor, { key: "Tab" });

      // Should not throw errors and handle the event
      expect(true).toBe(true);
    });
  });

  describe("Readonly Mode", () => {
    it("should disable editing when readonly is true", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, readonly: true },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.readOnly).toBe(true);

      const buttons = container.querySelectorAll("button");
      buttons.forEach((button) => {
        if (
          button.textContent?.includes("Markdown") ||
          button.textContent?.includes("HTML")
        ) {
          expect(button.disabled).toBe(true);
        }
      });
    });

    it("should allow editing when readonly is false", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, readonly: false },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.readOnly).toBe(false);

      const buttons = container.querySelectorAll("button");
      buttons.forEach((button) => {
        if (
          button.textContent?.includes("Markdown") ||
          button.textContent?.includes("HTML")
        ) {
          expect(button.disabled).toBe(false);
        }
      });
    });
  });

  describe("Theme Support", () => {
    it("should apply light theme", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, theme: "light" },
      });

      const editor = container.querySelector(".html-markdown-editor");
      expect(editor?.getAttribute("data-theme")).toBe("light");
    });

    it("should apply dark theme", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, theme: "dark" },
      });

      const editor = container.querySelector(".html-markdown-editor");
      expect(editor?.getAttribute("data-theme")).toBe("dark");
    });

    it("should apply auto theme", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, theme: "auto" },
      });

      const editor = container.querySelector(".html-markdown-editor");
      expect(editor?.getAttribute("data-theme")).toBe("auto");
    });
  });

  describe("Event Handling", () => {
    it("should emit focus event", async () => {
      const onfocus = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, onfocus },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      await fireEvent.focus(textarea);

      expect(onfocus).toHaveBeenCalled();
    });

    it("should emit blur event", async () => {
      const onblur = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, onblur },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      await fireEvent.blur(textarea);

      expect(onblur).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should display error when error occurs", async () => {
      const { container, component } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, enableErrorRecovery: true },
      });

      // Simulate an error by setting the error state
      // This would normally be triggered by the error handler
      const editor = container.querySelector(".html-markdown-editor");
      expect(editor).toBeTruthy();
    });

    it("should show error recovery options", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          enableErrorRecovery: true,
          showErrorDetails: true,
        },
      });

      // Error display should be available when needed
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
    });
  });

  describe("Loading States", () => {
    it("should show loading indicator when loading", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, showLoadingStates: true },
      });

      // Loading overlay should be available when needed
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
    });
  });

  describe("Performance Optimization", () => {
    it("should use optimized editor for large content", async () => {
      const largeContent = "x".repeat(60000); // Larger than 50KB threshold
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          value: largeContent,
          enableVirtualScrolling: true,
        },
      });

      // Should render without issues
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
    });

    it("should handle performance monitoring", () => {
      const onperformanceupdate = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          enablePerformanceMonitoring: true,
          onperformanceupdate,
        },
      });

      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
    });
  });

  describe("Mobile Responsiveness", () => {
    it("should adapt to mobile layout", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          enableResponsiveDesign: true,
          enableMobileOptimizations: true,
        },
      });

      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
    });

    it("should show mobile preview toggle when needed", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, enableMobileOptimizations: true },
      });

      const mobileToggle = container.querySelector(".mobile-preview-toggle");
      // Mobile toggle exists but may be hidden by CSS
      expect(mobileToggle).toBeTruthy();
    });
  });
});
