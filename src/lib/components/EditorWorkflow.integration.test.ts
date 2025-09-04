import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/svelte";
import HtmlMarkdownEditor from "./HtmlMarkdownEditor.svelte";
import type { EditorProps, Template, Snippet } from "../types/index.js";

// Mock all utilities for integration testing
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
    getRecoveryActions: vi.fn(() => [
      { label: "Retry", action: vi.fn() },
      { label: "Reset", action: vi.fn() },
    ]),
    clearErrorHistory: vi.fn(),
  })),
}));

vi.mock("../utils/responsive.js", () => ({
  ResponsiveManager: vi.fn(() => ({
    onViewportChange: vi.fn(),
    observeContainer: vi.fn(),
    getMobileConfig: vi.fn(() => ({ showPreview: false })),
    getTabletConfig: vi.fn(() => ({})),
    getTouchConfig: vi.fn(() => ({})),
    destroy: vi.fn(),
  })),
  createResponsiveProperties: vi.fn(() => ({})),
}));

describe("Editor Workflow Integration Tests", () => {
  let defaultProps: EditorProps;

  beforeEach(() => {
    defaultProps = {
      value: "",
      mode: "markdown",
      showPreview: true,
      showToolbar: true,
      placeholder: "Start writing...",
      readonly: false,
      theme: "light",
      debounceMs: 50,
      templates: [],
      snippets: [],
      enableSlashCommands: true,
      githubStyle: true,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete Document Creation Workflow", () => {
    it("should handle full document creation from start to finish", async () => {
      const onchange = vi.fn();
      const onmodechange = vi.fn();

      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, onchange, onmodechange },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Step 1: User starts with a title
      await fireEvent.input(textarea, { target: { value: "# My Blog Post" } });
      expect(onchange).toHaveBeenCalledWith("# My Blog Post");

      // Step 2: User adds introduction
      const introContent =
        "# My Blog Post\n\nThis is an introduction to my blog post.";
      await fireEvent.input(textarea, { target: { value: introContent } });
      expect(onchange).toHaveBeenCalledWith(introContent);

      // Step 3: User adds a list
      const listContent =
        introContent + "\n\n## Key Points\n\n- Point 1\n- Point 2\n- Point 3";
      await fireEvent.input(textarea, { target: { value: listContent } });
      expect(onchange).toHaveBeenCalledWith(listContent);

      // Step 4: User adds code block
      const codeContent =
        listContent + '\n\n```javascript\nconsole.log("Hello, world!");\n```';
      await fireEvent.input(textarea, { target: { value: codeContent } });
      expect(onchange).toHaveBeenCalledWith(codeContent);

      // Step 5: User switches to HTML mode to fine-tune
      const htmlButton = container.querySelector(
        'button[aria-label="Switch to HTML mode"]',
      ) as HTMLButtonElement;
      await fireEvent.click(htmlButton);
      expect(onmodechange).toHaveBeenCalledWith("html");

      // Step 6: User makes HTML adjustments
      const htmlContent =
        "<h1>My Blog Post</h1>\n<p>This is an introduction with <strong>emphasis</strong>.</p>";
      await fireEvent.input(textarea, { target: { value: htmlContent } });
      expect(onchange).toHaveBeenCalledWith(htmlContent);

      // Step 7: User switches back to Markdown
      const markdownButton = container.querySelector(
        'button[aria-label="Switch to Markdown mode"]',
      ) as HTMLButtonElement;
      await fireEvent.click(markdownButton);
      expect(onmodechange).toHaveBeenCalledWith("markdown");

      // Content should be preserved throughout the workflow
      expect(textarea.value).toBe(htmlContent);
    });

    it("should handle collaborative editing simulation", async () => {
      const onchange = vi.fn();
      const { component, container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, onchange },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Simulate user typing
      await fireEvent.input(textarea, { target: { value: "User content" } });
      expect(onchange).toHaveBeenCalledWith("User content");

      // Simulate external update (like from collaboration)
      await component.$set({ value: "User content\n\nCollaborator addition" });
      expect(textarea.value).toBe("User content\n\nCollaborator addition");

      // User continues editing
      await fireEvent.input(textarea, {
        target: {
          value: "User content\n\nCollaborator addition\n\nUser response",
        },
      });
      expect(onchange).toHaveBeenCalledWith(
        "User content\n\nCollaborator addition\n\nUser response",
      );
    });
  });

  describe("Template and Snippet Workflow", () => {
    const templates: Template[] = [
      {
        id: "1",
        name: "Blog Post",
        content:
          "# ${title}\n\n## Introduction\n\n${intro}\n\n## Main Content\n\n${content}\n\n## Conclusion\n\n${conclusion}",
        variables: [
          { name: "title", placeholder: "Post title" },
          { name: "intro", placeholder: "Introduction" },
          { name: "content", placeholder: "Main content" },
          { name: "conclusion", placeholder: "Conclusion" },
        ],
      },
      {
        id: "2",
        name: "Meeting Notes",
        content:
          "# Meeting Notes - ${date}\n\n## Attendees\n\n${attendees}\n\n## Agenda\n\n${agenda}\n\n## Action Items\n\n${actions}",
        variables: [
          { name: "date", placeholder: "Meeting date" },
          { name: "attendees", placeholder: "List of attendees" },
          { name: "agenda", placeholder: "Meeting agenda" },
          { name: "actions", placeholder: "Action items" },
        ],
      },
    ];

    const snippets: Snippet[] = [
      {
        id: "1",
        name: "Bold Text",
        shortcut: "Ctrl+B",
        content: "**${text}**",
        variables: [{ name: "text", placeholder: "Bold text" }],
      },
      {
        id: "2",
        name: "Code Inline",
        shortcut: "Ctrl+`",
        content: "`${code}`",
        variables: [{ name: "code", placeholder: "Code" }],
      },
    ];

    it("should handle template-based document creation", async () => {
      const onchange = vi.fn();
      const ontemplateinsert = vi.fn();

      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          templates,
          onchange,
          ontemplateinsert,
          enableSlashCommands: true,
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // User starts with slash command
      await fireEvent.input(textarea, { target: { value: "/" } });

      // User types to filter templates
      await fireEvent.input(textarea, { target: { value: "/blog" } });

      // Simulate template selection and insertion
      const templateContent =
        "# My New Blog Post\n\n## Introduction\n\nWelcome to my blog.\n\n## Main Content\n\nContent goes here.\n\n## Conclusion\n\nThanks for reading.";
      await fireEvent.input(textarea, { target: { value: templateContent } });

      expect(onchange).toHaveBeenCalledWith(templateContent);

      // User continues editing the template
      const editedContent = templateContent.replace(
        "My New Blog Post",
        "Advanced JavaScript Techniques",
      );
      await fireEvent.input(textarea, { target: { value: editedContent } });

      expect(onchange).toHaveBeenCalledWith(editedContent);
    });

    it("should handle snippet insertion workflow", async () => {
      const onchange = vi.fn();
      const onsnippetinsert = vi.fn();

      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          snippets,
          onchange,
          onsnippetinsert,
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // User types some content
      await fireEvent.input(textarea, {
        target: { value: "This is some text." },
      });

      // User selects text
      textarea.setSelectionRange(8, 12); // Select "some"

      // User triggers snippet with keyboard shortcut
      await fireEvent.keyDown(textarea, { key: "b", ctrlKey: true });

      // Simulate snippet insertion
      const withSnippet = "This is **some** text.";
      await fireEvent.input(textarea, { target: { value: withSnippet } });

      expect(onchange).toHaveBeenCalledWith(withSnippet);

      // User adds inline code
      const finalContent = withSnippet + " Here is `code` example.";
      await fireEvent.input(textarea, { target: { value: finalContent } });

      expect(onchange).toHaveBeenCalledWith(finalContent);
    });
  });

  describe("Multi-Modal Editing Workflow", () => {
    it("should handle seamless mode switching during editing", async () => {
      const onchange = vi.fn();
      const onmodechange = vi.fn();

      const { container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, onchange, onmodechange },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      const markdownButton = container.querySelector(
        'button[aria-label="Switch to Markdown mode"]',
      ) as HTMLButtonElement;
      const htmlButton = container.querySelector(
        'button[aria-label="Switch to HTML mode"]',
      ) as HTMLButtonElement;

      // Start in Markdown mode
      expect(markdownButton.getAttribute("aria-pressed")).toBe("true");

      // User creates markdown content
      const markdownContent =
        "# Title\n\n**Bold** and *italic* text.\n\n- List item 1\n- List item 2";
      await fireEvent.input(textarea, { target: { value: markdownContent } });
      expect(onchange).toHaveBeenCalledWith(markdownContent);

      // Switch to HTML mode
      await fireEvent.click(htmlButton);
      expect(onmodechange).toHaveBeenCalledWith("html");
      expect(htmlButton.getAttribute("aria-pressed")).toBe("true");

      // Content should be preserved
      expect(textarea.value).toBe(markdownContent);

      // User edits in HTML mode
      const htmlContent =
        "<h1>Title</h1>\n<p><strong>Bold</strong> and <em>italic</em> text.</p>\n<ul>\n<li>List item 1</li>\n<li>List item 2</li>\n</ul>";
      await fireEvent.input(textarea, { target: { value: htmlContent } });
      expect(onchange).toHaveBeenCalledWith(htmlContent);

      // Switch back to Markdown
      await fireEvent.click(markdownButton);
      expect(onmodechange).toHaveBeenCalledWith("markdown");
      expect(markdownButton.getAttribute("aria-pressed")).toBe("true");

      // Content should still be preserved
      expect(textarea.value).toBe(htmlContent);

      // User continues in Markdown mode
      const finalContent =
        htmlContent + "\n\n## New Section\n\nAdditional content.";
      await fireEvent.input(textarea, { target: { value: finalContent } });
      expect(onchange).toHaveBeenCalledWith(finalContent);
    });

    it("should handle preview toggling during editing", async () => {
      const { component, container } = render(HtmlMarkdownEditor, {
        props: { ...defaultProps, showPreview: true },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // User types content
      await fireEvent.input(textarea, {
        target: {
          value: "# Preview Test\n\nThis content should appear in preview.",
        },
      });

      // Check that preview is shown
      expect(
        container.querySelector(".editor-content.with-preview"),
      ).toBeTruthy();

      // Hide preview
      await component.$set({ showPreview: false });
      expect(
        container.querySelector(".editor-content.with-preview"),
      ).toBeFalsy();

      // User continues editing without preview
      await fireEvent.input(textarea, {
        target: {
          value:
            "# Preview Test\n\nThis content should appear in preview.\n\nMore content added.",
        },
      });

      // Show preview again
      await component.$set({ showPreview: true });
      expect(
        container.querySelector(".editor-content.with-preview"),
      ).toBeTruthy();
    });
  });

  describe("Error Recovery Workflow", () => {
    it("should handle and recover from various error scenarios", async () => {
      const onerror = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          onerror,
          enableErrorRecovery: true,
          showErrorDetails: true,
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // User types content that might cause processing errors
      const problematicContent =
        "# Title\n\n[Broken link](\n\n```\nUnclosed code block";
      await fireEvent.input(textarea, {
        target: { value: problematicContent },
      });

      // Editor should continue functioning
      expect(textarea.value).toBe(problematicContent);

      // User fixes the content
      const fixedContent =
        '# Title\n\n[Fixed link](https://example.com)\n\n```javascript\nconsole.log("Fixed code block");\n```';
      await fireEvent.input(textarea, { target: { value: fixedContent } });

      expect(textarea.value).toBe(fixedContent);

      // User continues working normally
      const finalContent =
        fixedContent +
        "\n\n## Additional Section\n\nEverything works fine now.";
      await fireEvent.input(textarea, { target: { value: finalContent } });

      expect(textarea.value).toBe(finalContent);
    });

    it("should handle network interruption during template loading", async () => {
      // Simulate network failure
      const failingTemplates: Template[] = [];

      const { component, container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          templates: failingTemplates,
          enableErrorRecovery: true,
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // User tries to use templates despite network issues
      await fireEvent.input(textarea, { target: { value: "/" } });

      // Editor should still function for basic editing
      await fireEvent.input(textarea, {
        target: { value: "Manual content creation" },
      });
      expect(textarea.value).toBe("Manual content creation");

      // Network recovers, templates become available
      const recoveredTemplates: Template[] = [
        {
          id: "1",
          name: "Simple Template",
          content: "# ${title}\n\n${content}",
          variables: [
            { name: "title", placeholder: "Title" },
            { name: "content", placeholder: "Content" },
          ],
        },
      ];

      await component.$set({ templates: recoveredTemplates });

      // User can now use templates
      await fireEvent.input(textarea, {
        target: { value: "Manual content creation\n\n/" },
      });

      // Should work normally now
      expect(container.querySelector(".html-markdown-editor")).toBeTruthy();
    });
  });

  describe("Performance Under Load Workflow", () => {
    it("should maintain responsiveness during intensive editing", async () => {
      const onchange = vi.fn();
      const onperformanceupdate = vi.fn();

      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          onchange,
          onperformanceupdate,
          enablePerformanceMonitoring: true,
          debounceMs: 10, // Very fast for testing
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;

      // Simulate intensive editing session
      const baseContent = "# Document\n\n";
      let currentContent = baseContent;

      const startTime = performance.now();

      // Add content rapidly
      for (let i = 0; i < 50; i++) {
        currentContent += `Paragraph ${i + 1} with some content that makes it longer.\n\n`;
        await fireEvent.input(textarea, { target: { value: currentContent } });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle rapid updates efficiently
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(onchange).toHaveBeenCalled();
      expect(textarea.value).toBe(currentContent);

      // Performance monitoring should have been triggered
      expect(onperformanceupdate).toHaveBeenCalled();
    });

    it("should handle large document editing workflow", async () => {
      // Create a large initial document
      const largeContent =
        "# Large Document\n\n" +
        "This is a paragraph with substantial content. ".repeat(500);

      const onchange = vi.fn();
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          value: largeContent,
          onchange,
          enableVirtualScrolling: true,
          performanceMode: "auto",
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      expect(textarea.value).toBe(largeContent);

      // User makes edits to the large document
      const startTime = performance.now();

      // Add content at the beginning
      const updatedContent =
        "# Large Document\n\n## New Section\n\nNew content added.\n\n" +
        largeContent.substring(largeContent.indexOf("This is"));
      await fireEvent.input(textarea, { target: { value: updatedContent } });

      const endTime = performance.now();
      const editTime = endTime - startTime;

      // Should handle large document edits efficiently
      expect(editTime).toBeLessThan(500); // Should complete within 500ms
      expect(onchange).toHaveBeenCalledWith(updatedContent);
      expect(textarea.value).toBe(updatedContent);
    });
  });

  describe("Accessibility Workflow", () => {
    it("should support complete keyboard-only workflow", async () => {
      const onchange = vi.fn();
      const onmodechange = vi.fn();

      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          onchange,
          onmodechange,
          enableAccessibility: true,
          enableKeyboardNavigation: true,
          enableScreenReaderSupport: true,
        },
      });

      const textarea = container.querySelector(
        "textarea",
      ) as HTMLTextAreaElement;
      const editor = container.querySelector(
        ".html-markdown-editor",
      ) as HTMLElement;

      // User navigates to editor using keyboard
      textarea.focus();
      expect(document.activeElement).toBe(textarea);

      // User types content
      await fireEvent.input(textarea, {
        target: { value: "Accessible content creation" },
      });
      expect(onchange).toHaveBeenCalledWith("Accessible content creation");

      // User uses keyboard shortcuts
      await fireEvent.keyDown(editor, { key: "b", ctrlKey: true });
      await fireEvent.keyDown(editor, { key: "i", ctrlKey: true });
      await fireEvent.keyDown(editor, { key: "k", ctrlKey: true });

      // User navigates to mode toggle using Tab
      await fireEvent.keyDown(textarea, { key: "Tab" });

      // User switches mode using keyboard
      const htmlButton = container.querySelector(
        'button[aria-label="Switch to HTML mode"]',
      ) as HTMLButtonElement;
      if (htmlButton) {
        htmlButton.focus();
        await fireEvent.keyDown(htmlButton, { key: "Enter" });
        expect(onmodechange).toHaveBeenCalledWith("html");
      }

      // User continues editing in new mode
      await fireEvent.input(textarea, {
        target: { value: "<p>Accessible HTML content</p>" },
      });
      expect(onchange).toHaveBeenCalledWith("<p>Accessible HTML content</p>");
    });

    it("should provide proper screen reader announcements", async () => {
      const { container } = render(HtmlMarkdownEditor, {
        props: {
          ...defaultProps,
          enableScreenReaderSupport: true,
          ariaLabel: "Main content editor",
        },
      });

      // Check ARIA attributes
      const editor = container.querySelector(".html-markdown-editor");
      expect(editor?.getAttribute("aria-label")).toBe("Main content editor");
      expect(editor?.getAttribute("role")).toBe("application");

      // Check live regions for announcements
      const liveRegions = container.querySelectorAll("[aria-live]");
      expect(liveRegions.length).toBeGreaterThan(0);

      // Check help text
      const helpText = container.querySelector("#editor-help");
      expect(helpText?.classList.contains("sr-only")).toBe(true);
      expect(helpText?.textContent).toContain("Use Ctrl+B for bold");
    });
  });
});
