# HTML Markdown Editor - Developer Guide

## Overview

This guide provides comprehensive information for developers who want to integrate, customize, or contribute to the HTML Markdown Editor component built with Svelte 5.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Basic knowledge of Svelte/SvelteKit
- TypeScript (recommended)

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Architecture](#architecture)
5. [Component Integration](#component-integration)
6. [Customization](#customization)
7. [Performance Optimization](#performance-optimization)
8. [Accessibility](#accessibility)
9. [Testing](#testing)
10. [Contributing](#contributing)

## Development Setup

### Local Development

```bash
# Clone the repository
git clone https://github.com/yang-gyunam/md-editor.git
cd md-editor

# Install dependencies
npm install

# Start development server
npm run dev
# Opens http://localhost:5173

# Run in different modes
npm run dev -- --host          # Expose to network
npm run dev -- --port 3000     # Custom port
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Production build
npm run preview      # Preview production build locally

# Code Quality
npm run check        # TypeScript type checking
npm run check:watch  # Watch mode type checking
npm run lint         # ESLint + Prettier checks
npm run format       # Auto-format with Prettier
npm test             # Run Vitest tests
npm test -- --ui     # Run tests with UI
npm test -- --coverage  # Run tests with coverage
```

### Development Environment

The project uses:

- **Vite** - Fast build tool and dev server
- **SvelteKit** - Full-stack Svelte framework
- **TypeScript** - Type safety
- **Vitest** - Testing framework
- **ESLint + Prettier** - Code quality
- **JSDOM** - DOM testing environment

## Project Structure

```
svelte5-html-md-editor/
├── src/
│   ├── lib/                    # Core library code
│   │   ├── components/         # Svelte components
│   │   │   ├── HtmlMarkdownEditor.svelte  # Main component
│   │   │   ├── EditorToolbar.svelte       # Formatting toolbar
│   │   │   ├── PreviewPane.svelte         # Live preview
│   │   │   ├── TemplatePopup.svelte       # Template selector
│   │   │   └── index.ts                   # Component exports
│   │   ├── types/              # TypeScript definitions
│   │   │   ├── editor.ts       # Core editor types
│   │   │   ├── toolbar.ts      # Toolbar types
│   │   │   ├── template.ts     # Template types
│   │   │   └── index.ts        # Type exports
│   │   ├── utils/              # Utility functions
│   │   │   ├── markdown.ts     # Markdown processing
│   │   │   ├── html.ts         # HTML sanitization
│   │   │   ├── debounce.ts     # Performance utils
│   │   │   └── index.ts        # Utility exports
│   │   └── index.ts            # Main library export
│   ├── routes/                 # SvelteKit demo routes
│   │   ├── +layout.svelte      # App layout
│   │   ├── +page.svelte        # Demo page
│   │   └── demo/               # Additional demos
│   └── app.html                # HTML template
├── examples/                   # Usage examples
├── tests/                      # Test files
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite configuration
├── svelte.config.js           # Svelte configuration
├── tsconfig.json              # TypeScript configuration
├── eslint.config.js           # ESLint configuration
└── README.md                  # Project documentation
```

## Getting Started

### Installation

```bash
npm install svelte5-html-md-editor
```

### Basic Integration

```svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  let content = $state('# Hello World');
  let mode = $state('markdown');
</script>

<HtmlMarkdownEditor
  bind:value={content}
  bind:mode={mode}
/>
```

### TypeScript Support

The component is built with TypeScript and provides full type definitions:

```typescript
import type {
  EditorProps,
  Template,
  Snippet,
  PerformanceMetrics,
} from "svelte5-html-md-editor";
```

## Architecture

### Component Hierarchy

```
HtmlMarkdownEditor (Main Component)
├── EditorToolbar (Formatting Tools)
├── CodeEditor/VirtualizedCodeEditor (Input)
├── PreviewPane (Output Rendering)
├── TemplatePopup (Slash Commands)
├── SnippetManager (Snippet Management)
├── LoadingIndicator (Loading States)
└── ErrorDisplay (Error Handling)
```

### State Management

The component uses Svelte 5 runes for reactive state management:

- `$state()` - Mutable reactive state
- `$derived()` - Computed values
- `$effect()` - Side effects and cleanup
- `$bindable()` - Two-way data binding

### Key Features

1. **Dual-mode editing** - HTML and Markdown modes
2. **Real-time preview** - Live rendering with debouncing
3. **Template system** - Slash command triggered templates
4. **Snippet management** - Custom keyboard shortcuts
5. **Performance optimization** - Virtual scrolling and memory management
6. **Accessibility** - Full keyboard navigation and screen reader support
7. **Responsive design** - Mobile and touch optimizations
8. **Error handling** - Graceful error recovery
9. **Theme support** - Light, dark, and auto themes

## Component Integration

### Props Configuration

```svelte
<HtmlMarkdownEditor
  bind:value={content}
  bind:mode={mode}
  showPreview={true}
  showToolbar={true}
  theme="auto"
  debounceMs={300}
  templates={customTemplates}
  snippets={customSnippets}
  enableSlashCommands={true}
  githubStyle={true}
  enableVirtualScrolling={true}
  enableAccessibility={true}
  enableResponsiveDesign={true}
  onchange={handleContentChange}
  onmodechange={handleModeChange}
  ontemplateinsert={handleTemplateInsert}
  onsnippetinsert={handleSnippetInsert}
  onperformanceupdate={handlePerformanceUpdate}
  onerror={handleError}
/>
```

### Event Handling

```typescript
function handleContentChange(content: string) {
  // Handle content changes
  console.log("Content updated:", content.length, "characters");
}

function handleModeChange(mode: "html" | "markdown") {
  // Handle mode switches
  console.log("Mode changed to:", mode);
}

function handleTemplateInsert(template: Template) {
  // Handle template insertions
  console.log("Template inserted:", template.name);
}

function handleSnippetInsert(snippet: Snippet) {
  // Handle snippet insertions
  console.log("Snippet inserted:", snippet.name);
}

function handlePerformanceUpdate(metrics: PerformanceMetrics) {
  // Monitor performance
  if (metrics.renderTime > 500) {
    console.warn("Slow rendering detected");
  }
}

function handleError(error: EditorError) {
  // Handle errors
  console.error("Editor error:", error);
}
```

## Customization

### Custom Templates

```typescript
const customTemplates: Template[] = [
  {
    id: "api-doc",
    name: "API Documentation",
    description: "REST API endpoint documentation",
    category: "Documentation",
    content: `## {{method}} {{endpoint}}

### Description
{{description}}

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| {{param}} | {{type}} | {{required}} | {{param_desc}} |

### Response
\`\`\`json
{{response}}
\`\`\`

### Example
\`\`\`bash
curl -X {{method}} "{{base_url}}{{endpoint}}"
\`\`\``,
    variables: [
      { name: "method", placeholder: "GET" },
      { name: "endpoint", placeholder: "/api/users" },
      { name: "description", placeholder: "Endpoint description" },
      { name: "param", placeholder: "id" },
      { name: "type", placeholder: "string" },
      { name: "required", placeholder: "Yes" },
      { name: "param_desc", placeholder: "Parameter description" },
      { name: "response", placeholder: '{"status": "success"}' },
      { name: "base_url", placeholder: "https://api.example.com" },
    ],
  },
];
```

### Custom Snippets

```typescript
const customSnippets: Snippet[] = [
  {
    id: "react-component",
    name: "React Component",
    shortcut: "Ctrl+Shift+R",
    content: `import React from 'react';

interface {{ComponentName}}Props {
  {{prop}}: {{type}};
}

const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({ {{prop}} }) => {
  return (
    <div>
      {{content}}
    </div>
  );
};

export default {{ComponentName}};`,
    variables: [
      { name: "ComponentName", placeholder: "MyComponent" },
      { name: "prop", placeholder: "title" },
      { name: "type", placeholder: "string" },
      { name: "content", placeholder: "Component content" },
    ],
    category: "React",
  },
];
```

### Custom Styling

```css
/* Override default styles */
.svelte5-html-md-editor {
  --bg-color: #ffffff;
  --text-primary: #24292f;
  --border-color: #e1e5e9;
  /* ... other custom properties */
}

/* Custom toolbar styling */
.svelte5-html-md-editor .toolbar-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Custom preview styling */
.svelte5-html-md-editor .preview-pane {
  font-family: "Georgia", serif;
  line-height: 1.8;
}
```

### Plugin System

Create custom toolbar tools:

```typescript
const customTools: ToolConfig[] = [
  {
    id: "insert-date",
    label: "Date",
    icon: "📅",
    shortcut: "Ctrl+Shift+D",
    action: (editor: EditorInstance) => {
      const date = new Date().toLocaleDateString();
      editor.insertText(date);
    },
  },
  {
    id: "word-count",
    label: "Count",
    icon: "🔢",
    action: (editor: EditorInstance) => {
      const wordCount = editor.getContent().split(/\s+/).length;
      alert(`Word count: ${wordCount}`);
    },
  },
];
```

## Performance Optimization

### Large Document Handling

```svelte
<HtmlMarkdownEditor
  enableVirtualScrolling={true}
  performanceMode="auto"
  enablePerformanceMonitoring={true}
  onperformanceupdate={(metrics) => {
    if (metrics.isLargeDocument) {
      console.log('Large document mode active');
    }
  }}
/>
```

### Memory Management

```typescript
// Monitor memory usage
function handlePerformanceUpdate(metrics: PerformanceMetrics) {
  if (metrics.memoryUsage > 80) {
    console.warn("High memory usage detected");
    // Implement cleanup or optimization
  }
}
```

### Input Optimization

The editor automatically optimizes input handling:

- Debounced updates for preview rendering
- Batched DOM operations
- Smart re-rendering based on content changes
- Virtual scrolling for large documents

## Accessibility

### Keyboard Navigation

The editor supports comprehensive keyboard navigation:

```typescript
// Default shortcuts
const shortcuts = {
  "Ctrl+B": "Bold formatting",
  "Ctrl+I": "Italic formatting",
  "Ctrl+K": "Insert link",
  "Ctrl+Z": "Undo",
  "Ctrl+Y": "Redo",
  "Ctrl+Space": "Open snippet manager",
  Tab: "Navigate elements",
  Escape: "Close popups",
  "/": "Trigger template popup",
};
```

### Screen Reader Support

```svelte
<HtmlMarkdownEditor
  enableScreenReaderSupport={true}
  ariaLabel="Markdown editor with live preview"
  ariaDescribedBy="editor-help"
/>
```

### High Contrast Mode

The editor automatically adapts to high contrast preferences:

```css
@media (prefers-contrast: high) {
  .svelte5-html-md-editor {
    border-width: 2px;
    outline-width: 3px;
  }
}
```

## Testing

### Unit Testing

```typescript
import { render, fireEvent } from "@testing-library/svelte";
import { HtmlMarkdownEditor } from "svelte5-html-md-editor";

test("renders with default props", () => {
  const { getByRole } = render(HtmlMarkdownEditor);
  expect(getByRole("application")).toBeInTheDocument();
});

test("switches between modes", async () => {
  const { getByText } = render(HtmlMarkdownEditor);
  const htmlButton = getByText("HTML");

  await fireEvent.click(htmlButton);
  expect(htmlButton).toHaveAttribute("aria-pressed", "true");
});
```

### Integration Testing

```typescript
test("template insertion workflow", async () => {
  const { getByRole, getByText } = render(HtmlMarkdownEditor, {
    templates: [
      {
        id: "test",
        name: "Test Template",
        content: "# Test",
      },
    ],
  });

  const editor = getByRole("textbox");

  // Type slash to trigger template popup
  await fireEvent.input(editor, { target: { value: "/" } });

  // Select template
  const template = getByText("Test Template");
  await fireEvent.click(template);

  expect(editor).toHaveValue("# Test");
});
```

### Performance Testing

```typescript
test("handles large documents efficiently", async () => {
  const largeContent = "x".repeat(100000);
  const startTime = performance.now();

  const { getByRole } = render(HtmlMarkdownEditor, {
    value: largeContent,
  });

  const endTime = performance.now();
  expect(endTime - startTime).toBeLessThan(500); // 500ms requirement
});
```

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

test("has no accessibility violations", async () => {
  const { container } = render(HtmlMarkdownEditor);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Contributing

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yang-gyunam/md-editor.git
cd md-editor

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run type checking
npm run check

# Run linting
npm run lint

# Format code
npm run format
```

### Code Style

The project uses:

- **Prettier** for code formatting
- **ESLint** for linting
- **TypeScript** for type checking
- **Svelte Check** for Svelte-specific validation

### Commit Guidelines

Follow conventional commits:

```
feat: add template variable support
fix: resolve preview rendering issue
docs: update API documentation
test: add integration tests for snippets
refactor: optimize performance monitoring
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation
7. Submit a pull request

### Architecture Decisions

When contributing, consider:

- **Performance**: Maintain sub-500ms rendering for large documents
- **Accessibility**: Ensure full keyboard navigation and screen reader support
- **Compatibility**: Support modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- **Bundle Size**: Keep the component lightweight
- **API Consistency**: Maintain backward compatibility

### Testing Requirements

All contributions must include:

- Unit tests for new functionality
- Integration tests for user workflows
- Accessibility tests
- Performance tests for large documents
- Documentation updates

## Advanced Topics

### Custom Renderers

Implement custom preview renderers:

```typescript
interface CustomRenderer {
  render(content: string, mode: "html" | "markdown"): string;
  sanitize(html: string): string;
}

const customRenderer: CustomRenderer = {
  render(content, mode) {
    if (mode === "markdown") {
      return marked(content, {
        gfm: true,
        breaks: true,
        highlight: (code, lang) =>
          hljs.highlight(code, { language: lang }).value,
      });
    }
    return content;
  },

  sanitize(html) {
    return DOMPurify.sanitize(html);
  },
};
```

### State Persistence

Implement content persistence:

```typescript
function useEditorPersistence(key: string) {
  let content = $state(localStorage.getItem(key) || "");

  $effect(() => {
    localStorage.setItem(key, content);
  });

  return {
    get content() {
      return content;
    },
    set content(value) {
      content = value;
    },
  };
}
```

### Plugin Development

Create editor plugins:

```typescript
interface EditorPlugin {
  name: string;
  version: string;
  init(editor: EditorInstance): void;
  destroy(): void;
}

const autoSavePlugin: EditorPlugin = {
  name: "auto-save",
  version: "1.0.0",

  init(editor) {
    const interval = setInterval(() => {
      const content = editor.getContent();
      localStorage.setItem("auto-save", content);
    }, 30000); // Save every 30 seconds

    this.cleanup = () => clearInterval(interval);
  },

  destroy() {
    this.cleanup?.();
  },
};
```

## Development Tools

### Debugging

#### Browser DevTools

```bash
# Enable source maps in development
npm run dev -- --sourcemap

# Debug with browser DevTools
# 1. Open DevTools (F12)
# 2. Go to Sources tab
# 3. Find your component files
# 4. Set breakpoints
```

#### Svelte DevTools

Install the Svelte DevTools browser extension for:

- Component inspection
- State debugging
- Performance profiling
- Event tracking

#### Vite DevTools

Development server provides:

- Hot Module Replacement (HMR)
- Error overlay
- Build analysis
- Dependency graph

### Testing Tools

#### Unit Testing with Vitest

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# UI mode
npm test -- --ui
```

#### Component Testing

```typescript
import { render, fireEvent } from "@testing-library/svelte";
import { HtmlMarkdownEditor } from "../src/lib";

test("editor renders correctly", () => {
  const { getByRole } = render(HtmlMarkdownEditor);
  expect(getByRole("application")).toBeInTheDocument();
});
```

#### E2E Testing Setup

```bash
# Install Playwright (optional)
npm install -D @playwright/test

# Run E2E tests
npx playwright test
```

### Code Quality Tools

#### ESLint Configuration

```javascript
// eslint.config.js
export default [
  {
    files: ["**/*.{js,ts,svelte}"],
    plugins: {
      svelte: eslintPluginSvelte,
    },
    rules: {
      "svelte/no-unused-svelte-ignore": "error",
      "svelte/no-dom-manipulating": "error",
    },
  },
];
```

#### Prettier Configuration

```json
{
  "useTabs": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 80,
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [
    {
      "files": "*.svelte",
      "options": {
        "parser": "svelte"
      }
    }
  ]
}
```

### Performance Monitoring

#### Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --analyze

# Check bundle composition
npx vite-bundle-analyzer dist
```

#### Performance Profiling

```typescript
// Enable performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});

performanceObserver.observe({ entryTypes: ["measure"] });
```

## Troubleshooting

### Common Development Issues

#### 1. Build Errors

**TypeScript errors:**

```bash
# Check types
npm run check

# Fix auto-fixable issues
npm run format
```

**Import errors:**

```typescript
// Use .js extensions for TypeScript imports
import { utils } from "./utils/index.js";

// Not: import { utils } from './utils/index.ts';
```

#### 2. HMR Issues

**Hot reload not working:**

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

#### 3. Performance Issues

**Slow development server:**

```bash
# Check for large files in src/
find src/ -size +1M

# Exclude large files from Vite
# vite.config.ts
export default {
  server: {
    fs: {
      strict: false
    }
  }
}
```

#### 4. Testing Issues

**Tests not running:**

```bash
# Check test environment
npm run test -- --reporter=verbose

# Clear test cache
npx vitest run --clearCache
```

### Production Issues

#### 1. Build Optimization

```bash
# Analyze bundle
npm run build -- --analyze

# Check for unused code
npx depcheck

# Optimize images
npx imagemin src/assets/* --out-dir=dist/assets
```

#### 2. Performance Monitoring

```typescript
// Add performance monitoring
function trackPerformance() {
  if ("performance" in window) {
    window.addEventListener("load", () => {
      const perfData = performance.getEntriesByType("navigation")[0];
      console.log(
        "Page load time:",
        perfData.loadEventEnd - perfData.loadEventStart,
      );
    });
  }
}
```

### Debug Mode

Enable comprehensive debugging:

```svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  // Development mode detection
  const isDev = import.meta.env.DEV;

  function handleDebug(event) {
    if (isDev) {
      console.group('Editor Debug');
      console.log('Event:', event.type);
      console.log('Data:', event.detail);
      console.log('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  }
</script>

<HtmlMarkdownEditor
  enablePerformanceMonitoring={isDev}
  showErrorDetails={isDev}
  onchange={handleDebug}
  onmodechange={handleDebug}
  onperformanceupdate={(metrics) => {
    if (isDev) console.log('Performance:', metrics);
  }}
  onerror={(error) => {
    console.error('Editor Error:', error);
    if (isDev) {
      // Additional debug info in development
      console.log('Stack:', error.stack);
      console.log('Component state:', error.componentState);
    }
  }}
/>
```

### Environment Setup

#### VS Code Extensions

Recommended extensions for development:

- Svelte for VS Code
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Vite
- GitLens

#### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "svelte.enable-ts-plugin": true,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Resources

- [API Documentation](./src/lib/API.md)
- [Component Demo](./src/routes/demo/+page.svelte)
- [Test Examples](./src/lib/components/)
- [GitHub Repository](https://github.com/yang-gyunam/md-editor)
- [Issue Tracker](https://github.com/yang-gyunam/md-editor/issues)

## License

Apache License 2.0 - see [LICENSE](./LICENSE) file for details.
