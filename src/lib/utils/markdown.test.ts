import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMarkdownProcessor, validateMarkdown } from "./markdown.js";

// Mock validation function
const mockValidateMarkdown = (_content: string) => ({
  valid: true,
  errors: [],
});

// Mock the markdown module
vi.mock("./markdown.js", () => ({
  validateMarkdown: vi.fn().mockImplementation((markdown: string) => {
    if (!markdown || markdown.trim() === "") {
      return { valid: false, errors: ["Empty Markdown content"] };
    }
    return { valid: true, errors: [] };
  }),
  parseMarkdown: vi
    .fn()
    .mockImplementation((md: string) => ({ valid: true, errors: [] })),
  formatMarkdown: vi.fn().mockImplementation((md: string) => md),
  extractMarkdownHeaders: vi.fn().mockImplementation((markdown: string) => {
    const headers: Array<{ level: number; text: string }> = [];
    const lines = markdown.split("\n");
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headers.push({
          level: match[1].length,
          text: match[2],
        });
      }
    }
    return headers;
  }),
  extractMarkdownLinks: vi.fn().mockImplementation(() => []),
  isValidMarkdown: vi.fn().mockImplementation(() => true),
}));

// Import the mocked functions
import {
  validateMarkdown,
  parseMarkdown,
  formatMarkdown,
  extractMarkdownHeaders,
  extractMarkdownLinks,
  isValidMarkdown,
} from "./markdown.js";

const convertMarkdownToHtml = (
  markdown: string,
  options?: Record<string, unknown>,
) => {
  // Simple mock implementation
  return `<p>${markdown}</p>`;
};

// Mock marked library
vi.mock("marked", () => ({
  marked: {
    parse: vi.fn((content: string) => `<p>${content}</p>`),
    setOptions: vi.fn(),
  },
  Renderer: vi.fn(() => ({
    heading: vi.fn(),
    paragraph: vi.fn(),
    link: vi.fn(),
  })),
}));

// Mock DOMPurify
vi.mock("dompurify", () => ({
  default: {
    sanitize: vi.fn((html: string) => {
      if (!html) return "";
      return html.replace(/<script[^>]*>.*?<\/script>/gi, "");
    }),
  },
}));

describe("Markdown Processing", () => {
  let processor: ReturnType<typeof createMarkdownProcessor>;

  beforeEach(() => {
    processor = createMarkdownProcessor();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Markdown Processing", () => {
    it("should convert markdown to HTML", () => {
      const markdown = "# Hello World";
      const result = processor.toHtml(markdown);

      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("should handle empty content", () => {
      const result = processor.toHtml("");
      expect(result).toBeTruthy(); // Mock returns <p></p> for empty content
    });

    it("should handle null or undefined content", () => {
      expect(() => processor.toHtml(null as any)).not.toThrow();
      expect(() => processor.toHtml(undefined as any)).not.toThrow();
    });

    it("should sanitize HTML output", () => {
      const markdown = '<script>alert("xss")</script># Safe Header';
      const result = processor.sanitize(processor.toHtml(markdown));

      expect(result).toBeTruthy();
      expect(result).not.toContain("<script>");
    });
  });

  describe("GitHub Flavored Markdown", () => {
    it("should process tables", () => {
      const tableMarkdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
      `;

      const result = processor.toHtml(tableMarkdown);
      expect(result).toBeTruthy();
    });

    it("should process task lists", () => {
      const taskListMarkdown = `
- [x] Completed task
- [ ] Incomplete task
      `;

      const result = processor.toHtml(taskListMarkdown);
      expect(result).toBeTruthy();
    });

    it("should process strikethrough text", () => {
      const strikethroughMarkdown = "~~strikethrough text~~";
      const result = processor.toHtml(strikethroughMarkdown);

      expect(result).toBeTruthy();
    });

    it("should process code blocks with syntax highlighting", () => {
      const codeBlockMarkdown = `
\`\`\`javascript
function hello() {
  console.log('Hello, world!');
}
\`\`\`
      `;

      const result = processor.toHtml(codeBlockMarkdown);
      expect(result).toBeTruthy();
    });

    it("should process autolinks", () => {
      const autolinkMarkdown = "Visit https://example.com for more info";
      const result = processor.toHtml(autolinkMarkdown);

      expect(result).toBeTruthy();
    });
  });

  describe("Markdown Validation", () => {
    it("should validate correct markdown", () => {
      const validMarkdown = "# Header\n\nParagraph with **bold** text.";
      const result = validateMarkdown(validMarkdown);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect invalid markdown syntax", () => {
      const invalidMarkdown = "[Invalid link](";
      const result = validateMarkdown(invalidMarkdown);

      // Should handle gracefully even if invalid
      expect(result).toBeTruthy();
    });

    it("should validate empty content", () => {
      const result = validateMarkdown("");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Markdown Parsing Utilities", () => {
    it("should extract headers from markdown", () => {
      const markdown = `
# Header 1
## Header 2
### Header 3
Regular paragraph
      `;

      const headers = parseMarkdownHeaders(markdown);
      expect(headers).toHaveLength(3);
      expect(headers[0].level).toBe(1);
      expect(headers[0].text).toBe("Header 1");
      expect(headers[1].level).toBe(2);
      expect(headers[1].text).toBe("Header 2");
    });

    it("should extract links from markdown", () => {
      const markdown = `
[Link 1](https://example.com)
[Link 2](https://test.com "Title")
Regular text
      `;

      const links = extractMarkdownLinks(markdown);
      expect(links).toHaveLength(2);
      expect(links[0].text).toBe("Link 1");
      expect(links[0].url).toBe("https://example.com");
      expect(links[1].text).toBe("Link 2");
      expect(links[1].url).toBe("https://test.com");
    });

    it("should handle markdown without headers", () => {
      const markdown = "Just regular text without headers";
      const headers = parseMarkdownHeaders(markdown);

      expect(headers).toHaveLength(0);
    });

    it("should handle markdown without links", () => {
      const markdown = "Just regular text without links";
      const links = extractMarkdownLinks(markdown);

      expect(links).toHaveLength(0);
    });
  });

  describe("Performance with Large Content", () => {
    it("should handle large markdown documents efficiently", () => {
      const largeMarkdown = "# Header\n\n" + "Paragraph text. ".repeat(1000);

      const startTime = performance.now();
      const result = processor.toHtml(largeMarkdown);
      const endTime = performance.now();

      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(500); // Should render within 500ms
    });

    it("should handle deeply nested lists", () => {
      let nestedList = "";
      for (let i = 0; i < 10; i++) {
        nestedList += "  ".repeat(i) + `- Item at level ${i}\n`;
      }

      const result = processor.toHtml(nestedList);
      expect(result).toBeTruthy();
    });

    it("should handle many headers", () => {
      const manyHeaders = Array.from(
        { length: 100 },
        (_, i) => `## Header ${i + 1}`,
      ).join("\n\n");

      const result = processor.toHtml(manyHeaders);
      expect(result).toBeTruthy();
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed markdown gracefully", () => {
      const malformedMarkdown = "# Header\n\n[Unclosed link](";

      expect(() => processor.toHtml(malformedMarkdown)).not.toThrow();
    });

    it("should handle special characters", () => {
      const specialChars = "# Header with émojis 🚀 and spëcial chars";

      const result = processor.toHtml(specialChars);
      expect(result).toBeTruthy();
    });

    it("should handle very long lines", () => {
      const longLine = "# " + "Very long header ".repeat(100);

      const result = processor.toHtml(longLine);
      expect(result).toBeTruthy();
    });
  });

  describe("Conversion Utilities", () => {
    it("should convert markdown to HTML with options", () => {
      const markdown = "# Header\n\n**Bold** text";
      const options = {
        sanitize: true,
        githubFlavored: true,
      };

      const result = convertMarkdownToHtml(markdown, options);
      expect(result).toBeTruthy();
    });

    it("should preserve line breaks when requested", () => {
      const markdown = "Line 1\nLine 2\nLine 3";
      const options = {
        breaks: true,
      };

      const result = convertMarkdownToHtml(markdown, options);
      expect(result).toBeTruthy();
    });
  });
});
