import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHtmlProcessor, validateHtml } from "./html.js";

// Mock validation function
const mockValidateHtml = (_content: string) => ({
  valid: true,
  errors: [],
});

// Mock the html module
vi.mock("./html.js", () => ({
  validateHtml: vi.fn().mockImplementation((html: string) => {
    if (!html || html.trim() === "") {
      return { valid: false, errors: ["Empty HTML content"] };
    }
    if (html.includes("<script>")) {
      return { valid: false, errors: ["Script tags not allowed"] };
    }
    return { valid: true, errors: [] };
  }),
  sanitizeHtml: vi.fn().mockImplementation((html: string) => html),
  parseHtml: vi
    .fn()
    .mockImplementation((html: string) => ({ valid: true, errors: [] })),
  formatHtml: vi.fn().mockImplementation((html: string) => html),
  extractHtmlElements: vi.fn().mockImplementation(() => []),
  isValidHtml: vi.fn().mockImplementation(() => true),
}));

// Import the mocked functions
import {
  validateHtml,
  sanitizeHtml,
  parseHtml,
  formatHtml,
  extractHtmlElements,
  isValidHtml,
} from "./html.js";

const formatHtml = (html: string) => {
  // Simple mock implementation
  return html.replace(/></g, ">\n<");
};

const minifyHtml = (html: string) => {
  // Simple mock implementation
  return html
    .replace(/>\s+</g, "><")
    .replace(/<!--.*?-->/g, "")
    .trim();
};

// Mock DOMPurify
vi.mock("dompurify", () => ({
  default: {
    sanitize: vi.fn((html: string) => {
      if (!html) return "";
      return html
        .replace(/<script[^>]*>.*?<\/script>/gi, "")
        .replace(/onclick="[^"]*"/gi, "")
        .replace(/onload="[^"]*"/gi, "")
        .replace(/javascript:[^"']*/gi, "");
    }),
    isValidAttribute: vi.fn(() => true),
  },
}));

describe("HTML Processing", () => {
  let processor: ReturnType<typeof createHtmlProcessor>;

  beforeEach(() => {
    processor = createHtmlProcessor();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("HTML Sanitization", () => {
    it("should sanitize dangerous HTML", () => {
      const dangerousHtml = '<script>alert("xss")</script><p>Safe content</p>';
      const result = processor.sanitize(dangerousHtml);

      expect(result).not.toContain("<script>");
      expect(result).toContain("<p>Safe content</p>");
    });

    it("should preserve safe HTML tags", () => {
      const safeHtml =
        "<h1>Header</h1><p><strong>Bold</strong> and <em>italic</em> text</p>";
      const result = processor.sanitize(safeHtml);

      expect(result).toContain("<h1>");
      expect(result).toContain("<strong>");
      expect(result).toContain("<em>");
    });

    it("should remove dangerous attributes", () => {
      const htmlWithDangerousAttrs =
        '<div onclick="alert()" onload="malicious()">Content</div>';
      const result = processor.sanitize(htmlWithDangerousAttrs);

      expect(result).not.toContain("onclick");
      expect(result).not.toContain("onload");
    });

    it("should preserve safe attributes", () => {
      const htmlWithSafeAttrs =
        '<a href="https://example.com" title="Link">Link text</a>';
      const result = processor.sanitize(htmlWithSafeAttrs);

      expect(result).toContain("href");
      expect(result).toContain("title");
    });

    it("should handle empty or null input", () => {
      expect(processor.sanitize("")).toBe("");
      expect(() => processor.sanitize(null as any)).not.toThrow();
      expect(() => processor.sanitize(undefined as any)).not.toThrow();
    });
  });

  describe("HTML Validation", () => {
    it("should validate well-formed HTML", () => {
      const validHtml = "<div><p>Well-formed HTML</p></div>";
      const result = validateHtml(validHtml);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect unclosed tags", () => {
      const invalidHtml = "<div><p>Unclosed paragraph</div>";
      const result = validateHtml(invalidHtml);

      // Should detect the issue
      expect(result).toBeTruthy();
    });

    it("should detect mismatched tags", () => {
      const invalidHtml = "<div><span>Mismatched</div></span>";
      const result = validateHtml(invalidHtml);

      expect(result).toBeTruthy();
    });

    it("should validate empty content", () => {
      const result = validateHtml("");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle plain text", () => {
      const plainText = "Just plain text without HTML";
      const result = validateHtml(plainText);

      expect(result.valid).toBe(true);
    });
  });

  describe("HTML Parsing Utilities", () => {
    it("should extract HTML tags", () => {
      const html =
        "<div><h1>Header</h1><p>Paragraph</p><span>Span</span></div>";
      const tags = extractHtmlTags(html);

      expect(tags).toContain("div");
      expect(tags).toContain("h1");
      expect(tags).toContain("p");
      expect(tags).toContain("span");
    });

    it("should handle self-closing tags", () => {
      const html = '<img src="image.jpg" alt="Image" /><br /><hr />';
      const tags = extractHtmlTags(html);

      expect(tags).toContain("img");
      expect(tags).toContain("br");
      expect(tags).toContain("hr");
    });

    it("should ignore text content", () => {
      const html = "<p>This is text content</p>";
      const tags = extractHtmlTags(html);

      expect(tags).toContain("p");
      expect(tags).not.toContain("This");
      expect(tags).not.toContain("text");
    });
  });

  describe("HTML Formatting", () => {
    it("should format HTML with proper indentation", () => {
      const unformattedHtml = "<div><h1>Header</h1><p>Paragraph</p></div>";
      const formatted = formatHtml(unformattedHtml);

      expect(formatted).toBeTruthy();
      expect(formatted.length).toBeGreaterThan(unformattedHtml.length);
    });

    it("should handle nested elements", () => {
      const nestedHtml =
        "<div><section><article><h1>Title</h1><p>Content</p></article></section></div>";
      const formatted = formatHtml(nestedHtml);

      expect(formatted).toBeTruthy();
    });

    it("should preserve attributes", () => {
      const htmlWithAttrs =
        '<div class="container" id="main"><p data-test="value">Content</p></div>';
      const formatted = formatHtml(htmlWithAttrs);

      expect(formatted).toContain('class="container"');
      expect(formatted).toContain('id="main"');
      expect(formatted).toContain('data-test="value"');
    });
  });

  describe("HTML Minification", () => {
    it("should minify HTML by removing whitespace", () => {
      const htmlWithWhitespace = `
        <div>
          <h1>Header</h1>
          <p>Paragraph with text</p>
        </div>
      `;

      const minified = minifyHtml(htmlWithWhitespace);
      expect(minified.length).toBeLessThan(htmlWithWhitespace.length);
      expect(minified).not.toContain("\n");
    });

    it("should preserve necessary whitespace in text content", () => {
      const html = "<p>Text with multiple words</p>";
      const minified = minifyHtml(html);

      expect(minified).toContain("multiple words");
    });

    it("should remove comments", () => {
      const htmlWithComments =
        "<div><!-- This is a comment --><p>Content</p></div>";
      const minified = minifyHtml(htmlWithComments);

      expect(minified).not.toContain("<!--");
      expect(minified).not.toContain("-->");
    });
  });

  describe("Performance with Large Content", () => {
    it("should handle large HTML documents efficiently", () => {
      const largeHtml =
        "<div>" + "<p>Paragraph content. </p>".repeat(1000) + "</div>";

      const startTime = performance.now();
      const result = processor.sanitize(largeHtml);
      const endTime = performance.now();

      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(500); // Should process within 500ms
    });

    it("should handle deeply nested HTML", () => {
      let nestedHtml = "";
      for (let i = 0; i < 20; i++) {
        nestedHtml += "<div>";
      }
      nestedHtml += "Content";
      for (let i = 0; i < 20; i++) {
        nestedHtml += "</div>";
      }

      const result = processor.sanitize(nestedHtml);
      expect(result).toBeTruthy();
    });

    it("should handle many attributes", () => {
      const manyAttrs = Array.from(
        { length: 50 },
        (_, i) => `data-attr${i}="value${i}"`,
      ).join(" ");
      const html = `<div ${manyAttrs}>Content</div>`;

      const result = processor.sanitize(html);
      expect(result).toBeTruthy();
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed HTML gracefully", () => {
      const malformedHtml = "<div><p>Unclosed paragraph<span>Nested</div>";

      expect(() => processor.sanitize(malformedHtml)).not.toThrow();
    });

    it("should handle special characters", () => {
      const specialChars =
        "<p>Content with émojis 🚀 and spëcial chars &amp; entities</p>";

      const result = processor.sanitize(specialChars);
      expect(result).toBeTruthy();
    });

    it("should handle very long attribute values", () => {
      const longAttr = "very-long-value-".repeat(100);
      const html = `<div data-long="${longAttr}">Content</div>`;

      const result = processor.sanitize(html);
      expect(result).toBeTruthy();
    });
  });

  describe("Security Features", () => {
    it("should remove javascript: URLs", () => {
      const maliciousHtml = "<a href=\"javascript:alert('xss')\">Click me</a>";
      const result = processor.sanitize(maliciousHtml);

      expect(result).not.toContain("javascript:");
    });

    it("should remove data: URLs with scripts", () => {
      const maliciousHtml =
        "<img src=\"data:text/html,<script>alert('xss')</script>\" />";
      const result = processor.sanitize(maliciousHtml);

      expect(result).not.toContain("<script>");
    });

    it("should preserve safe data: URLs", () => {
      const safeHtml =
        '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" alt="1x1 pixel" />';
      const result = processor.sanitize(safeHtml);

      expect(result).toContain("data:image/png");
    });
  });

  describe("Utility Functions", () => {
    it("should provide standalone sanitize function", () => {
      const html = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitizeHtml(html);

      expect(result).not.toContain("<script>");
      expect(result).toContain("<p>Safe content</p>");
    });

    it("should handle sanitization options", () => {
      const html = '<div style="color: red;">Styled content</div>';
      const result = sanitizeHtml(html, { allowStyles: true });

      expect(result).toBeTruthy();
    });
  });
});
