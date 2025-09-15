# Quick Start Guide

Get up and running with the HTML Markdown Editor in minutes.

## For Users

### 1. Basic Usage

```svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';
  let content = $state('# Hello World');
</script>

<HtmlMarkdownEditor bind:value={content} />
```

### 2. With Templates

```svelte
<script>
  import { HtmlMarkdownEditor } from 'svelte5-html-md-editor';

  let content = $state('');
  const templates = [
    {
      id: 'blog',
      name: 'Blog Post',
      content: '# {{title}}\n\n{{content}}'
    }
  ];
</script>

<HtmlMarkdownEditor
  bind:value={content}
  {templates}
  enableSlashCommands={true}
/>
```

## For Developers

### 1. Clone and Setup

```bash
git clone https://github.com/yang-gyunam/md-editor.git
cd md-editor
npm install
npm run dev
```

### 2. Project Structure

```
src/lib/
├── components/     # Svelte components
├── types/         # TypeScript definitions
├── utils/         # Utility functions
└── index.ts       # Main export
```

### 3. Development Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run test       # Run tests
npm run lint       # Check code quality
```

### 4. Adding Features

1. Create component in `src/lib/components/`
2. Add types in `src/lib/types/`
3. Export from `src/lib/index.ts`
4. Write tests
5. Update documentation

## Next Steps

- **Users**: Read the [User Guide](./USER_GUIDE.md)
- **Developers**: Check the [Developer Guide](./DEVELOPER_GUIDE.md)
- **API Reference**: See [API Documentation](./src/lib/API.md)
- **Examples**: Browse [examples folder](./examples/)

## Need Help?

- 🐛 [Report bugs](https://github.com/yang-gyunam/md-editor/issues)
- 💡 [Request features](https://github.com/yang-gyunam/md-editor/discussions)
- 📖 [Read documentation](./README.md)
- 💬 [Join discussions](https://github.com/yang-gyunam/md-editor/discussions)
