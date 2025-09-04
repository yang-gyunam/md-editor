// Template and snippet related types

export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  variables?: TemplateVariable[];
  category?: string;
}

export interface TemplateVariable {
  name: string;
  placeholder: string;
  defaultValue?: string;
}

export interface Snippet {
  id: string;
  name: string;
  description?: string;
  shortcut: string;
  content: string;
  cursorOffset?: number;
  variables?: TemplateVariable[];
  category?: string;
  createdAt?: number;
  lastUsed?: number;
  useCount?: number;
}

export interface SnippetPlaceholder {
  name: string;
  start: number;
  end: number;
  defaultValue?: string;
  tabIndex: number;
}

export interface SnippetInsertionResult {
  content: string;
  cursorPosition: number;
  placeholders: SnippetPlaceholder[];
  activeTabIndex: number;
}

export interface SnippetSettings {
  enableSnippets: boolean;
  triggerKey: string; // Default: 'Ctrl+Space'
  maxRecentSnippets: number;
  categories: string[];
  customShortcuts: Record<string, string>; // shortcut -> snippet id mapping
}

export interface TemplatePopupProps {
  visible: boolean;
  position: { x: number; y: number };
  templates: Template[];
  filter: string;
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export interface TemplateManagerProps {
  templates: Template[];
  onAdd: (template: Template) => void;
  onEdit: (id: string, template: Template) => void;
  onDelete: (id: string) => void;
  onImport: (templates: Template[]) => void;
  onExport: () => Template[];
}

export interface SnippetManagerProps {
  snippets: Snippet[];
  settings: SnippetSettings;
  onAdd: (snippet: Snippet) => void;
  onEdit: (id: string, snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onShortcutTrigger: (shortcut: string) => void;
  onSettingsChange: (settings: SnippetSettings) => void;
  onImport: (snippets: Snippet[]) => void;
  onExport: () => Snippet[];
}

export interface SnippetSelectorProps {
  visible: boolean;
  position: { x: number; y: number };
  snippets: Snippet[];
  filter: string;
  selectedIndex: number;
  onSelect: (snippet: Snippet) => void;
  onClose: () => void;
  onFilterChange: (filter: string) => void;
}

export interface SnippetEditorProps {
  snippet?: Snippet;
  isOpen: boolean;
  onSave: (snippet: Snippet) => void;
  onCancel: () => void;
  existingShortcuts: string[];
}
