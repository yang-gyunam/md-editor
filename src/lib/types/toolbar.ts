// Toolbar related types and interfaces

import type { EditorMode } from "./editor.js";

export interface ToolbarProps {
  mode: EditorMode;
  disabled?: boolean;
  customTools?: ToolConfig[];
  editorInstance?: EditorInstance | null;
  onFormatAction?: (action: string, formatAction: FormatAction) => void;
}

export interface ToolConfig {
  id: string;
  label: string;
  icon?: string;
  action: (editor: EditorInstance) => void;
  shortcut?: string;
}

export interface EditorInstance {
  insertText: (text: string) => void;
  wrapSelection: (before: string, after: string) => void;
  getSelection: () => { start: number; end: number; text: string };
  setCursor: (position: number) => void;
  focus: () => void;
  // Additional methods for testing and advanced functionality
  getValue?: () => string;
  setValue?: (value: string) => void;
  getMode?: () => EditorMode;
  undo?: () => void;
  redo?: () => void;
}

export interface FormatAction {
  type: "wrap" | "insert" | "replace";
  before: string;
  after?: string;
  placeholder?: string;
}

// Predefined format actions for Markdown
export const MARKDOWN_ACTIONS: Record<string, FormatAction> = {
  bold: { type: "wrap", before: "**", after: "**", placeholder: "bold text" },
  italic: { type: "wrap", before: "_", after: "_", placeholder: "italic text" },
  link: {
    type: "wrap",
    before: "[",
    after: "](url)",
    placeholder: "link text",
  },
  header1: { type: "insert", before: "# ", placeholder: "Header 1" },
  header2: { type: "insert", before: "## ", placeholder: "Header 2" },
  header3: { type: "insert", before: "### ", placeholder: "Header 3" },
  unorderedList: { type: "insert", before: "- ", placeholder: "List item" },
  orderedList: { type: "insert", before: "1. ", placeholder: "List item" },
  code: { type: "wrap", before: "`", after: "`", placeholder: "code" },
  codeBlock: {
    type: "wrap",
    before: "```\n",
    after: "\n```",
    placeholder: "code block",
  },
};

// Predefined format actions for HTML
export const HTML_ACTIONS: Record<string, FormatAction> = {
  bold: {
    type: "wrap",
    before: "<strong>",
    after: "</strong>",
    placeholder: "bold text",
  },
  italic: {
    type: "wrap",
    before: "<em>",
    after: "</em>",
    placeholder: "italic text",
  },
  paragraph: {
    type: "wrap",
    before: "<p>",
    after: "</p>",
    placeholder: "paragraph text",
  },
  header1: {
    type: "wrap",
    before: "<h1>",
    after: "</h1>",
    placeholder: "Header 1",
  },
  header2: {
    type: "wrap",
    before: "<h2>",
    after: "</h2>",
    placeholder: "Header 2",
  },
  header3: {
    type: "wrap",
    before: "<h3>",
    after: "</h3>",
    placeholder: "Header 3",
  },
  link: {
    type: "wrap",
    before: '<a href="url">',
    after: "</a>",
    placeholder: "link text",
  },
  unorderedList: {
    type: "wrap",
    before: "<ul>\n<li>",
    after: "</li>\n</ul>",
    placeholder: "List item",
  },
  orderedList: {
    type: "wrap",
    before: "<ol>\n<li>",
    after: "</li>\n</ol>",
    placeholder: "List item",
  },
  code: {
    type: "wrap",
    before: "<code>",
    after: "</code>",
    placeholder: "code",
  },
  codeBlock: {
    type: "wrap",
    before: "<pre><code>",
    after: "</code></pre>",
    placeholder: "code block",
  },
};
