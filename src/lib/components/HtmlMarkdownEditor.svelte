<script lang="ts">
  import type { EditorProps, EditorState, Template, Snippet, PerformanceMetrics } from '../types/index.js';
  import PreviewPane from './PreviewPane.svelte';
  import VirtualizedCodeEditor from './VirtualizedCodeEditor.svelte';
  import LoadingIndicator from './LoadingIndicator.svelte';
  import ErrorDisplay from './ErrorDisplay.svelte';
  import EditorToolbar from './EditorToolbar.svelte';
  import TemplatePopup from './TemplatePopup.svelte';
  import SnippetManager from './SnippetManager.svelte';
  import KeyboardShortcutSettings from './KeyboardShortcutSettings.svelte';
  import { 
    createInputOptimizer, 
    createDOMOptimizer, 
    type InputOptimizer, 
    type DOMOptimizer 
  } from '../utils/inputOptimization.js';
  import { 
    createPerformanceMonitor, 
    type PerformanceMonitor 
  } from '../utils/performanceMonitor.js';
  import { isLargeContent } from '../utils/memoryOptimization.js';
  import { 
    AccessibilityManager, 
    createAriaAttributes,
    type KeyboardShortcut
  } from '../utils/accessibility.js';
  import { 
    LoadingStateManager, 
    type LoadingState 
  } from '../utils/loadingState.js';
  import { 
    ErrorHandler, 
    type EditorError 
  } from '../utils/errorHandling.js';
  import { 
    ResponsiveManager, 
    createResponsiveProperties
  } from '../utils/responsive.js';
  // Processors imported when needed
  import { createContentConverter, getConversionStats, type ConversionResult } from '../utils/contentConverter.js';
  import { applyFormatAction, type FormatContext, type TextSelection } from '../utils/formatActions.js';
  import { KeyboardShortcutService } from '../utils/keyboardShortcuts.js';
  
  // Props with defaults - Clean API with customizable props
  const {
    value = $bindable(''),
    mode = $bindable('markdown'),
    showPreview = true,
    showToolbar = true,
    placeholder = '',
    readonly = false,
    theme = 'auto',
    debounceMs = 300,
    maxLength,
    templates = [],
    snippets = [],
    enableSlashCommands = true,
    githubStyle = true,
    enableVirtualScrolling = true,
    performanceMode = 'auto',
    enablePerformanceMonitoring = true,
    // Accessibility props
    enableAccessibility = true,
    enableKeyboardNavigation = true,
    enableScreenReaderSupport = true,
    ariaLabel,
    ariaDescribedBy,
    // Responsive props
    enableResponsiveDesign = true,
    enableMobileOptimizations = true,
    enableTouchOptimizations = true,
    // Error handling props
    enableErrorRecovery = true,
    showErrorDetails = false,
    // Loading state props
    showLoadingStates = true,
    // Event handlers
    onchange,
    onmodechange,
    onfocus,
    onblur,
    ontemplateinsert,
    onsnippetinsert,
    onperformanceupdate,
    onerror,
    onloadingstatechange
  }: EditorProps & {
    enableVirtualScrolling?: boolean;
    performanceMode?: 'auto' | 'always' | 'never';
    enablePerformanceMonitoring?: boolean;
    // Accessibility
    enableAccessibility?: boolean;
    enableKeyboardNavigation?: boolean;
    enableScreenReaderSupport?: boolean;
    ariaLabel?: string;
    ariaDescribedBy?: string;
    // Responsive
    enableResponsiveDesign?: boolean;
    enableMobileOptimizations?: boolean;
    enableTouchOptimizations?: boolean;
    // Error handling
    enableErrorRecovery?: boolean;
    showErrorDetails?: boolean;
    // Loading states
    showLoadingStates?: boolean;
    // Event handlers
    onchange?: (value: string) => void;
    onmodechange?: (mode: 'html' | 'markdown') => void;
    onfocus?: () => void;
    onblur?: () => void;
    ontemplateinsert?: (template: Template) => void;
    onsnippetinsert?: (snippet: Snippet) => void;
    onperformanceupdate?: (metrics: PerformanceMetrics) => void;
    onerror?: (error: EditorError) => void;
    onloadingstatechange?: (state: LoadingState) => void;
  } = $props();

  // Performance optimization instances
  let inputOptimizer: InputOptimizer;
  let domOptimizer: DOMOptimizer;
  let performanceMonitor: PerformanceMonitor;
  
  // Accessibility and UX instances
  let accessibilityManager = $state<AccessibilityManager>();
  let loadingStateManager = $state<LoadingStateManager>();
  let errorHandler = $state<ErrorHandler>();
  let responsiveManager = $state<ResponsiveManager>();
  let keyboardShortcutService = $state<KeyboardShortcutService>();
  
  // Component references
  let editorContainer = $state<HTMLDivElement>();
  let editorElement = $state<HTMLTextAreaElement>();
  
  // Performance state
  let isLargeDocument = $state(false);
  let useOptimizedEditor = $state(false);
  let performanceMetrics = $state<PerformanceMetrics>({
    renderTime: 0,
    inputLatency: 0,
    memoryUsage: 0,
    isLargeDocument: false,
    useVirtualScrolling: false,
    lineCount: 0,
    contentSize: 0
  });
  
  // Accessibility and UX state
  let currentError = $state<EditorError | null>(null);
  let loadingState = $state<LoadingState>({
    isLoading: false
  });
  let isResponsive = $state(false);
  let isMobileView = $state(false);
  let responsiveConfig = $state<Record<string, any>>({});
  let cssProperties = $state<Record<string, string>>({});

  // Internal state using Svelte 5 runes - state management system
  let editorState = $state<EditorState>({
    content: value,
    mode: mode,
    showPreview: showPreview,
    cursorPosition: 0,
    selection: null,
    history: [],
    historyIndex: -1,
    showTemplatePopup: false,
    templateFilter: '',
    customShortcuts: {}
  });

  // Template and snippet state
  let showSnippetManager = $state(false);
  let showKeyboardSettings = $state(false);
  let templatePopupPosition = $state({ x: 0, y: 0 });
  let filteredTemplates = $state<Template[]>([]);
  let activeSnippets = $state<Snippet[]>(snippets);

  // Conversion preview state
  let conversionPreview = $state({
    show: false,
    targetMode: 'markdown' as 'html' | 'markdown',
    preview: '',
    warnings: [] as string[]
  });

  // Derived state for computed values
  const isHtmlMode = $derived(editorState.mode === 'html');
  const isMarkdownMode = $derived(editorState.mode === 'markdown');
  const hasContent = $derived(editorState.content.length > 0);
  const canUndo = $derived(editorState.historyIndex > 0);
  const canRedo = $derived(editorState.historyIndex < editorState.history.length - 1);
  
  // Performance-related derived state
  const shouldUseOptimizations = $derived(
    performanceMode === 'always' || 
    (performanceMode === 'auto' && (isLargeDocument || performanceMetrics.renderTime > 100))
  );

  // Initialize all managers and optimizations
  $effect(() => {
    // Performance monitoring
    if (enablePerformanceMonitoring) {
      performanceMonitor = createPerformanceMonitor(100, {
        maxRenderTime: 500, // Render within 500ms
        maxInputLatency: 16, // 60fps target
        memoryWarningThreshold: 80
      });

      // Monitor performance warnings and auto-optimize
      performanceMonitor.onPerformanceWarning((metric, threshold) => {
        console.warn(`Performance warning: ${threshold} exceeded`, metric);
        
        if (performanceMode === 'auto' && threshold === 'maxRenderTime') {
          useOptimizedEditor = true;
        }
      });
    }

    // Input optimization
    inputOptimizer = createInputOptimizer({
      enableBatching: true,
      batchSize: 5,
      maxBatchDelay: 16, // No delay for continuous typing
      enableSmartDebouncing: true,
      inputLatencyTarget: 16
    });

    domOptimizer = createDOMOptimizer();

    // Accessibility manager - keyboard navigation and accessibility
    if (enableAccessibility) {
      accessibilityManager = new AccessibilityManager({
        enableKeyboardNavigation,
        enableScreenReaderSupport,
        enableFocusManagement: true,
        announceChanges: true
      });

      // Register keyboard shortcuts
      if (enableKeyboardNavigation) {
        registerKeyboardShortcuts();
      }
    }

    // Keyboard shortcut service - keyboard shortcut system
    keyboardShortcutService = new KeyboardShortcutService();
    
    // Create editor instance interface for shortcuts
    const editorInstance = {
      getValue: () => value,
      setValue: (newValue: string) => { 
        editorState.content = newValue;
      },
      getMode: () => mode,
      setMode: (newMode: 'html' | 'markdown') => { 
        switchMode(newMode);
      },
      getSelection: () => getTextSelection(),
      setSelection: (start: number, end: number) => setTextSelection(start, end),
      setCursor: (position: number) => setCursorPosition(position),
      focus: () => focusEditor(),
      undo: () => performUndo(),
      redo: () => performRedo()
    };
    
    keyboardShortcutService.setEditorInstance(editorInstance);

    // Loading state manager - loading state and feedback
    if (showLoadingStates) {
      loadingStateManager = new LoadingStateManager({
        showSpinner: true,
        showProgress: false,
        showMessage: true,
        minDisplayTime: 300,
        timeout: 30000
      });

      loadingStateManager.onStateChange('editor', (state) => {
        loadingState = state;
        onloadingstatechange?.(state);
      });
    }

    // Error handler - error messages and recovery options
    if (enableErrorRecovery) {
      errorHandler = new ErrorHandler({
        enableAutoRecovery: true,
        showUserFriendlyMessages: true,
        logErrors: true,
        maxRetries: 3,
        retryDelay: 1000
      });

      errorHandler.onError('editor', (error) => {
        currentError = error;
        onerror?.(error);
      });
    }

    // Responsive manager - responsive design and mobile support
    if (enableResponsiveDesign) {
      responsiveManager = new ResponsiveManager({
        enableMobileOptimizations,
        enableTouchOptimizations,
        mobileBreakpoint: 768,
        tabletBreakpoint: 1024,
        adaptiveLayout: true,
        touchTargetSize: 44
      });

      responsiveManager.onViewportChange('editor', (viewport) => {
        isMobileView = viewport.isMobile;
        isResponsive = true;
        responsiveConfig = {
          ...responsiveManager.getMobileConfig(),
          ...responsiveManager.getTabletConfig(),
          ...responsiveManager.getTouchConfig()
        };
        cssProperties = createResponsiveProperties(responsiveManager);
      });

      // Observe container for responsive behavior
      if (editorContainer) {
        responsiveManager.observeContainer(editorContainer);
      }
    }

    return () => {
      inputOptimizer?.destroy();
      domOptimizer?.destroy();
      accessibilityManager?.destroy();
      loadingStateManager?.destroy();
      errorHandler?.clearErrorHistory();
      responsiveManager?.destroy();
    };
  });

  // Monitor content size and determine if optimizations are needed
  $effect(() => {
    const contentSize = editorState.content.length;
    const lineCount = editorState.content.split('\n').length;
    
    isLargeDocument = isLargeContent(editorState.content, 50000); // 50KB threshold
    useOptimizedEditor = shouldUseOptimizations;
    
    // Update performance metrics
    performanceMetrics = {
      ...performanceMetrics,
      isLargeDocument,
      useVirtualScrolling: useOptimizedEditor && enableVirtualScrolling,
      lineCount,
      contentSize
    };
    
    onperformanceupdate?.(performanceMetrics);
  });

  // Two-way data binding support with performance optimization
  $effect(() => {
    if (editorState.content !== value) {
      if (performanceMonitor) {
        const endTiming = performanceMonitor.startTiming('content-sync');
        onchange?.(editorState.content);
        const metric = endTiming();
        
        performanceMetrics = {
          ...performanceMetrics,
          renderTime: metric.renderTime
        };
      } else {
        onchange?.(editorState.content);
      }
    }
  });

  $effect(() => {
    if (editorState.mode !== mode) {
      onmodechange?.(editorState.mode);
    }
  });

  // Sync external value changes to internal state with batching
  $effect(() => {
    if (value !== editorState.content) {
      if (inputOptimizer) {
        inputOptimizer.processInput({
          type: 'replace',
          position: 0,
          content: value,
          length: editorState.content.length
        });
      }
      editorState.content = value;
    }
  });

  $effect(() => {
    if (mode !== editorState.mode) {
      editorState.mode = mode;
    }
  });

  // Mode switching function - preserve content when switching modes
  function switchMode(newMode: 'html' | 'markdown') {
    if (newMode !== editorState.mode) {
      // Save current state to history before switching
      addToHistory();
      
      // Convert content if needed
      const convertedContent = convertContentForMode(editorState.content, editorState.mode, newMode);
      
      // Update state
      editorState.mode = newMode;
      editorState.content = convertedContent;
      
      // Announce mode change for accessibility
      if (accessibilityManager) {
        accessibilityManager.announce(`Switched to ${newMode} mode`);
      }
      
      // Trigger mode change event
      onmodechange?.(newMode);
    }
  }

  // Content conversion function - minimize data loss during conversion
  function convertContentForMode(content: string, fromMode: 'html' | 'markdown', toMode: 'html' | 'markdown'): string {
    // If modes are the same or content is empty, no conversion needed
    if (fromMode === toMode || !content.trim()) {
      return content;
    }

    try {
      const converter = createContentConverter();
      let result: ConversionResult;

      if (fromMode === 'markdown' && toMode === 'html') {
        // Convert Markdown to HTML
        result = converter.markdownToHtml(content, {
          preserveWhitespace: true,
          preserveComments: true,
          enableFallback: true
        });
      } else if (fromMode === 'html' && toMode === 'markdown') {
        // Convert HTML to Markdown
        result = converter.htmlToMarkdown(content, {
          preserveWhitespace: true,
          preserveComments: true,
          preserveUnknownTags: true,
          enableFallback: true
        });
      } else {
        return content;
      }

      // Log conversion statistics for debugging
      if (enablePerformanceMonitoring) {
        console.log(`Content conversion (${fromMode} → ${toMode}):`, getConversionStats(result));
      }

      // Show warnings to user if there are any
      if (result.warnings.length > 0 && accessibilityManager) {
        const warningMessage = `Conversion completed with ${result.warnings.length} warning(s)`;
        accessibilityManager.announce(warningMessage);
        
        if (result.dataLoss) {
          console.warn('Data loss detected during conversion:', result.warnings);
        }
      }

      // Validate the conversion
      if (!converter.validateConversion(content, result.content, fromMode, toMode)) {
        console.warn('Conversion validation failed, using fallback');
        return content;
      }

      return result.content;

    } catch (error) {
      // Handle conversion errors gracefully
      if (errorHandler) {
        errorHandler.handleError(error as Error, {
          context: 'content-conversion',
          fromMode,
          toMode,
          contentLength: content.length
        });
      }
      
      // Return original content if conversion fails
      console.warn(`Failed to convert content from ${fromMode} to ${toMode}:`, error);
      return content;
    }
  }

  // History management functions
  function addToHistory() {
    const historyEntry = {
      content: editorState.content,
      cursorPosition: editorState.cursorPosition,
      timestamp: Date.now()
    };
    
    // Remove any future history if we're not at the end
    if (editorState.historyIndex < editorState.history.length - 1) {
      editorState.history = editorState.history.slice(0, editorState.historyIndex + 1);
    }
    
    editorState.history.push(historyEntry);
    editorState.historyIndex = editorState.history.length - 1;
    
    // Limit history size to prevent memory issues
    if (editorState.history.length > 50) {
      editorState.history = editorState.history.slice(-50);
      editorState.historyIndex = editorState.history.length - 1;
    }
  }

  function undo() {
    if (canUndo) {
      editorState.historyIndex--;
      const historyEntry = editorState.history[editorState.historyIndex];
      editorState.content = historyEntry.content;
      editorState.cursorPosition = historyEntry.cursorPosition;
    }
  }

  function redo() {
    if (canRedo) {
      editorState.historyIndex++;
      const historyEntry = editorState.history[editorState.historyIndex];
      editorState.content = historyEntry.content;
      editorState.cursorPosition = historyEntry.cursorPosition;
    }
  }

  // Accessibility functions - keyboard navigation
  function registerKeyboardShortcuts() {
    if (!accessibilityManager) return;

    const shortcuts: KeyboardShortcut[] = [
      {
        key: 'b',
        ctrlKey: true,
        action: () => applyFormat('bold'),
        description: 'Bold text'
      },
      {
        key: 'i',
        ctrlKey: true,
        action: () => applyFormat('italic'),
        description: 'Italic text'
      },
      {
        key: 'k',
        ctrlKey: true,
        action: () => applyFormat('link'),
        description: 'Insert link'
      },
      {
        key: 'z',
        ctrlKey: true,
        action: () => undo(),
        description: 'Undo'
      },
      {
        key: 'y',
        ctrlKey: true,
        action: () => redo(),
        description: 'Redo'
      },
      {
        key: 'Tab',
        action: () => handleTabNavigation(),
        description: 'Navigate between elements',
        preventDefault: false
      },
      {
        key: 'Escape',
        action: () => handleEscape(),
        description: 'Close popups and return focus'
      },
      {
        key: ' ',
        ctrlKey: true,
        action: () => toggleSnippetManager(),
        description: 'Open snippet manager'
      },
      {
        key: 'm',
        altKey: true,
        action: () => switchMode('markdown'),
        description: 'Switch to Markdown mode'
      },
      {
        key: 'h',
        altKey: true,
        action: () => switchMode('html'),
        description: 'Switch to HTML mode'
      }
    ];

    shortcuts.forEach(shortcut => {
      accessibilityManager.registerKeyboardShortcut(shortcut);
    });
  }

  function applyFormat(format: string) {
    // This will be implemented when toolbar functionality is added
    console.log(`Applying format: ${format}`);
    if (accessibilityManager) {
      accessibilityManager.announce(`Applied ${format} formatting`);
    }
  }

  // Format action handler - handle format buttons and text selection
  function handleFormatAction(actionId: string, formatAction: any) {
    try {
      // Get current editor state
      const currentSelection = getCurrentSelection();
      const context: FormatContext = {
        content: editorState.content,
        selection: currentSelection,
        cursorPosition: editorState.cursorPosition
      };

      // Apply the format action
      const result = applyFormatAction(formatAction, context);

      // Update editor state
      editorState.content = result.content;
      editorState.cursorPosition = result.cursorPosition;

      // Update selection if specified
      if (result.selectionStart !== undefined && result.selectionEnd !== undefined) {
        editorState.selection = {
          start: result.selectionStart,
          end: result.selectionEnd
        };
      }

      // Add to history
      addToHistory();

      // Announce to accessibility manager
      if (accessibilityManager) {
        accessibilityManager.announce(`Applied ${actionId} formatting`);
      }

      // Trigger change event
      onchange?.(editorState.content);

    } catch (error) {
      console.error(`Error applying format action '${actionId}':`, error);
      if (errorHandler) {
        errorHandler.handleError(error as Error, {
          context: 'format-action',
          actionId,
          formatAction
        });
      }
    }
  }

  // Get current text selection - text selection and format application
  function getCurrentSelection(): TextSelection {
    // If we have a stored selection, use it
    if (editorState.selection) {
      return {
        start: editorState.selection.start,
        end: editorState.selection.end,
        text: editorState.content.slice(editorState.selection.start, editorState.selection.end)
      };
    }

    // Otherwise, use cursor position as zero-width selection
    return {
      start: editorState.cursorPosition,
      end: editorState.cursorPosition,
      text: ''
    };
  }

  // Create editor instance for toolbar integration
  function createEditorInstance(): any {
    return {
      insertText: (text: string) => {
        const beforeCursor = editorState.content.slice(0, editorState.cursorPosition);
        const afterCursor = editorState.content.slice(editorState.cursorPosition);
        editorState.content = beforeCursor + text + afterCursor;
        editorState.cursorPosition = beforeCursor.length + text.length;
        onchange?.(editorState.content);
      },
      wrapSelection: (before: string, after: string) => {
        const selection = getCurrentSelection();
        if (selection.text) {
          const beforeSelection = editorState.content.slice(0, selection.start);
          const afterSelection = editorState.content.slice(selection.end);
          const wrappedText = before + selection.text + after;
          editorState.content = beforeSelection + wrappedText + afterSelection;
          editorState.cursorPosition = selection.start + before.length + selection.text.length + after.length;
        } else {
          const beforeCursor = editorState.content.slice(0, editorState.cursorPosition);
          const afterCursor = editorState.content.slice(editorState.cursorPosition);
          const insertText = before + after;
          editorState.content = beforeCursor + insertText + afterCursor;
          editorState.cursorPosition = beforeCursor.length + before.length;
        }
        onchange?.(editorState.content);
      },
      getSelection: () => getCurrentSelection(),
      setCursor: (position: number) => {
        editorState.cursorPosition = Math.max(0, Math.min(position, editorState.content.length));
      },
      focus: () => {
        if (editorElement) {
          editorElement.focus();
        }
      }
    };
  }

  // Create editor instance for toolbar
  const editorInstance = $derived(createEditorInstance());

  // Template handling functions 
  function handleSlashCommand(event: KeyboardEvent) {
    if (!enableSlashCommands) return;
    
    if (event.key === '/' && editorState.content.endsWith('/')) {
      // Show template popup
      const rect = editorElement?.getBoundingClientRect();
      if (rect) {
        templatePopupPosition = {
          x: rect.left,
          y: rect.bottom + 4
        };
        editorState.showTemplatePopup = true;
        editorState.templateFilter = '';
        filteredTemplates = templates;
      }
    }
  }

  function handleTemplateSelect(template: Template) {
    // Remove the slash that triggered the popup
    const content = editorState.content;
    const beforeSlash = content.slice(0, -1);
    
    // Insert template content
    let templateContent = template.content;
    
    // Handle template variables if any
    if (template.variables && template.variables.length > 0) {
      template.variables.forEach(variable => {
        const placeholder = `{{${variable.name}}}`;
        const replacement = variable.defaultValue || variable.placeholder;
        templateContent = templateContent.replace(new RegExp(placeholder, 'g'), replacement);
      });
    }
    
    editorState.content = beforeSlash + templateContent;
    editorState.showTemplatePopup = false;
    
    // Trigger event
    ontemplateinsert?.(template);
    
    if (accessibilityManager) {
      accessibilityManager.announce(`Inserted template: ${template.name}`);
    }
  }

  function handleTemplateClose() {
    editorState.showTemplatePopup = false;
    editorState.templateFilter = '';
  }

  // Snippet handling functions
  function handleSnippetTrigger(shortcut: string) {
    const snippet = activeSnippets.find(s => s.shortcut === shortcut);
    if (snippet) {
      insertSnippet(snippet);
    }
  }

  function insertSnippet(snippet: Snippet) {
    let snippetContent = snippet.content;
    
    // Handle snippet variables if any
    if (snippet.variables && snippet.variables.length > 0) {
      snippet.variables.forEach(variable => {
        const placeholder = `{{${variable.name}}}`;
        const replacement = variable.defaultValue || variable.placeholder;
        snippetContent = snippetContent.replace(new RegExp(placeholder, 'g'), replacement);
      });
    }
    
    // Insert at current cursor position
    const beforeCursor = editorState.content.slice(0, editorState.cursorPosition);
    const afterCursor = editorState.content.slice(editorState.cursorPosition);
    
    editorState.content = beforeCursor + snippetContent + afterCursor;
    
    // Update cursor position
    if (snippet.cursorOffset !== undefined) {
      editorState.cursorPosition = beforeCursor.length + snippet.cursorOffset;
    } else {
      editorState.cursorPosition = beforeCursor.length + snippetContent.length;
    }
    
    // Trigger event
    onsnippetinsert?.(snippet);
    
    if (accessibilityManager) {
      accessibilityManager.announce(`Inserted snippet: ${snippet.name}`);
    }
  }

  function toggleSnippetManager() {
    showSnippetManager = !showSnippetManager;
  }

  function toggleKeyboardSettings() {
    showKeyboardSettings = !showKeyboardSettings;
  }

  function handleKeyboardSettingsChange(newSettings: any) {
    if (keyboardShortcutService) {
      keyboardShortcutService.updateSettings(newSettings);
    }
  }

  function handleConflictResolve(conflictKey: string, keepNew: boolean) {
    if (keyboardShortcutService) {
      keyboardShortcutService.resolveConflict(conflictKey, keepNew);
    }
  }

  function handleAddCustomSnippet(snippet: any) {
    if (keyboardShortcutService) {
      keyboardShortcutService.addCustomSnippet(snippet);
    }
  }

  function handleRemoveCustomSnippet(snippetId: string) {
    if (keyboardShortcutService) {
      keyboardShortcutService.removeCustomSnippet(snippetId);
    }
  }

  function handleTabNavigation() {
    // Let the accessibility manager handle tab navigation
    return false;
  }

  function handleEscape() {
    // Close any open popups and return focus to editor
    editorState.showTemplatePopup = false;
    if (editorElement) {
      editorElement.focus();
    }
    if (accessibilityManager) {
      accessibilityManager.announce('Popups closed, focus returned to editor');
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    // First, try keyboard shortcut service
    if (keyboardShortcutService && keyboardShortcutService.handleKeyDown(event)) {
      return; // Handled by keyboard shortcut service
    }
    
    // Then try accessibility manager
    if (accessibilityManager && accessibilityManager.handleKeyDown(event)) {
      return; // Handled by accessibility manager
    }
    
    // Handle slash commands
    handleSlashCommand(event);
    
    // Handle snippet shortcuts (legacy support)
    if (activeSnippets.length > 0) {
      const shortcut = getKeyboardShortcut(event);
      const snippet = activeSnippets.find(s => s.shortcut === shortcut);
      if (snippet) {
        event.preventDefault();
        insertSnippet(snippet);
      }
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

  // Editor instance helper functions - keyboard shortcut support
  function getTextSelection(): TextSelection {
    if (editorElement) {
      const start = editorElement.selectionStart || 0;
      const end = editorElement.selectionEnd || 0;
      const text = value.slice(start, end);
      return { start, end, text };
    }
    return { start: 0, end: 0, text: '' };
  }

  function setTextSelection(start: number, end: number): void {
    if (editorElement) {
      editorElement.setSelectionRange(start, end);
      editorElement.focus();
    }
  }

  function setCursorPosition(position: number): void {
    if (editorElement) {
      editorElement.setSelectionRange(position, position);
      editorElement.focus();
    }
  }

  function focusEditor(): void {
    if (editorElement) {
      editorElement.focus();
    }
  }

  function performUndo(): void {
    // Basic undo implementation - could be enhanced with proper history
    if (editorState.history.length > 0 && editorState.historyIndex > 0) {
      editorState.historyIndex--;
      const historyEntry = editorState.history[editorState.historyIndex];
      editorState.content = historyEntry.content;
      setCursorPosition(historyEntry.cursorPosition);
    }
  }

  function performRedo(): void {
    // Basic redo implementation - could be enhanced with proper history
    if (editorState.historyIndex < editorState.history.length - 1) {
      editorState.historyIndex++;
      const historyEntry = editorState.history[editorState.historyIndex];
      editorState.content = historyEntry.content;
      setCursorPosition(historyEntry.cursorPosition);
    }
  }

  // Error handling functions - error messages and recovery options
  function handleError(error: Error | EditorError, context?: Record<string, any>) {
    if (errorHandler) {
      const editorError = errorHandler.handleError(error, context);
      currentError = editorError;
      return editorError;
    }
    return null;
  }

  function dismissError() {
    currentError = null;
  }

  function retryLastOperation() {
    if (currentError && errorHandler) {
      const recoveryActions = errorHandler.getRecoveryActions(currentError);
      const retryAction = recoveryActions.find(action => action.label.toLowerCase().includes('retry'));
      if (retryAction) {
        retryAction.action();
      }
    }
  }

  // Loading state functions - loading state and feedback
  function _startLoading(message?: string) {
    if (loadingStateManager) {
      loadingStateManager.startLoading('editor', message);
    }
  }

  function _completeLoading(message?: string) {
    if (loadingStateManager) {
      loadingStateManager.completeLoading('editor', message);
    }
  }

  function _setLoadingError(error: string) {
    if (loadingStateManager) {
      loadingStateManager.setError('editor', error);
    }
  }

  // Conversion preview functions
  function showConversionPreview(targetMode: 'html' | 'markdown') {
    if (targetMode === editorState.mode || !editorState.content.trim()) {
      return;
    }

    try {
      const converter = createContentConverter();
      let result: ConversionResult;

      if (editorState.mode === 'markdown' && targetMode === 'html') {
        result = converter.markdownToHtml(editorState.content, {
          preserveWhitespace: true,
          preserveComments: true,
          enableFallback: true
        });
      } else if (editorState.mode === 'html' && targetMode === 'markdown') {
        result = converter.htmlToMarkdown(editorState.content, {
          preserveWhitespace: true,
          preserveComments: true,
          preserveUnknownTags: true,
          enableFallback: true
        });
      } else {
        return;
      }

      // Show preview with truncated content
      const maxPreviewLength = 200;
      let preview = result.content;
      if (preview.length > maxPreviewLength) {
        preview = preview.substring(0, maxPreviewLength) + '...';
      }

      conversionPreview = {
        show: true,
        targetMode,
        preview,
        warnings: result.warnings
      };

    } catch (error) {
      console.warn('Failed to generate conversion preview:', error);
    }
  }

  function hideConversionPreview() {
    conversionPreview = {
      show: false,
      targetMode: 'markdown',
      preview: '',
      warnings: []
    };
  }
</script>

<!-- Main editor layout with accessibility and responsive features -->
<div 
  bind:this={editorContainer}
  class="html-markdown-editor" 
  class:mobile={isMobileView}
  class:responsive={isResponsive}
  class:has-error={!!currentError}
  class:loading={loadingState.isLoading}
  data-theme={theme}
  style={Object.entries(cssProperties).map(([key, value]) => `${key}: ${value}`).join('; ')}
  role="application"
  aria-label={ariaLabel || `${editorState.mode} editor`}
  aria-describedby={ariaDescribedBy}
  onkeydown={handleKeyDown}
  {...createAriaAttributes({
    label: ariaLabel || `${editorState.mode} editor with ${showPreview ? 'preview' : 'no preview'}`,
    live: 'polite'
  })}
>
  <!-- Loading indicator -->
  {#if showLoadingStates && loadingState.isLoading}
    <div class="loading-overlay">
      <LoadingIndicator 
        state={loadingState}
        size={isMobileView ? 'small' : 'medium'}
        variant="spinner"
        showMessage={true}
      />
    </div>
  {/if}

  <!-- Error display -->
  {#if currentError}
    <ErrorDisplay 
      error={currentError}
      recoveryActions={errorHandler?.getRecoveryActions(currentError) || []}
      showDetails={showErrorDetails}
      compact={isMobileView}
      dismissible={true}
      onDismiss={dismissError}
      onRetry={retryLastOperation}
    />
  {/if}

  {#if showToolbar}
    <div class="toolbar-container">
      <div class="mode-toggle" role="group" aria-label="Editor mode selection">
        <button 
          type="button"
          class="mode-button"
          class:active={isMarkdownMode}
          onclick={() => switchMode('markdown')}
          disabled={readonly}
          aria-pressed={isMarkdownMode}
          aria-label="Switch to Markdown mode"
          title="Markdown mode (Alt+M)"
          onmouseenter={() => showConversionPreview('markdown')}
          onmouseleave={hideConversionPreview}
        >
          <span class="mode-icon">📝</span>
          <span class="mode-label">Markdown</span>
        </button>
        <button 
          type="button"
          class="mode-button"
          class:active={isHtmlMode}
          onclick={() => switchMode('html')}
          disabled={readonly}
          aria-pressed={isHtmlMode}
          aria-label="Switch to HTML mode"
          title="HTML mode (Alt+H)"
          onmouseenter={() => showConversionPreview('html')}
          onmouseleave={hideConversionPreview}
        >
          <span class="mode-icon">🏷️</span>
          <span class="mode-label">HTML</span>
        </button>
        
        {#if conversionPreview.show}
          <div class="conversion-preview" role="tooltip">
            <div class="preview-header">
              <span class="preview-title">Preview: {editorState.mode} → {conversionPreview.targetMode}</span>
              {#if conversionPreview.warnings.length > 0}
                <span class="preview-warnings" title={conversionPreview.warnings.join(', ')}>
                  ⚠️ {conversionPreview.warnings.length}
                </span>
              {/if}
            </div>
            <div class="preview-content">
              {conversionPreview.preview}
            </div>
          </div>
        {/if}
      </div>
      
      <EditorToolbar 
        mode={editorState.mode}
        disabled={readonly}
        customTools={[]}
        editorInstance={editorInstance}
        onFormatAction={handleFormatAction}
        onOpenSettings={toggleKeyboardSettings}
      />
      
      <div class="toolbar-actions">
        <button 
          type="button"
          onclick={toggleSnippetManager}
          title="Snippet Manager (Ctrl+Space)"
          aria-label="Open snippet manager"
        >
          📝
        </button>
      </div>
    </div>
  {/if}

  <div 
    class="editor-content" 
    class:with-preview={showPreview && !isMobileView}
    class:mobile-layout={isMobileView}
  >
    <div 
      class="editor-pane"
      role="group"
      aria-label="Code editor"
    >
      {#if useOptimizedEditor}
        <!-- Use virtualized editor for large documents or when performance mode is enabled -->
        <VirtualizedCodeEditor
          bind:this={editorElement}
          bind:value={editorState.content}
          mode={editorState.mode}
          {placeholder}
          {readonly}
          {enableVirtualScrolling}
          {performanceMode}
          {templates}
          {enableSlashCommands}
          theme={theme}
          aria-label={`${editorState.mode} code editor`}
          aria-describedby="editor-help"
          onInput={(newValue) => {
            try {
              if (performanceMonitor) {
                performanceMonitor.measureInputLatency('editor-input', () => {
                  editorState.content = newValue;
                });
              } else {
                editorState.content = newValue;
              }
            } catch (error) {
              handleError(error as Error, { context: 'editor-input' });
            }
          }}
          onfocus={() => {
            onfocus?.();
            if (accessibilityManager) {
              accessibilityManager.announce(`${editorState.mode} editor focused`);
            }
          }}
          onblur={() => {
            onblur?.();
          }}
        />
      {:else}
        <!-- Standard textarea for smaller documents -->
        <textarea
          bind:this={editorElement}
          bind:value={editorState.content}
          {placeholder}
          {readonly}
          class="code-editor"
          aria-label={`${editorState.mode} code editor`}
          aria-describedby="editor-help"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          onfocus={() => {
            onfocus?.();
            if (accessibilityManager) {
              accessibilityManager.announce(`${editorState.mode} editor focused`);
            }
          }}
          onblur={() => onblur?.()}
          oninput={(e) => {
            try {
              if (performanceMonitor) {
                performanceMonitor.measureInputLatency('textarea-input', () => {
                  const target = e.target as HTMLTextAreaElement;
                  editorState.content = target.value;
                });
              } else {
                const target = e.target as HTMLTextAreaElement;
                editorState.content = target.value;
              }
            } catch (error) {
              handleError(error as Error, { context: 'textarea-input' });
            }
          }}
        ></textarea>
      {/if}
      
      <!-- Screen reader help text -->
      <div id="editor-help" class="sr-only">
        Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+K for links. 
        Press Tab to navigate between editor elements.
        {#if enableSlashCommands}
          Type / to insert templates.
        {/if}
      </div>
    </div>

    {#if showPreview && (!isMobileView || responsiveConfig.showPreview)}
      <PreviewPane 
        content={editorState.content}
        mode={editorState.mode}
        {githubStyle}
        {debounceMs}
        sanitize={true}
        aria-label="Content preview"
        role="region"
      />
    {/if}
  </div>

  <!-- Mobile preview toggle -->
  {#if isMobileView && showPreview}
    <div class="mobile-preview-toggle">
      <button
        type="button"
        class="preview-toggle-button"
        onclick={() => {
          responsiveConfig = { ...responsiveConfig, showPreview: !responsiveConfig.showPreview };
        }}
        aria-pressed={responsiveConfig.showPreview}
        aria-label={responsiveConfig.showPreview ? 'Hide preview' : 'Show preview'}
      >
        {responsiveConfig.showPreview ? '📝 Edit' : '👁️ Preview'}
      </button>
    </div>
  {/if}

  <!-- Template Popup -->
  {#if enableSlashCommands}
    <TemplatePopup
      visible={editorState.showTemplatePopup}
      position={templatePopupPosition}
      templates={filteredTemplates}
      filter={editorState.templateFilter}
      onSelect={handleTemplateSelect}
      onClose={handleTemplateClose}
    />
  {/if}

  <!-- Snippet Manager -->
  {#if showSnippetManager}
    <div class="snippet-manager-overlay">
      <div class="snippet-manager-modal">
        <SnippetManager
          bind:snippets={activeSnippets}
          visible={showSnippetManager}
          onAdd={(snippet) => {
            activeSnippets = [...activeSnippets, snippet];
          }}
          onEdit={(id, snippet) => {
            activeSnippets = activeSnippets.map(s => s.id === id ? snippet : s);
          }}
          onDelete={(id) => {
            activeSnippets = activeSnippets.filter(s => s.id !== id);
          }}
          onDuplicate={(snippet) => {
            activeSnippets = [...activeSnippets, { ...snippet, id: crypto.randomUUID() }];
          }}
          onShortcutTrigger={handleSnippetTrigger}
          onSettingsChange={() => {}}
          onImport={(importedSnippets) => {
            activeSnippets = [...activeSnippets, ...importedSnippets];
          }}
          onExport={() => activeSnippets}
        />
        <button 
          class="close-snippet-manager"
          onclick={() => showSnippetManager = false}
          aria-label="Close snippet manager"
        >
          ✕
        </button>
      </div>
    </div>
  {/if}

  <!-- Keyboard Shortcut Settings -->
  {#if showKeyboardSettings && keyboardShortcutService}
    <div class="settings-overlay">
      <KeyboardShortcutSettings
        actions={keyboardShortcutService.getActions()}
        settings={keyboardShortcutService.getSettings()}
        conflicts={keyboardShortcutService.getConflicts()}
        onSettingsChange={handleKeyboardSettingsChange}
        onConflictResolve={handleConflictResolve}
        onAddSnippet={handleAddCustomSnippet}
        onRemoveSnippet={handleRemoveCustomSnippet}
        onClose={() => showKeyboardSettings = false}
      />
    </div>
  {/if}
</div>

<style>
  .html-markdown-editor {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid #e1e5e9;
    border-radius: 6px;
    overflow: hidden;
    background: white;
  }

  /* Loading overlay */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  /* Error state styling */
  .html-markdown-editor.has-error {
    border-color: #fecaca;
    box-shadow: 0 0 0 1px #fecaca;
  }

  .toolbar-container {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: #f6f8fa;
    border-bottom: 1px solid #e1e5e9;
    gap: 8px;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }

  .toolbar-actions button {
    padding: 6px 8px;
    border: 1px solid #d1d9e0;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    min-height: 32px;
    min-width: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .toolbar-actions button:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .toolbar-actions button:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .mode-toggle {
    display: flex;
    gap: 2px;
    background: #f1f3f4;
    border-radius: 6px;
    padding: 2px;
  }

  .mode-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    min-height: 32px; /* Accessibility: minimum touch target */
    min-width: 80px;
    color: #656d76;
  }

  .mode-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.7);
    color: #24292f;
  }

  .mode-button:focus {
    outline: 2px solid #0969da;
    outline-offset: 2px;
  }

  .mode-button.active {
    background: white;
    color: #24292f;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .mode-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .mode-icon {
    font-size: 14px;
  }

  .mode-label {
    font-weight: 500;
  }

  .conversion-preview {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #d1d9e0;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 12px;
    margin-top: 4px;
    z-index: 1000;
    max-width: 400px;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e1e5e9;
  }

  .preview-title {
    font-size: 11px;
    font-weight: 600;
    color: #656d76;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .preview-warnings {
    font-size: 12px;
    color: #d1242f;
    cursor: help;
  }

  .preview-content {
    font-size: 12px;
    color: #24292f;
    line-height: 1.4;
    max-height: 120px;
    overflow: hidden;
    white-space: pre-wrap;
    word-break: break-word;
    background: #f6f8fa;
    padding: 8px;
    border-radius: 4px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  }

  .loading-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mode-toggle button:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .mode-toggle button:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .mode-toggle button.active {
    background: #0969da;
    color: white;
    border-color: #0969da;
  }

  .mode-toggle button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .editor-content {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .editor-content.with-preview .editor-pane {
    border-right: 1px solid #e1e5e9;
  }

  .editor-content.mobile-layout {
    flex-direction: column;
  }

  .editor-content.mobile-layout .editor-pane {
    border-right: none;
    border-bottom: 1px solid #e1e5e9;
  }

  .editor-pane {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .code-editor {
    flex: 1;
    border: none;
    outline: none;
    padding: 12px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    resize: none;
    background: transparent;
    color: inherit;
  }

  .code-editor:focus {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }

  /* Screen reader only content */
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  /* Mobile preview toggle */
  .mobile-preview-toggle {
    display: none;
    padding: 8px 12px;
    background: #f6f8fa;
    border-top: 1px solid #e1e5e9;
  }

  .preview-toggle-button {
    width: 100%;
    padding: 8px 16px;
    border: 1px solid #d1d9e0;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    min-height: 44px; /* Touch-friendly */
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .preview-toggle-button:hover {
    background: #f3f4f6;
  }

  .preview-toggle-button:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Snippet Manager Overlay */
  .snippet-manager-overlay {
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

  .snippet-manager-modal {
    position: relative;
    background: white;
    border-radius: 8px;
    width: 90vw;
    max-width: 800px;
    height: 80vh;
    max-height: 600px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .close-snippet-manager {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border: none;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    z-index: 1001;
  }

  .close-snippet-manager:hover {
    background: rgba(0, 0, 0, 0.2);
  }

  .close-snippet-manager:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  /* Mobile responsive styles */
  .html-markdown-editor.mobile {
    border-radius: 0;
    height: 100vh;
  }

  .html-markdown-editor.mobile .mobile-preview-toggle {
    display: block;
  }

  .html-markdown-editor.mobile .editor-toolbar {
    padding: 12px;
  }

  .html-markdown-editor.mobile .mode-toggle button {
    min-height: 44px;
    min-width: 80px;
    font-size: 14px;
    padding: 8px 16px;
  }

  .html-markdown-editor.mobile .code-editor {
    padding: 16px;
    font-size: 16px; /* Prevent zoom on iOS */
    line-height: 1.4;
  }

  /* Responsive breakpoints */
  @media (max-width: 768px) {
    .html-markdown-editor:not(.mobile) {
      border-radius: 4px;
    }

    .editor-content.with-preview {
      flex-direction: column;
    }

    .editor-content.with-preview .editor-pane {
      border-right: none;
      border-bottom: 1px solid #e1e5e9;
    }

    .mode-toggle button {
      min-height: 40px;
      min-width: 70px;
      font-size: 13px;
    }
  }

  @media (max-width: 480px) {
    .editor-toolbar {
      padding: 8px;
    }

    .mode-toggle {
      flex: 1;
    }

    .mode-toggle button {
      flex: 1;
      min-width: 0;
    }

    .code-editor {
      padding: 12px 8px;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .html-markdown-editor {
      border-width: 2px;
    }

    .mode-toggle button:focus {
      outline-width: 3px;
    }

    .code-editor:focus {
      outline-width: 3px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .mode-toggle button {
      transition: none;
    }

    .loading-overlay {
      animation: none;
    }
  }

  /* Theme support */
  .html-markdown-editor[data-theme="dark"] {
    background: #0d1117;
    border-color: #30363d;
    color: #f0f6fc;
  }

  .html-markdown-editor[data-theme="dark"] .loading-overlay {
    background: rgba(13, 17, 23, 0.9);
  }

  .html-markdown-editor[data-theme="dark"].has-error {
    border-color: #7f1d1d;
    box-shadow: 0 0 0 1px #7f1d1d;
  }

  .html-markdown-editor[data-theme="dark"] .toolbar-container {
    background: #161b22;
    border-color: #30363d;
  }

  .html-markdown-editor[data-theme="dark"] .toolbar-actions button {
    background: #21262d;
    border-color: #30363d;
    color: #f0f6fc;
  }

  .html-markdown-editor[data-theme="dark"] .toolbar-actions button:hover:not(:disabled) {
    background: #30363d;
    border-color: #484f58;
  }

  .html-markdown-editor[data-theme="dark"] .snippet-manager-modal {
    background: #0d1117;
  }

  .html-markdown-editor[data-theme="dark"] .close-snippet-manager {
    background: rgba(255, 255, 255, 0.1);
    color: #f0f6fc;
  }

  .html-markdown-editor[data-theme="dark"] .close-snippet-manager:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .html-markdown-editor[data-theme="dark"] .mobile-preview-toggle {
    background: #161b22;
    border-color: #30363d;
  }

  .html-markdown-editor[data-theme="dark"] .mode-toggle button {
    background: #21262d;
    border-color: #30363d;
    color: #f0f6fc;
  }

  .html-markdown-editor[data-theme="dark"] .mode-toggle button:hover:not(:disabled) {
    background: #30363d;
    border-color: #484f58;
  }

  .html-markdown-editor[data-theme="dark"] .mode-toggle button.active {
    background: #1f6feb;
    border-color: #1f6feb;
  }

  .html-markdown-editor[data-theme="dark"] .preview-toggle-button {
    background: #21262d;
    border-color: #30363d;
    color: #f0f6fc;
  }

  .html-markdown-editor[data-theme="dark"] .preview-toggle-button:hover {
    background: #30363d;
  }

  .html-markdown-editor[data-theme="dark"] .code-editor {
    background: #0d1117;
    color: #f0f6fc;
  }

  .html-markdown-editor[data-theme="dark"] :global(.preview-pane) {
    background: #0d1117;
    border-color: #30363d;
  }

  /* Auto theme support */
  @media (prefers-color-scheme: dark) {
    .html-markdown-editor[data-theme="auto"] {
      background: #0d1117;
      border-color: #30363d;
      color: #f0f6fc;
    }

    .html-markdown-editor[data-theme="auto"] .loading-overlay {
      background: rgba(13, 17, 23, 0.9);
    }

    .html-markdown-editor[data-theme="auto"].has-error {
      border-color: #7f1d1d;
      box-shadow: 0 0 0 1px #7f1d1d;
    }

    .html-markdown-editor[data-theme="auto"] .toolbar-container {
      background: #161b22;
      border-color: #30363d;
    }

    .html-markdown-editor[data-theme="auto"] .toolbar-actions button {
      background: #21262d;
      border-color: #30363d;
      color: #f0f6fc;
    }

    .html-markdown-editor[data-theme="auto"] .toolbar-actions button:hover:not(:disabled) {
      background: #30363d;
      border-color: #484f58;
    }

    .html-markdown-editor[data-theme="auto"] .snippet-manager-modal {
      background: #0d1117;
    }

    .html-markdown-editor[data-theme="auto"] .close-snippet-manager {
      background: rgba(255, 255, 255, 0.1);
      color: #f0f6fc;
    }

    .html-markdown-editor[data-theme="auto"] .close-snippet-manager:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .html-markdown-editor[data-theme="auto"] .mobile-preview-toggle {
      background: #161b22;
      border-color: #30363d;
    }

    .html-markdown-editor[data-theme="auto"] .mode-toggle button {
      background: #21262d;
      border-color: #30363d;
      color: #f0f6fc;
    }

    .html-markdown-editor[data-theme="auto"] .mode-toggle button:hover:not(:disabled) {
      background: #30363d;
      border-color: #484f58;
    }

    .html-markdown-editor[data-theme="auto"] .mode-toggle button.active {
      background: #1f6feb;
      border-color: #1f6feb;
    }

    .html-markdown-editor[data-theme="auto"] .preview-toggle-button {
      background: #21262d;
      border-color: #30363d;
      color: #f0f6fc;
    }

    .html-markdown-editor[data-theme="auto"] .preview-toggle-button:hover {
      background: #30363d;
    }

    .html-markdown-editor[data-theme="auto"] .code-editor {
      background: #0d1117;
      color: #f0f6fc;
    }

    .html-markdown-editor[data-theme="auto"] :global(.preview-pane) {
      background: #0d1117;
      border-color: #30363d;
    }
  }

  /* Settings overlay styles */
  .settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(2px);
  }

  /* Dark theme settings overlay */
  .html-markdown-editor[data-theme="dark"] .settings-overlay {
    background: rgba(13, 17, 23, 0.8);
  }

  @media (prefers-color-scheme: dark) {
    .html-markdown-editor[data-theme="auto"] .settings-overlay {
      background: rgba(13, 17, 23, 0.8);
    }
  }
</style>