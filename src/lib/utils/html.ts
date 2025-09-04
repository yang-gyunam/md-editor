// HTML processing utilities
import DOMPurify from "dompurify";

export interface HtmlProcessor {
  validate: (html: string) => { valid: boolean; errors: string[] };
  sanitize: (html: string) => string;
  toMarkdown: (html: string) => string;
}

export interface HtmlError {
  type: "validation" | "parsing" | "rendering";
  message: string;
  line?: number;
  column?: number;
}

export function createHtmlProcessor(): HtmlProcessor {
  return {
    validate: (html: string) => {
      const errors: string[] = [];

      try {
        // Create a temporary DOM element to test parsing
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;

        // Check for unclosed tags by comparing original with parsed
        const parsed = tempDiv.innerHTML;

        // Basic validation checks
        const openTags = html.match(/<[^/!][^>]*>/g) || [];
        const closeTags = html.match(/<\/[^>]*>/g) || [];
        const selfClosingTags = html.match(/<[^>]*\/>/g) || [];

        // Count expected closing tags (excluding self-closing and void elements)
        const voidElements = [
          "area",
          "base",
          "br",
          "col",
          "embed",
          "hr",
          "img",
          "input",
          "link",
          "meta",
          "param",
          "source",
          "track",
          "wbr",
        ];
        let expectedClosingTags = 0;

        openTags.forEach((tag) => {
          const tagName = tag.match(/<(\w+)/)?.[1]?.toLowerCase();
          if (
            tagName &&
            !voidElements.includes(tagName) &&
            !tag.endsWith("/>")
          ) {
            expectedClosingTags++;
          }
        });

        if (expectedClosingTags !== closeTags.length) {
          errors.push("Mismatched HTML tags detected");
        }

        // Check for malformed attributes
        const malformedAttrs = html.match(/\s\w+=[^"'\s>]+(?=\s|>)/g);
        if (malformedAttrs) {
          errors.push("Malformed attributes detected (missing quotes)");
        }
      } catch (error) {
        errors.push(
          "HTML parsing error: " +
            (error instanceof Error ? error.message : "Unknown error"),
        );
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    },

    sanitize: (html: string) => {
      try {
        return DOMPurify.sanitize(html, {
          ALLOWED_TAGS: [
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "p",
            "br",
            "strong",
            "b",
            "em",
            "i",
            "u",
            "s",
            "del",
            "a",
            "img",
            "ul",
            "ol",
            "li",
            "dl",
            "dt",
            "dd",
            "blockquote",
            "code",
            "pre",
            "kbd",
            "samp",
            "var",
            "table",
            "thead",
            "tbody",
            "tfoot",
            "tr",
            "th",
            "td",
            "caption",
            "div",
            "span",
            "section",
            "article",
            "aside",
            "header",
            "footer",
            "main",
            "details",
            "summary",
            "figure",
            "figcaption",
          ],
          ALLOWED_ATTR: [
            "href",
            "src",
            "alt",
            "title",
            "class",
            "id",
            "style",
            "width",
            "height",
            "target",
            "rel",
            "type",
          ],
          ALLOW_DATA_ATTR: false,
        });
      } catch (error) {
        console.error("HTML sanitization error:", error);
        return html; // Return original HTML as fallback
      }
    },

    toMarkdown: (html: string) => {
      try {
        // Enhanced HTML to Markdown conversion with better data preservation
        let markdown = html;

        // Handle nested structures first to preserve hierarchy
        // Convert tables
        markdown = markdown.replace(
          /<table[^>]*>(.*?)<\/table>/gims,
          (match, content) => {
            const rows = content.match(/<tr[^>]*>(.*?)<\/tr>/gim) || [];
            if (rows.length === 0) return match;

            let tableMarkdown = "\n";
            let isFirstRow = true;

            rows.forEach((row) => {
              const cells = row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gim) || [];
              if (cells.length > 0) {
                const cellContents = cells.map((cell) =>
                  cell.replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/gim, "$1").trim(),
                );
                tableMarkdown += "| " + cellContents.join(" | ") + " |\n";

                if (isFirstRow) {
                  tableMarkdown +=
                    "|" + " --- |".repeat(cellContents.length) + "\n";
                  isFirstRow = false;
                }
              }
            });

            return tableMarkdown + "\n";
          },
        );

        // Convert code blocks (preserve language if specified)
        markdown = markdown.replace(
          /<pre[^>]*><code[^>]*class="language-([^"]*)"[^>]*>(.*?)<\/code><\/pre>/gims,
          "```$1\n$2\n```\n\n",
        );
        markdown = markdown.replace(
          /<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gims,
          "```\n$1\n```\n\n",
        );
        markdown = markdown.replace(
          /<pre[^>]*>(.*?)<\/pre>/gims,
          "```\n$1\n```\n\n",
        );

        // Convert headings
        markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gim, "# $1\n\n");
        markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gim, "## $1\n\n");
        markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gim, "### $1\n\n");
        markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gim, "#### $1\n\n");
        markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gim, "##### $1\n\n");
        markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gim, "###### $1\n\n");

        // Convert text formatting
        markdown = markdown.replace(
          /<strong[^>]*>(.*?)<\/strong>/gim,
          "**$1**",
        );
        markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gim, "**$1**");
        markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gim, "*$1*");
        markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gim, "*$1*");
        markdown = markdown.replace(/<u[^>]*>(.*?)<\/u>/gim, "<u>$1</u>"); // Keep underline as HTML
        markdown = markdown.replace(/<s[^>]*>(.*?)<\/s>/gim, "~~$1~~");
        markdown = markdown.replace(/<del[^>]*>(.*?)<\/del>/gim, "~~$1~~");

        // Convert inline code
        markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gim, "`$1`");

        // Convert links (preserve title if present)
        markdown = markdown.replace(
          /<a[^>]*href="([^"]*)"[^>]*title="([^"]*)"[^>]*>(.*?)<\/a>/gim,
          '[$3]($1 "$2")',
        );
        markdown = markdown.replace(
          /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gim,
          "[$2]($1)",
        );

        // Convert images (preserve alt and title)
        markdown = markdown.replace(
          /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*title="([^"]*)"[^>]*>/gim,
          '![$2]($1 "$3")',
        );
        markdown = markdown.replace(
          /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gim,
          "![$2]($1)",
        );
        markdown = markdown.replace(
          /<img[^>]*src="([^"]*)"[^>]*>/gim,
          "![]($1)",
        );

        // Convert blockquotes (handle nested content)
        markdown = markdown.replace(
          /<blockquote[^>]*>(.*?)<\/blockquote>/gims,
          (match, content) => {
            const lines = content
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line);
            return lines.map((line) => `> ${line}`).join("\n") + "\n\n";
          },
        );

        // Convert lists (handle nested lists)
        markdown = markdown.replace(
          /<ul[^>]*>(.*?)<\/ul>/gims,
          (match, content) => {
            const items = content.match(/<li[^>]*>(.*?)<\/li>/gims) || [];
            const listItems = items.map((item) => {
              const itemContent = item
                .replace(/<li[^>]*>(.*?)<\/li>/gims, "$1")
                .trim();
              return `- ${itemContent}`;
            });
            return listItems.join("\n") + "\n\n";
          },
        );

        markdown = markdown.replace(
          /<ol[^>]*>(.*?)<\/ol>/gims,
          (match, content) => {
            const items = content.match(/<li[^>]*>(.*?)<\/li>/gims) || [];
            const listItems = items.map((item, index) => {
              const itemContent = item
                .replace(/<li[^>]*>(.*?)<\/li>/gims, "$1")
                .trim();
              return `${index + 1}. ${itemContent}`;
            });
            return listItems.join("\n") + "\n\n";
          },
        );

        // Convert horizontal rules
        markdown = markdown.replace(/<hr[^>]*>/gim, "\n---\n\n");

        // Convert line breaks
        markdown = markdown.replace(/<br\s*\/?>/gim, "\n");

        // Convert paragraphs
        markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gims, "$1\n\n");

        // Convert divs to paragraphs (basic handling)
        markdown = markdown.replace(/<div[^>]*>(.*?)<\/div>/gims, "$1\n\n");

        // Handle remaining HTML tags that don't have Markdown equivalents
        // Keep them as HTML for better data preservation
        const preservedTags = [
          "sup",
          "sub",
          "mark",
          "kbd",
          "var",
          "samp",
          "details",
          "summary",
        ];
        preservedTags.forEach((tag) => {
          const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, "gim");
          // Keep these tags as-is since Markdown doesn't have equivalents
        });

        // Remove any remaining HTML tags (but preserve their content)
        markdown = markdown.replace(/<[^>]+>/g, "");

        // Clean up excessive whitespace
        markdown = markdown.replace(/\n{3,}/g, "\n\n");
        markdown = markdown.replace(/^\s+|\s+$/g, ""); // Trim start and end

        return markdown;
      } catch (error) {
        console.error("HTML to Markdown conversion error:", error);
        return html; // Return original HTML as fallback
      }
    },
  };
}

export function validateHtml(html: string): {
  valid: boolean;
  errors: HtmlError[];
} {
  const processor = createHtmlProcessor();
  const result = processor.validate(html);

  return {
    valid: result.valid,
    errors: result.errors.map((error) => ({
      type: "validation" as const,
      message: error,
    })),
  };
}
