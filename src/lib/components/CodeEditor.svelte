<script lang="ts">
  import type { CodeEditorProps, Template } from '../types/index.js';
  import SyntaxHighlight from './SyntaxHighlight.svelte';
  import TemplatePopup from './TemplatePopup.svelte';
  import { detectSlashCommand, insertTemplateAtSlashCommand, getSlashCommandTemplates } from '../utils/slashCommands.js';
  import { TemplateService } from '../utils/templateManager.js';
  
  const {
    value = $bindable(''),
    mode,
    placeholder = '',
    readonly = false,
    onInput,
    theme = 'light',
    enableSyntaxHighlighting = true,
    enableSlashCommands = true,
    templates = []
  }: CodeEditorProps & { 
    theme?: 'light' | 'dark' | 'auto';
    enableSyntaxHighlighting?: boolean;
    enableSlashCommands?: boolean;
    templates?: Template[];
  } = $props();

  let textareaElement: HTMLTextAreaElement;
  
  // Local state for the textarea value
  let localValue = $state(value);
  
  // Track cursor position and selection state
  let cursorPosition = $state(0);
  let selectionStart = $state(0);
  let selectionEnd = $state(0);
  
  // Sync local value with bindable prop
  $effect(() => {
    if (localValue !== value) {
      localValue = value;
    }
  });
  const hasSelection = $derived(selectionStart !== selectionEnd);
  
  // Template manager and slash command state
  let templateManager: TemplateService;
  let showTemplatePopup = $state(false);
  let templateFilter = $state('');
  let slashCommandPosition = $state(0);
  let popupPosition = $state({ x: 0, y: 0 });
  
  // Initialize template manager
  $effect(() => {
    if (enableSlashCommands) {
      templateManager = new TemplateService();
    }
  });
  
  // Get available templates
  const availableTemplates = $derived(() => {
    if (!enableSlashCommands || !templateManager) return [];
    
    const allTemplates = templates.length > 0 ? templates : templateManager.getTemplates();
    return getSlashCommandTemplates(allTemplates, templateFilter, mode);
  });

  // Helper function to update value
  function updateValue(newValue: string) {
    localValue = newValue;
    onInput(newValue);
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    const newValue = target.value;
    updateCursorPosition();
    
    // Check for slash commands
    if (enableSlashCommands && !readonly) {
      checkSlashCommand();
    }
    
    updateValue(newValue);
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Handle template popup navigation
    if (showTemplatePopup) {
      // Let the TemplatePopup component handle these keys
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
        return; // Let the popup handle it
      }
    }
    
    // Enhanced keyboard handling with cursor tracking
    if (event.key === 'Tab') {
      event.preventDefault();
      const start = textareaElement.selectionStart;
      const end = textareaElement.selectionEnd;
      
      // Insert tab character
      const newValue = localValue.substring(0, start) + '\t' + localValue.substring(end);
      updateValue(newValue);
      
      // Restore cursor position
      setTimeout(() => {
        textareaElement.selectionStart = textareaElement.selectionEnd = start + 1;
        updateCursorPosition();
      });
    }
  }

  function handleSelectionChange() {
    updateCursorPosition();
  }

  function handleClick() {
    updateCursorPosition();
  }

  function handleKeyUp() {
    updateCursorPosition();
  }

  function updateCursorPosition() {
    if (!textareaElement) return;
    
    cursorPosition = textareaElement.selectionStart;
    selectionStart = textareaElement.selectionStart;
    selectionEnd = textareaElement.selectionEnd;
  }

  // Enhanced editor instance methods with cursor tracking
  export function insertText(text: string) {
    if (!textareaElement) return;
    
    const start = textareaElement.selectionStart;
    const end = textareaElement.selectionEnd;
    const newValue = localValue.substring(0, start) + text + localValue.substring(end);
    
    updateValue(newValue);
    
    // Position cursor after inserted text
    setTimeout(() => {
      textareaElement.selectionStart = textareaElement.selectionEnd = start + text.length;
      updateCursorPosition();
      textareaElement.focus();
    });
  }

  export function wrapSelection(before: string, after: string) {
    if (!textareaElement) return;
    
    const start = textareaElement.selectionStart;
    const end = textareaElement.selectionEnd;
    const selectedText = localValue.substring(start, end);
    const newText = before + selectedText + after;
    const newValue = localValue.substring(0, start) + newText + localValue.substring(end);
    
    updateValue(newValue);
    
    // Select the wrapped content
    setTimeout(() => {
      textareaElement.selectionStart = start + before.length;
      textareaElement.selectionEnd = start + before.length + selectedText.length;
      updateCursorPosition();
      textareaElement.focus();
    });
  }

  export function getSelection() {
    if (!textareaElement) return { start: 0, end: 0, text: '' };
    
    return {
      start: textareaElement.selectionStart,
      end: textareaElement.selectionEnd,
      text: localValue.substring(textareaElement.selectionStart, textareaElement.selectionEnd)
    };
  }

  export function getCursorPosition() {
    return cursorPosition;
  }

  export function getSelectionInfo() {
    return {
      start: selectionStart,
      end: selectionEnd,
      hasSelection,
      selectedText: hasSelection ? localValue.substring(selectionStart, selectionEnd) : ''
    };
  }

  export function setCursor(position: number) {
    if (!textareaElement) return;
    
    textareaElement.selectionStart = textareaElement.selectionEnd = position;
    updateCursorPosition();
    textareaElement.focus();
  }

  export function setSelection(start: number, end: number) {
    if (!textareaElement) return;
    
    textareaElement.selectionStart = start;
    textareaElement.selectionEnd = end;
    updateCursorPosition();
    textareaElement.focus();
  }

  export function focus() {
    textareaElement?.focus();
  }

  export function blur() {
    textareaElement?.blur();
  }

  export function getTextareaElement() {
    return textareaElement;
  }
  
  // Slash command functions
  function checkSlashCommand() {
    if (!textareaElement) return;
    
    const result = detectSlashCommand(localValue, cursorPosition, textareaElement);
    
    if (result.shouldShow) {
      showTemplatePopup = true;
      templateFilter = result.query;
      slashCommandPosition = result.position;
      popupPosition = result.cursorPosition;
    } else {
      showTemplatePopup = false;
      templateFilter = '';
    }
  }
  
  function handleTemplateSelect(template: Template) {
    const queryLength = templateFilter.length;
    const result = insertTemplateAtSlashCommand(
      localValue,
      template,
      slashCommandPosition,
      queryLength
    );
    
    updateValue(result.newText);
    
    // Update cursor position
    setTimeout(() => {
      textareaElement.selectionStart = textareaElement.selectionEnd = result.newCursorPosition;
      updateCursorPosition();
      textareaElement.focus();
    });
    
    // Mark template as used
    if (templateManager) {
      templateManager.markTemplateAsUsed(template.id);
    }
    
    // Close popup
    closeTemplatePopup();
  }
  
  function closeTemplatePopup() {
    showTemplatePopup = false;
    templateFilter = '';
    textareaElement?.focus();
  }
</script>

<div class="editor-container" class:syntax-enabled={enableSyntaxHighlighting}>
  <!-- Syntax highlighting overlay -->
  {#if enableSyntaxHighlighting}
    <SyntaxHighlight content={localValue} {mode} {theme} />
  {/if}
  
  <!-- Text input -->
  <textarea
    bind:this={textareaElement}
    bind:value={localValue}
    {placeholder}
    {readonly}
    class="code-editor"
    class:html-mode={mode === 'html'}
    class:markdown-mode={mode === 'markdown'}
    class:has-selection={hasSelection}
    class:with-highlighting={enableSyntaxHighlighting}
    oninput={handleInput}
    onkeydown={handleKeyDown}
    onkeyup={handleKeyUp}
    onclick={handleClick}
    onselect={handleSelectionChange}
    onfocus={updateCursorPosition}
    spellcheck="false"
    autocomplete="off"
  ></textarea>
  
  <!-- Template popup for slash commands -->
  {#if enableSlashCommands}
    <TemplatePopup
      bind:visible={showTemplatePopup}
      bind:filter={templateFilter}
      position={popupPosition}
      templates={availableTemplates}
      onSelect={handleTemplateSelect}
      onClose={closeTemplatePopup}
    />
  {/if}
</div>

<style>
  .editor-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .code-editor {
    position: relative;
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    padding: 12px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    resize: none;
    background: transparent;
    color: inherit;
    tab-size: 2;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    z-index: 2;
  }

  .code-editor.with-highlighting {
    /* Make text transparent when syntax highlighting is enabled */
    color: transparent;
    caret-color: #0969da;
  }

  .code-editor:focus {
    outline: none;
  }

  .code-editor.html-mode:not(.with-highlighting) {
    /* HTML-specific styling when no syntax highlighting */
    color: #24292f;
  }

  .code-editor.markdown-mode:not(.with-highlighting) {
    /* Markdown-specific styling when no syntax highlighting */
    color: #24292f;
  }

  .code-editor.has-selection {
    /* Visual feedback when text is selected - placeholder for future enhancements */
    position: relative;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .code-editor.html-mode:not(.with-highlighting),
    .code-editor.markdown-mode:not(.with-highlighting) {
      color: #f0f6fc;
    }
    
    .code-editor.with-highlighting {
      caret-color: #58a6ff;
    }
  }

  /* Improved text rendering */
  .code-editor {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  /* Selection styling for highlighted text */
  .code-editor.with-highlighting::selection {
    background: rgba(9, 105, 218, 0.3);
  }

  @media (prefers-color-scheme: dark) {
    .code-editor.with-highlighting::selection {
      background: rgba(88, 166, 255, 0.3);
    }
  }

  /* Ensure proper scrolling synchronization */
  .syntax-enabled {
    overflow: hidden;
  }

  .syntax-enabled .code-editor {
    background: transparent;
  }
</style>