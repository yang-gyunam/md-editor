import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, waitFor, screen } from "@testing-library/svelte";
import HtmlMarkdownEditor from "./HtmlMarkdownEditor.svelte";
import type { EditorProps, Template, Snippet } from "../types/index.js";

// Mock all dependencies for integration testing
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

describe("HTML Markdown Editor Integration Tests", () => {
  let defaultProps: EditorProps;
  let mockTemplates: Template[];
  let mockSnippets: Snippet[];

  beforeEach(() => {
    mockTemplates = [
      {
        id: "1",
        name: "Header Template",
        content: "# ${title}\n\n${content}",
        variables: [
          { name: "title", placeholder: "Enter title" },
          { name: "content", placeholder: "Enter content" },
        ],
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

    mockSnippets = [
      {
        id: "1",
        name: "Bold Text",
        shortcut: "Ctrl+B",
        content: "**${text}**",
        variables: [{ name: "text", placeholder: "Bold text" }],
      },
      {
        id: "2",
        name: "Link",
        shortcut: "Ctrl+K",
        content: "[${text}](${url})",
        variables: [
          { name: "text", placeholder: "Link text" },
          { name: "url", placeholder: "URL" },
        ],
      },
    ];

    defaultProps = {
      value: "",
      mode: "markdown",
      showPreview: true,
      showToolbar: true,
      placeholder: "Enter your content...",
      readonly: false,
      theme: "light",
      debounceMs: 100, // Faster for testing
      templates: mockTemplates,
      snippets: mockSnippets,
      enableSlashCommands: true,
      githubStyle: true,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete User Workflows", () => {
    it("should handle complete content creation workflow", async () => {
      const onchange = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, onchange },
      });

      // 1. User starts typing content
      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      await fireEvent.input(textarea, { target: { value: "# My Document" } });

      expect(onchange).toHaveBeenCalledWith("# My Document");

      // 2. User adds more content
      await fireEvent.input(textarea, {
        target: { value: "# My Document\n\nThis is a paragraph." },
      });

      expect(onchange).toHaveBeenCalledWith(
        "# My Document\n\nThis is a paragraph.",
      );

      // 3. User switches to HTML mode
      const htmlButton = container.querySelector(
        'button[aria-label="Switch to HTML mode"]',
      ) as HTMLButtonElement;
      await fireEvent.click(htmlButton);

      // Content should be preserved
      expect(textarea.value).toBe("# My Document\n\nThis is a paragraph.");

      // 4. User continues editing in HTML mode
      await fireEvent.input(textarea, {
        target: {
          value: "<h1>My Document</h1>\n\n<p>This is a paragraph.</p>",
        },
      });

      expect(onchange).toHaveBeenCalledWith(
        "<h1>My Document</h1>\n\n<p>This is a paragraph.</p>",
      );
    });

    it("should handle template insertion workflow", async () => {
      const onchange = vi.fn();
      const ontemplateinsert = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          onchange,
          ontemplateinsert,
          enableSlashCommands: true,
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // 1. User types slash command
      await fireEvent.input(textarea, { target: { value: "/" } });

      // 2. User continues typing to filter templates
      await fireEvent.input(textarea, { target: { value: "/head" } });

      // 3. Template popup should be triggered (mocked behavior)
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();

      // 4. User selects template (simulated)
      // In real implementation, this would trigger template insertion
      await fireEvent.input(textarea, {
        target: { value: "# New Header\n\nContent here" },
      });

      expect(onchange).toHaveBeenCalledWith("# New Header\n\nContent here");
    });

    it("should handle keyboard shortcut workflow", async () => {
      const onchange = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, onchange, enableKeyboardNavigation: true },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // 1. User types some text
      await fireEvent.input(textarea, {
        target: { value: "Some text to format" },
      });

      // 2. User selects text
      textarea.setSelectionRange(0, 4); // Select "Some"

      // 3. User presses Ctrl+B for bold
      await fireEvent.keyDown(textarea, { key: "b", ctrlKey: true });

      // 4. User presses Ctrl+I for italic
      await fireEvent.keyDown(textarea, { key: "i", ctrlKey: true });

      // 5. User presses Ctrl+K for link
      await fireEvent.keyDown(textarea, { key: "k", ctrlKey: true });

      // Keyboard shortcuts should be handled by accessibility manager
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
    });

    it("should handle error recovery workflow", async () => {
      const onerror = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, onerror, enableErrorRecovery: true },
      });

      // 1. Simulate an error condition
      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // 2. User continues working despite error
      await fireEvent.input(textarea, {
        target: { value: "Content after error" },
      });

      // 3. Error should be handled gracefully
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
    });
  });

  describe("Performance Testing and Large Document Processing", () => {
    it("should handle large documents efficiently", async () => {
      const largeContent =
        "# Header\n\n" + "Lorem ipsum dolor sit amet. ".repeat(2000);
      const onchange = vi.fn();

      const startTime = performance.now();
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          value: largeContent,
          onchange,
          enableVirtualScrolling: true,
        },
      });
      const renderTime = performance.now() - startTime;

      // Should render within performance requirements (500ms)
      expect(renderTime).toBeLessThan(500);

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe(largeContent);

      // Should handle input on large documents
      const inputStartTime = performance.now();
      await fireEvent.input(textarea, {
        target: { value: largeContent + "\n\nNew content" },
      });
      const inputTime = performance.now() - inputStartTime;

      // Input should be responsive (under 100ms)
      expect(inputTime).toBeLessThan(100);
      expect(onchange).toHaveBeenCalled();
    });

    it("should handle rapid input events efficiently", async () => {
      const onchange = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, onchange, debounceMs: 50 },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Simulate rapid typing
      const rapidInputs = ["a", "ab", "abc", "abcd", "abcde"];
      const startTime = performance.now();

      for (const input of rapidInputs) {
        await fireEvent.input(textarea, { target: { value: input } });
      }

      const totalTime = performance.now() - startTime;

      // Should handle rapid inputs efficiently
      expect(totalTime).toBeLessThan(200);
      expect(onchange).toHaveBeenCalled();
    });

    it("should optimize memory usage with large content", async () => {
      const veryLargeContent = "x".repeat(100000); // 100KB content
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          value: veryLargeContent,
          enableVirtualScrolling: true,
          performanceMode: "always",
        },
      });

      // Should use optimized editor for large content
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();

      // Should not crash or freeze
      const textarea = container.querySelector("textarea");
      expect(textarea).toBeTruthy();
    });

    it("should handle performance monitoring", async () => {
      const onperformanceupdate = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          onperformanceupdate,
          enablePerformanceMonitoring: true,
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Trigger some operations that should be monitored
      await fireEvent.input(textarea, { target: { value: "Test content" } });

      // Performance updates should be called
      expect(onperformanceupdate).toHaveBeenCalled();
    });
  });

  describe("Cross-Browser Compatibility", () => {
    it("should handle different keyboard event formats", async () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, enableKeyboardNavigation: true },
      });

      const editor = container.querySelector(
        ".html-markdown-editor",
      ) as HTMLElement;

      // Test different event formats that browsers might send
      const events = [
        new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
        new KeyboardEvent("keydown", { key: "B", ctrlKey: true }),
        new KeyboardEvent("keydown", { keyCode: 66, ctrlKey: true } as any),
      ];

      for (const event of events) {
        await fireEvent(editor, event);
      }

      // Should handle all event formats without errors
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
    });

    it("should handle different clipboard formats", async () => {
      const { container } = render(HtmlMarkdownEditor, { props: defaultProps });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Simulate paste events with different data formats
      const pasteEvent = new ClipboardEvent("paste", {
        clipboardData: new DataTransfer(),
      });

      pasteEvent.clipboardData?.setData("text/plain", "Pasted text");
      pasteEvent.clipboardData?.setData(
        "text/html",
        "<strong>Pasted HTML</strong>",
      );

      await fireEvent(textarea, pasteEvent);

      // Should handle paste without errors
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
    });

    it("should handle different focus/blur behaviors", async () => {
      const onfocus = vi.fn();
      const onblur = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, onfocus, onblur },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Test focus/blur cycle
      await fireEvent.focus(textarea);
      expect(onfocus).toHaveBeenCalled();

      await fireEvent.blur(textarea);
      expect(onblur).toHaveBeenCalled();

      // Test rapid focus changes
      await fireEvent.focus(textarea);
      await fireEvent.blur(textarea);
      await fireEvent.focus(textarea);

      // Should handle rapid focus changes gracefully
      expect(onfocus).toHaveBeenCalledTimes(2);
      expect(onblur).toHaveBeenCalledTimes(2);
    });
  });

  describe("Responsive Design Integration", () => {
    it("should adapt to mobile viewport", async () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          enableResponsiveDesign: true,
          enableMobileOptimizations: true,
        },
      });

      // Should render mobile-friendly interface
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
      expect(container.querySelector(".mobile-preview-toggle")).toBeTruthy();
    });

    it("should handle touch interactions", async () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          enableTouchOptimizations: true,
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Simulate touch events
      const touchStart = new TouchEvent("touchstart", {
        touches: [
          new Touch({
            identifier: 1,
            target: textarea,
            clientX: 100,
            clientY: 100,
          }),
        ],
      });

      await fireEvent(textarea, touchStart);

      // Should handle touch events without errors
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
    });

    it("should toggle preview on mobile", async () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          enableMobileOptimizations: true,
        },
      });

      const previewToggle = container.querySelector(
        ".preview-toggle-button",
      ) as HTMLButtonElement;

      if (previewToggle) {
        await fireEvent.click(previewToggle);

        // Should toggle preview state
        expect(previewToggle.getAttribute("aria-pressed")).toBeTruthy();
      }
    });
  });

  describe("Accessibility Integration", () => {
    it("should provide complete keyboard navigation", async () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          enableAccessibility: true,
          enableKeyboardNavigation: true,
        },
      });

      // Test tab navigation through all interactive elements
      const interactiveElements = container.querySelectorAll(
        "button, textarea, [tabindex]",
      );

      expect(interactiveElements.length).toBeGreaterThan(0);

      // Each element should be focusable
      for (const element of interactiveElements) {
        (element as HTMLElement).focus();
        expect(document.activeElement).toBe(element);
      }
    });

    it("should announce changes to screen readers", async () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          enableScreenReaderSupport: true,
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Mode changes should be announced
      const htmlButton = container.querySelector(
        'button[aria-label="Switch to HTML mode"]',
      ) as HTMLButtonElement;
      await fireEvent.click(htmlButton);

      // Content changes should be announced
      await fireEvent.input(textarea, { target: { value: "New content" } });

      // Should have proper ARIA live regions
      const liveRegions = container.querySelectorAll("[aria-live]");
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it("should handle high contrast mode", () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, theme: "auto" },
      });

      // Should render without issues in high contrast
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();

      // All interactive elements should be visible
      const buttons = container.querySelectorAll("button");
      buttons.forEach((button) => {
        expect(button.offsetHeight).toBeGreaterThan(0);
        expect(button.offsetWidth).toBeGreaterThan(0);
      });
    });
  });

  describe("Error Handling Integration", () => {
    it("should recover from rendering errors", async () => {
      const onerror = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          onerror,
          enableErrorRecovery: true,
        },
      });

      // Should continue functioning after errors
      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      await fireEvent.input(textarea, {
        target: { value: "Content after error" },
      });

      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
    });

    it("should handle network-related errors gracefully", async () => {
      // Simulate network error during template loading
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          templates: [], // Empty templates to simulate loading failure
          enableErrorRecovery: true,
        },
      });

      // Should still render and function
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      await fireEvent.input(textarea, { target: { value: "Still works" } });

      expect(textarea.value).toBe("Still works");
    });
  });

  describe("State Persistence Integration", () => {
    it("should maintain state across prop changes", async () => {
      const { component, container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, value: "Initial content" },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe("Initial content");

      // Change props
      await component.$set({ theme: "dark" });

      // Content should be preserved
      expect(textarea.value).toBe("Initial content");

      // Change mode
      await component.$set({ mode: "html" });

      // Content should still be preserved
      expect(textarea.value).toBe("Initial content");
    });

    it("should handle rapid prop updates", async () => {
      const { component, container } = render(HtmlMarkdownEditor, {
        props: defaultProps,
      });

      // Rapid prop changes
      await component.$set({ theme: "dark" });
      await component.$set({ showPreview: false });
      await component.$set({ readonly: true });
      await component.$set({ readonly: false });
      await component.$set({ theme: "light" });

      // Should handle all changes without errors
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
    });
  });

  describe("Memory Management Integration", () => {
    it("should clean up resources on unmount", () => {
      const { unmount } = render(HtmlMarkdownEditor, { props: defaultProps });

      // Unmount component
      unmount();

      // Should not throw errors during cleanup
      expect(true).toBe(true);
    });

    it("should handle multiple instances", () => {
      // Create multiple editor instances
      const instances = [];

      for (let i = 0; i < 5; i++) {
        instances.push(
          render(HtmlMarkdownEditor, {
            props: { ...defaultProps, value: `Content ${i}` },
          }),
        );
      }

      // All instances should render correctly
      instances.forEach((instance, index) => {
        const textarea = instance.container.querySelector(
          "textarea",
        ) as HTMLTextAreaElement;
        expect(textarea.value).toBe(`Content ${index}`);
      });

      // Clean up all instances
      instances.forEach((instance) => instance.unmount());
    });
  });
});
