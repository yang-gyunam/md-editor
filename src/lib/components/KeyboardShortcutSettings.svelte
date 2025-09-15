<!-- Keyboard Shortcut Settings Component -->
<!-- Custom keyboard shortcut system -->

<script lang="ts">
  import type { KeyboardShortcut, ShortcutConflict } from '../utils/keyboard.js';
  import type { ShortcutAction, ShortcutSettings } from '../utils/keyboardShortcuts.js';
  import type { Snippet } from '../types/index.js';
  import { KeyboardManager } from '../utils/keyboard.js';

  const {
    actions = [],
    settings = $bindable({
      shortcuts: {},
      enabled: true,
      customSnippets: []
    }),
    conflicts = [],
    onSettingsChange,
    onConflictResolve,
    onAddSnippet,
    onRemoveSnippet,
    onClose
  }: {
    actions: ShortcutAction[];
    settings: ShortcutSettings;
    conflicts: ShortcutConflict[];
    onSettingsChange?: (settings: ShortcutSettings) => void;
    onConflictResolve?: (conflictKey: string, keepNew: boolean) => void;
    onAddSnippet?: (snippet: Snippet) => void;
    onRemoveSnippet?: (snippetId: string) => void;
    onClose?: () => void;
  } = $props();

  // Local state for editing
  let editingAction: string | null = $state(null);
  let editingShortcut: KeyboardShortcut = $state({ key: '' });
  let recordingKeys = $state(false);
  let recordedKeys: string[] = $state([]);
  
  // Snippet editing state
  const editingSnippet: Snippet | null = $state(null);
  let showSnippetForm = $state(false);
  let newSnippet: Snippet = $state({
    id: '',
    name: '',
    shortcut: '',
    content: '',
    variables: []
  });

  // Group actions by category
  const actionsByCategory = $derived(() => {
    const grouped: Record<string, ShortcutAction[]> = {};
    actions.forEach(action => {
      if (!grouped[action.category]) {
        grouped[action.category] = [];
      }
      grouped[action.category].push(action);
    });
    return grouped;
  });

  function startEditingShortcut(actionId: string) {
    editingAction = actionId;
    const currentShortcut = settings.shortcuts[actionId];
    const action = actions.find(a => a.id === actionId);
    editingShortcut = currentShortcut || action?.defaultShortcut || { key: '' };
    recordingKeys = false;
    recordedKeys = [];
  }

  function cancelEditingShortcut() {
    editingAction = null;
    editingShortcut = { key: '' };
    recordingKeys = false;
    recordedKeys = [];
  }

  function saveShortcut() {
    if (editingAction && editingShortcut.key) {
      settings.shortcuts[editingAction] = { ...editingShortcut };
      onSettingsChange?.(settings);
      cancelEditingShortcut();
    }
  }

  function removeShortcut(actionId: string) {
    delete settings.shortcuts[actionId];
    onSettingsChange?.(settings);
  }

  function resetToDefault(actionId: string) {
    const action = actions.find(a => a.id === actionId);
    if (action?.defaultShortcut) {
      settings.shortcuts[actionId] = { ...action.defaultShortcut };
      onSettingsChange?.(settings);
    }
  }

  function startRecordingKeys() {
    recordingKeys = true;
    recordedKeys = [];
    editingShortcut = { key: '' };
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!recordingKeys) return;

    event.preventDefault();
    event.stopPropagation();

    // Build shortcut from recorded keys
    editingShortcut = {
      key: event.key.toLowerCase(),
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey
    };

    recordingKeys = false;
  }

  function resolveConflict(conflict: ShortcutConflict, keepNew: boolean) {
    onConflictResolve?.(conflict.key, keepNew);
  }

  function formatShortcut(shortcut: KeyboardShortcut): string {
    return KeyboardManager.formatShortcut(shortcut);
  }

  function getEffectiveShortcut(action: ShortcutAction): KeyboardShortcut | undefined {
    return settings.shortcuts[action.id] || action.defaultShortcut;
  }

  function toggleEnabled() {
    settings.enabled = !settings.enabled;
    onSettingsChange?.(settings);
  }

  // Snippet management functions
  function startAddingSnippet() {
    newSnippet = {
      id: crypto.randomUUID(),
      name: '',
      shortcut: '',
      content: '',
      variables: []
    };
    showSnippetForm = true;
  }

  function saveSnippet() {
    if (newSnippet.name && newSnippet.content) {
      onAddSnippet?.(newSnippet);
      showSnippetForm = false;
    }
  }

  function cancelSnippetForm() {
    showSnippetForm = false;
    newSnippet = {
      id: '',
      name: '',
      shortcut: '',
      content: '',
      variables: []
    };
  }

  function removeSnippet(snippetId: string) {
    onRemoveSnippet?.(snippetId);
  }

  function addSnippetVariable() {
    newSnippet.variables = [
      ...newSnippet.variables,
      { name: '', placeholder: '', defaultValue: '' }
    ];
  }

  function removeSnippetVariable(index: number) {
    newSnippet.variables = newSnippet.variables.filter((_, i) => i !== index);
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="keyboard-shortcut-settings" role="dialog" aria-labelledby="settings-title">
  <div class="settings-header">
    <h2 id="settings-title">Keyboard Shortcuts</h2>
    <button 
      class="close-button" 
      onclick={onClose}
      aria-label="Close settings"
    >
      ×
    </button>
  </div>

  <div class="settings-content">
    <!-- Global Settings -->
    <div class="settings-section">
      <div class="setting-item">
        <label class="setting-label">
          <input 
            type="checkbox" 
            bind:checked={settings.enabled}
            onchange={toggleEnabled}
          />
          Enable keyboard shortcuts
        </label>
      </div>
    </div>

    <!-- Conflicts Section -->
    {#if conflicts.length > 0}
      <div class="settings-section">
        <h3>Shortcut Conflicts</h3>
        <div class="conflicts-list">
          {#each conflicts as conflict}
            <div class="conflict-item">
              <div class="conflict-info">
                <strong>{formatShortcut(conflict.existing)}</strong>
                <span>conflicts between existing and new shortcut</span>
              </div>
              <div class="conflict-actions">
                <button 
                  class="btn btn-secondary"
                  onclick={() => resolveConflict(conflict, false)}
                >
                  Keep Existing
                </button>
                <button 
                  class="btn btn-primary"
                  onclick={() => resolveConflict(conflict, true)}
                >
                  Use New
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Shortcuts by Category -->
    {#each Object.entries(actionsByCategory) as [category, categoryActions]}
      <div class="settings-section">
        <h3>{category.charAt(0).toUpperCase() + category.slice(1)} Shortcuts</h3>
        <div class="shortcuts-list">
          {#each categoryActions as action}
            {@const effectiveShortcut = getEffectiveShortcut(action)}
            <div class="shortcut-item">
              <div class="shortcut-info">
                <div class="shortcut-name">{action.name}</div>
                <div class="shortcut-description">{action.description}</div>
              </div>
              
              <div class="shortcut-key">
                {#if editingAction === action.id}
                  <div class="shortcut-editor">
                    <div class="key-display">
                      {#if recordingKeys}
                        <span class="recording">Press keys...</span>
                      {:else if editingShortcut.key}
                        {formatShortcut(editingShortcut)}
                      {:else}
                        <span class="no-shortcut">No shortcut</span>
                      {/if}
                    </div>
                    <div class="editor-actions">
                      <button 
                        class="btn btn-small"
                        onclick={startRecordingKeys}
                        disabled={recordingKeys}
                      >
                        {recordingKeys ? 'Recording...' : 'Record'}
                      </button>
                      <button 
                        class="btn btn-small btn-primary"
                        onclick={saveShortcut}
                        disabled={!editingShortcut.key}
                      >
                        Save
                      </button>
                      <button 
                        class="btn btn-small"
                        onclick={cancelEditingShortcut}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                {:else}
                  <div class="shortcut-display">
                    <span class="key-combo">
                      {effectiveShortcut ? formatShortcut(effectiveShortcut) : 'No shortcut'}
                    </span>
                    <div class="shortcut-actions">
                      <button 
                        class="btn btn-small"
                        onclick={() => startEditingShortcut(action.id)}
                      >
                        Edit
                      </button>
                      {#if settings.shortcuts[action.id]}
                        <button 
                          class="btn btn-small"
                          onclick={() => removeShortcut(action.id)}
                        >
                          Remove
                        </button>
                        {#if action.defaultShortcut}
                          <button 
                            class="btn btn-small"
                            onclick={() => resetToDefault(action.id)}
                          >
                            Reset
                          </button>
                        {/if}
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}

    <!-- Custom Snippets Section -->
    <div class="settings-section">
      <div class="section-header">
        <h3>Custom Snippets</h3>
        <button 
          class="btn btn-primary"
          onclick={startAddingSnippet}
        >
          Add Snippet
        </button>
      </div>

      {#if showSnippetForm}
        <div class="snippet-form">
          <div class="form-group">
            <label for="snippet-name">Name</label>
            <input 
              id="snippet-name"
              type="text" 
              bind:value={newSnippet.name}
              placeholder="Snippet name"
            />
          </div>

          <div class="form-group">
            <label for="snippet-shortcut">Keyboard Shortcut</label>
            <input 
              id="snippet-shortcut"
              type="text" 
              bind:value={newSnippet.shortcut}
              placeholder="e.g., ctrl+shift+s"
            />
          </div>

          <div class="form-group">
            <label for="snippet-content">Content</label>
            <textarea 
              id="snippet-content"
              bind:value={newSnippet.content}
              placeholder="Snippet content with ${variable} placeholders"
              rows="4"
            ></textarea>
          </div>

          <div class="form-group">
            <div class="variables-header">
              <label>Variables</label>
              <button 
                type="button"
                class="btn btn-small"
                onclick={addSnippetVariable}
              >
                Add Variable
              </button>
            </div>
            
            {#each newSnippet.variables as variable, index}
              <div class="variable-item">
                <input 
                  type="text" 
                  bind:value={variable.name}
                  placeholder="Variable name"
                />
                <input 
                  type="text" 
                  bind:value={variable.placeholder}
                  placeholder="Placeholder text"
                />
                <input 
                  type="text" 
                  bind:value={variable.defaultValue}
                  placeholder="Default value"
                />
                <button 
                  type="button"
                  class="btn btn-small btn-danger"
                  onclick={() => removeSnippetVariable(index)}
                >
                  Remove
                </button>
              </div>
            {/each}
          </div>

          <div class="form-actions">
            <button 
              class="btn btn-primary"
              onclick={saveSnippet}
              disabled={!newSnippet.name || !newSnippet.content}
            >
              Save Snippet
            </button>
            <button 
              class="btn btn-secondary"
              onclick={cancelSnippetForm}
            >
              Cancel
            </button>
          </div>
        </div>
      {/if}

      <div class="snippets-list">
        {#each settings.customSnippets as snippet}
          <div class="snippet-item">
            <div class="snippet-info">
              <div class="snippet-name">{snippet.name}</div>
              <div class="snippet-shortcut">{snippet.shortcut || 'No shortcut'}</div>
              <div class="snippet-preview">{snippet.content.slice(0, 50)}...</div>
            </div>
            <div class="snippet-actions">
              <button 
                class="btn btn-small btn-danger"
                onclick={() => removeSnippet(snippet.id)}
              >
                Remove
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .keyboard-shortcut-settings {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    background: var(--bg-color, white);
    border: 1px solid var(--border-color, #ddd);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color, #ddd);
    background: var(--header-bg, #f8f9fa);
  }

  .settings-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
    color: var(--text-color, #666);
  }

  .close-button:hover {
    color: var(--text-color, #333);
  }

  .settings-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .settings-section {
    margin-bottom: 2rem;
  }

  .settings-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color, #333);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .setting-item {
    margin-bottom: 0.75rem;
  }

  .setting-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .shortcut-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    background: var(--item-bg, #fafafa);
  }

  .shortcut-info {
    flex: 1;
  }

  .shortcut-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .shortcut-description {
    font-size: 0.875rem;
    color: var(--text-muted, #666);
  }

  .shortcut-key {
    min-width: 200px;
  }

  .shortcut-display {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .key-combo {
    font-family: monospace;
    background: var(--key-bg, #e9ecef);
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-size: 0.875rem;
    min-width: 80px;
    text-align: center;
  }

  .shortcut-actions {
    display: flex;
    gap: 0.5rem;
  }

  .shortcut-editor {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .key-display {
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 3px;
    background: var(--input-bg, white);
    text-align: center;
    font-family: monospace;
  }

  .recording {
    color: var(--primary-color, #007bff);
    font-style: italic;
  }

  .no-shortcut {
    color: var(--text-muted, #666);
    font-style: italic;
  }

  .editor-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .conflicts-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .conflict-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid var(--warning-color, #ffc107);
    border-radius: 4px;
    background: var(--warning-bg, #fff3cd);
  }

  .conflict-info {
    flex: 1;
  }

  .conflict-actions {
    display: flex;
    gap: 0.5rem;
  }

  .snippet-form {
    background: var(--form-bg, #f8f9fa);
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: 500;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 3px;
    font-size: 0.875rem;
  }

  .variables-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .variable-item {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    align-items: center;
  }

  .variable-item input {
    flex: 1;
    margin: 0;
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .snippets-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .snippet-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    background: var(--item-bg, #fafafa);
  }

  .snippet-info {
    flex: 1;
  }

  .snippet-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .snippet-shortcut {
    font-family: monospace;
    font-size: 0.875rem;
    color: var(--text-muted, #666);
    margin-bottom: 0.25rem;
  }

  .snippet-preview {
    font-size: 0.875rem;
    color: var(--text-muted, #666);
  }

  .snippet-actions {
    display: flex;
    gap: 0.5rem;
  }

  /* Button styles */
  .btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid transparent;
    border-radius: 3px;
    font-size: 0.875rem;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    text-align: center;
    transition: all 0.15s ease-in-out;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-small {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .btn-primary {
    background-color: var(--primary-color, #007bff);
    border-color: var(--primary-color, #007bff);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: var(--primary-hover, #0056b3);
    border-color: var(--primary-hover, #0056b3);
  }

  .btn-secondary {
    background-color: var(--secondary-color, #6c757d);
    border-color: var(--secondary-color, #6c757d);
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: var(--secondary-hover, #545b62);
    border-color: var(--secondary-hover, #545b62);
  }

  .btn-danger {
    background-color: var(--danger-color, #dc3545);
    border-color: var(--danger-color, #dc3545);
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background-color: var(--danger-hover, #c82333);
    border-color: var(--danger-hover, #c82333);
  }

  .btn:not(.btn-primary):not(.btn-secondary):not(.btn-danger) {
    background-color: var(--btn-bg, #f8f9fa);
    border-color: var(--border-color, #ddd);
    color: var(--text-color, #333);
  }

  .btn:not(.btn-primary):not(.btn-secondary):not(.btn-danger):hover:not(:disabled) {
    background-color: var(--btn-hover-bg, #e9ecef);
    border-color: var(--border-hover, #adb5bd);
  }
</style>