<script lang="ts">
  import type { TemplateManagerProps } from '../types/index.js';
  
  const {
    templates,
    onAdd,
    onEdit,
    onDelete,
    onImport,
    onExport
  }: TemplateManagerProps = $props();

  let showAddForm = $state(false);
  let editingId = $state<string | null>(null);
  
  let newTemplate = $state({
    id: '',
    name: '',
    description: '',
    content: '',
    variables: [],
    category: 'General'
  });

  const categories = ['General', 'Code', 'Documentation', 'Email', 'Custom'];

  function startAdd() {
    newTemplate = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      content: '',
      variables: [],
      category: 'General'
    };
    showAddForm = true;
    editingId = null;
  }

  function startEdit(template: typeof templates[0]) {
    newTemplate = { ...template };
    showAddForm = true;
    editingId = template.id;
  }

  function saveTemplate() {
    if (!newTemplate.name || !newTemplate.content) {
      return;
    }

    if (editingId) {
      onEdit(editingId, newTemplate);
    } else {
      onAdd(newTemplate);
    }

    showAddForm = false;
    editingId = null;
  }

  function cancelEdit() {
    showAddForm = false;
    editingId = null;
  }

  function deleteTemplate(id: string) {
    if (confirm('Are you sure you want to delete this template?')) {
      onDelete(id);
    }
  }

  function exportTemplates() {
    const exported = onExport();
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'templates.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importTemplates(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        onImport(imported);
      } catch (error) {
        alert('Invalid template file format');
      }
    };
    reader.readAsText(file);
  }

  // Group templates by category
  const groupedTemplates = $derived(() => {
    const groups: Record<string, typeof templates> = {};
    templates.forEach(template => {
      const category = template.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(template);
    });
    return groups;
  });
</script>

<div class="template-manager">
  <div class="manager-header">
    <h3>Templates</h3>
    <div class="header-actions">
      <input
        type="file"
        accept=".json"
        onchange={importTemplates}
        style="display: none;"
        id="import-input"
      />
      <button type="button" onclick={() => document.getElementById('import-input')?.click()}>
        Import
      </button>
      <button type="button" onclick={exportTemplates}>
        Export
      </button>
      <button type="button" class="add-button" onclick={startAdd}>
        + Add Template
      </button>
    </div>
  </div>

  {#if showAddForm}
    <div class="template-form">
      <div class="form-header">
        <h4>{editingId ? 'Edit' : 'Add'} Template</h4>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="template-name">Name</label>
          <input
            id="template-name"
            type="text"
            bind:value={newTemplate.name}
            placeholder="Template name"
          />
        </div>

        <div class="form-group">
          <label for="template-category">Category</label>
          <select id="template-category" bind:value={newTemplate.category}>
            {#each categories as category}
              <option value={category}>{category}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="template-description">Description</label>
        <input
          id="template-description"
          type="text"
          bind:value={newTemplate.description}
          placeholder="Optional description"
        />
      </div>

      <div class="form-group">
        <label for="template-content">Content</label>
        <textarea
          id="template-content"
          bind:value={newTemplate.content}
          placeholder="Template content..."
          rows="6"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="button" onclick={saveTemplate}>
          {editingId ? 'Update' : 'Add'} Template
        </button>
        <button type="button" onclick={cancelEdit}>Cancel</button>
      </div>
    </div>
  {/if}

  <div class="template-list">
    {#each Object.entries(groupedTemplates) as [category, categoryTemplates]}
      <div class="category-section">
        <h4 class="category-title">{category}</h4>
        
        {#each categoryTemplates as template}
          <div class="template-item">
            <div class="template-info">
              <div class="template-name">{template.name}</div>
              {#if template.description}
                <div class="template-description">{template.description}</div>
              {/if}
              <div class="template-preview">{template.content.substring(0, 100)}...</div>
            </div>

            <div class="template-actions">
              <button 
                type="button" 
                class="edit-button"
                onclick={() => startEdit(template)}
                title="Edit template"
              >
                ✏️
              </button>
              <button 
                type="button" 
                class="delete-button"
                onclick={() => deleteTemplate(template.id)}
                title="Delete template"
              >
                🗑️
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/each}

    {#if templates.length === 0}
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <div class="empty-message">No templates yet</div>
        <div class="empty-description">
          Create your first template to quickly insert commonly used content structures.
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .template-manager {
    padding: 16px;
    background: white;
    border: 1px solid #d1d9e0;
    border-radius: 8px;
  }

  .manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .manager-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .header-actions button {
    padding: 6px 12px;
    border: 1px solid #d1d9e0;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .header-actions button:hover {
    background: #f6f8fa;
  }

  .add-button {
    background: #0969da !important;
    color: white !important;
    border-color: #0969da !important;
  }

  .add-button:hover {
    background: #0860ca !important;
  }

  .template-form {
    background: #f6f8fa;
    border: 1px solid #d1d9e0;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .form-header h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
  }

  .form-row {
    display: flex;
    gap: 16px;
  }

  .form-group {
    margin-bottom: 12px;
    flex: 1;
  }

  .form-group label {
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
    font-size: 14px;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d9e0;
    border-radius: 6px;
    font-size: 14px;
  }

  .form-group textarea {
    resize: vertical;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  }

  .form-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }

  .form-actions button {
    padding: 8px 16px;
    border: 1px solid #d1d9e0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .form-actions button:first-child {
    background: #0969da;
    color: white;
    border-color: #0969da;
  }

  .form-actions button:first-child:hover {
    background: #0860ca;
  }

  .form-actions button:last-child {
    background: white;
  }

  .form-actions button:last-child:hover {
    background: #f6f8fa;
  }

  .template-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .category-section {
    border: 1px solid #d1d9e0;
    border-radius: 8px;
    overflow: hidden;
  }

  .category-title {
    margin: 0;
    padding: 8px 12px;
    background: #f6f8fa;
    border-bottom: 1px solid #d1d9e0;
    font-size: 14px;
    font-weight: 600;
    color: #656d76;
  }

  .template-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #f6f8fa;
  }

  .template-item:last-child {
    border-bottom: none;
  }

  .template-info {
    flex: 1;
  }

  .template-name {
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 2px;
  }

  .template-description {
    font-size: 12px;
    color: #656d76;
    margin-bottom: 4px;
  }

  .template-preview {
    font-size: 12px;
    color: #656d76;
    font-family: monospace;
    background: #f6f8fa;
    padding: 4px 6px;
    border-radius: 4px;
    display: inline-block;
  }

  .template-actions {
    display: flex;
    gap: 4px;
  }

  .template-actions button {
    padding: 4px 8px;
    border: 1px solid #d1d9e0;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }

  .template-actions button:hover {
    background: #f3f4f6;
  }

  .delete-button:hover {
    background: #fef2f2;
    border-color: #fecaca;
  }

  .empty-state {
    text-align: center;
    padding: 32px 16px;
    color: #656d76;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .empty-message {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 8px;
    color: #1f2328;
  }

  .empty-description {
    font-size: 14px;
    max-width: 300px;
    margin: 0 auto;
  }
</style>