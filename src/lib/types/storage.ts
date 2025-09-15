// Storage and persistence related types

import type { Template, Snippet, SnippetSettings } from "./template.js";

export interface StorageSchema {
  templates: Template[];
  snippets: Snippet[];
  settings: {
    enableSlashCommands: boolean;
    templateCategories: string[];
    lastUsedTemplates: string[];
    snippetSettings: SnippetSettings;
    lastUsedSnippets: string[];
  };
}

export interface ExportFormat {
  version: string;
  timestamp: number;
  templates: Template[];
  snippets: Snippet[];
}
