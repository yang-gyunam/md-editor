// Lightweight syntax highlighting utilities

export interface SyntaxToken {
  type: string;
  value: string;
  start: number;
  end: number;
}

export interface SyntaxHighlightConfig {
  theme: "light" | "dark";
  mode: "html" | "markdown";
}

// HTML syntax highlighting patterns
const HTML_PATTERNS = [
  { type: "tag", pattern: /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?>/ },
  { type: "attribute", pattern: /\s([a-zA-Z-]+)=/ },
  { type: "string", pattern: /"[^"]*"|'[^']*'/ },
  { type: "comment", pattern: /<!--[\s\S]*?-->/ },
  { type: "doctype", pattern: /<!DOCTYPE[^>]*>/i },
];

// Markdown syntax highlighting patterns with GFM support
const MARKDOWN_PATTERNS = [
  { type: "header", pattern: /^#{1,6}\s.+$/gm },
  { type: "bold", pattern: /\*\*([^*]+)\*\*|__([^_]+)__/g },
  { type: "italic", pattern: /\*([^*]+)\*|_([^_]+)_/g },
  { type: "code-inline", pattern: /`([^`]+)`/g },
  { type: "code-block", pattern: /```[\s\S]*?```|~~~[\s\S]*?~~~/g },
  { type: "link", pattern: /\[([^\]]+)\]\(([^)]+)\)/g },
  { type: "image", pattern: /!\[([^\]]*)\]\(([^)]+)\)/g },
  { type: "task-list-checked", pattern: /^[\s]*[-*+]\s+\[x\]\s/gm },
  { type: "task-list-unchecked", pattern: /^[\s]*[-*+]\s+\[\s\]\s/gm },
  { type: "list", pattern: /^[\s]*[-*+]\s/gm },
  { type: "ordered-list", pattern: /^[\s]*\d+\.\s/gm },
  { type: "blockquote", pattern: /^>\s.+$/gm },
  { type: "strikethrough", pattern: /~~([^~]+)~~/g },
  { type: "table-header", pattern: /^\|.*\|\s*$/gm },
  { type: "table-separator", pattern: /^\|[\s:|-]+\|\s*$/gm },
  { type: "table-row", pattern: /^\|.*\|(?!\s*$)/gm },
  { type: "auto-link", pattern: /https?:\/\/[^\s]+/g },
  { type: "emoji", pattern: /:[\w+-]+:/g },
];

export function tokenizeHTML(text: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];

  for (const { type, pattern } of HTML_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags || "g");
    let match;

    while ((match = regex.exec(text)) !== null) {
      tokens.push({
        type,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Sort tokens by start position
  return tokens.sort((a, b) => a.start - b.start);
}

export function tokenizeMarkdown(text: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];

  for (const { type, pattern } of MARKDOWN_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags || "g");
    let match;

    while ((match = regex.exec(text)) !== null) {
      tokens.push({
        type,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Sort tokens by start position
  return tokens.sort((a, b) => a.start - b.start);
}

export function highlightSyntax(
  text: string,
  mode: "html" | "markdown",
): string {
  const tokens = mode === "html" ? tokenizeHTML(text) : tokenizeMarkdown(text);

  if (tokens.length === 0) return escapeHtml(text);

  let result = "";
  let lastIndex = 0;

  for (const token of tokens) {
    // Add text before token
    if (token.start > lastIndex) {
      result += escapeHtml(text.substring(lastIndex, token.start));
    }

    // Add highlighted token
    result += `<span class="syntax-${token.type}">${escapeHtml(token.value)}</span>`;
    lastIndex = token.end;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result += escapeHtml(text.substring(lastIndex));
  }

  return result;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function getSyntaxCSS(theme: "light" | "dark" = "light"): string {
  const lightTheme = {
    "syntax-tag": "#d73a49",
    "syntax-attribute": "#6f42c1",
    "syntax-string": "#032f62",
    "syntax-comment": "#6a737d",
    "syntax-doctype": "#6a737d",
    "syntax-header": "#005cc5",
    "syntax-bold": "#24292e",
    "syntax-italic": "#24292e",
    "syntax-code-inline": "#e36209",
    "syntax-code-block": "#e36209",
    "syntax-link": "#0366d6",
    "syntax-image": "#0366d6",
    "syntax-task-list-checked": "#28a745",
    "syntax-task-list-unchecked": "#6a737d",
    "syntax-list": "#d73a49",
    "syntax-ordered-list": "#d73a49",
    "syntax-blockquote": "#6a737d",
    "syntax-strikethrough": "#6a737d",
    "syntax-table-header": "#6f42c1",
    "syntax-table-separator": "#d1d5da",
    "syntax-table-row": "#24292e",
    "syntax-auto-link": "#0366d6",
    "syntax-emoji": "#e36209",
  };

  const darkTheme = {
    "syntax-tag": "#f97583",
    "syntax-attribute": "#b392f0",
    "syntax-string": "#9ecbff",
    "syntax-comment": "#6a737d",
    "syntax-doctype": "#6a737d",
    "syntax-header": "#79b8ff",
    "syntax-bold": "#f0f6fc",
    "syntax-italic": "#f0f6fc",
    "syntax-code-inline": "#ffab70",
    "syntax-code-block": "#ffab70",
    "syntax-link": "#58a6ff",
    "syntax-image": "#58a6ff",
    "syntax-task-list-checked": "#56d364",
    "syntax-task-list-unchecked": "#8b949e",
    "syntax-list": "#f97583",
    "syntax-ordered-list": "#f97583",
    "syntax-blockquote": "#8b949e",
    "syntax-strikethrough": "#8b949e",
    "syntax-table-header": "#d2a8ff",
    "syntax-table-separator": "#30363d",
    "syntax-table-row": "#f0f6fc",
    "syntax-auto-link": "#58a6ff",
    "syntax-emoji": "#ffab70",
  };

  const colors = theme === "dark" ? darkTheme : lightTheme;

  return Object.entries(colors)
    .map(([className, color]) => `.${className} { color: ${color}; }`)
    .join("\n");
}
