import { describe, it, expect } from "vitest";
import {
  createContentConverter,
  getConversionStats,
} from "./contentConverter.js";

describe("ContentConverter", () => {
  const converter = createContentConverter();

  describe("htmlToMarkdown", () => {
    it("should convert basic HTML to Markdown", () => {
      const html =
        "<h1>Hello World</h1><p>This is a <strong>test</strong> paragraph.</p>";
      const result = converter.htmlToMarkdown(html);

      expect(result.content).toContain("# Hello World");
      expect(result.content).toContain("**test**");
      expect(result.warnings).toEqual([]);
      expect(result.dataLoss).toBe(false);
    });

    it("should handle complex HTML structures", () => {
      const html = `
        <table>
          <tr><th>Name</th><th>Age</th></tr>
          <tr><td>John</td><td>30</td></tr>
        </table>
      `;
      const result = converter.htmlToMarkdown(html);

      expect(result.content).toContain("|");
      expect(result.content).toContain("Name");
      expect(result.content).toContain("Age");
    });

    it("should warn about data loss for complex elements", () => {
      const html = '<div><script>alert("test")</script><p>Content</p></div>';
      const result = converter.htmlToMarkdown(html);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.dataLoss).toBe(true);
    });

    it("should preserve links and images", () => {
      const html =
        '<p><a href="https://example.com">Link</a> and <img src="image.jpg" alt="Image"></p>';
      const result = converter.htmlToMarkdown(html);

      expect(result.content).toContain("[Link](https://example.com)");
      expect(result.content).toContain("![Image](image.jpg)");
    });
  });

  describe("markdownToHtml", () => {
    it("should convert basic Markdown to HTML", () => {
      const markdown = "# Hello World\n\nThis is a **test** paragraph.";
      const result = converter.markdownToHtml(markdown);

      expect(result.content).toContain("Hello World");
      expect(result.content).toContain("<strong>test</strong>");
      expect(result.warnings).toEqual([]);
    });

    it("should handle GitHub Flavored Markdown", () => {
      const markdown = `
| Name | Age |
|------|-----|
| John | 30  |

- [x] Task 1
- [ ] Task 2

\`\`\`javascript
console.log('hello');
\`\`\`
      `;
      const result = converter.markdownToHtml(markdown);

      expect(result.content).toContain("table");
      expect(result.warnings.some((w) => w.includes("Tables detected"))).toBe(
        true,
      );
      expect(
        result.warnings.some((w) => w.includes("Task lists detected")),
      ).toBe(true);
      expect(
        result.warnings.some((w) => w.includes("Code blocks detected")),
      ).toBe(true);
    });
  });

  describe("detectContentType", () => {
    it("should detect HTML content", () => {
      const html = "<div><p>Hello <strong>world</strong></p></div>";
      expect(converter.detectContentType(html)).toBe("html");
    });

    it("should detect Markdown content", () => {
      const markdown = "# Hello\n\nThis is **bold** text.";
      expect(converter.detectContentType(markdown)).toBe("markdown");
    });

    it("should detect mixed content", () => {
      const mixed = "# Hello\n\n<div>This is mixed content</div>";
      expect(converter.detectContentType(mixed)).toBe("mixed");
    });

    it("should detect plain text", () => {
      const plain = "Just some plain text without any formatting.";
      expect(converter.detectContentType(plain)).toBe("plain");
    });
  });

  describe("validateConversion", () => {
    it("should validate successful conversions", () => {
      const original = "# Hello World\n\nThis is a test.";
      const converted = "<h1>Hello World</h1>\n<p>This is a test.</p>";

      expect(
        converter.validateConversion(original, converted, "markdown", "html"),
      ).toBe(true);
    });

    it("should detect failed conversions", () => {
      const original = "# Hello World\n\nThis is a test.";
      const converted = "";

      expect(
        converter.validateConversion(original, converted, "markdown", "html"),
      ).toBe(false);
    });
  });

  describe("getConversionStats", () => {
    it("should generate conversion statistics", () => {
      const result = {
        content: "converted content",
        warnings: ["warning 1"],
        dataLoss: true,
        originalLength: 100,
        convertedLength: 90,
      };

      const stats = getConversionStats(result);
      expect(stats).toContain("Original: 100 chars");
      expect(stats).toContain("Converted: 90 chars");
      expect(stats).toContain("Data loss: Yes");
      expect(stats).toContain("Warnings: 1");
    });
  });
});
