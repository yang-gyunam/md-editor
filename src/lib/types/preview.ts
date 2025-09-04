// Preview pane related types

import type { EditorMode } from "./editor.js";

export interface PreviewProps {
  content: string;
  mode: EditorMode;
  sanitize?: boolean;
  githubStyle?: boolean;
  debounceMs?: number;
}

// CodeEditorProps moved to editor.ts to avoid duplication

export interface GitHubStyleConfig {
  useGitHubCSS: boolean;
  fontFamily: string;
  fontSize: string;
  lineHeight: number;
  codeTheme: "github-light" | "github-dark";
}
