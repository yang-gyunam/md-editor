// Core editor types and interfaces
import type { Template, Snippet } from "./template.js";

export type EditorMode = "html" | "markdown";
export type EditorTheme = "light" | "dark" | "auto";

export interface EditorProps {
  value?: string;
  mode?: EditorMode;
  showPreview?: boolean;
  showToolbar?: boolean;
  placeholder?: string;
  readonly?: boolean;
  theme?: EditorTheme;
  debounceMs?: number;
  maxLength?: number;
  templates?: Template[];
  snippets?: Snippet[];
  enableSlashCommands?: boolean;
  githubStyle?: boolean;
}

export interface EditorEvents {
  change: (value: string) => void;
  modeChange: (mode: EditorMode) => void;
  focus: () => void;
  blur: () => void;
  templateInsert: (template: Template) => void;
  snippetInsert: (snippet: Snippet) => void;
}

export interface EditorState {
  content: string;
  mode: EditorMode;
  showPreview: boolean;
  cursorPosition: number;
  selection: { start: number; end: number } | null;
  history: HistoryEntry[];
  historyIndex: number;
  showTemplatePopup: boolean;
  templateFilter: string;
  customShortcuts: Record<string, Snippet>;
}

export interface HistoryEntry {
  content: string;
  cursorPosition: number;
  timestamp: number;
}

export interface EditorError {
  type: "validation" | "parsing" | "rendering";
  message: string;
  line?: number;
  column?: number;
}

export interface CodeEditorProps {
  value: string;
  mode: EditorMode;
  placeholder?: string;
  readonly?: boolean;
  onInput: (value: string) => void;
  enableVirtualScrolling?: boolean;
  performanceMode?: "auto" | "always" | "never";
  maxContentSize?: number;
}

export interface PerformanceMetrics {
  renderTime: number;
  inputLatency: number;
  memoryUsage: number;
  isLargeDocument: boolean;
  useVirtualScrolling: boolean;
  lineCount: number;
  contentSize: number;
}
