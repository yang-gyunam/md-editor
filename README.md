# HTML Markdown Editor

A powerful dual-mode editor built with Svelte 5 that seamlessly switches between HTML and Markdown editing modes with real-time preview capabilities.

![HTML Markdown Editor Demo](https://via.placeholder.com/800x400/0969da/ffffff?text=HTML+Markdown+Editor)

## ✨ Features

- 🔄 **Dual-mode editing**: Switch between HTML and Markdown seamlessly
- 👁️ **Real-time preview**: Live preview with GitHub-flavored styling
- 📝 **Template system**: Quick content insertion with slash commands (`/`)
- ⚡ **Snippet management**: Custom keyboard shortcuts for frequent content
- 🎨 **Theming**: Light, dark, and auto themes
- ♿ **Accessibility**: Full keyboard navigation and screen reader support
- 📱 **Responsive**: Optimized for mobile and touch devices
- 🚀 **Performance**: Virtual scrolling for large documents
- 🛡️ **Security**: Built-in HTML sanitization
- 🎯 **GitHub Flavored Markdown**: Complete GFM support

## 🚀 Quick Start

### Installation

```bash
npm install svelte5-html-md-editor
```

### Basic Usage

```svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  let content = $state('# Hello World\n\nThis is **markdown** content.');
  let mode = $state('markdown');
</script>

<HtmlMarkdownEditor
  bind:value={content}
  bind:mode={mode}
  showPreview={true}
  showToolbar={true}
/>
```

> 📖 **New to the editor?** Check out our [Quick Start Guide](./QUICK_START.md) for a faster setup experience!

## 📖 Examples

### 1. Basic Editor

The simplest setup with default configuration:

```svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  let content = $state('');
</script>

<HtmlMarkdownEditor bind:value={content} />
```

### 2. Custom Templates

Add your own templates for quick content insertion:

```svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  let content = $state('');

  const templates = [
    {
      id: 'blog-post',
      name: 'Blog Post',
      description: 'Standard blog post template',
      category: 'Content',
      content: `# {{title}}

*Published on {{date}} by {{author}}*

{{content}}

## Conclusion

{{conclusion}}`,
      variables: [
        { name: 'title', placeholder: 'Post Title' },
        { name: 'date', defaultValue: new Date().toLocaleDateString() },
        { name: 'author', placeholder: 'Author Name' },
        { name: 'content', placeholder: 'Main content here...' },
        { name: 'conclusion', placeholder: 'Wrap up your thoughts...' }
      ]
    }
  ];
</script>

<HtmlMarkdownEditor
  bind:value={content}
  {templates}
  enableSlashCommands={true}
/>
```

### 3. Custom Snippets

Define keyboard shortcuts for frequently used content:

````svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  let content = $state('');

  const snippets = [
    {
      id: 'code-block',
      name: 'Code Block',
      shortcut: 'Ctrl+Shift+C',
      content: '```{{language}}\n{{code}}\n```',
      variables: [
        { name: 'language', defaultValue: 'javascript' },
        { name: 'code', placeholder: 'Your code here...' }
      ],
      category: 'Code'
    },
    {
      id: 'link',
      name: 'Link',
      shortcut: 'Ctrl+K',
      content: '[{{text}}]({{url}})',
      variables: [
        { name: 'text', placeholder: 'link text' },
        { name: 'url', placeholder: 'https://example.com' }
      ],
      category: 'Formatting'
    }
  ];
</script>

<HtmlMarkdownEditor
  bind:value={content}
  {snippets}
/>
````

### 4. Event Handling

Handle editor events for integration with your application:

```svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  let content = $state('');
  let mode = $state('markdown');

  function handleContentChange(newContent) {
    console.log('Content changed:', newContent.length, 'characters');
    // Auto-save logic here
  }

  function handleModeChange(newMode) {
    console.log('Mode changed to:', newMode);
    // Update UI or save preferences
  }

  function handleTemplateInsert(template) {
    console.log('Template inserted:', template.name);
    // Analytics or usage tracking
  }

  function handleError(error) {
    console.error('Editor error:', error);
    // Show user-friendly error message
  }
</script>

<HtmlMarkdownEditor
  bind:value={content}
  bind:mode={mode}
  onchange={handleContentChange}
  onmodechange={handleModeChange}
  ontemplateinsert={handleTemplateInsert}
  onerror={handleError}
/>
```

### 5. Performance Optimization

Configure the editor for large documents:

```svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  let content = $state('');

  function handlePerformanceUpdate(metrics) {
    if (metrics.renderTime > 500) {
      console.warn('Slow rendering detected:', metrics);
    }

    if (metrics.isLargeDocument) {
      console.info('Large document mode active');
    }
  }
</script>

<HtmlMarkdownEditor
  bind:value={content}
  enableVirtualScrolling={true}
  performanceMode="auto"
  enablePerformanceMonitoring={true}
  onperformanceupdate={handlePerformanceUpdate}
/>
```

### 6. Accessibility Configuration

Ensure full accessibility support:

```svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  let content = $state('');
</script>

<HtmlMarkdownEditor
  bind:value={content}
  enableAccessibility={true}
  enableKeyboardNavigation={true}
  enableScreenReaderSupport={true}
  ariaLabel="Document editor with live preview"
  ariaDescribedBy="editor-help"
/>

<div id="editor-help" class="sr-only">
  Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+K for links.
  Type / to insert templates.
</div>
```

### 7. Responsive Design

Optimize for mobile and touch devices:

```svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  let content = $state('');
</script>

<HtmlMarkdownEditor
  bind:value={content}
  enableResponsiveDesign={true}
  enableMobileOptimizations={true}
  enableTouchOptimizations={true}
/>
```

### 8. Custom Styling

Apply custom themes and styling:

```svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  let content = $state('');
  let theme = $state('dark');
</script>

<HtmlMarkdownEditor
  bind:value={content}
  {theme}
/>

<style>
  :global(.html-markdown-editor) {
    --bg-color: #1a1a1a;
    --text-primary: #ffffff;
    --border-color: #333333;
    /* Custom theme variables */
  }
</style>
```

## 🎯 Advanced Usage

### Integration with Vite/Webpack Projects

```javascript
// vite.config.js or webpack.config.js
import { HtmlMarkdownEditor } from 'html-markdown-editor';

// In your component
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  let content = $state('');
  let mode = $state('markdown');

  // Auto-save functionality
  let saveTimeout;
  function autoSave(newContent) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      await fetch('/api/documents/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent, mode })
      });
    }, 1000);
  }

  // Load document on mount
  $effect(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const documentId = urlParams.get('id');
    if (documentId) {
      const response = await fetch(`/api/documents/${documentId}`);
      const document = await response.json();
      content = document.content;
      mode = document.mode;
    }
  });
</script>

<HtmlMarkdownEditor
  bind:value={content}
  bind:mode={mode}
  onchange={autoSave}
  enableSlashCommands={true}
  githubStyle={true}
/>
```

### Custom Toolbar Integration

```svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  let content = $state('');
  let editorRef;

  const customTools = [
    {
      id: 'word-count',
      label: 'Word Count',
      icon: '🔢',
      action: (editor) => {
        const words = editor.getContent().split(/\s+/).length;
        alert(`Word count: ${words}`);
      }
    },
    {
      id: 'insert-date',
      label: 'Insert Date',
      icon: '📅',
      shortcut: 'Ctrl+Shift+D',
      action: (editor) => {
        const date = new Date().toLocaleDateString();
        editor.insertText(date);
      }
    }
  ];
</script>

<HtmlMarkdownEditor
  bind:this={editorRef}
  bind:value={content}
  customTools={customTools}
/>
```

## 🎮 Keyboard Shortcuts

| Shortcut           | Action                 | Mode |
| ------------------ | ---------------------- | ---- |
| `Ctrl+B` / `Cmd+B` | Bold formatting        | Both |
| `Ctrl+I` / `Cmd+I` | Italic formatting      | Both |
| `Ctrl+K` / `Cmd+K` | Insert link            | Both |
| `Ctrl+Z` / `Cmd+Z` | Undo                   | Both |
| `Ctrl+Y` / `Cmd+Y` | Redo                   | Both |
| `Ctrl+Space`       | Open snippet manager   | Both |
| `Tab`              | Navigate elements      | Both |
| `Escape`           | Close popups           | Both |
| `/`                | Trigger template popup | Both |

## 🔧 Configuration

### Props

| Prop                  | Type                          | Default      | Description                 |
| --------------------- | ----------------------------- | ------------ | --------------------------- |
| `value`               | `string`                      | `''`         | Editor content (bindable)   |
| `mode`                | `'html' \| 'markdown'`        | `'markdown'` | Editor mode (bindable)      |
| `showPreview`         | `boolean`                     | `true`       | Show preview pane           |
| `showToolbar`         | `boolean`                     | `true`       | Show formatting toolbar     |
| `theme`               | `'light' \| 'dark' \| 'auto'` | `'auto'`     | Color theme                 |
| `templates`           | `Template[]`                  | `[]`         | Available templates         |
| `snippets`            | `Snippet[]`                   | `[]`         | Available snippets          |
| `enableSlashCommands` | `boolean`                     | `true`       | Enable `/` template trigger |
| `githubStyle`         | `boolean`                     | `true`       | Use GitHub-flavored styling |

### Events

| Event              | Payload                                | Description       |
| ------------------ | -------------------------------------- | ----------------- |
| `onchange`         | `(value: string) => void`              | Content changed   |
| `onmodechange`     | `(mode: 'html' \| 'markdown') => void` | Mode changed      |
| `ontemplateinsert` | `(template: Template) => void`         | Template inserted |
| `onsnippetinsert`  | `(snippet: Snippet) => void`           | Snippet inserted  |
| `onerror`          | `(error: EditorError) => void`         | Error occurred    |

## 🎨 Theming

The editor supports extensive theming through CSS custom properties:

```css
.html-markdown-editor {
  --bg-color: #ffffff;
  --bg-secondary: #f6f8fa;
  --text-primary: #24292f;
  --text-secondary: #656d76;
  --border-color: #e1e5e9;
  --button-bg: #f6f8fa;
  --button-hover-bg: #e1e5e9;
  /* ... more variables */
}
```

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## ♿ Accessibility

The editor is fully accessible and supports:

- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard navigation
- High contrast mode
- Reduced motion preferences
- ARIA labels and descriptions
- Focus management

## 🚀 Performance

Optimized for performance with:

- Virtual scrolling for large documents
- Debounced updates
- Memory optimization
- Input batching
- DOM optimization
- Performance monitoring

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/html-markdown-editor.git
cd html-markdown-editor

# Install dependencies
npm install

# Start development server (opens http://localhost:5173)
npm run dev

# Available development commands
npm run dev          # Development server with hot reload
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # TypeScript type checking
npm run check:watch  # Watch mode type checking
npm run lint         # ESLint + Prettier checks
npm run format       # Auto-format code
npm test             # Run Vitest tests
npm test -- --ui     # Run tests with UI
```

**Development Requirements:**

- Node.js 18+
- npm or pnpm
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)

## 📄 License

Apache License 2.0 - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Svelte 5](https://svelte.dev/)
- Markdown parsing by [marked](https://marked.js.org/)
- HTML sanitization by [DOMPurify](https://github.com/cure53/DOMPurify)
- Inspired by GitHub's editor experience

---

## 📚 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Get started in minutes
- **[User Guide](./USER_GUIDE.md)** - Complete guide for end-users
- **[Developer Guide](./DEVELOPER_GUIDE.md)** - Integration and development guide
- **[API Documentation](./src/lib/API.md)** - Detailed API reference
- **[Examples](./examples/)** - Usage examples and demos

## 🔗 Links

- **[GitHub Repository](https://github.com/yang-gyunam/md-editor)** - Source code.
- **[Issue Tracker](https://github.com/yang-gyunam/md-editor/issues)** - Bug reports and feature requests
- **[Discussions](https://github.com/yang-gyunam/md-editor/discussions)** - Community discussions
