<script lang="ts">
  import { highlightSyntax, getSyntaxCSS } from '../utils/syntax.js';
  import type { EditorMode, EditorTheme } from '../types/index.js';

  const {
    content,
    mode,
    theme = 'light'
  }: {
    content: string;
    mode: EditorMode;
    theme?: EditorTheme;
  } = $props();

  // Compute highlighted HTML
  const highlightedHTML = $derived(() => {
    if (!content) return '';
    return highlightSyntax(content, mode);
  });

  // Compute theme (handle 'auto' theme)
  const resolvedTheme = $derived(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  });

  // Generate CSS for current theme
  const syntaxCSS = $derived(() => getSyntaxCSS(resolvedTheme()));
</script>

<div class="syntax-highlight" class:light={resolvedTheme() === 'light'} class:dark={resolvedTheme() === 'dark'}>
  {@html highlightedHTML}
</div>

<!-- Inject syntax highlighting CSS -->
<svelte:head>
  <style>
    {syntaxCSS}
  </style>
</svelte:head>

<style>
  .syntax-highlight {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 12px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    pointer-events: none;
    z-index: 1;
    color: transparent;
    background: transparent;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  .syntax-highlight :global(span) {
    color: inherit;
  }

  /* Ensure highlighting matches textarea exactly */
  .syntax-highlight {
    tab-size: 2;
    -moz-tab-size: 2;
  }
</style>