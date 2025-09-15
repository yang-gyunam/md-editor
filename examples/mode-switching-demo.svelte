<!-- Mode Switching Demo -->
<script>
  import { HtmlMarkdownEditor } from '../src/lib/index.js';
  
  let value = $state(`# Hello World

This is a **demo** of the mode switching functionality.

- Feature 1: HTML to Markdown conversion
- Feature 2: Markdown to HTML conversion  
- Feature 3: Content preservation during mode switches

> The editor automatically converts content when switching between modes!

[Learn more](https://example.com)`);
  
  let mode = $state('markdown');
  
  function handleModeChange(newMode) {
    mode = newMode;
    console.log('Mode changed to:', newMode);
  }
  
  function handleChange(newValue) {
    value = newValue;
    console.log('Content changed:', newValue.length, 'characters');
  }
</script>

<div class="demo-container">
  <h1>Mode Switching Demo</h1>
  
  <div class="demo-info">
    <p>Current mode: <strong>{mode}</strong></p>
    <p>Content length: <strong>{value.length}</strong> characters</p>
  </div>
  
  <div class="editor-container">
    <HtmlMarkdownEditor
      bind:value={value}
      bind:mode={mode}
      showPreview={true}
      showToolbar={true}
      placeholder="Start typing..."
      onmodechange={handleModeChange}
      onchange={handleChange}
      githubStyle={true}
      enableSlashCommands={true}
    />
  </div>
  
  <div class="demo-instructions">
    <h3>Try these features:</h3>
    <ul>
      <li>Switch between HTML and Markdown modes using the toggle buttons</li>
      <li>Notice how content is automatically converted</li>
      <li>Hover over mode buttons to see conversion preview</li>
      <li>Use keyboard shortcuts: Alt+M (Markdown), Alt+H (HTML)</li>
    </ul>
  </div>
</div>

<style>
  .demo-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .demo-info {
    background: #f6f8fa;
    padding: 16px;
    border-radius: 6px;
    margin-bottom: 20px;
    display: flex;
    gap: 20px;
  }
  
  .demo-info p {
    margin: 0;
    color: #24292f;
  }
  
  .editor-container {
    height: 500px;
    border: 1px solid #d1d9e0;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 20px;
  }
  
  .demo-instructions {
    background: #fff8dc;
    padding: 16px;
    border-radius: 6px;
    border-left: 4px solid #ffd700;
  }
  
  .demo-instructions h3 {
    margin-top: 0;
    color: #24292f;
  }
  
  .demo-instructions ul {
    margin-bottom: 0;
  }
  
  .demo-instructions li {
    margin-bottom: 8px;
    color: #656d76;
  }
</style>