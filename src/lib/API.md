# HTML Markdown Editor API Documentation

## Overview

The HTML Markdown Editor is a comprehensive dual-mode editor built with Svelte 5 that provides seamless switching between HTML and Markdown editing modes with real-time preview capabilities.

## Installation

```bash
npm install svelte5-html-md-editor
```

## Basic Usage

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

## Props

### Core Props

| Prop          | Type                          | Default      | Description               |
| ------------- | ----------------------------- | ------------ | ------------------------- |
| `value`       | `string`                      | `''`         | Editor content (bindable) |
| `mode`        | `'html' \| 'markdown'`        | `'markdown'` | Editor mode (bindable)    |
| `showPreview` | `boolean`                     | `true`       | Show preview pane         |
| `showToolbar` | `boolean`                     | `true`       | Show formatting toolbar   |
| `placeholder` | `string`                      | `''`         | Placeholder text          |
| `readonly`    | `boolean`                     | `false`      | Read-only mode            |
| `theme`       | `'light' \| 'dark' \| 'auto'` | `'auto'`     | Color theme               |
| `debounceMs`  | `number`                      | `300`        | Preview update debounce   |
| `maxLength`   | `number`                      | `undefined`  | Maximum content length    |

### Template System Props

| Prop                  | Type         | Default | Description                 |
| --------------------- | ------------ | ------- | --------------------------- |
| `templates`           | `Template[]` | `[]`    | Available templates         |
| `enableSlashCommands` | `boolean`    | `true`  | Enable `/` template trigger |

### Snippet System Props

| Prop       | Type        | Default | Description        |
| ---------- | ----------- | ------- | ------------------ |
| `snippets` | `Snippet[]` | `[]`    | Available snippets |

### Performance Props

| Prop                          | Type                            | Default  | Description                                  |
| ----------------------------- | ------------------------------- | -------- | -------------------------------------------- |
| `enableVirtualScrolling`      | `boolean`                       | `true`   | Enable virtual scrolling for large documents |
| `performanceMode`             | `'auto' \| 'always' \| 'never'` | `'auto'` | Performance optimization mode                |
| `enablePerformanceMonitoring` | `boolean`                       | `true`   | Monitor performance metrics                  |

### Accessibility Props

| Prop                        | Type      | Default     | Description                   |
| --------------------------- | --------- | ----------- | ----------------------------- |
| `enableAccessibility`       | `boolean` | `true`      | Enable accessibility features |
| `enableKeyboardNavigation`  | `boolean` | `true`      | Enable keyboard shortcuts     |
| `enableScreenReaderSupport` | `boolean` | `true`      | Enable screen reader support  |
| `ariaLabel`                 | `string`  | `undefined` | Custom ARIA label             |
| `ariaDescribedBy`           | `string`  | `undefined` | ARIA described-by reference   |

### Responsive Props

| Prop                        | Type      | Default | Description                 |
| --------------------------- | --------- | ------- | --------------------------- |
| `enableResponsiveDesign`    | `boolean` | `true`  | Enable responsive behavior  |
| `enableMobileOptimizations` | `boolean` | `true`  | Enable mobile optimizations |
| `enableTouchOptimizations`  | `boolean` | `true`  | Enable touch optimizations  |

### Error Handling Props

| Prop                  | Type      | Default | Description                     |
| --------------------- | --------- | ------- | ------------------------------- |
| `enableErrorRecovery` | `boolean` | `true`  | Enable automatic error recovery |
| `showErrorDetails`    | `boolean` | `false` | Show detailed error information |

### Loading State Props

| Prop                | Type      | Default | Description             |
| ------------------- | --------- | ------- | ----------------------- |
| `showLoadingStates` | `boolean` | `true`  | Show loading indicators |

### GitHub Features Props

| Prop          | Type      | Default | Description                 |
| ------------- | --------- | ------- | --------------------------- |
| `githubStyle` | `boolean` | `true`  | Use GitHub-flavored styling |

## Events

### Core Events

| Event          | Payload                                | Description     |
| -------------- | -------------------------------------- | --------------- |
| `onchange`     | `(value: string) => void`              | Content changed |
| `onmodechange` | `(mode: 'html' \| 'markdown') => void` | Mode changed    |
| `onfocus`      | `() => void`                           | Editor focused  |
| `onblur`       | `() => void`                           | Editor blurred  |

### Template Events

| Event              | Payload                        | Description       |
| ------------------ | ------------------------------ | ----------------- |
| `ontemplateinsert` | `(template: Template) => void` | Template inserted |

### Snippet Events

| Event             | Payload                      | Description      |
| ----------------- | ---------------------------- | ---------------- |
| `onsnippetinsert` | `(snippet: Snippet) => void` | Snippet inserted |

### Performance Events

| Event                 | Payload                                 | Description                 |
| --------------------- | --------------------------------------- | --------------------------- |
| `onperformanceupdate` | `(metrics: PerformanceMetrics) => void` | Performance metrics updated |

### Error Events

| Event     | Payload                        | Description    |
| --------- | ------------------------------ | -------------- |
| `onerror` | `(error: EditorError) => void` | Error occurred |

### Loading Events

| Event                  | Payload                         | Description           |
| ---------------------- | ------------------------------- | --------------------- |
| `onloadingstatechange` | `(state: LoadingState) => void` | Loading state changed |

## Types

### Template

```typescript
interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  variables?: TemplateVariable[];
  category?: string;
}

interface TemplateVariable {
  name: string;
  placeholder: string;
  defaultValue?: string;
}
```

### Snippet

```typescript
interface Snippet {
  id: string;
  name: string;
  shortcut: string;
  content: string;
  cursorOffset?: number;
  variables?: TemplateVariable[];
  category?: string;
  description?: string;
  useCount?: number;
  lastUsed?: number;
  createdAt?: number;
}
```

### Performance Metrics

```typescript
interface PerformanceMetrics {
  renderTime: number;
  inputLatency: number;
  memoryUsage: number;
  isLargeDocument: boolean;
  useVirtualScrolling: boolean;
  lineCount: number;
  contentSize: number;
}
```

### Editor Error

```typescript
interface EditorError {
  type:
    | "validation"
    | "parsing"
    | "rendering"
    | "performance"
    | "accessibility";
  message: string;
  line?: number;
  column?: number;
  context?: Record<string, any>;
  recoverable: boolean;
  timestamp: number;
}
```

### Loading State

```typescript
interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
  error?: string;
}
```

## Keyboard Shortcuts

### Default Shortcuts

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

### Custom Shortcuts

You can define custom shortcuts through the snippet system:

````javascript
const snippets = [
  {
    id: "custom-1",
    name: "Code Block",
    shortcut: "Ctrl+Shift+C",
    content: "```javascript\n{{code}}\n```",
    variables: [{ name: "code", placeholder: "Your code here" }],
  },
];
````

## Advanced Usage

### Custom Templates

```svelte
<script>
  const templates = [
    {
      id: 'blog-post',
      name: 'Blog Post',
      description: 'Standard blog post template',
      category: 'Content',
      content: `# {{title}}

*Published on {{date}}*

{{content}}

## Conclusion

{{conclusion}}`,
      variables: [
        { name: 'title', placeholder: 'Post Title' },
        { name: 'date', defaultValue: new Date().toLocaleDateString() },
        { name: 'content', placeholder: 'Main content here...' },
        { name: 'conclusion', placeholder: 'Wrap up your thoughts...' }
      ]
    }
  ];
</script>

<HtmlMarkdownEditor
  {templates}
  enableSlashCommands={true}
/>
```

### Performance Monitoring

```svelte
<script>
  function handlePerformanceUpdate(metrics) {
    console.log('Performance metrics:', metrics);

    if (metrics.renderTime > 500) {
      console.warn('Slow rendering detected');
    }

    if (metrics.isLargeDocument) {
      console.info('Large document mode active');
    }
  }
</script>

<HtmlMarkdownEditor
  enablePerformanceMonitoring={true}
  onperformanceupdate={handlePerformanceUpdate}
/>
```

### Error Handling

```svelte
<script>
  function handleError(error) {
    console.error('Editor error:', error);

    if (error.recoverable) {
      // Handle recoverable errors
      showNotification('An error occurred but was recovered automatically');
    } else {
      // Handle non-recoverable errors
      showErrorDialog(error.message);
    }
  }
</script>

<HtmlMarkdownEditor
  enableErrorRecovery={true}
  showErrorDetails={true}
  onerror={handleError}
/>
```

### Responsive Design

```svelte
<HtmlMarkdownEditor
  enableResponsiveDesign={true}
  enableMobileOptimizations={true}
  enableTouchOptimizations={true}
/>
```

## Styling

### CSS Custom Properties

The editor supports extensive theming through CSS custom properties:

```css
.svelte5-html-md-editor {
  --bg-color: #ffffff;
  --bg-secondary: #f6f8fa;
  --bg-hover: #f3f4f6;
  --bg-selected: #dbeafe;
  --border-color: #e1e5e9;
  --border-light: #f0f0f0;
  --text-primary: #24292f;
  --text-secondary: #656d76;
  --text-muted: #8b949e;
  --button-bg: #f6f8fa;
  --button-hover-bg: #e1e5e9;
  --code-bg: #f6f8fa;
}
```

### Dark Theme

```css
.svelte5-html-md-editor[data-theme="dark"] {
  --bg-color: #0d1117;
  --bg-secondary: #161b22;
  --bg-hover: #21262d;
  --bg-selected: #1f2937;
  --border-color: #30363d;
  --border-light: #21262d;
  --text-primary: #f0f6fc;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;
  --button-bg: #21262d;
  --button-hover-bg: #30363d;
  --code-bg: #161b22;
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

The editor is fully accessible and supports:

- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard navigation
- High contrast mode
- Reduced motion preferences
- ARIA labels and descriptions
- Focus management

## Performance

The editor is optimized for performance with:

- Virtual scrolling for large documents
- Debounced updates
- Memory optimization
- Input batching
- DOM optimization
- Performance monitoring

## License

MIT License - see LICENSE file for details.
