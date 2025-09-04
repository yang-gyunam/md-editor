import { describe, it, expect } from "vitest";
import { createGFMProcessor } from "./markdown.js";
import { getGitHubCSS } from "./githubStyles.js";
import {
  replaceEmojiShortcodes,
  detectEmojiShortcodes,
  getEmojiSuggestions,
} from "./emoji.js";

describe("GitHub-style Preview Features", () => {
  const processor = createGFMProcessor();

  describe("Emoji Support", () => {
    it("should replace emoji shortcodes with actual emojis", () => {
      const text = "Hello :smile: world :heart:";
      const result = replaceEmojiShortcodes(text);

      expect(result).toContain("😄");
      expect(result).toContain("❤️");
      expect(result).not.toContain(":smile:");
      expect(result).not.toContain(":heart:");
    });

    it("should detect emoji shortcodes in text", () => {
      const text = "This has :smile: and :heart: emojis";
      const shortcodes = detectEmojiShortcodes(text);

      expect(shortcodes).toContain(":smile:");
      expect(shortcodes).toContain(":heart:");
      expect(shortcodes).toHaveLength(2);
    });

    it("should provide emoji suggestions", () => {
      const suggestions = getEmojiSuggestions("smile", undefined, 5);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty("shortcode");
      expect(suggestions[0]).toHaveProperty("emoji");
      expect(suggestions.some((s) => s.shortcode === ":smile:")).toBe(true);
    });

    it("should process emojis in markdown", () => {
      const markdown = "# Hello :smile:\n\nThis is a test with :heart: emoji.";
      const html = processor.toHtml(markdown);

      expect(html).toContain("😄");
      expect(html).toContain("❤️");
    });
  });

  describe("Auto-linking", () => {
    it("should auto-link URLs in markdown", () => {
      const markdown = "Visit https://github.com for more info";
      const html = processor.toHtml(markdown);

      expect(html).toContain(
        '<a href="https://github.com">https://github.com</a>',
      );
    });

    it("should not double-link already linked URLs", () => {
      const markdown = "[GitHub](https://github.com) and https://example.com";
      const html = processor.toHtml(markdown);

      // Should have the manual link
      expect(html).toContain('<a href="https://github.com">GitHub</a>');
      // Should auto-link the standalone URL
      expect(html).toContain(
        '<a href="https://example.com">https://example.com</a>',
      );
    });

    it("should handle multiple URLs in the same text", () => {
      const markdown = "Check out https://github.com and https://example.com";
      const html = processor.toHtml(markdown);

      expect(html).toContain(
        '<a href="https://github.com">https://github.com</a>',
      );
      expect(html).toContain(
        '<a href="https://example.com">https://example.com</a>',
      );
    });
  });

  describe("GitHub CSS Styles", () => {
    it("should generate light theme CSS", () => {
      const css = getGitHubCSS({
        theme: "light",
        fontSize: "16px",
        fontFamily: "Arial",
      });

      expect(css).toContain(".github-markdown-body");
      expect(css).toContain("font-size: 16px");
      expect(css).toContain("font-family: Arial");
      expect(css).toContain("color: #1f2328"); // Light theme foreground
    });

    it("should generate dark theme CSS", () => {
      const css = getGitHubCSS({
        theme: "dark",
        fontSize: "14px",
        fontFamily: "Monaco",
      });

      expect(css).toContain(".github-markdown-body");
      expect(css).toContain("font-size: 14px");
      expect(css).toContain("font-family: Monaco");
      expect(css).toContain("color: #f0f6fc"); // Dark theme foreground
    });

    it("should include task list styles", () => {
      const css = getGitHubCSS();

      expect(css).toContain(".task-list-item");
      expect(css).toContain(".task-list-item-checkbox");
    });

    it("should include code block styles", () => {
      const css = getGitHubCSS();

      expect(css).toContain(".code-block-wrapper");
      expect(css).toContain(".code-block");
    });

    it("should include table styles", () => {
      const css = getGitHubCSS();

      expect(css).toContain(".table-wrapper");
      expect(css).toContain(".gfm-table");
    });
  });

  describe("Complete GitHub-style Processing", () => {
    it("should process a complex markdown with all GFM features", () => {
      const markdown = `# GitHub Flavored Markdown :rocket:

## Features

- [x] Tables
- [x] Task lists :white_check_mark:
- [ ] More features

### Code Block

\`\`\`javascript
console.log('Hello :smile:');
\`\`\`

### Table

| Feature | Status |
|---------|--------|
| Tables  | :white_check_mark: |
| Emojis  | :heart: |

### Links

Visit https://github.com for more info.

~~Strikethrough~~ text.`;

      const html = processor.toHtml(markdown);

      // Check emojis
      expect(html).toContain("🚀");
      expect(html).toContain("✅");
      expect(html).toContain("😄");
      expect(html).toContain("❤️");

      // Check task lists
      expect(html).toContain('class="task-list-item"');
      expect(html).toContain('type="checkbox"');
      expect(html).toContain("checked");

      // Check tables
      expect(html).toContain('class="gfm-table"');
      expect(html).toContain("<th>Feature</th>");

      // Check code blocks
      expect(html).toContain('class="code-block-wrapper"');
      expect(html).toContain("language-javascript");

      // Check auto-linking
      expect(html).toContain(
        '<a href="https://github.com">https://github.com</a>',
      );

      // Check strikethrough
      expect(html).toContain("<del>Strikethrough</del>");
    });

    it("should sanitize HTML while preserving GFM features", () => {
      const markdown = `# Test :smile:

- [x] Task with <script>alert("xss")</script>
- [ ] Safe task

Visit https://github.com

\`\`\`javascript
const safe = "code";
\`\`\``;

      const html = processor.sanitize(processor.toHtml(markdown));

      // Should preserve GFM features
      expect(html).toContain("😄");
      expect(html).toContain('class="task-list-item"');
      expect(html).toContain(
        '<a href="https://github.com">https://github.com</a>',
      );
      expect(html).toContain('class="code-block-wrapper"');

      // Should remove dangerous content
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("alert");
    });
  });
});
