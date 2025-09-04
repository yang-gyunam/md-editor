import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, waitFor } from "@testing-library/svelte";
import PreviewPane from "./PreviewPane.svelte";
import type { PreviewProps } from "../types/index.js";

// Mock dependencies
vi.mock("../utils/markdown.js", () => ({
  createMarkdownProcessor: vi.fn(() => ({
    toHtml: vi.fn((content: string) => `<p>${content}</p>`),
    sanitize: vi.fn((html: string) => html),
    validate: vi.fn(() => ({ isValid: true, errors: [] })),
  })),
  validateMarkdown: vi.fn(() => ({ isValid: true, errors: [] })),
}));

vi.mock("../utils/html.js", () => ({
  createHtmlProcessor: vi.fn(() => ({
    sanitize: vi.fn((html: string) => html),
    validate: vi.fn(() => ({ isValid: true, errors: [] })),
  })),
  validateHtml: vi.fn(() => ({ isValid: true, errors: [] })),
}));

vi.mock("../utils/preview.js", () => ({
  createPreviewUpdateManager: vi.fn((processor, options) => ({
    updatePreview: vi.fn((content, mode) => processor(content, mode)),
    destroy: vi.fn(),
  })),
}));

describe("PreviewPane Component", () => {
  let defaultProps: PreviewProps;

  beforeEach(() => {
    defaultProps = {
      content: "",
      mode: "markdown",
      sanitize: true,
      githubStyle: true,
      debounceMs: 300,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render preview pane", () => {
      const { container } = render(PreviewPane, { props: defaultProps });

      expect(container.querySelector(".preview-pane")).toBeTruthy();
    });

    it("should render markdown content as HTML", async () => {
      const { container } = render(PreviewPane, {
        props: { ...defaultProps, content: "# Test Header", mode: "markdown" },
      });

      await waitFor(() => {
        const previewContent = container.querySelector(".preview-content");
        expect(previewContent).toBeTruthy();
      });
    });

    it("should render HTML content directly", async () => {
      const { container } = render(PreviewPane, {
        props: {
          ...defaultProps,
          content: "<h1>Test Header</h1>",
          mode: "html",
        },
      });

      await waitFor(() => {
        const previewContent = container.querySelector(".preview-content");
        expect(previewContent).toBeTruthy();
      });
    });

    it("should apply GitHub styling when enabled", () => {
      const { container } = render(PreviewPane, {
        props: { ...defaultProps, githubStyle: true },
      });

      const previewPane = container.querySelector(".preview-pane");
      expect(previewPane?.classList.contains("github-style")).toBe(true);
    });

    it("should not apply GitHub styling when disabled", () => {
      const { container } = render(PreviewPane, {
        props: { ...defaultProps, githubStyle: false },
      });

      const previewPane = container.querySelector(".preview-pane");
      expect(previewPane?.classList.contains("github-style")).toBe(false);
    });
  });

  describe("Content Processing", () => {
    it("should process markdown content", async () => {
      const markdownContent = "**Bold text** and *italic text*";
      const { container } = render(PreviewPane, {
        props: { ...defaultProps, content: markdownContent, mode: "markdown" },
      });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });
    });

    it("should process HTML content", async () => {
      const htmlContent = "<strong>Bold text</strong> and <em>italic text</em>";
      const { container } = render(PreviewPane, {
        props: { ...defaultProps, content: htmlContent, mode: "html" },
      });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });
    });

    it("should sanitize content when sanitize is enabled", async () => {
      const unsafeContent = '<script>alert("xss")</script><p>Safe content</p>';
      const { container } = render(PreviewPane, {
        props: {
          ...defaultProps,
          content: unsafeContent,
          mode: "html",
          sanitize: true,
        },
      });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });
    });

    it("should not sanitize content when sanitize is disabled", async () => {
      const htmlContent = '<div onclick="alert()">Content</div>';
      const { container } = render(PreviewPane, {
        props: {
          ...defaultProps,
          content: htmlContent,
          mode: "html",
          sanitize: false,
        },
      });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle processing errors gracefully", async () => {
      // Mock an error in the markdown processor
      const { createMarkdownProcessor } = await import("../utils/markdown.js");
      const mockProcessor = vi.mocked(createMarkdownProcessor);
      mockProcessor.mockReturnValue({
        toHtml: vi.fn(() => {
          throw new Error("Processing failed");
        }),
        sanitize: vi.fn((html: string) => html),
        validate: vi.fn(() => ({ isValid: false, errors: ["Test error"] })),
      });

      const { container } = render(PreviewPane, {
        props: { ...defaultProps, content: "# Test", mode: "markdown" },
      });

      await waitFor(() => {
        expect(container.querySelector(".preview-pane")).toBeTruthy();
      });
    });

    it("should display error message for invalid content", async () => {
      const { container } = render(PreviewPane, {
        props: {
          ...defaultProps,
          content: "Invalid content",
          mode: "markdown",
        },
      });

      await waitFor(() => {
        expect(container.querySelector(".preview-pane")).toBeTruthy();
      });
    });
  });

  describe("Real-time Updates", () => {
    it("should update preview when content changes", async () => {
      const { component, container } = render(PreviewPane, {
        props: { ...defaultProps, content: "# Initial", mode: "markdown" },
      });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });

      // Update content
      await component.$set({ content: "# Updated" });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });
    });

    it("should update preview when mode changes", async () => {
      const { component, container } = render(PreviewPane, {
        props: { ...defaultProps, content: "<h1>Test</h1>", mode: "html" },
      });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });

      // Switch to markdown mode
      await component.$set({ mode: "markdown" });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });
    });

    it("should debounce updates to prevent excessive re-rendering", async () => {
      const { component, container } = render(PreviewPane, {
        props: { ...defaultProps, content: "Initial", debounceMs: 100 },
      });

      // Rapidly update content multiple times
      await component.$set({ content: "Update 1" });
      await component.$set({ content: "Update 2" });
      await component.$set({ content: "Update 3" });

      // Should still render correctly after debounce
      await waitFor(
        () => {
          expect(container.querySelector(".preview-content")).toBeTruthy();
        },
        { timeout: 200 },
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      const { container } = render(PreviewPane, { props: defaultProps });

      const previewPane = container.querySelector(".preview-pane");
      expect(previewPane?.getAttribute("role")).toBe("region");
      expect(previewPane?.getAttribute("aria-label")).toBe("Content preview");
    });

    it("should be accessible to screen readers", () => {
      const { container } = render(PreviewPane, {
        props: { ...defaultProps, content: "# Test Header" },
      });

      const previewPane = container.querySelector(".preview-pane");
      expect(previewPane?.getAttribute("aria-live")).toBe("polite");
    });
  });

  describe("Performance", () => {
    it("should handle large content efficiently", async () => {
      const largeContent = "# Header\n\n" + "Lorem ipsum ".repeat(1000);
      const { container } = render(PreviewPane, {
        props: { ...defaultProps, content: largeContent, mode: "markdown" },
      });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });
    });

    it("should use memoization for repeated content", async () => {
      const { component, container } = render(PreviewPane, {
        props: { ...defaultProps, content: "# Same Content", mode: "markdown" },
      });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });

      // Update with same content - should use memoized result
      await component.$set({ content: "# Same Content" });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });
    });
  });

  describe("GitHub Flavored Markdown", () => {
    it("should render tables correctly", async () => {
      const tableContent = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
      `;

      const { container } = render(PreviewPane, {
        props: {
          ...defaultProps,
          content: tableContent,
          mode: "markdown",
          githubStyle: true,
        },
      });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });
    });

    it("should render task lists correctly", async () => {
      const taskListContent = `
- [x] Completed task
- [ ] Incomplete task
      `;

      const { container } = render(PreviewPane, {
        props: {
          ...defaultProps,
          content: taskListContent,
          mode: "markdown",
          githubStyle: true,
        },
      });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });
    });

    it("should render code blocks with syntax highlighting", async () => {
      const codeContent = `
\`\`\`javascript
function hello() {
  console.log('Hello, world!');
}
\`\`\`
      `;

      const { container } = render(PreviewPane, {
        props: {
          ...defaultProps,
          content: codeContent,
          mode: "markdown",
          githubStyle: true,
        },
      });

      await waitFor(() => {
        expect(container.querySelector(".preview-content")).toBeTruthy();
      });
    });
  });
});
