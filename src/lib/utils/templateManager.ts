// Template manager for handling template operations

import type { Template } from "../types/index.js";
import { EditorStorage } from "./storage.js";
import { getDefaultTemplates, validateTemplate } from "./template.js";

export class TemplateService {
  private storage: EditorStorage;
  private templates: Template[] = [];

  constructor() {
    this.storage = new EditorStorage();
    this.loadTemplates();
  }

  /**
   * Load templates from storage, initialize with defaults if empty
   */
  private loadTemplates(): void {
    this.templates = this.storage.getTemplates();

    // Initialize with default templates if none exist
    if (this.templates.length === 0) {
      this.templates = getDefaultTemplates();
      this.saveTemplates();
    }
  }

  /**
   * Save templates to storage
   */
  private saveTemplates(): void {
    this.storage.saveTemplates(this.templates);
  }

  /**
   * Get all templates
   */
  getTemplates(): Template[] {
    return [...this.templates];
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): Template[] {
    return this.templates.filter((template) => template.category === category);
  }

  /**
   * Search templates by name or content
   */
  searchTemplates(query: string): Template[] {
    const lowercaseQuery = query.toLowerCase();
    return this.templates.filter(
      (template) =>
        template.name.toLowerCase().includes(lowercaseQuery) ||
        template.description?.toLowerCase().includes(lowercaseQuery) ||
        template.content.toLowerCase().includes(lowercaseQuery),
    );
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): Template | undefined {
    return this.templates.find((template) => template.id === id);
  }

  /**
   * Add a new template
   */
  addTemplate(template: Omit<Template, "id">): Template {
    const validation = validateTemplate(template.content);
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(", ")}`);
    }

    const newTemplate: Template = {
      ...template,
      id: this.generateId(),
    };

    this.templates.push(newTemplate);
    this.saveTemplates();
    return newTemplate;
  }

  /**
   * Update an existing template
   */
  updateTemplate(id: string, updates: Partial<Omit<Template, "id">>): Template {
    const templateIndex = this.templates.findIndex((t) => t.id === id);
    if (templateIndex === -1) {
      throw new Error(`Template with id ${id} not found`);
    }

    const updatedTemplate = { ...this.templates[templateIndex], ...updates };

    if (updates.content) {
      const validation = validateTemplate(updates.content);
      if (!validation.valid) {
        throw new Error(
          `Invalid template content: ${validation.errors.join(", ")}`,
        );
      }
    }

    this.templates[templateIndex] = updatedTemplate;
    this.saveTemplates();
    return updatedTemplate;
  }

  /**
   * Delete a template
   */
  deleteTemplate(id: string): boolean {
    const templateIndex = this.templates.findIndex((t) => t.id === id);
    if (templateIndex === -1) {
      return false;
    }

    this.templates.splice(templateIndex, 1);
    this.saveTemplates();
    return true;
  }

  /**
   * Get all unique categories
   */
  getCategories(): string[] {
    const categories = new Set(
      this.templates
        .map((t) => t.category)
        .filter((category): category is string => Boolean(category)),
    );
    return Array.from(categories).sort();
  }

  /**
   * Import templates from external source
   */
  importTemplates(templates: Template[]): {
    imported: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let imported = 0;

    for (const template of templates) {
      try {
        // Validate template
        const validation = validateTemplate(template.content);
        if (!validation.valid) {
          errors.push(
            `Template "${template.name}": ${validation.errors.join(", ")}`,
          );
          continue;
        }

        // Check for duplicate IDs and generate new ones if needed
        const templateToAdd = { ...template };
        if (this.templates.some((t) => t.id === template.id)) {
          templateToAdd.id = this.generateId();
        }

        this.templates.push(templateToAdd);
        imported++;
      } catch (error) {
        errors.push(
          `Template "${template.name}": ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    if (imported > 0) {
      this.saveTemplates();
    }

    return { imported, errors };
  }

  /**
   * Export all templates
   */
  exportTemplates(): Template[] {
    return [...this.templates];
  }

  /**
   * Reset to default templates
   */
  resetToDefaults(): void {
    this.templates = getDefaultTemplates();
    this.saveTemplates();
  }

  /**
   * Generate a unique ID for templates
   */
  private generateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update last used templates for quick access
   */
  markTemplateAsUsed(templateId: string): void {
    const settings = this.storage.getSettings();
    const lastUsed = settings.lastUsedTemplates.filter(
      (id) => id !== templateId,
    );
    lastUsed.unshift(templateId);

    // Keep only the last 10 used templates
    settings.lastUsedTemplates = lastUsed.slice(0, 10);
    this.storage.saveSettings(settings);
  }

  /**
   * Get recently used templates
   */
  getRecentlyUsedTemplates(): Template[] {
    const settings = this.storage.getSettings();
    return settings.lastUsedTemplates
      .map((id) => this.getTemplate(id))
      .filter((template): template is Template => template !== undefined);
  }
}
