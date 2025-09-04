<script lang="ts">
  import { createMarkdownProcessor } from '../utils/markdown.js';
  import { createHtmlProcessor } from '../utils/html.js';
  
  interface Props {
    value?: string;
    mode?: 'html' | 'markdown';
    showPreview?: boolean;
    showToolbar?: boolean;
    placeholder?: string;
  }

  let {
    value = $bindable(''),
    mode = $bindable('markdown'),
    showPreview = true,
    showToolbar = true,
    placeholder = 'Start typing...'
  }: Props = $props();

  let markdownProcessor = createMarkdownProcessor();
  let htmlProcessor = createHtmlProcessor();
  
  // Generate preview
  const preview = $derived(() => {
    if (!value) return '';
    
    try {
      if (mode === 'markdown') {
        return markdownProcessor.toHtml(value);
      } else {
        // For HTML mode, just sanitize
        return markdownProcessor.sanitize(value);
      }
    } catch (e) {
      console.error('Preview error:', e);
      return '<p>Error generating preview</p>';
    }
  });

  function handleBold() {
    if (mode === 'markdown') {
      value = value + '\n**bold text**';
    } else {
      value = value + '\n<strong>bold text</strong>';
    }
  }

  function handleItalic() {
    if (mode === 'markdown') {
      value = value + '\n*italic text*';
    } else {
      value = value + '\n<em>italic text</em>';
    }
  }
</script>

<div class="simple-editor">
  {#if showToolbar}
    <div class="toolbar">
      <button onclick={handleBold}>Bold</button>
      <button onclick={handleItalic}>Italic</button>
      <button onclick={() => mode = mode === 'markdown' ? 'html' : 'markdown'}>
        Mode: {mode.toUpperCase()}
      </button>
    </div>
  {/if}
  
  <div class="editor-container">
    <div class="editor-pane">
      <textarea
        bind:value
        {placeholder}
        class="editor-textarea"
      />
    </div>
    
    {#if showPreview}
      <div class="preview-pane">
        <div class="preview-content">
          {@html preview()}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .simple-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid #d1d9e0;
    border-radius: 8px;
    overflow: hidden;
  }

  .toolbar {
    display: flex;
    gap: 8px;
    padding: 8px;
    background: #f6f8fa;
    border-bottom: 1px solid #d1d9e0;
  }

  .toolbar button {
    padding: 4px 12px;
    background: white;
    border: 1px solid #d1d9e0;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .toolbar button:hover {
    background: #f3f4f6;
  }

  .editor-container {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .editor-pane,
  .preview-pane {
    flex: 1;
    overflow: auto;
  }

  .editor-textarea {
    width: 100%;
    height: 100%;
    padding: 16px;
    border: none;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 14px;
    resize: none;
    outline: none;
  }

  .preview-pane {
    border-left: 1px solid #d1d9e0;
    background: white;
  }

  .preview-content {
    padding: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  /* Basic markdown styles for preview */
  .preview-content :global(h1) {
    font-size: 2em;
    margin: 0.67em 0;
    font-weight: 600;
  }

  .preview-content :global(h2) {
    font-size: 1.5em;
    margin: 0.75em 0;
    font-weight: 600;
  }

  .preview-content :global(h3) {
    font-size: 1.25em;
    margin: 1em 0;
    font-weight: 600;
  }

  .preview-content :global(p) {
    margin: 1em 0;
  }

  .preview-content :global(ul),
  .preview-content :global(ol) {
    margin: 1em 0;
    padding-left: 2em;
  }

  .preview-content :global(code) {
    background: #f6f8fa;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 85%;
  }

  .preview-content :global(pre) {
    background: #f6f8fa;
    padding: 16px;
    border-radius: 6px;
    overflow: auto;
  }

  .preview-content :global(blockquote) {
    border-left: 4px solid #d1d9e0;
    margin: 0;
    padding-left: 16px;
    color: #656d76;
  }
</style>