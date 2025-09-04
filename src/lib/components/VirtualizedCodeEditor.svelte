<script lang="ts">
  import type { CodeEditorProps, Template } from '../types/index.js';
  import SyntaxHighlight from './SyntaxHighlight.svelte';
  import TemplatePopup from './TemplatePopup.svelte';
  import { detectSlashCommand, insertTemplateAtSlashCommand, getSlashCommandTemplates } from '../utils/slashCommands.js';
  import { TemplateService } from '../utils/templateManager.js';
  import { 
    createVirtualScrollManager, 
    splitContentIntoLines, 
    calculateLineHeight,
    type VirtualScrollState 
  } from '../utils/virtualScroll.js';
  import { 
    createLargeContentManager, 
    isLargeContent, 
    type LargeContentManager 
  } from '../utils/memoryOptimization.js';
  import { 
    createPerformanceMonitor, 
    measurePerformance,
    type PerformanceMonitor 
  } from '../utils/performanceMonitor.js';
  
  let {
    value = $bindable(''),
    mode,
    placeholder = '',
    readonly = false,
    onInput,
    theme = 'light',
    enableSyntaxHighlighting = true,
    enableSlashCommands = true,
    templates = [],
    enableVirtualScrolling = true,
    performanceMode = 'auto' // 'auto', 'always', 'never'
  }: CodeEditorProps & { 
    theme?: 'light' | 'dark' | 'auto';
    enableSyntaxHighlighting?: boolean;
    enableSlashCommands?: boolean;
    templates?: Template[];
    enableVirtualScrolling?: boolean;
    performanceMode?: 'auto' | 'always' | 'never';
  } = $props();

  let containerElement = $state<HTMLDivElement>();
  let textareaElement = $state<HTMLTextAreaElement>();
  let virtualScrollContainer = $state<HTMLDivElement>();
  
  // Performance monitoring
  let performanceMonitor: PerformanceMonitor;
  let contentManager: LargeContentManager | null = null;
  let virtualScrollManager = $state<ReturnType<typeof createVirtualScrollManager> | null>(null);
  
  // State management
  let cursorPosition = $state(0);
  let selectionStart = $state(0);
  let selectionEnd = $state(0);
  const hasSelection = $derived(selectionStart !== selectionEnd);
  let containerHeight = $state(400);
  let scrollTop = $state(0);
  
  // Content processing state
  let lines = $state<string[]>([]);
  let isLargeDocument = $state(false);
  let useVirtualScrolling = $state(false);
  let virtualScrollState = $state<VirtualScrollState | null>(null);
  
  // Template and slash command state
  let templateManager: TemplateService;
  let showTemplatePopup = $state(false);
  let templateFilter = $state('');
  let slashCommandPosition = $state(0);
  let popupPosition = $state({ x: 0, y: 0 });
  
  // Performance metrics
  let renderTime = $state(0);
  let inputLatency = $state(0);
  let memoryUsage = $state(0);

  // Initialize performance monitoring and content management
  $effect(() => {
    performanceMonitor = createPerformanceMonitor(100, {
      maxRenderTime: 500, // Render within 500ms
      maxInputLatency: 16, // 60fps target
      memoryWarningThreshold: 80
    });

    // Monitor performance warnings
    performanceMonitor.onPerformanceWarning((metric, threshold) => {
      console.warn(`Performance warning: ${threshold} exceeded`, metric);
      
      // Auto-enable performance optimizations if needed
      if (performanceMode === 'auto' && threshold === 'maxRenderTime') {
        enablePerformanceOptimizations();
      }
    });

    return () => {
      contentManager?.destroy();
    };
  });

  // Initialize template manager
  $effect(() => {
    if (enableSlashCommands) {
      templateManager = new TemplateService();
    }
  });

  // Process content and determine if optimizations are needed
  $effect(() => {
    const { result: processedData } = measurePerformance(
      performanceMonitor,
      'content-processing',
      () => {
        const newLines = splitContentIntoLines(value);
        const isLarge = isLargeContent(value, 50000); // 50KB threshold
        
        return { newLines, isLarge };
      }
    );

    lines = processedData.newLines;
    isLargeDocument = processedData.isLarge;
    
    // Determine if we should use virtual scrolling
    const shouldUseVirtual = enableVirtualScrolling && (
      performanceMode === 'always' || 
      (performanceMode === 'auto' && (isLargeDocument || lines.length > 1000))
    );
    
    useVirtualScrolling = shouldUseVirtual;
    
    // Initialize content manager for large documents
    if (isLargeDocument && !contentManager) {
      contentManager = createLargeContentManager(10000);
      contentManager.setContent(value);
    } else if (!isLargeDocument && contentManager) {
      contentManager.destroy();
      contentManager = null;
    }
    
    // Update content manager if it exists
    if (contentManager) {
      contentManager.setContent(value);
    }
  });

  // Initialize virtual scrolling
  $effect(() => {
    if (useVirtualScrolling && containerHeight > 0) {
      const lineHeight = calculateLineHeight(14); // 14px font size
      
      virtualScrollManager = createVirtualScrollManager({
        itemHeight: lineHeight,
        containerHeight,
        overscan: 10,
        threshold: 500 // Enable for 500+ lines
      });
      
      virtualScrollManager.updateTotalItems(lines.length);
      
      // Subscribe to virtual scroll state changes
      const unsubscribe = virtualScrollManager.subscribe((state) => {
        virtualScrollState = state;
      });
      
      return unsubscribe;
    } else {
      virtualScrollManager = null;
      virtualScrollState = null;
    }
  });

  // Get available templates
  const availableTemplates = $derived(() => {
    if (!enableSlashCommands || !templateManager) return [];
    
    const allTemplates = templates.length > 0 ? templates : templateManager.getTemplates();
    return getSlashCommandTemplates(allTemplates, templateFilter, mode);
  });

  // Get visible lines for virtual scrolling
  const visibleLines = $derived(() => {
    if (!useVirtualScrolling || !virtualScrollState) {
      return lines;
    }
    
    return lines.slice(virtualScrollState.startIndex, virtualScrollState.endIndex + 1);
  });

  function enablePerformanceOptimizations(): void {
    useVirtualScrolling = true;
    
    if (!contentManager && isLargeDocument) {
      contentManager = createLargeContentManager(5000); // Smaller chunks for better performance
      contentManager.setContent(value);
    }
  }

  function handleInput(event: Event) {
    const { result } = measurePerformance(
      performanceMonitor,
      'input-processing',
      () => {
        const target = event.target as HTMLTextAreaElement;
        value = target.value;
        updateCursorPosition();
        
        // Check for slash commands
        if (enableSlashCommands && !readonly) {
          checkSlashCommand();
        }
        
        onInput(value);
      }
    );
    
    // Update performance metrics
    const summary = performanceMonitor.getPerformanceSummary();
    renderTime = summary.averageRenderTime;
    inputLatency = summary.averageInputLatency;
    
    if (contentManager) {
      const memStats = contentManager.getMemoryStats();
      memoryUsage = memStats.memoryUsagePercentage || 0;
    }
  }

  function handleScroll(event: Event) {
    const target = event.target as HTMLElement;
    scrollTop = target.scrollTop;
    
    if (virtualScrollManager) {
      virtualScrollManager.updateScrollTop(scrollTop);
    }
  }

  function handleResize() {
    if (containerElement) {
      const newHeight = containerElement.clientHeight;
      containerHeight = newHeight;
      
      if (virtualScrollManager) {
        virtualScrollManager.updateContainerHeight(newHeight);
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Handle template popup navigation
    if (showTemplatePopup) {
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
        return; // Let the popup handle it
      }
    }
    
    // Enhanced keyboard handling with performance monitoring
    performanceMonitor.measureInputLatency('keyboard', () => {
      if (event.key === 'Tab') {
        event.preventDefault();
        const start = textareaElement.selectionStart;
        const end = textareaElement.selectionEnd;
        
        // Insert tab character
        const newValue = value.substring(0, start) + '\t' + value.substring(end);
        value = newValue;
        onInput(value);
        
        // Restore cursor position
        setTimeout(() => {
          textareaElement.selectionStart = textareaElement.selectionEnd = start + 1;
          updateCursorPosition();
        });
      }
    });
  }

  function updateCursorPosition() {
    if (!textareaElement) return;
    
    cursorPosition = textareaElement.selectionStart;
    selectionStart = textareaElement.selectionStart;
    selectionEnd = textareaElement.selectionEnd;
  }

  // Enhanced editor methods with performance monitoring
  export function insertText(text: string) {
    if (!textareaElement) return;
    
    measurePerformance(performanceMonitor, 'insert-text', () => {
      const start = textareaElement.selectionStart;
      const end = textareaElement.selectionEnd;
      const newValue = value.substring(0, start) + text + value.substring(end);
      
      value = newValue;
      onInput(value);
      
      // Position cursor after inserted text
      setTimeout(() => {
        textareaElement.selectionStart = textareaElement.selectionEnd = start + text.length;
        updateCursorPosition();
        textareaElement.focus();
      });
    });
  }

  export function wrapSelection(before: string, after: string) {
    if (!textareaElement) return;
    
    measurePerformance(performanceMonitor, 'wrap-selection', () => {
      const start = textareaElement.selectionStart;
      const end = textareaElement.selectionEnd;
      const selectedText = value.substring(start, end);
      const newText = before + selectedText + after;
      const newValue = value.substring(0, start) + newText + value.substring(end);
      
      value = newValue;
      onInput(value);
      
      // Select the wrapped content
      setTimeout(() => {
        textareaElement.selectionStart = start + before.length;
        textareaElement.selectionEnd = start + before.length + selectedText.length;
        updateCursorPosition();
        textareaElement.focus();
      });
    });
  }

  export function getPerformanceMetrics() {
    return {
      renderTime,
      inputLatency,
      memoryUsage,
      isLargeDocument,
      useVirtualScrolling,
      lineCount: lines.length,
      contentSize: value.length
    };
  }

  // Slash command functions
  function checkSlashCommand() {
    if (!textareaElement) return;
    
    const result = detectSlashCommand(value, cursorPosition, textareaElement);
    
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
      value,
      template,
      slashCommandPosition,
      queryLength
    );
    
    value = result.newText;
    onInput(value);
    
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

  // Expose additional methods
  export function getSelection() {
    if (!textareaElement) return { start: 0, end: 0, text: '' };
    
    return {
      start: textareaElement.selectionStart,
      end: textareaElement.selectionEnd,
      text: value.substring(textareaElement.selectionStart, textareaElement.selectionEnd)
    };
  }

  export function getCursorPosition() {
    return cursorPosition;
  }

  export function focus() {
    textareaElement?.focus();
  }

  export function blur() {
    textareaElement?.blur();
  }
</script>

<svelte:window on:resize={handleResize} />

<div 
  bind:this={containerElement}
  class="virtualized-editor-container" 
  class:large-document={isLargeDocument}
  class:virtual-scrolling={useVirtualScrolling}
  class:syntax-enabled={enableSyntaxHighlighting}
>
  <!-- Performance indicator -->
  {#if isLargeDocument}
    <div class="performance-indicator">
      <span class="indicator-item">Lines: {lines.length.toLocaleString()}</span>
      <span class="indicator-item">Size: {Math.round(value.length / 1024)}KB</span>
      {#if renderTime > 0}
        <span class="indicator-item" class:warning={renderTime > 100}>
          Render: {Math.round(renderTime)}ms
        </span>
      {/if}
      {#if memoryUsage > 0}
        <span class="indicator-item" class:warning={memoryUsage > 70}>
          Memory: {Math.round(memoryUsage)}%
        </span>
      {/if}
      {#if useVirtualScrolling}
        <span class="indicator-item virtual">Virtual Scrolling</span>
      {/if}
    </div>
  {/if}

  <!-- Virtual scroll container -->
  {#if useVirtualScrolling && virtualScrollState}
    <div 
      bind:this={virtualScrollContainer}
      class="virtual-scroll-container"
      style="height: {virtualScrollManager?.getTotalHeight()}px"
    >
      <!-- Syntax highlighting overlay for visible lines -->
      {#if enableSyntaxHighlighting}
        <div 
          class="virtual-syntax-highlight"
          style="transform: translateY({virtualScrollState.offsetY}px)"
        >
          <SyntaxHighlight 
            content={visibleLines.join('\n')} 
            {mode} 
            {theme} 
          />
        </div>
      {/if}
      
      <!-- Virtual textarea -->
      <textarea
        bind:this={textareaElement}
        bind:value
        {placeholder}
        {readonly}
        class="virtual-code-editor"
        class:html-mode={mode === 'html'}
        class:markdown-mode={mode === 'markdown'}
        class:has-selection={hasSelection}
        class:with-highlighting={enableSyntaxHighlighting}
        style="transform: translateY({virtualScrollState.offsetY}px)"
        oninput={handleInput}
        onkeydown={handleKeyDown}
        onkeyup={updateCursorPosition}
        onclick={updateCursorPosition}
        onselect={updateCursorPosition}
        onfocus={updateCursorPosition}
        onscroll={handleScroll}
        spellcheck="false"
        autocomplete="off"
      ></textarea>
    </div>
  {:else}
    <!-- Standard editor for smaller documents -->
    <div class="standard-editor-container">
      <!-- Syntax highlighting overlay -->
      {#if enableSyntaxHighlighting}
        <SyntaxHighlight content={value} {mode} {theme} />
      {/if}
      
      <!-- Text input -->
      <textarea
        bind:this={textareaElement}
        bind:value
        {placeholder}
        {readonly}
        class="code-editor"
        class:html-mode={mode === 'html'}
        class:markdown-mode={mode === 'markdown'}
        class:has-selection={hasSelection}
        class:with-highlighting={enableSyntaxHighlighting}
        oninput={handleInput}
        onkeydown={handleKeyDown}
        onkeyup={updateCursorPosition}
        onclick={updateCursorPosition}
        onselect={updateCursorPosition}
        onfocus={updateCursorPosition}
        onscroll={handleScroll}
        spellcheck="false"
        autocomplete="off"
      ></textarea>
    </div>
  {/if}
  
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
  .virtualized-editor-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .performance-indicator {
    display: flex;
    gap: 12px;
    padding: 4px 8px;
    background: #f6f8fa;
    border-bottom: 1px solid #e1e5e9;
    font-size: 11px;
    color: #656d76;
    font-family: 'SF Mono', Monaco, monospace;
  }

  .indicator-item {
    padding: 2px 6px;
    border-radius: 3px;
    background: white;
    border: 1px solid #d1d9e0;
  }

  .indicator-item.warning {
    background: #fff3cd;
    border-color: #ffeaa7;
    color: #856404;
  }

  .indicator-item.virtual {
    background: #e7f3ff;
    border-color: #b6d7ff;
    color: #0969da;
  }

  .virtual-scroll-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }

  .virtual-syntax-highlight {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    z-index: 1;
  }

  .virtual-code-editor {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
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

  .standard-editor-container {
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

  .code-editor.with-highlighting,
  .virtual-code-editor.with-highlighting {
    color: transparent;
    caret-color: #0969da;
  }

  .code-editor:focus,
  .virtual-code-editor:focus {
    outline: none;
  }

  /* Improved scrolling performance */
  .virtual-scroll-container {
    will-change: scroll-position;
    -webkit-overflow-scrolling: touch;
  }

  /* Optimize rendering for large documents */
  .large-document {
    contain: layout style paint;
  }

  .virtual-scrolling .virtual-code-editor {
    contain: layout style paint;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .performance-indicator {
      background: #161b22;
      border-color: #30363d;
      color: #8b949e;
    }
    
    .indicator-item {
      background: #21262d;
      border-color: #30363d;
      color: #f0f6fc;
    }
    
    .code-editor.with-highlighting,
    .virtual-code-editor.with-highlighting {
      caret-color: #58a6ff;
    }
  }

  /* Selection styling */
  .code-editor.with-highlighting::selection,
  .virtual-code-editor.with-highlighting::selection {
    background: rgba(9, 105, 218, 0.3);
  }

  @media (prefers-color-scheme: dark) {
    .code-editor.with-highlighting::selection,
    .virtual-code-editor.with-highlighting::selection {
      background: rgba(88, 166, 255, 0.3);
    }
  }
</style>