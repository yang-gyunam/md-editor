// Markdown processing utilities
import { marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedHighlight } from "marked-highlight";
import DOMPurify from "dompurify";
import Prism from "prismjs";
import { replaceEmojiShortcodes } from "./emoji.js";

// Import common language components for syntax highlighting
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";

export interface MarkdownProcessor {
  toHtml: (markdown: string) => string;
  sanitize: (html: string) => string;
}

export interface MarkdownError {
  type: "parsing" | "rendering";
  message: string;
  line?: number;
  column?: number;
}

export interface GFMOptions {
  tables: boolean;
  breaks: boolean;
  pedantic: boolean;
  gfm: boolean;
  sanitize: boolean;
  smartLists: boolean;
  smartypants: boolean;
  headerIds: boolean;
  syntaxHighlight: boolean;
}

// Configure marked with GitHub Flavored Markdown extensions
function configureMarked(options: Partial<GFMOptions> = {}) {
  const defaultOptions: GFMOptions = {
    tables: true,
    breaks: true,
    pedantic: false,
    gfm: true,
    sanitize: false, // We'll sanitize separately
    smartLists: true,
    smartypants: false,
    headerIds: true,
    syntaxHighlight: true,
  };

  const config = { ...defaultOptions, ...options };

  // Configure marked options
  marked.setOptions({
    gfm: config.gfm,
    breaks: config.breaks,
    pedantic: config.pedantic,
    sanitize: config.sanitize,
    smartLists: config.smartLists,
    smartypants: config.smartypants,
  });

  // Add GFM heading IDs extension
  if (config.headerIds) {
    try {
      marked.use(gfmHeadingId());
    } catch (error) {
      console.warn("Failed to add GFM heading IDs:", error);
    }
  }

  // Add syntax highlighting extension
  if (config.syntaxHighlight) {
    try {
      marked.use(
        markedHighlight({
          langPrefix: "language-",
          highlight(code, lang) {
            try {
              if (lang && Prism.languages[lang]) {
                return Prism.highlight(code, Prism.languages[lang], lang);
              }
              return code;
            } catch (error) {
              console.warn("Syntax highlighting error:", error);
              return code;
            }
          },
        }),
      );
    } catch (error) {
      console.warn("Failed to add syntax highlighting:", error);
    }
  }
}

export function createMarkdownProcessor(
  options?: Partial<GFMOptions>,
): MarkdownProcessor {
  // Configure marked with the provided options
  configureMarked(options);

  return {
    toHtml: (markdown: string) => {
      try {
        // Use marked to convert markdown to HTML
        let html = marked.parse(markdown);
        html = typeof html === "string" ? html : "";

        // Post-process the HTML to add GitHub-style features
        html = postProcessGFMFeatures(html);

        return html;
      } catch (error) {
        console.error("Markdown parsing error:", error);
        // Enhanced fallback conversion with GFM features
        return (
          markdown
            // Headers with IDs
            .replace(/^#{6}\s+(.*$)/gim, '<h6 id="$1">$1</h6>')
            .replace(/^#{5}\s+(.*$)/gim, '<h5 id="$1">$1</h5>')
            .replace(/^#{4}\s+(.*$)/gim, '<h4 id="$1">$1</h4>')
            .replace(/^#{3}\s+(.*$)/gim, '<h3 id="$1">$1</h3>')
            .replace(/^#{2}\s+(.*$)/gim, '<h2 id="$1">$1</h2>')
            .replace(/^#{1}\s+(.*$)/gim, '<h1 id="$1">$1</h1>')

            // Text formatting including strikethrough
            .replace(/\*\*\*(.*?)\*\*\*/gim, "<strong><em>$1</em></strong>")
            .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/gim, "<em>$1</em>")
            .replace(/~~(.*?)~~/gim, "<del>$1</del>")
            .replace(/`(.*?)`/gim, "<code>$1</code>")

            // Task lists (checkboxes)
            .replace(
              /^\s*[-*+]\s+\[x\]\s+(.*$)/gim,
              '<li class="task-list-item"><input type="checkbox" checked disabled class="task-list-item-checkbox"> $1</li>',
            )
            .replace(
              /^\s*[-*+]\s+\[\s\]\s+(.*$)/gim,
              '<li class="task-list-item"><input type="checkbox" disabled class="task-list-item-checkbox"> $1</li>',
            )

            // Links and images
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1">')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')

            // Auto-link URLs
            .replace(/(https?:\/\/[^\s]+)/gim, '<a href="$1">$1</a>')

            // Tables (basic)
            .replace(/\|(.+)\|/gim, "<tr><td>$1</td></tr>")

            // Lists (basic)
            .replace(/^\s*[-*+]\s+(.*$)/gim, "<li>$1</li>")
            .replace(/^\s*\d+\.\s+(.*$)/gim, "<li>$1</li>")

            // Line breaks and paragraphs
            .replace(/\n\n/gim, "</p><p>")
            .replace(/\n/gim, "<br>")
            .replace(/^(.*)$/gim, "<p>$1</p>")

            // Clean up empty paragraphs
            .replace(/<p><\/p>/gim, "")
            .replace(/<p>\s*<\/p>/gim, "")
        );
      }
    },
    sanitize: (html: string) => {
      try {
        // Use DOMPurify to sanitize HTML with GFM support
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
            "em",
            "u",
            "s",
            "del",
            "a",
            "img",
            "ul",
            "ol",
            "li",
            "blockquote",
            "code",
            "pre",
            "table",
            "thead",
            "tbody",
            "tr",
            "th",
            "td",
            "div",
            "span",
            "input",
          ],
          ALLOWED_ATTR: [
            "href",
            "src",
            "alt",
            "title",
            "class",
            "id",
            "type",
            "checked",
            "disabled",
          ],
          ALLOW_DATA_ATTR: false,
        });
      } catch (error) {
        console.error("HTML sanitization error:", error);
        return html; // Return unsanitized HTML as fallback
      }
    },
  };
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Post-process HTML to add GitHub-style features
function postProcessGFMFeatures(html: string): string {
  let result = html;

  // Replace emoji shortcodes with actual emojis
  result = replaceEmojiShortcodes(result);

  // Auto-link URLs that aren't already linked
  result = result.replace(
    /(?<!href=["'])(https?:\/\/[^\s<>"]+)(?![^<]*<\/a>)/gi,
    '<a href="$1">$1</a>',
  );

  // Wrap tables with GitHub-style wrapper
  result = result
    .replace(/<table>/g, '<div class="table-wrapper"><table class="gfm-table">')
    .replace(/<\/table>/g, "</table></div>");

  // Convert task list items to GitHub-style checkboxes
  // Handle already processed checkboxes from marked
  result = result
    .replace(
      /<li><input ([^>]*checked[^>]*) type="checkbox"([^>]*)>\s*(.*?)<\/li>/gi,
      '<li class="task-list-item"><input $1 type="checkbox"$2 class="task-list-item-checkbox"> $3</li>',
    )
    .replace(
      /<li><input ([^>]*) type="checkbox"([^>]*)>\s*(.*?)<\/li>/gi,
      '<li class="task-list-item"><input $1 type="checkbox"$2 class="task-list-item-checkbox"> $3</li>',
    );

  // Handle raw markdown checkboxes that weren't processed
  result = result
    .replace(
      /<li>\s*\[x\]\s*(.*?)<\/li>/gi,
      '<li class="task-list-item"><input type="checkbox" checked disabled class="task-list-item-checkbox"> $1</li>',
    )
    .replace(
      /<li>\s*\[\s\]\s*(.*?)<\/li>/gi,
      '<li class="task-list-item"><input type="checkbox" disabled class="task-list-item-checkbox"> $1</li>',
    );

  // Wrap code blocks with GitHub-style wrapper
  result = result
    .replace(
      /<pre><code class="language-([^"]*)">([\s\S]*?)<\/code><\/pre>/g,
      '<div class="code-block-wrapper"><pre class="code-block language-$1"><code class="language-$1">$2</code></pre></div>',
    )
    .replace(
      /<pre><code>([\s\S]*?)<\/code><\/pre>/g,
      '<div class="code-block-wrapper"><pre class="code-block"><code>$1</code></pre></div>',
    );

  return result;
}

export function validateMarkdown(markdown: string): {
  valid: boolean;
  errors: MarkdownError[];
} {
  const errors: MarkdownError[] = [];

  try {
    marked.parse(markdown);
    return { valid: true, errors: [] };
  } catch (error) {
    errors.push({
      type: "parsing",
      message: error instanceof Error ? error.message : "Unknown parsing error",
    });
    return { valid: false, errors };
  }
}

// GitHub Flavored Markdown specific utilities
export function isGFMTable(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}

export function isTaskListItem(line: string): boolean {
  return /^\s*[-*+]\s+\[([x\s])\]\s+/.test(line);
}

export function parseTaskListItem(
  line: string,
): { checked: boolean; text: string } | null {
  const match = line.match(/^\s*[-*+]\s+\[([x\s])\]\s+(.+)$/);
  if (!match) return null;

  return {
    checked: match[1].toLowerCase() === "x",
    text: match[2],
  };
}

export function createGFMProcessor(
  options?: Partial<GFMOptions>,
): MarkdownProcessor {
  return createMarkdownProcessor({
    tables: true,
    breaks: true,
    gfm: true,
    syntaxHighlight: true,
    headerIds: true,
    ...options,
  });
}
