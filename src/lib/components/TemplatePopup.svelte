<script lang="ts">
  import type { Template } from '../types/index.js';
  
  interface Props {
    visible: boolean;
    position: { x: number; y: number };
    templates: Template[];
    filter: string;
    onSelect: (template: Template) => void;
    onClose: () => void;
  }
  
  const {
    visible = $bindable(),
    position,
    templates,
    filter = $bindable(),
    onSelect,
    onClose
  }: Props = $props();
  
  let popupElement: HTMLDivElement;
  let selectedIndex = $state(0);
  
  // Filter templates based on search query
  const filteredTemplates = $derived(() => {
    if (!filter.trim()) return templates;
    
    const query = filter.toLowerCase();
    return templates.filter(template => 
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.category?.toLowerCase().includes(query)
    );
  });

  // Get filtered templates as array for indexing
  const filteredTemplatesArray = $derived(filteredTemplates());
  
  // Reset selected index when filter changes
  $effect(() => {
    if (filter) {
      selectedIndex = 0;
    }
  });
  
  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (!visible) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredTemplatesArray.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredTemplatesArray[selectedIndex]) {
          onSelect(filteredTemplatesArray[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  }
  
  function handleTemplateClick(template: Template) {
    onSelect(template);
  }
  
  // Group templates by category
  const groupedTemplates = $derived(() => {
    const groups: Record<string, Template[]> = {};
    
    filteredTemplatesArray.forEach(template => {
      const category = template.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(template);
    });
    
    return groups;
  });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if visible}
  <div
    bind:this={popupElement}
    class="template-popup"
    style="left: {position.x}px; top: {position.y}px;"
    role="listbox"
    aria-label="Template selection"
  >
    <div class="template-popup-header">
      <span class="template-popup-title">Templates</span>
      {#if filteredTemplatesArray.length > 0}
        <span class="template-popup-count">{filteredTemplatesArray.length} found</span>
      {/if}
    </div>
    
    {#if filteredTemplatesArray.length === 0}
      <div class="template-popup-empty">
        <span>No templates found</span>
        {#if filter}
          <small>Try a different search term</small>
        {/if}
      </div>
    {:else}
      <div class="template-popup-content">
        {#each Object.entries(groupedTemplates) as [category, categoryTemplates]}
          <div class="template-category">
            <div class="template-category-header">{category}</div>
            {#each categoryTemplates as template, index}
              {@const globalIndex = filteredTemplatesArray.indexOf(template)}
              <button
                class="template-item"
                class:selected={globalIndex === selectedIndex}
                onclick={() => handleTemplateClick(template)}
                role="option"
                aria-selected={globalIndex === selectedIndex}
              >
                <div class="template-item-name">{template.name}</div>
                {#if template.description}
                  <div class="template-item-description">{template.description}</div>
                {/if}
              </button>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
    
    <div class="template-popup-footer">
      <small>Use ↑↓ to navigate, Enter to select, Esc to close</small>
    </div>
  </div>
{/if}

<style>
  .template-popup {
    position: absolute;
    z-index: 1000;
    background: var(--bg-color, white);
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2);
    min-width: 300px;
    max-width: 400px;
    max-height: 400px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 14px;
  }
  
  .template-popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-color, #e1e5e9);
    background: var(--bg-secondary, #f6f8fa);
  }
  
  .template-popup-title {
    font-weight: 600;
    color: var(--text-primary, #24292f);
  }
  
  .template-popup-count {
    font-size: 12px;
    color: var(--text-secondary, #656d76);
  }
  
  .template-popup-content {
    max-height: 300px;
    overflow-y: auto;
  }
  
  .template-popup-empty {
    padding: 20px;
    text-align: center;
    color: var(--text-secondary, #656d76);
  }
  
  .template-popup-empty small {
    display: block;
    margin-top: 4px;
    font-size: 12px;
  }
  
  .template-category {
    border-bottom: 1px solid var(--border-light, #f0f0f0);
  }
  
  .template-category:last-child {
    border-bottom: none;
  }
  
  .template-category-header {
    padding: 8px 12px 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary, #656d76);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .template-item {
    display: block;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.1s ease;
  }
  
  .template-item:hover,
  .template-item.selected {
    background: var(--bg-hover, #f6f8fa);
  }
  
  .template-item.selected {
    background: var(--bg-selected, #dbeafe);
  }
  
  .template-item-name {
    font-weight: 500;
    color: var(--text-primary, #24292f);
    margin-bottom: 2px;
  }
  
  .template-item-description {
    font-size: 12px;
    color: var(--text-secondary, #656d76);
    line-height: 1.3;
  }
  
  .template-popup-footer {
    padding: 6px 12px;
    border-top: 1px solid var(--border-color, #e1e5e9);
    background: var(--bg-secondary, #f6f8fa);
  }
  
  .template-popup-footer small {
    color: var(--text-secondary, #656d76);
    font-size: 11px;
  }
  
  /* Dark theme support */
  @media (prefers-color-scheme: dark) {
    .template-popup {
      --bg-color: #0d1117;
      --bg-secondary: #161b22;
      --bg-hover: #21262d;
      --bg-selected: #1f2937;
      --border-color: #30363d;
      --border-light: #21262d;
      --text-primary: #f0f6fc;
      --text-secondary: #8b949e;
    }
  }
</style>