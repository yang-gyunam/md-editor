// Local storage utilities for templates and snippets

import type { StorageSchema, Template, Snippet } from "../types/index.js";
import { DEFAULT_SNIPPET_SETTINGS } from "./snippet.js";

const STORAGE_KEY = "html-markdown-editor";

export class EditorStorage {
  private getStorageData(): StorageSchema {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn("Failed to load editor storage data:", error);
    }

    return {
      templates: [],
      snippets: [],
      settings: {
        enableSlashCommands: true,
        templateCategories: ["General", "Code", "Documentation"],
        lastUsedTemplates: [],
        snippetSettings: DEFAULT_SNIPPET_SETTINGS,
        lastUsedSnippets: [],
      },
    };
  }

  private saveStorageData(data: StorageSchema): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save editor storage data:", error);
    }
  }

  getTemplates(): Template[] {
    return this.getStorageData().templates;
  }

  saveTemplates(templates: Template[]): void {
    const data = this.getStorageData();
    data.templates = templates;
    this.saveStorageData(data);
  }

  getSnippets(): Snippet[] {
    return this.getStorageData().snippets;
  }

  saveSnippets(snippets: Snippet[]): void {
    const data = this.getStorageData();
    data.snippets = snippets;
    this.saveStorageData(data);
  }

  getSettings() {
    return this.getStorageData().settings;
  }

  saveSettings(settings: StorageSchema["settings"]): void {
    const data = this.getStorageData();
    data.settings = settings;
    this.saveStorageData(data);
  }

  exportData() {
    const data = this.getStorageData();
    return {
      version: "1.0.0",
      timestamp: Date.now(),
      templates: data.templates,
      snippets: data.snippets,
    };
  }

  importData(importData: { templates: Template[]; snippets: Snippet[] }): void {
    const data = this.getStorageData();
    data.templates = [...data.templates, ...importData.templates];
    data.snippets = [...data.snippets, ...importData.snippets];
    this.saveStorageData(data);
  }
}
