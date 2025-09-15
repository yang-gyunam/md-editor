<script>
  import { HtmlMarkdownEditor } from '../src/lib/components/index.js';
  
  // Advanced editor state
  let content = $state(`# Advanced HTML Markdown Editor Example

This example demonstrates advanced features including templates, snippets, and custom configurations.

## Template System

Type \`/\` to see available templates:
- Blog post template
- Code documentation
- Meeting notes
- Task list

## Snippet System

Use these keyboard shortcuts:
- \`Ctrl+Shift+C\` - Insert code block
- \`Ctrl+Shift+L\` - Insert link
- \`Ctrl+Shift+T\` - Insert table

## Performance Features

This editor handles large documents efficiently with:
- Virtual scrolling
- Debounced updates
- Memory optimization
- Performance monitoring`);

  let mode = $state('markdown');
  let theme = $state('auto');
  let showPreview = $state(true);
  let showToolbar = $state(true);
  
  // Advanced templates
  const templates = [
    {
      id: 'blog-post',
      name: 'Blog Post',
      description: 'Complete blog post template with metadata',
      category: 'Content',
      content: `# {{title}}

*Published on {{date}} by {{author}}*
*Tags: {{tags}}*

## Introduction

{{introduction}}

## Main Content

{{content}}

## Conclusion

{{conclusion}}

---

*Thank you for reading! Feel free to share your thoughts in the comments below.*`,
      variables: [
        { name: 'title', placeholder: 'Blog Post Title' },
        { name: 'date', defaultValue: new Date().toLocaleDateString() },
        { name: 'author', placeholder: 'Author Name' },
        { name: 'tags', placeholder: 'tag1, tag2, tag3' },
        { name: 'introduction', placeholder: 'Brief introduction...' },
        { name: 'content', placeholder: 'Main content goes here...' },
        { name: 'conclusion', placeholder: 'Wrap up your thoughts...' }
      ]
    },
    {
      id: 'api-docs',
      name: 'API Documentation',
      description: 'REST API endpoint documentation',
      category: 'Documentation',
      content: `## {{method}} {{endpoint}}

### Description
{{description}}

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| {{param_name}} | {{param_type}} | {{required}} | {{param_description}} |

### Request Example

\`\`\`bash
curl -X {{method}} "{{base_url}}{{endpoint}}" \\
  -H "Content-Type: application/json" \\
  -d '{{request_body}}'
\`\`\`

### Response

\`\`\`json
{{response_example}}
\`\`\`

### Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |`,
      variables: [
        { name: 'method', placeholder: 'GET' },
        { name: 'endpoint', placeholder: '/api/users' },
        { name: 'description', placeholder: 'Endpoint description' },
        { name: 'param_name', placeholder: 'id' },
        { name: 'param_type', placeholder: 'string' },
        { name: 'required', placeholder: 'Yes' },
        { name: 'param_description', placeholder: 'Parameter description' },
        { name: 'base_url', placeholder: 'https://api.example.com' },
        { name: 'request_body', placeholder: '{"key": "value"}' },
        { name: 'response_example', placeholder: '{"status": "success", "data": {}}' }
      ]
    },
    {
      id: 'meeting-notes',
      name: 'Meeting Notes',
      description: 'Structured meeting notes template',
      category: 'Productivity',
      content: `# {{meeting_title}}

**Date:** {{date}}
**Time:** {{time}}
**Attendees:** {{attendees}}

## Agenda

1. {{agenda_item_1}}
2. {{agenda_item_2}}
3. {{agenda_item_3}}

## Discussion Points

### {{topic_1}}
{{discussion_1}}

### {{topic_2}}
{{discussion_2}}

## Action Items

- [ ] {{action_1}} - Assigned to: {{assignee_1}} - Due: {{due_1}}
- [ ] {{action_2}} - Assigned to: {{assignee_2}} - Due: {{due_2}}
- [ ] {{action_3}} - Assigned to: {{assignee_3}} - Due: {{due_3}}

## Next Meeting

**Date:** {{next_date}}
**Topics:** {{next_topics}}`,
      variables: [
        { name: 'meeting_title', placeholder: 'Weekly Team Meeting' },
        { name: 'date', defaultValue: new Date().toLocaleDateString() },
        { name: 'time', placeholder: '10:00 AM - 11:00 AM' },
        { name: 'attendees', placeholder: 'John, Jane, Bob' },
        { name: 'agenda_item_1', placeholder: 'Project updates' },
        { name: 'agenda_item_2', placeholder: 'Budget review' },
        { name: 'agenda_item_3', placeholder: 'Next quarter planning' },
        { name: 'topic_1', placeholder: 'Topic 1' },
        { name: 'discussion_1', placeholder: 'Discussion notes...' },
        { name: 'topic_2', placeholder: 'Topic 2' },
        { name: 'discussion_2', placeholder: 'Discussion notes...' },
        { name: 'action_1', placeholder: 'Complete project proposal' },
        { name: 'assignee_1', placeholder: 'John' },
        { name: 'due_1', placeholder: 'Next Friday' },
        { name: 'action_2', placeholder: 'Review budget numbers' },
        { name: 'assignee_2', placeholder: 'Jane' },
        { name: 'due_2', placeholder: 'End of week' },
        { name: 'action_3', placeholder: 'Schedule client meeting' },
        { name: 'assignee_3', placeholder: 'Bob' },
        { name: 'due_3', placeholder: 'Next Monday' },
        { name: 'next_date', placeholder: 'Next week' },
        { name: 'next_topics', placeholder: 'Follow-up on action items' }
      ]
    }
  ];
  
  // Advanced snippets
  const snippets = [
    {
      id: 'code-block-advanced',
      name: 'Advanced Code Block',
      shortcut: 'Ctrl+Shift+C',
      content: `\`\`\`{{language}} title="{{title}}" {{{line_numbers}}}
{{code}}
\`\`\``,
      variables: [
        { name: 'language', defaultValue: 'javascript' },
        { name: 'title', placeholder: 'Code Example' },
        { name: 'line_numbers', placeholder: '1-10' },
        { name: 'code', placeholder: 'Your code here...' }
      ],
      category: 'Code'
    },
    {
      id: 'link-with-title',
      name: 'Link with Title',
      shortcut: 'Ctrl+Shift+L',
      content: '[{{text}}]({{url}} "{{title}}")',
      variables: [
        { name: 'text', placeholder: 'link text' },
        { name: 'url', placeholder: 'https://example.com' },
        { name: 'title', placeholder: 'Link title' }
      ],
      category: 'Formatting'
    },
    {
      id: 'table-advanced',
      name: 'Advanced Table',
      shortcut: 'Ctrl+Shift+T',
      content: `| {{header1}} | {{header2}} | {{header3}} | {{header4}} |
|:---------|:----------:|----------:|-----------|
| {{cell1}} | {{cell2}} | {{cell3}} | {{cell4}} |
| {{cell5}} | {{cell6}} | {{cell7}} | {{cell8}} |
| {{cell9}} | {{cell10}} | {{cell11}} | {{cell12}} |`,
      variables: [
        { name: 'header1', placeholder: 'Left Aligned' },
        { name: 'header2', placeholder: 'Center Aligned' },
        { name: 'header3', placeholder: 'Right Aligned' },
        { name: 'header4', placeholder: 'Default' },
        { name: 'cell1', placeholder: 'Data 1' },
        { name: 'cell2', placeholder: 'Data 2' },
        { name: 'cell3', placeholder: 'Data 3' },
        { name: 'cell4', placeholder: 'Data 4' },
        { name: 'cell5', placeholder: 'Data 5' },
        { name: 'cell6', placeholder: 'Data 6' },
        { name: 'cell7', placeholder: 'Data 7' },
        { name: 'cell8', placeholder: 'Data 8' },
        { name: 'cell9', placeholder: 'Data 9' },
        { name: 'cell10', placeholder: 'Data 10' },
        { name: 'cell11', placeholder: 'Data 11' },
        { name: 'cell12', placeholder: 'Data 12' }
      ],
      category: 'Structure'
    },
    {
      id: 'alert-box',
      name: 'Alert Box',
      shortcut: 'Ctrl+Shift+A',
      content: `> **{{type}}**: {{message}}
> 
> {{details}}`,
      variables: [
        { name: 'type', defaultValue: 'Note' },
        { name: 'message', placeholder: 'Alert message' },
        { name: 'details', placeholder: 'Additional details...' }
      ],
      category: 'Formatting'
    }
  ];
  
  // Performance metrics tracking
  let performanceMetrics = $state({
    renderTime: 0,
    inputLatency: 0,
    memoryUsage: 0,
    isLargeDocument: false,
    lineCount: 0,
    contentSize: 0
  });
  
  // Event handlers
  function handleContentChange(newContent) {
    console.log('Content changed:', newContent.length, 'characters');
    // Simulate auto-save
    setTimeout(() => {
      console.log('Auto-saved content');
    }, 1000);
  }
  
  function handleModeChange(newMode) {
    console.log('Mode changed to:', newMode);
    mode = newMode;
  }
  
  function handleTemplateInsert(template) {
    console.log('Template inserted:', template.name);
    // Track template usage
  }
  
  function handleSnippetInsert(snippet) {
    console.log('Snippet inserted:', snippet.name);
    // Track snippet usage
  }
  
  function handlePerformanceUpdate(metrics) {
    performanceMetrics = metrics;
    
    if (metrics.renderTime > 500) {
      console.warn('Slow rendering detected:', metrics.renderTime, 'ms');
    }
    
    if (metrics.isLargeDocument) {
      console.info('Large document mode active');
    }
  }
  
  function handleError(error) {
    console.error('Editor error:', error);
    // Show user-friendly error message
  }
  
  function handleLoadingStateChange(state) {
    console.log('Loading state:', state);
  }
</script>

<div class="advanced-example">
  <header class="example-header">
    <h1>Advanced HTML Markdown Editor</h1>
    <p>Demonstrating templates, snippets, performance monitoring, and advanced features</p>
  </header>
  
  <div class="controls-panel">
    <div class="control-group">
      <label>
        Theme:
        <select bind:value={theme}>
          <option value="auto">Auto</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </div>
    
    <div class="control-group">
      <label>
        <input type="checkbox" bind:checked={showPreview} />
        Show Preview
      </label>
      <label>
        <input type="checkbox" bind:checked={showToolbar} />
        Show Toolbar
      </label>
    </div>
  </div>
  
  <div class="editor-container">
    <HtmlMarkdownEditor
      bind:value={content}
      bind:mode={mode}
      {showPreview}
      {showToolbar}
      {theme}
      {templates}
      {snippets}
      enableSlashCommands={true}
      githubStyle={true}
      enableVirtualScrolling={true}
      performanceMode="auto"
      enablePerformanceMonitoring={true}
      enableAccessibility={true}
      enableResponsiveDesign={true}
      enableErrorRecovery={true}
      showLoadingStates={true}
      debounceMs={300}
      placeholder="Start typing or use '/' for templates, Ctrl+Space for snippets..."
      ariaLabel="Advanced markdown editor with templates and snippets"
      onchange={handleContentChange}
      onmodechange={handleModeChange}
      ontemplateinsert={handleTemplateInsert}
      onsnippetinsert={handleSnippetInsert}
      onperformanceupdate={handlePerformanceUpdate}
      onerror={handleError}
      onloadingstatechange={handleLoadingStateChange}
    />
  </div>
  
  <div class="status-panel">
    <div class="status-section">
      <h3>Editor Status</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">Mode:</span>
          <span class="value">{mode}</span>
        </div>
        <div class="status-item">
          <span class="label">Content:</span>
          <span class="value">{content.length} chars</span>
        </div>
        <div class="status-item">
          <span class="label">Lines:</span>
          <span class="value">{content.split('\n').length}</span>
        </div>
        <div class="status-item">
          <span class="label">Theme:</span>
          <span class="value">{theme}</span>
        </div>
      </div>
    </div>
    
    <div class="status-section">
      <h3>Performance Metrics</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">Render Time:</span>
          <span class="value">{performanceMetrics.renderTime}ms</span>
        </div>
        <div class="status-item">
          <span class="label">Input Latency:</span>
          <span class="value">{performanceMetrics.inputLatency}ms</span>
        </div>
        <div class="status-item">
          <span class="label">Memory Usage:</span>
          <span class="value">{performanceMetrics.memoryUsage}%</span>
        </div>
        <div class="status-item">
          <span class="label">Large Document:</span>
          <span class="value">{performanceMetrics.isLargeDocument ? 'Yes' : 'No'}</span>
        </div>
      </div>
    </div>
    
    <div class="status-section">
      <h3>Available Features</h3>
      <div class="feature-list">
        <div class="feature-item">
          <strong>Templates ({templates.length}):</strong>
          {templates.map(t => t.name).join(', ')}
        </div>
        <div class="feature-item">
          <strong>Snippets ({snippets.length}):</strong>
          {snippets.map(s => `${s.name} (${s.shortcut})`).join(', ')}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .advanced-example {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  }
  
  .example-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .example-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #24292f;
  }
  
  .example-header p {
    font-size: 1.125rem;
    color: #656d76;
    margin: 0;
  }
  
  .controls-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f6f8fa;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
  }
  
  .control-group {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .control-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .control-group select {
    padding: 0.25rem 0.5rem;
    border: 1px solid #d1d9e0;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  .editor-container {
    height: 600px;
    margin-bottom: 2rem;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .status-panel {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1.5rem;
  }
  
  .status-section {
    background: #f6f8fa;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #e1e5e9;
  }
  
  .status-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #24292f;
  }
  
  .status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 4px;
  }
  
  .status-item .label {
    font-size: 0.875rem;
    color: #656d76;
    font-weight: 500;
  }
  
  .status-item .value {
    font-size: 0.875rem;
    color: #24292f;
    font-weight: 600;
  }
  
  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .feature-item {
    padding: 0.75rem;
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 4px;
    font-size: 0.875rem;
    line-height: 1.4;
  }
  
  .feature-item strong {
    color: #24292f;
    display: block;
    margin-bottom: 0.25rem;
  }
  
  /* Responsive design */
  @media (max-width: 1200px) {
    .status-panel {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 768px) {
    .advanced-example {
      padding: 1rem;
    }
    
    .example-header h1 {
      font-size: 2rem;
    }
    
    .controls-panel {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    
    .control-group {
      justify-content: center;
    }
    
    .editor-container {
      height: 500px;
    }
    
    .status-grid {
      grid-template-columns: 1fr;
    }
  }
  
  /* Dark theme support */
  @media (prefers-color-scheme: dark) {
    .example-header h1 {
      color: #f0f6fc;
    }
    
    .example-header p {
      color: #8b949e;
    }
    
    .controls-panel {
      background: #161b22;
      border-color: #30363d;
    }
    
    .status-section {
      background: #161b22;
      border-color: #30363d;
    }
    
    .status-section h3 {
      color: #f0f6fc;
    }
    
    .status-item {
      background: #0d1117;
      border-color: #30363d;
    }
    
    .status-item .label {
      color: #8b949e;
    }
    
    .status-item .value {
      color: #f0f6fc;
    }
    
    .feature-item {
      background: #0d1117;
      border-color: #30363d;
    }
    
    .feature-item strong {
      color: #f0f6fc;
    }
  }
</style>