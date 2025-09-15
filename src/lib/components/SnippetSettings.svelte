<script lang="ts">
  import type { SnippetSettings as SnippetSettingsType } from '../types/template.js';
  import { DEFAULT_SNIPPET_SETTINGS } from '../utils/snippet.js';

  interface Props {
    settings: SnippetSettingsType;
    onSave: (settings: SnippetSettingsType) => void;
    onCancel: () => void;
  }

  const { settings, onSave, onCancel }: Props = $props();

  let formData = $state<SnippetSettingsType>({ ...settings });
  let newCategory = $state('');

  // Reset form data when settings change
  $effect(() => {
    formData = { ...settings };
  });

  function handleSave() {
    onSave(formData);
  }

  function handleCancel() {
    onCancel();
  }

  function handleReset() {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      formData = { ...DEFAULT_SNIPPET_SETTINGS };
    }
  }

  function addCategory() {
    if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
      formData.categories = [...formData.categories, newCategory.trim()];
      newCategory = '';
    }
  }

  function removeCategory(category: string) {
    if (formData.categories.length > 1) { // Keep at least one category
      formData.categories = formData.categories.filter(c => c !== category);
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
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="snippet-settings">
  <div class="snippet-settings-header">
    <h3>Snippet Settings</h3>
  </div>

  <div class="snippet-settings-content">
    <div class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={formData.enableSnippets}
          class="checkbox"
        />
        Enable snippets
      </label>
      <div class="help-text">
        When enabled, snippets can be triggered using keyboard shortcuts or the snippet selector.
      </div>
    </div>

    <div class="form-group">
      <label for="trigger-key">Trigger Key Combination</label>
      <input
        id="trigger-key"
        type="text"
        bind:value={formData.triggerKey}
        placeholder="e.g., Ctrl+Space"
        class="form-input"
        disabled={!formData.enableSnippets}
      />
      <div class="help-text">
        Key combination to open the snippet selector.
      </div>
    </div>

    <div class="form-group">
      <label for="max-recent">Maximum Recent Snippets</label>
      <input
        id="max-recent"
        type="number"
        bind:value={formData.maxRecentSnippets}
        min="1"
        max="50"
        class="form-input"
        disabled={!formData.enableSnippets}
      />
      <div class="help-text">
        Number of recently used snippets to show at the top of the list.
      </div>
    </div>

    <div class="form-group">
      <label>Categories</label>
      <div class="categories-list">
        {#each formData.categories as category}
          <div class="category-item">
            <span class="category-name">{category}</span>
            <button
              type="button"
              onclick={() => removeCategory(category)}
              class="remove-btn"
              disabled={formData.categories.length <= 1}
              title="Remove category"
            >
              ×
            </button>
          </div>
        {/each}
      </div>
      
      <div class="add-category">
        <input
          type="text"
          bind:value={newCategory}
          placeholder="New category name"
          class="form-input"
          onkeydown={(e) => e.key === 'Enter' && addCategory()}
        />
        <button
          type="button"
          onclick={addCategory}
          class="add-btn"
          disabled={!newCategory.trim()}
        >
          Add
        </button>
      </div>
      <div class="help-text">
        Categories help organize your snippets. At least one category is required.
      </div>
    </div>

    <div class="form-group">
      <label>Custom Shortcuts</label>
      <div class="shortcuts-info">
        <div class="help-text">
          Custom keyboard shortcuts are managed individually for each snippet in the snippet editor.
          Current shortcuts: {Object.keys(formData.customShortcuts).length}
        </div>
        {#if Object.keys(formData.customShortcuts).length > 0}
          <div class="shortcuts-list">
            {#each Object.entries(formData.customShortcuts) as [shortcut, snippetId]}
              <div class="shortcut-item">
                <code class="shortcut-code">{shortcut}</code>
                <span class="shortcut-arrow">→</span>
                <span class="snippet-id">{snippetId}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="snippet-settings-footer">
    <div class="help-text">
      <kbd>Ctrl+Enter</kbd> Save • <kbd>Esc</kbd> Cancel
    </div>
    <div class="footer-actions">
      <button type="button" onclick={handleReset} class="btn-reset">
        Reset to Defaults
      </button>
      <button type="button" onclick={handleCancel} class="btn-secondary">
        Cancel
      </button>
      <button type="button" onclick={handleSave} class="btn-primary">
        Save Settings
      </button>
    </div>
  </div>
</div>

<style>
  .snippet-settings {
    width: 500px;
    max-width: 90vw;
    background: var(--bg-color, #ffffff);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    max-height: 80vh;
  }

  .snippet-settings-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color, #e1e5e9);
  }

  .snippet-settings-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .snippet-settings-content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
  }

  .form-group {
    margin-bottom: 2rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary, #24292f);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: 500;
  }

  .checkbox {
    width: 1rem;
    height: 1rem;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: inherit;
    transition: border-color 0.2s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--accent-color, #0969da);
    box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.1);
  }

  .form-input:disabled {
    background: var(--disabled-bg, #f6f8fa);
    color: var(--disabled-color, #8c959f);
    cursor: not-allowed;
  }

  .help-text {
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    color: var(--text-muted, #656d76);
    line-height: 1.4;
  }

  .categories-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .category-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--tag-bg, #f1f8ff);
    border: 1px solid var(--tag-border, #c6e2ff);
    border-radius: 16px;
    padding: 0.375rem 0.75rem;
  }

  .category-name {
    font-size: 0.875rem;
    color: var(--tag-color, #0969da);
  }

  .remove-btn {
    background: none;
    border: none;
    color: var(--text-muted, #656d76);
    cursor: pointer;
    font-size: 1.125rem;
    line-height: 1;
    padding: 0;
    width: 1rem;
    height: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remove-btn:hover:not(:disabled) {
    color: var(--error-color, #d1242f);
  }

  .remove-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .add-category {
    display: flex;
    gap: 0.5rem;
  }

  .add-category .form-input {
    flex: 1;
  }

  .add-btn {
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 6px;
    background: var(--button-bg, #f6f8fa);
    cursor: pointer;
    font-size: 0.875rem;
  }

  .add-btn:hover:not(:disabled) {
    background: var(--button-hover-bg, #e1e5e9);
  }

  .add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .shortcuts-info {
    padding: 1rem;
    background: var(--info-bg, #f6f8fa);
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 6px;
  }

  .shortcuts-list {
    margin-top: 1rem;
    max-height: 150px;
    overflow-y: auto;
  }

  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-light, #f1f3f4);
  }

  .shortcut-item:last-child {
    border-bottom: none;
  }

  .shortcut-code {
    font-family: monospace;
    background: var(--code-bg, #ffffff);
    color: var(--code-color, #24292f);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8125rem;
    border: 1px solid var(--border-color, #e1e5e9);
  }

  .shortcut-arrow {
    color: var(--text-muted, #656d76);
  }

  .snippet-id {
    font-size: 0.8125rem;
    color: var(--text-muted, #656d76);
    font-family: monospace;
  }

  .snippet-settings-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-top: 1px solid var(--border-color, #e1e5e9);
    background: var(--footer-bg, #f6f8fa);
  }

  .snippet-settings-footer .help-text {
    margin: 0;
  }

  .snippet-settings-footer .help-text kbd {
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

  .btn-reset,
  .btn-secondary,
  .btn-primary {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-reset {
    background: var(--warning-bg, #fff8dc);
    border: 1px solid var(--warning-border, #f4d03f);
    color: var(--warning-color, #b7950b);
  }

  .btn-reset:hover {
    background: var(--warning-hover-bg, #fef5e7);
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