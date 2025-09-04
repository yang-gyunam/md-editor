<script>
  import { HtmlMarkdownEditor } from '../src/lib/components/index.js';
  
  // Basic editor state
  let content = $state(`# Welcome to HTML Markdown Editor

This is a **basic usage example** of the HTML Markdown Editor component.

## Features Demonstrated

- Dual-mode editing (HTML/Markdown)
- Real-time preview
- Basic toolbar functionality
- Responsive design

## Try It Out

1. Switch between HTML and Markdown modes using the toggle buttons
2. Type some content and see the live preview
3. Use keyboard shortcuts like \`Ctrl+B\` for bold text

> **Tip**: This editor supports GitHub Flavored Markdown!

\`\`\`javascript
// Example code block
function hello() {
  console.log('Hello from the editor!');
}
\`\`\`

| Feature | Status |
|---------|--------|
| Markdown | ✅ |
| HTML | ✅ |
| Preview | ✅ |
| Responsive | ✅ |

- [x] Completed features
- [ ] Future enhancements

Happy editing! 🎉`);

  let mode = $state('markdown');
  
  // Event handlers
  function handleContentChange(newContent) {
    console.log('Content changed:', newContent.length, 'characters');
  }
  
  function handleModeChange(newMode) {
    console.log('Mode changed to:', newMode);
  }
</script>

<div class="example-container">
  <h1>Basic HTML Markdown Editor Example</h1>
  
  <div class="editor-wrapper">
    <HtmlMarkdownEditor
      bind:value={content}
      bind:mode={mode}
      showPreview={true}
      showToolbar={true}
      theme="auto"
      placeholder="Start typing your content here..."
      onchange={handleContentChange}
      onmodechange={handleModeChange}
    />
  </div>
  
  <div class="info-panel">
    <h3>Current State</h3>
    <p><strong>Mode:</strong> {mode}</p>
    <p><strong>Content Length:</strong> {content.length} characters</p>
    <p><strong>Lines:</strong> {content.split('\n').length}</p>
  </div>
</div>

<style>
  .example-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  }
  
  h1 {
    text-align: center;
    color: #24292f;
    margin-bottom: 2rem;
  }
  
  .editor-wrapper {
    height: 500px;
    margin-bottom: 2rem;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .info-panel {
    background: #f6f8fa;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #e1e5e9;
  }
  
  .info-panel h3 {
    margin: 0 0 0.5rem 0;
    color: #24292f;
  }
  
  .info-panel p {
    margin: 0.25rem 0;
    font-size: 0.875rem;
  }
  
  @media (prefers-color-scheme: dark) {
    h1 {
      color: #f0f6fc;
    }
    
    .info-panel {
      background: #161b22;
      border-color: #30363d;
    }
    
    .info-panel h3 {
      color: #f0f6fc;
    }
  }
</style>