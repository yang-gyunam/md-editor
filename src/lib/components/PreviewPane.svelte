<script lang="ts">
  import type { PreviewProps } from '../types/index.js';
  import { createMarkdownProcessor, validateMarkdown } from '../utils/markdown.js';
  import { createHtmlProcessor, validateHtml } from '../utils/html.js';
  import { createPreviewUpdateManager } from '../utils/preview.js';
  
  const {
    content,
    mode,
    sanitize = true,
    githubStyle = true,
    debounceMs = 300
  }: PreviewProps = $props();

  // Create processors
  const markdownProcessor = createMarkdownProcessor();
  const htmlProcessor = createHtmlProcessor();

  // State for processed content and loading
  let processedContent = $state('');
  let isProcessing = $state(false);

  // Create preview update manager with memoization
  const previewManager = createPreviewUpdateManager(
    (content: string, mode: 'html' | 'markdown') => {
      try {
        if (mode === 'markdown') {
          // Convert markdown to HTML
          const html = markdownProcessor.toHtml(content);
          // Sanitize if requested
          return sanitize ? markdownProcessor.sanitize(html) : html;
        } else {
          // HTML mode - sanitize if requested
          return sanitize ? htmlProcessor.sanitize(content) : content;
        }
      } catch (error) {
        console.error('Content processing error:', error);
        return `<div class="processing-error">Error processing content: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
      }
    },
    {
      debounceMs,
      enableMemoization: true,
      maxCacheSize: 50
    }
  );

  let hasError = $state(false);
  let errorMessage = $state('');
  let errorDetails = $state<string[]>([]);

  // Enhanced error detection with debouncing
  $effect(() => {
    try {
      if (mode === 'html') {
        const validation = validateHtml(content);
        hasError = !validation.valid;
        if (hasError) {
          errorMessage = 'HTML validation errors detected';
          errorDetails = validation.errors.map(err => err.message);
        } else {
          errorMessage = '';
          errorDetails = [];
        }
      } else {
        const validation = validateMarkdown(content);
        hasError = !validation.valid;
        if (hasError) {
          errorMessage = 'Markdown parsing errors detected';
          errorDetails = validation.errors.map(err => err.message);
        } else {
          errorMessage = '';
          errorDetails = [];
        }
      }
    } catch (error) {
      hasError = true;
      errorMessage = 'Preview rendering error';
      errorDetails = [error instanceof Error ? error.message : 'Unknown error'];
    }
  });

  // Debounced content processing
  $effect(() => {
    isProcessing = true;
    
    previewManager.updatePreview(content, mode, (result) => {
      processedContent = result;
      isProcessing = false;
    });
  });
</script>

<div class="preview-pane" class:github-style={githubStyle}>
  {#if hasError}
    <div class="error-indicator">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <div class="error-message">{errorMessage}</div>
        {#if errorDetails.length > 0}
          <div class="error-details">
            {#each errorDetails as detail}
              <div class="error-detail">• {detail}</div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if isProcessing}
    <div class="processing-indicator">
      <div class="processing-spinner"></div>
      <span>Processing...</span>
    </div>
  {/if}

  <div class="preview-content" class:has-error={hasError} class:is-processing={isProcessing}>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html processedContent}
  </div>
</div>

<style>
  .preview-pane {
    height: 100%;
    overflow-y: auto;
    background: white;
    border-left: 1px solid #e1e5e9;
  }

  .preview-content {
    padding: 16px;
    min-height: 100%;
  }

  .preview-content.has-error {
    opacity: 0.7;
  }

  .error-indicator {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 16px;
    background: #fff3cd;
    border-bottom: 1px solid #ffeaa7;
    color: #856404;
    font-size: 14px;
  }

  .error-icon {
    font-size: 16px;
    margin-top: 2px;
    flex-shrink: 0;
  }

  .error-content {
    flex: 1;
  }

  .error-message {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .error-details {
    font-size: 13px;
    opacity: 0.9;
  }

  .error-detail {
    margin: 2px 0;
  }

  .preview-content :global(.processing-error) {
    padding: 16px;
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    margin: 16px;
  }

  .processing-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #e7f3ff;
    border-bottom: 1px solid #b6d7ff;
    color: #0969da;
    font-size: 14px;
  }

  .processing-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #b6d7ff;
    border-top: 2px solid #0969da;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .preview-content.is-processing {
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  /* GitHub-style preview */
  .preview-pane.github-style .preview-content {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: #1f2328;
  }

  .preview-pane.github-style .preview-content :global(h1) {
    font-size: 2em;
    font-weight: 600;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #d1d9e0;
    margin-bottom: 16px;
  }

  .preview-pane.github-style .preview-content :global(h2) {
    font-size: 1.5em;
    font-weight: 600;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #d1d9e0;
    margin-bottom: 16px;
  }

  .preview-pane.github-style .preview-content :global(h3) {
    font-size: 1.25em;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .preview-pane.github-style .preview-content :global(p) {
    margin-bottom: 16px;
  }

  .preview-pane.github-style .preview-content :global(strong) {
    font-weight: 600;
  }

  .preview-pane.github-style .preview-content :global(code) {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: #f6f8fa;
    border-radius: 6px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  }

  .preview-pane.github-style .preview-content :global(pre) {
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 6px;
    margin-bottom: 16px;
  }

  .preview-pane.github-style .preview-content :global(pre code) {
    padding: 0;
    margin: 0;
    background: transparent;
    border-radius: 0;
  }

  .preview-pane.github-style .preview-content :global(blockquote) {
    padding: 0 1em;
    color: #656d76;
    border-left: 0.25em solid #d1d9e0;
    margin-bottom: 16px;
  }

  .preview-pane.github-style .preview-content :global(ul),
  .preview-pane.github-style .preview-content :global(ol) {
    padding-left: 2em;
    margin-bottom: 16px;
  }

  .preview-pane.github-style .preview-content :global(li) {
    margin-bottom: 0.25em;
  }

  .preview-pane.github-style .preview-content :global(table) {
    border-spacing: 0;
    border-collapse: collapse;
    margin-bottom: 16px;
    width: 100%;
  }

  .preview-pane.github-style .preview-content :global(table th),
  .preview-pane.github-style .preview-content :global(table td) {
    padding: 6px 13px;
    border: 1px solid #d1d9e0;
  }

  .preview-pane.github-style .preview-content :global(table th) {
    font-weight: 600;
    background-color: #f6f8fa;
  }

  .preview-pane.github-style .preview-content :global(a) {
    color: #0969da;
    text-decoration: none;
  }

  .preview-pane.github-style .preview-content :global(a:hover) {
    text-decoration: underline;
  }

  .preview-pane.github-style .preview-content :global(img) {
    max-width: 100%;
    height: auto;
  }
</style>