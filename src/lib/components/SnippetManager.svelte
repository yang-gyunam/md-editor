<script lang="ts">
  import type { 
    Snippet, 
    SnippetSettings as SnippetSettingsType, 
    SnippetManagerProps 
  } from '../types/template.js';
  import { 
    loadSnippets, 
    saveSnippets, 
    loadSnippetSettings, 
    saveSnippetSettings,
    exportSnippets,
    importSnippets
  } from '../utils/snippetStorage.js';
  import {
    filterSnippets,
    sortSnippetsByUsage,
    validateSnippetShortcut,
    generateSnippetId,
    updateSnippetUsage
  } from '../utils/snippet.js';
  import SnippetEditor from './SnippetEditor.svelte';
  import SnippetSettings from './SnippetSettings.svelte';

  interface Props extends SnippetManagerProps {
    visible?: boolean;
  }

  let {
    snippets = $bindable([]),
    settings = $bindable(loadSnippetSettings()),
    onAdd,
    onEdit,
    onDelete,
    onDuplicate,
    onShortcutTrigger,
    onSettingsChange,
    onImport,
    onExport,
    visible = false
  }: Props = $props();

  let searchTerm = $state('');
  let selectedCategory = $state('All');
  let showEditor = $state(false);
  let editingSnippet = $state<Snippet | undefined>(undefined);
  let showSettings = $state(false);
  let importText = $state('');
  let showImportDialog = $state(false);

  // Computed values
  const filteredSnippets = $derived(() => {
    let filtered = filterSnippets(snippets, searchTerm);
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    
    return sortSnippetsByUsage(filtered);
  });

  const categories = $derived(() => {
    const cats = new Set(snippets.map(s => s.category || 'General'));
    return ['All', ...Array.from(cats).sort()];
  });

  const existingShortcuts = $derived(() => 
    snippets.map(s => s.shortcut).filter(Boolean)
  );

  // Event handlers
  function handleAddSnippet() {
    editingSnippet = undefined;
    showEditor = true;
  }

  function handleEditSnippet(snippet: Snippet) {
    editingSnippet = snippet;
    showEditor = true;
  }

  function handleDeleteSnippet(id: string) {
    if (confirm('Are you sure you want to delete this snippet?')) {
      onDelete(id);
    }
  }

  function handleDuplicateSnippet(snippet: Snippet) {
    const duplicated: Snippet = {
      ...snippet,
      id: generateSnippetId(),
      name: `${snippet.name} (Copy)`,
      shortcut: '', // Clear shortcut to avoid conflicts
      createdAt: Date.now(),
      useCount: 0,
      lastUsed: undefined
    };
    onAdd(duplicated);
  }

  function handleSaveSnippet(snippet: Snippet) {
    if (editingSnippet) {
      onEdit(editingSnippet.id, snippet);
    } else {
      onAdd(snippet);
    }
    showEditor = false;
    editingSnippet = undefined;
  }

  function handleCancelEdit() {
    showEditor = false;
    editingSnippet = undefined;
  }

  function handleSettingsChange(newSettings: SnippetSettingsType) {
    settings = newSettings;
    onSettingsChange?.(newSettings);
  }

  function handleExport() {
    const exportData = exportSnippets(snippets);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snippets-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    try {
      const importedSnippets = importSnippets(importText);
      onImport(importedSnippets);
      importText = '';
      showImportDialog = false;
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!settings.enableSnippets) return;
    
    // Check for custom shortcuts
    const shortcut = getKeyboardShortcut(event);
    const snippet = snippets.find(s => s.shortcut === shortcut);
    
    if (snippet) {
      event.preventDefault();
      onShortcutTrigger(snippet.shortcut);
    }
  }

  function getKeyboardShortcut(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    
    if (event.key && event.key.length === 1) {
      parts.push(event.key.toUpperCase());
    } else if (event.key) {
      parts.push(event.key);
    }
    
    return parts.join('+');
  }

  // Initialize keyboard listener
  $effect(() => {
    if (visible && settings.enableSnippets) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
  });
</script>

{#if visible}
  <div class="snippet-manager">
    <div class="snippet-manager-header">
      <h2>Snippet Manager</h2>
      <div class="header-actions">
        <button onclick={() => showSettings = true}>Settings</button>
        <button onclick={handleAddSnippet}>Add Snippet</button>
        <button onclick={() => showImportDialog = true}>Import</button>
        <button onclick={handleExport}>Export</button>
      </div>
    </div>

    <div class="snippet-manager-filters">
      <input
        type="text"
        placeholder="Search snippets..."
        bind:value={searchTerm}
        class="search-input"
      />
      <select bind:value={selectedCategory} class="category-select">
        {#each categories() as category}
          <option value={category}>{category}</option>
        {/each}
      </select>
    </div>

    <div class="snippet-list">
      {#each filteredSnippets() as snippet (snippet.id)}
        <div class="snippet-item">
          <div class="snippet-info">
            <div class="snippet-name">{snippet.name}</div>
            {#if snippet.description}
              <div class="snippet-description">{snippet.description}</div>
            {/if}
            <div class="snippet-meta">
              <span class="snippet-shortcut">{snippet.shortcut || 'No shortcut'}</span>
              <span class="snippet-category">{snippet.category || 'General'}</span>
              {#if snippet.useCount}
                <span class="snippet-usage">Used {snippet.useCount} times</span>
              {/if}
            </div>
          </div>
          <div class="snippet-actions">
            <button onclick={() => handleEditSnippet(snippet)}>Edit</button>
            <button onclick={() => handleDuplicateSnippet(snippet)}>Duplicate</button>
            <button onclick={() => handleDeleteSnippet(snippet.id)}>Delete</button>
          </div>
        </div>
      {/each}
      
      {#if filteredSnippets().length === 0}
        <div class="empty-state">
          {searchTerm ? 'No snippets match your search.' : 'No snippets available.'}
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Snippet Editor Modal -->
{#if showEditor}
  <div class="modal-overlay">
    <div class="modal">
      <SnippetEditor
        snippet={editingSnippet}
        isOpen={showEditor}
        onSave={handleSaveSnippet}
        onCancel={handleCancelEdit}
        existingShortcuts={existingShortcuts()}
      />
    </div>
  </div>
{/if}

<!-- Settings Modal -->
{#if showSettings}
  <div class="modal-overlay">
    <div class="modal">
      <SnippetSettings
        settings={settings}
        onSave={handleSettingsChange}
        onCancel={() => showSettings = false}
      />
    </div>
  </div>
{/if}

<!-- Import Dialog -->
{#if showImportDialog}
  <div class="modal-overlay">
    <div class="modal">
      <div class="import-dialog">
        <h3>Import Snippets</h3>
        <textarea
          bind:value={importText}
          placeholder="Paste your snippets JSON here..."
          rows="10"
          class="import-textarea"
        ></textarea>
        <div class="dialog-actions">
          <button onclick={handleImport} disabled={!importText.trim()}>Import</button>
          <button onclick={() => showImportDialog = false}>Cancel</button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .snippet-manager {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-color, #ffffff);
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 6px;
  }

  .snippet-manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color, #e1e5e9);
  }

  .snippet-manager-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .header-actions button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 4px;
    background: var(--button-bg, #f6f8fa);
    cursor: pointer;
    font-size: 0.875rem;
  }

  .header-actions button:hover {
    background: var(--button-hover-bg, #e1e5e9);
  }

  .snippet-manager-filters {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color, #e1e5e9);
  }

  .search-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .category-select {
    padding: 0.5rem;
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 4px;
    font-size: 0.875rem;
    background: var(--bg-color, #ffffff);
  }

  .snippet-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .snippet-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem;
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 6px;
    margin-bottom: 0.5rem;
    background: var(--item-bg, #f6f8fa);
  }

  .snippet-info {
    flex: 1;
  }

  .snippet-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .snippet-description {
    color: var(--text-muted, #656d76);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .snippet-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--text-muted, #656d76);
  }

  .snippet-shortcut {
    font-family: monospace;
    background: var(--code-bg, #f6f8fa);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
  }

  .snippet-actions {
    display: flex;
    gap: 0.5rem;
  }

  .snippet-actions button {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 4px;
    background: var(--button-bg, #ffffff);
    cursor: pointer;
    font-size: 0.75rem;
  }

  .snippet-actions button:hover {
    background: var(--button-hover-bg, #f6f8fa);
  }

  .empty-state {
    text-align: center;
    color: var(--text-muted, #656d76);
    padding: 2rem;
    font-style: italic;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: var(--bg-color, #ffffff);
    border-radius: 8px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
  }

  .import-dialog {
    padding: 1.5rem;
    min-width: 400px;
  }

  .import-dialog h3 {
    margin: 0 0 1rem 0;
  }

  .import-textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.875rem;
    resize: vertical;
  }

  .dialog-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  .dialog-actions button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 4px;
    background: var(--button-bg, #f6f8fa);
    cursor: pointer;
  }

  .dialog-actions button:hover {
    background: var(--button-hover-bg, #e1e5e9);
  }

  .dialog-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>