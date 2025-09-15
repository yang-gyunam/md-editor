<script lang="ts">
  import type { 
    Snippet, 
    SnippetSelectorProps 
  } from '../types/template.js';
  import { filterSnippets, sortSnippetsByUsage } from '../utils/snippet.js';

  let {
    visible = false,
    position = { x: 0, y: 0 },
    snippets = [],
    filter = '',
    selectedIndex = 0,
    onSelect,
    onClose,
    onFilterChange
  }: SnippetSelectorProps = $props();

  let selectorElement: HTMLDivElement;
  let filterInput: HTMLInputElement;

  // Computed values
  const filteredSnippets = $derived(() => {
    const filtered = filterSnippets(snippets, filter);
    return sortSnippetsByUsage(filtered);
  });

  const maxIndex = $derived(() => Math.max(0, filteredSnippets().length - 1));

  // Ensure selectedIndex is within bounds
  $effect(() => {
    if (selectedIndex > maxIndex()) {
      selectedIndex = maxIndex();
    }
  });

  // Focus input when visible
  $effect(() => {
    if (visible && filterInput) {
      filterInput.focus();
    }
  });

  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (!visible) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, maxIndex());
        scrollToSelected();
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        scrollToSelected();
        break;
      
      case 'Enter':
        event.preventDefault();
        if (filteredSnippets()[selectedIndex]) {
          onSelect(filteredSnippets()[selectedIndex]);
        }
        break;
      
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      
      case 'Tab':
        event.preventDefault();
        if (filteredSnippets()[selectedIndex]) {
          onSelect(filteredSnippets()[selectedIndex]);
        }
        break;
    }
  }

  function scrollToSelected() {
    if (!selectorElement) return;
    
    const selectedElement = selectorElement.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }

  function handleFilterInput(event: Event) {
    const target = event.target as HTMLInputElement;
    onFilterChange(target.value);
    selectedIndex = 0; // Reset selection when filtering
  }

  function handleSnippetClick(snippet: Snippet) {
    onSelect(snippet);
  }

  function handleMouseEnter(index: number) {
    selectedIndex = index;
  }

  // Position the selector
  const selectorStyle = $derived(() => {
    const style: Record<string, string> = {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      zIndex: '1000'
    };

    // Adjust position if it would go off-screen
    if (typeof window !== 'undefined') {
      const maxWidth = 300;
      const maxHeight = 200;
      
      if (position.x + maxWidth > window.innerWidth) {
        style.left = `${window.innerWidth - maxWidth - 10}px`;
      }
      
      if (position.y + maxHeight > window.innerHeight) {
        style.top = `${position.y - maxHeight - 10}px`;
      }
    }

    return Object.entries(style)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  });

  // Global keyboard listener
  $effect(() => {
    if (visible) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
  });

  // Click outside to close
  $effect(() => {
    if (visible) {
      function handleClickOutside(event: MouseEvent) {
        if (selectorElement && !selectorElement.contains(event.target as Node)) {
          onClose();
        }
      }
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  });
</script>

{#if visible}
  <div 
    bind:this={selectorElement}
    class="snippet-selector"
    style={selectorStyle()}
  >
    <div class="snippet-selector-header">
      <input
        bind:this={filterInput}
        type="text"
        placeholder="Type to filter snippets..."
        value={filter}
        oninput={handleFilterInput}
        class="filter-input"
      />
      <div class="snippet-count">
        {filteredSnippets().length} snippet{filteredSnippets().length !== 1 ? 's' : ''}
      </div>
    </div>

    <div class="snippet-list">
      {#each filteredSnippets() as snippet, index (snippet.id)}
        <div
          class="snippet-item"
          class:selected={index === selectedIndex}
          data-index={index}
          onclick={() => handleSnippetClick(snippet)}
          onmouseenter={() => handleMouseEnter(index)}
          role="option"
          aria-selected={index === selectedIndex}
        >
          <div class="snippet-main">
            <div class="snippet-name">{snippet.name}</div>
            {#if snippet.description}
              <div class="snippet-description">{snippet.description}</div>
            {/if}
          </div>
          <div class="snippet-meta">
            {#if snippet.shortcut}
              <div class="snippet-shortcut">{snippet.shortcut}</div>
            {/if}
            {#if snippet.category}
              <div class="snippet-category">{snippet.category}</div>
            {/if}
          </div>
        </div>
      {/each}

      {#if filteredSnippets().length === 0}
        <div class="empty-state">
          {filter ? 'No snippets match your filter.' : 'No snippets available.'}
        </div>
      {/if}
    </div>

    <div class="snippet-selector-footer">
      <div class="help-text">
        <kbd>↑↓</kbd> Navigate • <kbd>Enter</kbd> Select • <kbd>Esc</kbd> Close
      </div>
    </div>
  </div>
{/if}

<style>
  .snippet-selector {
    background: var(--bg-color, #ffffff);
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    width: 300px;
    max-height: 400px;
    display: flex;
    flex-direction: column;
    font-size: 0.875rem;
  }

  .snippet-selector-header {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border-color, #e1e5e9);
  }

  .filter-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-color, #e1e5e9);
    border-radius: 4px;
    font-size: 0.875rem;
    outline: none;
  }

  .filter-input:focus {
    border-color: var(--accent-color, #0969da);
    box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.1);
  }

  .snippet-count {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-muted, #656d76);
  }

  .snippet-list {
    flex: 1;
    overflow-y: auto;
    max-height: 250px;
  }

  .snippet-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.75rem;
    cursor: pointer;
    border-bottom: 1px solid var(--border-light, #f6f8fa);
    transition: background-color 0.1s ease;
  }

  .snippet-item:hover,
  .snippet-item.selected {
    background: var(--hover-bg, #f6f8fa);
  }

  .snippet-item.selected {
    background: var(--selected-bg, #dbeafe);
    border-color: var(--accent-color, #0969da);
  }

  .snippet-item:last-child {
    border-bottom: none;
  }

  .snippet-main {
    flex: 1;
    min-width: 0;
  }

  .snippet-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
    color: var(--text-primary, #24292f);
  }

  .snippet-description {
    font-size: 0.75rem;
    color: var(--text-muted, #656d76);
    line-height: 1.3;
  }

  .snippet-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
    margin-left: 0.5rem;
  }

  .snippet-shortcut {
    font-family: monospace;
    font-size: 0.75rem;
    background: var(--code-bg, #f6f8fa);
    color: var(--code-color, #24292f);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    border: 1px solid var(--border-color, #e1e5e9);
  }

  .snippet-category {
    font-size: 0.75rem;
    color: var(--text-muted, #656d76);
    background: var(--tag-bg, #f1f8ff);
    padding: 0.125rem 0.375rem;
    border-radius: 12px;
  }

  .empty-state {
    padding: 1.5rem;
    text-align: center;
    color: var(--text-muted, #656d76);
    font-style: italic;
  }

  .snippet-selector-footer {
    padding: 0.5rem 0.75rem;
    border-top: 1px solid var(--border-color, #e1e5e9);
    background: var(--footer-bg, #f6f8fa);
  }

  .help-text {
    font-size: 0.75rem;
    color: var(--text-muted, #656d76);
    text-align: center;
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

  /* Scrollbar styling */
  .snippet-list::-webkit-scrollbar {
    width: 6px;
  }

  .snippet-list::-webkit-scrollbar-track {
    background: var(--scrollbar-track, #f1f3f4);
  }

  .snippet-list::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb, #c1c7cd);
    border-radius: 3px;
  }

  .snippet-list::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover, #a8b3ba);
  }
</style>