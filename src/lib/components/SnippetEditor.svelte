<script lang="ts">
  import type { 
    Snippet, 
    SnippetEditorProps 
  } from '../types/template.js';
  import { 
    validateSnippetShortcut, 
    generateSnippetId,
    parsePlaceholders 
  } from '../utils/snippet.js';

  const {
    snippet,
    isOpen = false,
    onSave,
    onCancel,
    existingShortcuts = []
  }: SnippetEditorProps = $props();

  // Form state
  let formData = $state({
    name: '',
    description: '',
    shortcut: '',
    content: '',
    category: 'General'
  });

  let errors = $state<Record<string, string>>({});
  let previewPlaceholders = $state<string[]>([]);

  // Initialize form data when snippet changes
  $effect(() => {
    if (snippet) {
      formData = {
        name: snippet.name,
        description: snippet.description || '',
        shortcut: snippet.shortcut,
        content: snippet.content,
        category: snippet.category || 'General'
      };
    } else {
      formData = {
        name: '',
        description: '',
        shortcut: '',
        content: '',
        category: 'General'
      };
    }
    errors = {};
  });

  // Update placeholder preview when content changes
  $effect(() => {
    const placeholders = parsePlaceholders(formData.content);
    previewPlaceholders = placeholders.map(p => 
      `\${${p.tabIndex}${p.defaultValue ? ':' + p.defaultValue : ''}}`
    );
  });

  // Validation
  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (formData.shortcut.trim()) {
      const shortcutValidation = validateSnippetShortcut(
        formData.shortcut,
        existingShortcuts,
        snippet?.id
      );
      if (!shortcutValidation.isValid) {
        newErrors.shortcut = shortcutValidation.error || 'Invalid shortcut';
      }
    }

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validateForm()) return;

    const snippetData: Snippet = {
      id: snippet?.id || generateSnippetId(),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      shortcut: formData.shortcut.trim(),
      content: formData.content,
      category: formData.category,
      createdAt: snippet?.createdAt || Date.now(),
      useCount: snippet?.useCount || 0,
      lastUsed: snippet?.lastUsed
    };

    onSave(snippetData);
  }

  function handleCancel() {
    onCancel();
  }

  function insertPlaceholder(tabIndex: number) {
    const placeholder = `\${${tabIndex}:placeholder}`;
    const textarea = document.querySelector('.content-textarea') as HTMLTextAreaElement;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = 
        formData.content.slice(0, start) + 
        placeholder + 
        formData.content.slice(end);
      
      formData.content = newContent;
      
      // Set cursor position after the placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSave();
    }
  }

  // Global keyboard listener
  $effect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
  });

  const categories = ['General', 'HTML', 'Markdown', 'Code', 'Text', 'Custom'];
</script>

{#if isOpen}
  <div class="snippet-editor">
    <div class="snippet-editor-header">
      <h3>{snippet ? 'Edit Snippet' : 'Create New Snippet'}</h3>
    </div>

    <div class="snippet-editor-content">
      <div class="form-group">
        <label for="snippet-name">Name *</label>
        <input
          id="snippet-name"
          type="text"
          bind:value={formData.name}
          placeholder="Enter snippet name"
          class="form-input"
          class:error={errors.name}
        />
        {#if errors.name}
          <div class="error-message">{errors.name}</div>
        {/if}
      </div>

      <div class="form-group">
        <label for="snippet-description">Description</label>
        <input
          id="snippet-description"
          type="text"
          bind:value={formData.description}
          placeholder="Optional description"
          class="form-input"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="snippet-shortcut">Keyboard Shortcut</label>
          <input
            id="snippet-shortcut"
            type="text"
            bind:value={formData.shortcut}
            placeholder="e.g., Ctrl+Shift+S"
            class="form-input"
            class:error={errors.shortcut}
          />
          {#if errors.shortcut}
            <div class="error-message">{errors.shortcut}</div>
          {/if}
        </div>

        <div class="form-group">
          <label for="snippet-category">Category</label>
          <select
            id="snippet-category"
            bind:value={formData.category}
            class="form-select"
          >
            {#each categories as category}
              <option value={category}>{category}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="snippet-content">Content *</label>
        <div class="content-editor">
          <textarea
            id="snippet-content"
            bind:value={formData.content}
            placeholder="Enter snippet content..."
            rows="8"
            class="form-textarea content-textarea"
            class:error={errors.content}
          ></textarea>
          
          <div class="placeholder-tools">
            <div class="placeholder-help">
              <strong>Placeholders:</strong> Use <code>${'${1:placeholder}'}</code> syntax
            </div>
            <div class="placeholder-buttons">
              <button 
                type="button" 
                onclick={() => insertPlaceholder(1)}
                class="placeholder-btn"
              >
                Add ${'{1}'}
              </button>
              <button 
                type="button" 
                onclick={() => insertPlaceholder(2)}
                class="placeholder-btn"
              >
                Add ${'{2}'}
              </button>
              <button 
                type="button" 
                onclick={() => insertPlaceholder(3)}
                class="placeholder-btn"
              >
                Add ${'{3}'}
              </button>
            </div>
          </div>
        </div>
        {#if errors.content}
          <div class="error-message">{errors.content}</div>
        {/if}
      </div>

      {#if previewPlaceholders.length > 0}
        <div class="placeholder-preview">
          <strong>Detected placeholders:</strong>
          <div class="placeholder-list">
            {#each previewPlaceholders as placeholder}
              <code class="placeholder-tag">{placeholder}</code>
            {/each}
          </div>
        </div>
      {/if}

      <div class="preview-section">
        <label>Preview:</label>
        <div class="content-preview">
          {formData.content || 'Content preview will appear here...'}
        </div>
      </div>
    </div>

    <div class="snippet-editor-footer">
      <div class="help-text">
        <kbd>Ctrl+Enter</kbd> Save • <kbd>Esc</kbd> Cancel
      </div>
      <div class="footer-actions">
        <button type="button" onclick={handleCancel} class="btn-secondary">
          Cancel
        </button>
        <button type="button" onclick={handleSave} class="btn-primary">
          {snippet ? 'Update' : 'Create'} Snippet
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .snippet-editor {
    width: 600px;
    max-width: 90vw;
    background: var(--bg-color, #ffffff);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    max-height: 80vh;
  }

  .snippet-editor-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color, #e1e5e9);
  }

  .snippet-editor-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .snippet-editor-content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary, #24292f);
  }

  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: inherit;
    transition: border-color 0.2s ease;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--accent-color, #0969da);
    box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.1);
  }

  .form-input.error,
  .form-textarea.error {
    border-color: var(--error-color, #d1242f);
  }

  .form-textarea {
    resize: vertical;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    line-height: 1.5;
  }

  .content-editor {
    position: relative;
  }

  .placeholder-tools {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: var(--code-bg, #f6f8fa);
    border-radius: 6px;
    border: 1px solid var(--border-color, #e1e5e9);
  }

  .placeholder-help {
    font-size: 0.875rem;
    color: var(--text-muted, #656d76);
    margin-bottom: 0.5rem;
  }

  .placeholder-help code {
    background: var(--code-bg, #ffffff);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-size: 0.8125rem;
  }

  .placeholder-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .placeholder-btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 4px;
    background: var(--button-bg, #ffffff);
    cursor: pointer;
    font-size: 0.8125rem;
    font-family: monospace;
  }

  .placeholder-btn:hover {
    background: var(--button-hover-bg, #f6f8fa);
  }

  .placeholder-preview {
    margin-bottom: 1.5rem;
    padding: 0.75rem;
    background: var(--info-bg, #f1f8ff);
    border: 1px solid var(--info-border, #c6e2ff);
    border-radius: 6px;
  }

  .placeholder-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .placeholder-tag {
    background: var(--code-bg, #ffffff);
    color: var(--code-color, #24292f);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8125rem;
    border: 1px solid var(--border-color, #e1e5e9);
  }

  .preview-section {
    margin-bottom: 1.5rem;
  }

  .preview-section label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .content-preview {
    padding: 0.75rem;
    background: var(--preview-bg, #f6f8fa);
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 6px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    white-space: pre-wrap;
    color: var(--text-muted, #656d76);
    min-height: 3rem;
  }

  .error-message {
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    color: var(--error-color, #d1242f);
  }

  .snippet-editor-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-top: 1px solid var(--border-color, #e1e5e9);
    background: var(--footer-bg, #f6f8fa);
  }

  .help-text {
    font-size: 0.8125rem;
    color: var(--text-muted, #656d76);
  }

  .help-text kbd {
    font-family: monospace;
    font-size: 0.75rem;
    background: var(--kbd-bg, #ffffff);
    color: var(--kbd-color, #24292f);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    border: 1px solid var(--border-color, #e1e5e9);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
  }

  .footer-actions {
    display: flex;
    gap: 0.75rem;
  }

  .btn-secondary,
  .btn-primary {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secondary {
    background: var(--button-bg, #f6f8fa);
    border: 1px solid var(--border-color, #e1e5e9);
    color: var(--text-primary, #24292f);
  }

  .btn-secondary:hover {
    background: var(--button-hover-bg, #e1e5e9);
  }

  .btn-primary {
    background: var(--accent-color, #0969da);
    border: 1px solid var(--accent-color, #0969da);
    color: #ffffff;
  }

  .btn-primary:hover {
    background: var(--accent-hover, #0860ca);
    border-color: var(--accent-hover, #0860ca);
  }
</style>