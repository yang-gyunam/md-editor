# HTML Markdown Editor - User Guide

A comprehensive guide for using the HTML Markdown Editor, a powerful dual-mode editor that seamlessly switches between HTML and Markdown with real-time preview.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Basic Usage](#basic-usage)
4. [Switching Between Modes](#switching-between-modes)
5. [Using Templates](#using-templates)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Formatting Content](#formatting-content)
8. [Working with Images](#working-with-images)
9. [Tables and Lists](#tables-and-lists)
10. [Code Blocks](#code-blocks)
11. [Advanced Features](#advanced-features)
12. [Customization](#customization)
13. [Troubleshooting](#troubleshooting)
14. [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

### What is HTML Markdown Editor?

The HTML Markdown Editor is a versatile text editor that allows you to write content in both HTML and Markdown formats. It provides:

- **Dual-mode editing**: Switch seamlessly between HTML and Markdown
- **Live preview**: See your formatted content in real-time
- **Template system**: Quick content insertion with slash commands
- **Rich formatting**: Comprehensive formatting tools
- **Accessibility**: Full keyboard navigation support

### First Steps

1. **Open the editor** - The editor loads with a clean interface
2. **Choose your mode** - Select HTML or Markdown mode from the toolbar
3. **Start writing** - Begin typing your content
4. **Use the preview** - Watch your content render in real-time on the right panel

## Interface Overview

### Main Components

```
┌─────────────────────────────────────────────────────────────┐
│ [HTML] [Markdown]  [B] [I] [Link] [Image] [List] [Table]    │ ← Toolbar
├─────────────────────────────────────────────────────────────┤
│                    │                                        │
│   Editor Panel     │        Preview Panel                   │
│                    │                                        │
│   Type your        │   See formatted                        │
│   content here     │   output here                          │
│                    │                                        │
│                    │                                        │
└─────────────────────────────────────────────────────────────┘
```

### Toolbar Elements

- **Mode Switcher**: Toggle between HTML and Markdown modes
- **Formatting Tools**: Bold, italic, links, images, lists, tables
- **Template Trigger**: Access templates with the `/` command
- **Theme Toggle**: Switch between light, dark, and auto themes

## Basic Usage

### Writing Your First Content

1. **Start typing** in the editor panel
2. **Use the toolbar** for quick formatting
3. **Watch the preview** update automatically
4. **Switch modes** to see different representations

### Example: Creating a Simple Document

**In Markdown mode:**

```markdown
# My First Document

This is a **bold** statement and this is _italic_.

## Features I Love

- Real-time preview
- Easy formatting
- Template support

[Visit our website](https://example.com)
```

**In HTML mode:**

```html
<h1>My First Document</h1>

<p>This is a <strong>bold</strong> statement and this is <em>italic</em>.</p>

<h2>Features I Love</h2>

<ul>
  <li>Real-time preview</li>
  <li>Easy formatting</li>
  <li>Template support</li>
</ul>

<p><a href="https://example.com">Visit our website</a></p>
```

## Switching Between Modes

### When to Use Each Mode

**Markdown Mode** - Best for:

- Quick writing and note-taking
- Documentation
- Blog posts
- README files
- Simple formatting needs

**HTML Mode** - Best for:

- Complex layouts
- Custom styling
- Precise control over formatting
- Web content creation
- Advanced HTML features

### Seamless Conversion

The editor automatically converts content between modes:

1. **Markdown to HTML**: Converts Markdown syntax to HTML tags
2. **HTML to Markdown**: Converts HTML tags back to Markdown syntax
3. **Preservation**: Maintains formatting and structure during conversion

## Using Templates

### Accessing Templates

Templates provide quick content insertion for common document structures.

**Method 1: Slash Commands**

1. Type `/` in the editor
2. Browse available templates
3. Select your desired template
4. Fill in the variables

**Method 2: Toolbar**

1. Click the template button in the toolbar
2. Choose from the template library
3. Customize the content

### Built-in Templates

#### Blog Post Template

```markdown
# {{title}}

_Published on {{date}} by {{author}}_

{{content}}

## Conclusion

{{conclusion}}
```

#### Meeting Notes Template

```markdown
# Meeting Notes - {{date}}

**Attendees:** {{attendees}}
**Duration:** {{duration}}

## Agenda

{{agenda}}

## Discussion Points

{{discussion}}

## Action Items

- [ ] {{action1}}
- [ ] {{action2}}

## Next Meeting

**Date:** {{next_date}}
**Topics:** {{next_topics}}
```

#### API Documentation Template

````markdown
## {{method}} {{endpoint}}

### Description

{{description}}

### Parameters

| Parameter | Type     | Required     | Description    |
| --------- | -------- | ------------ | -------------- |
| {{param}} | {{type}} | {{required}} | {{param_desc}} |

### Response

```json
{{response}}
```
````

### Example

```bash
curl -X {{method}} "{{base_url}}{{endpoint}}"
```

````

## Keyboard Shortcuts

### Universal Shortcuts (Both Modes)

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+B` / `Cmd+B` | **Bold** | Make selected text bold |
| `Ctrl+I` / `Cmd+I` | *Italic* | Make selected text italic |
| `Ctrl+K` / `Cmd+K` | Link | Insert or edit link |
| `Ctrl+Z` / `Cmd+Z` | Undo | Undo last action |
| `Ctrl+Y` / `Cmd+Y` | Redo | Redo last undone action |
| `Ctrl+S` / `Cmd+S` | Save | Save content (if enabled) |
| `Ctrl+/` / `Cmd+/` | Comment | Toggle comment |
| `Tab` | Navigate | Move to next element |
| `Shift+Tab` | Navigate Back | Move to previous element |
| `Escape` | Close | Close popups/dialogs |

### Template and Snippet Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `/` | Templates | Open template selector |
| `Ctrl+Space` | Snippets | Open snippet manager |
| `Ctrl+Shift+T` | Template | Quick template insertion |

### Navigation Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Home` | Top | Go to document start |
| `Ctrl+End` | Bottom | Go to document end |
| `Ctrl+F` | Find | Open find dialog |
| `Ctrl+G` | Go to Line | Jump to specific line |

## Formatting Content

### Text Formatting

#### In Markdown Mode:
```markdown
**Bold text**
*Italic text*
***Bold and italic***
~~Strikethrough~~
`Inline code`
````

#### In HTML Mode:

```html
<strong>Bold text</strong>
<em>Italic text</em>
<strong><em>Bold and italic</em></strong>
<del>Strikethrough</del>
<code>Inline code</code>
```

### Headings

#### Markdown:

```markdown
# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6
```

#### HTML:

```html
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<h3>Heading 3</h3>
<h4>Heading 4</h4>
<h5>Heading 5</h5>
<h6>Heading 6</h6>
```

### Links

#### Markdown:

```markdown
[Link text](https://example.com)
[Link with title](https://example.com "Title")
<https://example.com>
```

#### HTML:

```html
<a href="https://example.com">Link text</a>
<a href="https://example.com" title="Title">Link with title</a>
<a href="https://example.com">https://example.com</a>
```

## Working with Images

### Basic Image Insertion

#### Markdown:

```markdown
![Alt text](image.jpg)
![Alt text](image.jpg "Image title")
```

#### HTML:

```html
<img src="image.jpg" alt="Alt text" />
<img src="image.jpg" alt="Alt text" title="Image title" />
```

### Image with Links

#### Markdown:

```markdown
[![Alt text](image.jpg)](https://example.com)
```

#### HTML:

```html
<a href="https://example.com">
  <img src="image.jpg" alt="Alt text" />
</a>
```

### Responsive Images

#### HTML:

```html
<img src="image.jpg" alt="Alt text" style="max-width: 100%; height: auto;" />
```

## Tables and Lists

### Creating Tables

#### Markdown:

```markdown
| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

| Left | Center | Right |
| :--- | :----: | ----: |
| L1   |   C1   |    R1 |
| L2   |   C2   |    R2 |
```

#### HTML:

```html
<table>
  <thead>
    <tr>
      <th>Header 1</th>
      <th>Header 2</th>
      <th>Header 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Cell 1</td>
      <td>Cell 2</td>
      <td>Cell 3</td>
    </tr>
    <tr>
      <td>Cell 4</td>
      <td>Cell 5</td>
      <td>Cell 6</td>
    </tr>
  </tbody>
</table>
```

### Creating Lists

#### Unordered Lists

**Markdown:**

```markdown
- Item 1
- Item 2
  - Nested item 1
  - Nested item 2
- Item 3
```

**HTML:**

```html
<ul>
  <li>Item 1</li>
  <li>
    Item 2
    <ul>
      <li>Nested item 1</li>
      <li>Nested item 2</li>
    </ul>
  </li>
  <li>Item 3</li>
</ul>
```

#### Ordered Lists

**Markdown:**

```markdown
1. First item
2. Second item
   1. Nested first
   2. Nested second
3. Third item
```

**HTML:**

```html
<ol>
  <li>First item</li>
  <li>
    Second item
    <ol>
      <li>Nested first</li>
      <li>Nested second</li>
    </ol>
  </li>
  <li>Third item</li>
</ol>
```

#### Task Lists

**Markdown:**

```markdown
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
```

## Code Blocks

### Inline Code

#### Markdown:

```markdown
Use `console.log()` to print output.
```

#### HTML:

```html
Use <code>console.log()</code> to print output.
```

### Code Blocks

#### Markdown:

````markdown
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}

greet("World");
```
````

#### HTML:

```html
<pre><code class="language-javascript">
function greet(name) {
  console.log(`Hello, ${name}!`);
}

greet('World');
</code></pre>
```

### Supported Languages

The editor supports syntax highlighting for:

- JavaScript/TypeScript
- Python
- Java
- C/C++
- HTML/CSS
- SQL
- JSON
- YAML
- Bash/Shell
- And many more...

## Advanced Features

### Blockquotes

#### Markdown:

```markdown
> This is a blockquote.
>
> It can span multiple lines.
>
> > Nested blockquotes are also supported.
```

#### HTML:

```html
<blockquote>
  <p>This is a blockquote.</p>
  <p>It can span multiple lines.</p>
  <blockquote>
    <p>Nested blockquotes are also supported.</p>
  </blockquote>
</blockquote>
```

### Horizontal Rules

#### Markdown:

```markdown
---
---

---
```

#### HTML:

```html
<hr />
```

### Line Breaks

#### Markdown:

```markdown
Line 1  
Line 2 (two spaces at end of Line 1)

Line 3

Line 4 (blank line creates paragraph break)
```

#### HTML:

```html
<p>
  Line 1<br />
  Line 2
</p>

<p>Line 3</p>

<p>Line 4</p>
```

### Escape Characters

#### Markdown:

```markdown
\*Not italic\*
\[Not a link\]
\# Not a heading
```

## Customization

### Theme Selection

The editor supports three themes:

1. **Light Theme** - Clean, bright interface
2. **Dark Theme** - Easy on the eyes for low-light environments
3. **Auto Theme** - Follows your system preference

**To change themes:**

1. Click the theme toggle in the toolbar
2. Select your preferred theme
3. The editor will remember your choice

### Preview Styling

The preview pane uses GitHub-flavored styling by default, but you can customize it:

1. **GitHub Style** - Familiar GitHub markdown styling
2. **Custom CSS** - Apply your own styles
3. **Print-friendly** - Optimized for printing

### Toolbar Customization

You can show/hide toolbar elements:

- **Full Toolbar** - All formatting options
- **Minimal Toolbar** - Essential tools only
- **Hidden Toolbar** - Clean writing experience

## Troubleshooting

### Common Issues

#### Preview Not Updating

**Problem**: Preview pane doesn't show changes
**Solution**:

- Check if preview is enabled
- Refresh the page
- Clear browser cache

#### Formatting Not Working

**Problem**: Toolbar buttons don't format text
**Solution**:

- Select text before applying formatting
- Check if you're in the correct mode
- Try using keyboard shortcuts

#### Templates Not Loading

**Problem**: Slash commands don't show templates
**Solution**:

- Ensure templates are enabled
- Type `/` and wait a moment
- Check for JavaScript errors in console

#### Performance Issues

**Problem**: Editor is slow with large documents
**Solution**:

- Enable performance mode
- Break large documents into sections
- Use virtual scrolling if available

### Browser Compatibility

**Supported Browsers:**

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**If you experience issues:**

1. Update your browser
2. Disable browser extensions
3. Clear cache and cookies
4. Try incognito/private mode

### Accessibility Issues

**Screen Reader Problems:**

- Ensure screen reader mode is enabled
- Use keyboard navigation
- Check ARIA labels are present

**Keyboard Navigation Issues:**

- Review keyboard shortcuts
- Ensure focus indicators are visible
- Test with Tab navigation

## Tips and Best Practices

### Writing Efficiently

1. **Use Templates** - Save time with common document structures
2. **Learn Shortcuts** - Master keyboard shortcuts for faster editing
3. **Preview Regularly** - Check formatting as you write
4. **Mode Switching** - Use the right mode for your content type

### Content Organization

1. **Use Headings** - Structure your content with proper heading hierarchy
2. **Break Up Text** - Use lists, tables, and blockquotes for readability
3. **Add Links** - Make your content interactive and informative
4. **Include Images** - Visual elements enhance understanding

### Performance Tips

1. **Large Documents** - Break into smaller sections for better performance
2. **Image Optimization** - Use appropriately sized images
3. **Regular Saving** - Save your work frequently
4. **Browser Resources** - Close unnecessary tabs and extensions

### Collaboration

1. **Consistent Formatting** - Establish style guidelines for teams
2. **Template Sharing** - Create shared templates for common documents
3. **Version Control** - Use external tools for version management
4. **Export Options** - Share content in appropriate formats

### Content Quality

1. **Proofread** - Use the preview to catch formatting errors
2. **Accessibility** - Include alt text for images and proper headings
3. **Link Validation** - Ensure all links work correctly
4. **Mobile Testing** - Check how content appears on mobile devices

## Getting Help

### Resources

- **Documentation** - Comprehensive guides and API reference
- **Examples** - Sample code and use cases
- **Community** - Forums and discussion groups
- **Support** - Technical support channels

### Reporting Issues

If you encounter problems:

1. **Check Documentation** - Review this guide and API docs
2. **Search Issues** - Look for existing bug reports
3. **Provide Details** - Include browser, version, and steps to reproduce
4. **Create Report** - Submit detailed bug reports with examples

### Feature Requests

To suggest new features:

1. **Check Roadmap** - See what's already planned
2. **Describe Use Case** - Explain why the feature is needed
3. **Provide Examples** - Show how it would work
4. **Engage Community** - Discuss with other users

---

**Happy writing!** The HTML Markdown Editor is designed to make your content creation experience smooth and efficient. Whether you're writing documentation, blog posts, or any other content, these tools will help you create professional, well-formatted documents with ease.
