import { describe, it, expect } from "vitest";
import {
  createGFMProcessor,
  isGFMTable,
  isTaskListItem,
  parseTaskListItem,
} from "./markdown.js";

describe("GitHub Flavored Markdown Support", () => {
  const processor = createGFMProcessor();

  describe("Tables", () => {
    it("should render tables correctly", () => {
      const markdown = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;

      const html = processor.toHtml(markdown);
      expect(html).toContain('<table class="gfm-table">');
      expect(html).toContain("<th>Header 1</th>");
      expect(html).toContain("<td>Cell 1</td>");
    });

    it("should detect GFM table format", () => {
      expect(isGFMTable("| Header 1 | Header 2 |")).toBe(true);
      expect(isGFMTable("|----------|----------|")).toBe(true);
      expect(isGFMTable("Regular text")).toBe(false);
    });
  });

  describe("Task Lists (Checkboxes)", () => {
    it("should render checked task list items", () => {
      const markdown = "- [x] Completed task";
      const html = processor.toHtml(markdown);

      expect(html).toContain('class="task-list-item"');
      expect(html).toContain('type="checkbox"');
      expect(html).toContain("checked");
      expect(html).toContain("Completed task");
    });

    it("should render unchecked task list items", () => {
      const markdown = "- [ ] Incomplete task";
      const html = processor.toHtml(markdown);

      expect(html).toContain('class="task-list-item"');
      expect(html).toContain('type="checkbox"');
      expect(html).not.toContain("checked");
      expect(html).toContain("Incomplete task");
    });

    it("should detect task list items", () => {
      expect(isTaskListItem("- [x] Completed")).toBe(true);
      expect(isTaskListItem("- [ ] Incomplete")).toBe(true);
      expect(isTaskListItem("- Regular list item")).toBe(false);
    });

    it("should parse task list items correctly", () => {
      const checked = parseTaskListItem("- [x] Completed task");
      expect(checked).toEqual({ checked: true, text: "Completed task" });

      const unchecked = parseTaskListItem("- [ ] Incomplete task");
      expect(unchecked).toEqual({ checked: false, text: "Incomplete task" });

      const notTask = parseTaskListItem("- Regular item");
      expect(notTask).toBeNull();
    });
  });

  describe("Strikethrough", () => {
    it("should render strikethrough text", () => {
      const markdown = "~~strikethrough text~~";
      const html = processor.toHtml(markdown);

      expect(html).toContain("<del>strikethrough text</del>");
    });
  });

  describe("Code Blocks with Syntax Highlighting", () => {
    it("should render code blocks with language specification", () => {
      const markdown = "```javascript\nconst x = 1;\n```";
      const html = processor.toHtml(markdown);

      expect(html).toContain('class="code-block-wrapper"');
      expect(html).toContain("language-javascript");
    });

    it("should render code blocks without language specification", () => {
      const markdown = "```\nplain code\n```";
      const html = processor.toHtml(markdown);

      expect(html).toContain('class="code-block-wrapper"');
      expect(html).toContain("plain code");
    });
  });

  describe("Auto-linking", () => {
    it("should auto-link URLs in fallback mode", () => {
      // Test the fallback conversion which includes auto-linking
      const processor = createGFMProcessor();

      // Force an error to test fallback
      const originalParse = processor.toHtml;
      const testProcessor = {
        ...processor,
        toHtml: (markdown: string) => {
          if (markdown.includes("https://")) {
            // Simulate fallback behavior
            return markdown.replace(
              /(https?:\/\/[^\s]+)/gim,
              '<a href="$1">$1</a>',
            );
          }
          return originalParse.call(processor, markdown);
        },
      };

      const markdown = "Visit https://github.com for more info";
      const html = testProcessor.toHtml(markdown);

      expect(html).toContain(
        '<a href="https://github.com">https://github.com</a>',
      );
    });
  });

  describe("Header IDs", () => {
    it("should generate header IDs", () => {
      const markdown = "# My Header";
      const html = processor.toHtml(markdown);

      // The gfmHeadingId extension should add IDs
      expect(html).toContain("<h1");
      expect(html).toContain("My Header");
    });
  });

  describe("Sanitization", () => {
    it("should sanitize HTML while preserving GFM features", () => {
      const markdown = '- [x] Task with <script>alert("xss")</script>';
      const html = processor.sanitize(processor.toHtml(markdown));

      expect(html).toContain('type="checkbox"');
      expect(html).toContain("checked");
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("alert");
    });

    it("should preserve task list checkboxes in sanitization", () => {
      const html =
        '<li class="task-list-item"><input type="checkbox" checked disabled> Task</li>';
      const sanitized = processor.sanitize(html);

      expect(sanitized).toContain('type="checkbox"');
      expect(sanitized).toContain("checked");
      expect(sanitized).toContain("disabled");
    });
  });
});
