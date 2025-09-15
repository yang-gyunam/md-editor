<script lang="ts">
  // Use the simplified editor component
  import SimpleEditor from './lib/components/SimpleEditor.svelte';
  
  let editorValue = $state('# Welcome to HTML Markdown Editor\n\nThis is a **dual-mode** editor that supports both *HTML* and *Markdown* editing.\n\n## Features\n\n- Real-time preview\n- Syntax highlighting\n- Template system\n- Snippet management\n- GitHub Flavored Markdown support\n\n## Try it out!\n\nStart typing in the editor on the left and see the preview on the right.\n\n### Markdown Examples\n\n**Bold text**, *italic text*, and `inline code`.\n\n> This is a blockquote\n\n```javascript\nfunction hello() {\n  console.log("Hello, World!");\n}\n```\n\n1. First item\n2. Second item\n3. Third item');
  
  let editorMode = $state<'html' | 'markdown'>('markdown');
</script>

<main>
  <div class="demo-container">
    <h1>HTML Markdown Editor</h1>
    <p>A powerful dual-mode editor built with Svelte 5</p>
    
    <div class="editor-wrapper">
      <SimpleEditor
        bind:value={editorValue}
        bind:mode={editorMode}
        showPreview={true}
        showToolbar={true}
        placeholder="Start typing..."
      />
    </div>

    <div class="demo-info">
      <h2>Current State</h2>
      <p><strong>Mode:</strong> {editorMode}</p>
      <p><strong>Content Length:</strong> {editorValue.length} characters</p>
    </div>
  </div>
</main>

<style>
  main {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
  }

  .demo-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2328;
    margin: 0;
  }

  .demo-container > p {
    font-size: 1.2rem;
    color: #656d76;
    margin: 0;
  }

  .editor-wrapper {
    height: 500px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .demo-info {
    padding: 16px;
    background: #f6f8fa;
    border-radius: 8px;
    border: 1px solid #d1d9e0;
  }

  .demo-info h2 {
    margin: 0 0 12px 0;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .demo-info p {
    margin: 4px 0;
    font-size: 14px;
    color: #656d76;
  }
</style>