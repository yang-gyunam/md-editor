<script lang="ts">
  import type { ToolbarProps, EditorInstance, FormatAction } from '../types/index.js';
  import { MARKDOWN_ACTIONS, HTML_ACTIONS } from '../types/toolbar.js';
  import { 
    safeApplyFormatAction, 
    getFormatState, 
    type FormatContext, 
    type TextSelection 
  } from '../utils/formatActions.js';
  
  const {
    mode,
    disabled = false,
    customTools = [],
    editorInstance = null,
    onFormatAction,
    onOpenSettings
  }: ToolbarProps & {
    editorInstance?: EditorInstance | null;
    onFormatAction?: (action: string, formatAction: FormatAction) => void;
    onOpenSettings?: () => void;
  } = $props();

  // Get current format actions based on mode
  const currentActions = $derived(mode === 'markdown' ? MARKDOWN_ACTIONS : HTML_ACTIONS);

  // Define toolbar button configurations for each mode (memoized)
  const markdownButtons = [
    { id: 'bold', label: 'Bold', icon: '𝐁', shortcut: 'Ctrl+B', title: 'Bold (Ctrl+B)' },
    { id: 'italic', label: 'Italic', icon: '𝐼', shortcut: 'Ctrl+I', title: 'Italic (Ctrl+I)' },
    { id: 'link', label: 'Link', icon: '🔗', shortcut: 'Ctrl+K', title: 'Link (Ctrl+K)' },
    { id: 'header1', label: 'H1', icon: 'H₁', shortcut: 'Ctrl+1', title: 'Header 1 (Ctrl+1)' },
    { id: 'header2', label: 'H2', icon: 'H₂', shortcut: 'Ctrl+2', title: 'Header 2 (Ctrl+2)' },
    { id: 'header3', label: 'H3', icon: 'H₃', shortcut: 'Ctrl+3', title: 'Header 3 (Ctrl+3)' },
    { id: 'unorderedList', label: 'List', icon: '•', shortcut: 'Ctrl+L', title: 'Unordered List (Ctrl+L)' },
    { id: 'orderedList', label: 'Numbered', icon: '1.', shortcut: 'Ctrl+Shift+L', title: 'Ordered List (Ctrl+Shift+L)' },
    { id: 'code', label: 'Code', icon: '`', shortcut: 'Ctrl+`', title: 'Inline Code (Ctrl+`)' },
    { id: 'codeBlock', label: 'Code Block', icon: '```', shortcut: 'Ctrl+Shift+`', title: 'Code Block (Ctrl+Shift+`)' }
  ];

  const htmlButtons = [
    { id: 'bold', label: 'Bold', icon: '𝐁', shortcut: 'Ctrl+B', title: 'Bold (Ctrl+B)' },
    { id: 'italic', label: 'Italic', icon: '𝐼', shortcut: 'Ctrl+I', title: 'Italic (Ctrl+I)' },
    { id: 'paragraph', label: 'Paragraph', icon: 'P', shortcut: 'Ctrl+P', title: 'Paragraph (Ctrl+P)' },
    { id: 'header1', label: 'H1', icon: 'H₁', shortcut: 'Ctrl+1', title: 'Header 1 (Ctrl+1)' },
    { id: 'header2', label: 'H2', icon: 'H₂', shortcut: 'Ctrl+2', title: 'Header 2 (Ctrl+2)' },
    { id: 'header3', label: 'H3', icon: 'H₃', shortcut: 'Ctrl+3', title: 'Header 3 (Ctrl+3)' },
    { id: 'link', label: 'Link', icon: '🔗', shortcut: 'Ctrl+K', title: 'Link (Ctrl+K)' },
    { id: 'unorderedList', label: 'List', icon: '•', shortcut: 'Ctrl+L', title: 'Unordered List (Ctrl+L)' },
    { id: 'orderedList', label: 'Numbered', icon: '1.', shortcut: 'Ctrl+Shift+L', title: 'Ordered List (Ctrl+Shift+L)' },
    { id: 'code', label: 'Code', icon: '`', shortcut: 'Ctrl+`', title: 'Inline Code (Ctrl+`)' },
    { id: 'codeBlock', label: 'Code Block', icon: '```', shortcut: 'Ctrl+Shift+`', title: 'Code Block (Ctrl+Shift+`)' }
  ];

  // Get current button configuration based on mode (memoized)
  const currentButtons = $derived(mode === 'markdown' ? markdownButtons : htmlButtons);

  // Get format state for button active state
  function getButtonState(actionId: string): boolean {
    if (!editorInstance) return false;
    
    const formatAction = currentActions[actionId];
    if (!formatAction) return false;

    try {
      const selection = editorInstance.getSelection();
      const content = editorInstance.getValue?.() || '';
      
      const context: FormatContext = {
        content,
        selection,
        cursorPosition: selection.start
      };

      return getFormatState(formatAction, context);
    } catch (error) {
      console.warn(`Error getting format state for '${actionId}':`, error);
      return false;
    }
  }

  function handleFormatAction(actionId: string) {
    if (disabled || !editorInstance) return;
    
    const formatAction = currentActions[actionId];
    if (!formatAction) {
      console.warn(`Format action '${actionId}' not found for mode '${mode}'`);
      return;
    }

    try {
      // Get current context
      const selection = editorInstance.getSelection();
      const content = editorInstance.getValue?.() || '';
      
      const context: FormatContext = {
        content,
        selection,
        cursorPosition: selection.start
      };

      // Apply format action using safe utility function
      const formatResult = safeApplyFormatAction(formatAction, context);

      if (formatResult.success && formatResult.result) {
        const result = formatResult.result;
        
        // Update editor content and cursor position
        if (editorInstance.setValue) {
          editorInstance.setValue(result.content);
        }
        
        // Set cursor position
        if (result.selectionStart !== undefined && result.selectionEnd !== undefined) {
          editorInstance.setCursor(result.selectionStart);
          // TODO: Set selection range when EditorInstance supports it
        } else {
          editorInstance.setCursor(result.cursorPosition);
        }

        // Focus back to editor
        editorInstance.focus();

        // Call the format action handler if provided
        if (onFormatAction) {
          onFormatAction(actionId, formatAction);
        }
      } else {
        console.error(`Error applying format action '${actionId}':`, formatResult.error);
        // TODO: Show user-friendly error message in UI
        // For now, we'll just log the error and continue
      }

    } catch (error) {
      console.error(`Unexpected error in format action '${actionId}':`, error);
      // TODO: Show user-friendly error message
    }
  }
</script>

<div class="editor-toolbar" class:disabled role="toolbar" aria-label="Text formatting toolbar">
  <!-- Basic formatting group -->
  <div class="toolbar-group" role="group" aria-label="Basic formatting">
    {#each currentButtons.slice(0, 3) as button}
      <button 
        type="button" 
        class="toolbar-button"
        class:active={getButtonState(button.id)}
        onclick={() => handleFormatAction(button.id)}
        title={button.title}
        aria-label={button.title}
        {disabled}
      >
        <span class="button-icon" aria-hidden="true">{button.icon}</span>
        <span class="button-label visually-hidden">{button.label}</span>
      </button>
    {/each}
  </div>

  <div class="toolbar-separator" aria-hidden="true"></div>

  <!-- Headers group -->
  <div class="toolbar-group" role="group" aria-label="Headers">
    {#each currentButtons.slice(3, 6) as button}
      <button 
        type="button" 
        class="toolbar-button header-button"
        class:active={getButtonState(button.id)}
        onclick={() => handleFormatAction(button.id)}
        title={button.title}
        aria-label={button.title}
        {disabled}
      >
        <span class="button-icon" aria-hidden="true">{button.icon}</span>
        <span class="button-label visually-hidden">{button.label}</span>
      </button>
    {/each}
  </div>

  <div class="toolbar-separator" aria-hidden="true"></div>

  <!-- Lists and code group -->
  <div class="toolbar-group" role="group" aria-label="Lists and code">
    {#each currentButtons.slice(6) as button}
      <button 
        type="button" 
        class="toolbar-button"
        class:active={getButtonState(button.id)}
        onclick={() => handleFormatAction(button.id)}
        title={button.title}
        aria-label={button.title}
        {disabled}
      >
        <span class="button-icon" aria-hidden="true">{button.icon}</span>
        <span class="button-label visually-hidden">{button.label}</span>
      </button>
    {/each}
  </div>

  <!-- Custom tools group -->
  {#if customTools.length > 0}
    <div class="toolbar-separator" aria-hidden="true"></div>
    <div class="toolbar-group" role="group" aria-label="Custom tools">
      {#each customTools as tool}
        <button 
          type="button" 
          class="toolbar-button custom-tool"
          onclick={() => tool.action(editorInstance!)}
          title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
          aria-label={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
          {disabled}
        >
          <span class="button-icon" aria-hidden="true">{tool.icon || tool.label}</span>
          <span class="button-label visually-hidden">{tool.label}</span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Settings group -->
  {#if onOpenSettings}
    <div class="toolbar-separator" aria-hidden="true"></div>
    <div class="toolbar-group" role="group" aria-label="Settings">
      <button 
        type="button" 
        class="toolbar-button settings-button"
        onclick={onOpenSettings}
        title="Keyboard Shortcuts Settings"
        aria-label="Open keyboard shortcuts settings"
        {disabled}
      >
        <span class="button-icon" aria-hidden="true">⚙️</span>
        <span class="button-label visually-hidden">Settings</span>
      </button>
    </div>
  {/if}
</div>

<style>
  .editor-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f6f8fa;
    border-bottom: 1px solid #e1e5e9;
    border-radius: 6px 6px 0 0;
    flex-wrap: wrap;
  }

  .editor-toolbar.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .toolbar-group {
    display: flex;
    gap: 2px;
    align-items: center;
  }

  .toolbar-separator {
    width: 1px;
    height: 20px;
    background: #d1d9e0;
    margin: 0 6px;
    flex-shrink: 0;
  }

  .toolbar-button {
    padding: 6px 8px;
    border: 1px solid #d1d9e0;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    min-width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.15s ease;
    color: #24292f;
  }

  .toolbar-button:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #c9d1d9;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .toolbar-button:active:not(:disabled) {
    background: #e5e7eb;
    transform: translateY(0);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .toolbar-button:focus-visible {
    outline: 2px solid #0969da;
    outline-offset: 2px;
  }

  .toolbar-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f6f8fa;
  }

  .toolbar-button.active {
    background: #dbeafe;
    border-color: #3b82f6;
    color: #1e40af;
  }

  .button-icon {
    font-size: 14px;
    line-height: 1;
    font-weight: 600;
  }

  .button-label {
    font-size: 11px;
    font-weight: 500;
  }

  .header-button .button-icon {
    font-size: 12px;
    font-weight: 700;
  }

  .custom-tool {
    border-color: #8b5cf6;
    color: #7c3aed;
  }

  .custom-tool:hover:not(:disabled) {
    background: #f3e8ff;
    border-color: #7c3aed;
  }

  /* Visually hidden class for screen readers */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Responsive design for mobile */
  @media (max-width: 768px) {
    .editor-toolbar {
      padding: 6px 8px;
      gap: 4px;
    }

    .toolbar-button {
      min-width: 28px;
      height: 28px;
      padding: 4px 6px;
    }

    .button-icon {
      font-size: 12px;
    }

    .toolbar-separator {
      margin: 0 4px;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .toolbar-button {
      border-width: 2px;
    }

    .toolbar-button:hover:not(:disabled) {
      border-color: #000;
    }

    .toolbar-button:focus-visible {
      outline-width: 3px;
    }
  }

  /* Dark theme support */
  @media (prefers-color-scheme: dark) {
    .editor-toolbar {
      background: #21262d;
      border-bottom-color: #30363d;
    }

    .toolbar-button {
      background: #30363d;
      border-color: #30363d;
      color: #f0f6fc;
    }

    .toolbar-button:hover:not(:disabled) {
      background: #373e47;
      border-color: #444c56;
    }

    .toolbar-button:active:not(:disabled) {
      background: #282e33;
    }

    .toolbar-button.active {
      background: #1f2937;
      border-color: #3b82f6;
      color: #60a5fa;
    }

    .toolbar-separator {
      background: #444c56;
    }
  }
</style>