<!-- 
  SvelteKit Integration Example
  
  This example shows how to integrate the HTML Markdown Editor
  into a SvelteKit application with features like:
  - Auto-save functionality
  - URL-based document loading
  - Server-side persistence
  - Real-time collaboration (mock)
-->

<script>
  import { HtmlMarkdownEditor } from '../src/lib/components/index.js';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  // Document state
  let content = $state('');
  let mode = $state('markdown');
  let documentId = $state(null);
  let isLoading = $state(false);
  let isSaving = $state(false);
  let lastSaved = $state(null);
  let hasUnsavedChanges = $state(false);
  
  // Auto-save configuration
  let autoSaveTimeout;
  const AUTO_SAVE_DELAY = 2000; // 2 seconds
  
  // Mock API functions (replace with your actual API)
  async function loadDocument(id) {
    isLoading = true;
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock document data
      const mockDocument = {
        id: id,
        content: `# Document ${id}

This is a sample document loaded from the server.

## Features Demonstrated

- Document loading from URL parameters
- Auto-save functionality
- Real-time collaboration simulation
- Unsaved changes tracking

## Content

You can edit this content and it will be automatically saved every 2 seconds.

> **Note**: This is a mock implementation. In a real application, you would connect to your backend API.`,
        mode: 'markdown',
        lastModified: new Date().toISOString()
      };
      
      content = mockDocument.content;
      mode = mockDocument.mode;
      lastSaved = new Date(mockDocument.lastModified);
      hasUnsavedChanges = false;
      
      console.log('Document loaded:', mockDocument);
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function saveDocument() {
    if (!hasUnsavedChanges) return;
    
    isSaving = true;
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock save response
      const saveResponse = {
        success: true,
        documentId: documentId || crypto.randomUUID(),
        lastModified: new Date().toISOString()
      };
      
      if (!documentId) {
        documentId = saveResponse.documentId;
        // Update URL without navigation
        const url = new URL(window.location);
        url.searchParams.set('doc', documentId);
        window.history.replaceState({}, '', url);
      }
      
      lastSaved = new Date(saveResponse.lastModified);
      hasUnsavedChanges = false;
      
      console.log('Document saved:', saveResponse);
    } catch (error) {
      console.error('Failed to save document:', error);
    } finally {
      isSaving = false;
    }
  }
  
  function scheduleAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(saveDocument, AUTO_SAVE_DELAY);
  }
  
  // Event handlers
  function handleContentChange(newContent) {
    content = newContent;
    hasUnsavedChanges = true;
    scheduleAutoSave();
  }
  
  function handleModeChange(newMode) {
    mode = newMode;
    hasUnsavedChanges = true;
    scheduleAutoSave();
  }
  
  function handleManualSave() {
    clearTimeout(autoSaveTimeout);
    saveDocument();
  }
  
  function handleNewDocument() {
    content = '# New Document\n\nStart writing your content here...';
    mode = 'markdown';
    documentId = null;
    hasUnsavedChanges = true;
    lastSaved = null;
    
    // Clear URL parameters
    const url = new URL(window.location);
    url.searchParams.delete('doc');
    window.history.replaceState({}, '', url);
  }
  
  // Simulate real-time collaboration
  function simulateCollaboration() {
    if (!documentId) return;
    
    const collaborativeChanges = [
      '\n\n## Collaborative Edit\n\nThis content was added by a collaborator!',
      '\n\n> **Collaborator Note**: Great work on this document!',
      '\n\n- [x] Added by collaborator\n- [ ] Needs review'
    ];
    
    const randomChange = collaborativeChanges[Math.floor(Math.random() * collaborativeChanges.length)];
    content += randomChange;
    hasUnsavedChanges = true;
    scheduleAutoSave();
    
    console.log('Simulated collaborative change');
  }
  
  // Initialize on mount
  onMount(() => {
    // Check for document ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('doc');
    
    if (docId) {
      documentId = docId;
      loadDocument(docId);
    } else {
      // Start with empty document
      content = '# Welcome to SvelteKit Integration\n\nThis example demonstrates how to integrate the HTML Markdown Editor with SvelteKit.\n\n## Features\n\n- Auto-save functionality\n- Document persistence\n- URL-based document loading\n- Real-time collaboration simulation\n\nStart editing to see the auto-save in action!';
    }
    
    // Simulate collaborative editing every 30 seconds
    const collaborationInterval = setInterval(simulateCollaboration, 30000);
    
    // Cleanup
    return () => {
      clearInterval(collaborationInterval);
      clearTimeout(autoSaveTimeout);
    };
  });
  
  // Handle page unload
  function handleBeforeUnload(event) {
    if (hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return event.returnValue;
    }
  }
  
  // Templates for SvelteKit projects
  const svelteKitTemplates = [
    {
      id: 'sveltekit-page',
      name: 'SvelteKit Page',
      description: 'Basic SvelteKit page component',
      category: 'SvelteKit',
      content: `<script>
  // Page logic here
  let {{variable}} = $state({{default_value}});
</script>

<svelte:head>
  <title>{{page_title}}</title>
  <meta name="description" content="{{page_description}}" />
</svelte:head>

<div class="page-container">
  <h1>{{page_title}}</h1>
  <p>{{page_content}}</p>
</div>

<style>
  .page-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
</style>`,
      variables: [
        { name: 'variable', placeholder: 'data' },
        { name: 'default_value', placeholder: "'initial value'" },
        { name: 'page_title', placeholder: 'Page Title' },
        { name: 'page_description', placeholder: 'Page description' },
        { name: 'page_content', placeholder: 'Page content goes here...' }
      ]
    },
    {
      id: 'sveltekit-api',
      name: 'SvelteKit API Route',
      description: 'API route handler',
      category: 'SvelteKit',
      content: `import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const {{method}}: RequestHandler = async ({ {{params}} }) => {
  try {
    // {{description}}
    {{logic}}
    
    return json({
      success: true,
      data: {{response_data}}
    });
  } catch (error) {
    console.error('{{error_context}}:', error);
    
    return json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
};`,
      variables: [
        { name: 'method', defaultValue: 'GET' },
        { name: 'params', placeholder: 'request, params' },
        { name: 'description', placeholder: 'API endpoint description' },
        { name: 'logic', placeholder: '// Your logic here' },
        { name: 'response_data', placeholder: 'result' },
        { name: 'error_context', placeholder: 'API error' }
      ]
    }
  ];
</script>

<svelte:window on:beforeunload={handleBeforeUnload} />

<div class="sveltekit-example">
  <header class="app-header">
    <div class="header-content">
      <h1>SvelteKit Integration Example</h1>
      <div class="header-actions">
        <button onclick={handleNewDocument} class="btn btn-secondary">
          New Document
        </button>
        <button 
          onclick={handleManualSave} 
          class="btn btn-primary"
          disabled={!hasUnsavedChanges || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Now'}
        </button>
      </div>
    </div>
    
    <div class="status-bar">
      <div class="status-left">
        {#if documentId}
          <span class="document-id">Document: {documentId.slice(0, 8)}...</span>
        {:else}
          <span class="document-id">Unsaved Document</span>
        {/if}
        
        {#if lastSaved}
          <span class="last-saved">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        {/if}
      </div>
      
      <div class="status-right">
        {#if isLoading}
          <span class="status loading">Loading...</span>
        {:else if isSaving}
          <span class="status saving">Saving...</span>
        {:else if hasUnsavedChanges}
          <span class="status unsaved">Unsaved changes</span>
        {:else}
          <span class="status saved">All changes saved</span>
        {/if}
      </div>
    </div>
  </header>
  
  <main class="editor-main">
    {#if isLoading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading document...</p>
      </div>
    {:else}
      <HtmlMarkdownEditor
        bind:value={content}
        bind:mode={mode}
        showPreview={true}
        showToolbar={true}
        theme="auto"
        templates={svelteKitTemplates}
        enableSlashCommands={true}
        githubStyle={true}
        placeholder="Start writing your document..."
        onchange={handleContentChange}
        onmodechange={handleModeChange}
      />
    {/if}
  </main>
  
  <footer class="app-footer">
    <div class="footer-content">
      <p>
        This example demonstrates SvelteKit integration with auto-save, 
        document persistence, and collaborative editing simulation.
      </p>
      <div class="footer-stats">
        <span>Characters: {content.length}</span>
        <span>Lines: {content.split('\n').length}</span>
        <span>Mode: {mode}</span>
      </div>
    </div>
  </footer>
</div>

<style>
  .sveltekit-example {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  }
  
  .app-header {
    background: #f6f8fa;
    border-bottom: 1px solid #e1e5e9;
    padding: 1rem;
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .header-content h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #24292f;
  }
  
  .header-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: 1px solid;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background: #0969da;
    border-color: #0969da;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #0860ca;
  }
  
  .btn-secondary {
    background: white;
    border-color: #d1d9e0;
    color: #24292f;
  }
  
  .btn-secondary:hover {
    background: #f3f4f6;
  }
  
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    color: #656d76;
  }
  
  .status-left {
    display: flex;
    gap: 1rem;
  }
  
  .document-id {
    font-weight: 500;
  }
  
  .status {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
  }
  
  .status.loading {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .status.saving {
    background: #fef3c7;
    color: #92400e;
  }
  
  .status.unsaved {
    background: #fecaca;
    color: #dc2626;
  }
  
  .status.saved {
    background: #dcfce7;
    color: #16a34a;
  }
  
  .editor-main {
    flex: 1;
    min-height: 0;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e1e5e9;
    border-top: 3px solid #0969da;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .app-footer {
    background: #f6f8fa;
    border-top: 1px solid #e1e5e9;
    padding: 1rem;
  }
  
  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    color: #656d76;
  }
  
  .footer-stats {
    display: flex;
    gap: 1rem;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    
    .header-content h1 {
      text-align: center;
    }
    
    .status-bar {
      flex-direction: column;
      gap: 0.5rem;
      align-items: stretch;
    }
    
    .footer-content {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }
    
    .footer-stats {
      justify-content: center;
    }
  }
  
  /* Dark theme support */
  @media (prefers-color-scheme: dark) {
    .app-header {
      background: #161b22;
      border-color: #30363d;
    }
    
    .header-content h1 {
      color: #f0f6fc;
    }
    
    .btn-secondary {
      background: #21262d;
      border-color: #30363d;
      color: #f0f6fc;
    }
    
    .btn-secondary:hover {
      background: #30363d;
    }
    
    .status-bar {
      color: #8b949e;
    }
    
    .app-footer {
      background: #161b22;
      border-color: #30363d;
    }
    
    .footer-content {
      color: #8b949e;
    }
  }
</style>