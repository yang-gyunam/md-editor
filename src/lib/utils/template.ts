// Template processing and variable substitution utilities

import type { Template, TemplateVariable } from "../types/index.js";

export interface TemplateProcessingResult {
  content: string;
  cursorPosition?: number;
  placeholders: Array<{
    start: number;
    end: number;
    variable: TemplateVariable;
  }>;
}

/**
 * Process a template by substituting variables and handling placeholders
 */
export function processTemplate(
  template: Template,
  variables?: Record<string, string>,
): TemplateProcessingResult {
  let content = template.content;
  const placeholders: TemplateProcessingResult["placeholders"] = [];
  let cursorPosition: number | undefined;

  // Handle cursor position marker
  const cursorMarker = "{{cursor}}";
  const cursorIndex = content.indexOf(cursorMarker);
  if (cursorIndex !== -1) {
    content = content.replace(cursorMarker, "");
    cursorPosition = cursorIndex;
  }

  // Process template variables
  if (template.variables) {
    for (const variable of template.variables) {
      const variablePattern = new RegExp(`{{${variable.name}}}`, "g");
      const providedValue = variables?.[variable.name];
      const value =
        providedValue ?? variable.defaultValue ?? variable.placeholder;

      let match;
      while ((match = variablePattern.exec(content)) !== null) {
        const start = match.index;
        const end = start + value.length;

        // If no value was provided, mark as placeholder for user input
        if (!providedValue && !variable.defaultValue) {
          placeholders.push({
            start,
            end,
            variable,
          });
        }

        // Adjust cursor position if it's after this replacement
        if (cursorPosition !== undefined && cursorPosition > match.index) {
          cursorPosition += value.length - match[0].length;
        }
      }

      content = content.replace(variablePattern, value);
    }
  }

  return {
    content,
    cursorPosition,
    placeholders,
  };
}

/**
 * Extract variables from template content
 */
export function extractTemplateVariables(content: string): string[] {
  const variablePattern = /{{(\w+)}}/g;
  const variables: string[] = [];
  let match;

  while ((match = variablePattern.exec(content)) !== null) {
    const variableName = match[1];
    if (variableName !== "cursor" && !variables.includes(variableName)) {
      variables.push(variableName);
    }
  }

  return variables;
}

/**
 * Validate template content for proper variable syntax
 */
export function validateTemplate(content: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for unmatched braces
  const openBraces = (content.match(/{{/g) || []).length;
  const closeBraces = (content.match(/}}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push("Unmatched template variable braces");
  }

  // Check for invalid variable names
  const variablePattern = /{{(\w*)}}/g;
  let match;
  while ((match = variablePattern.exec(content)) !== null) {
    const variableName = match[1];
    if (!variableName) {
      errors.push("Empty variable name found");
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variableName)) {
      errors.push(`Invalid variable name: ${variableName}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create default templates for common use cases
 */
export function getDefaultTemplates(): Template[] {
  return [
    {
      id: "markdown-header",
      name: "Markdown Header",
      description: "Create a markdown header with optional description",
      content: "# {{title}}\n\n{{description}}\n\n{{cursor}}",
      variables: [
        { name: "title", placeholder: "Header Title" },
        {
          name: "description",
          placeholder: "Optional description",
          defaultValue: "",
        },
      ],
      category: "Markdown",
    },
    {
      id: "code-block",
      name: "Code Block",
      description: "Insert a code block with language specification",
      content: "```{{language}}\n{{code}}\n```\n\n{{cursor}}",
      variables: [
        {
          name: "language",
          placeholder: "javascript",
          defaultValue: "javascript",
        },
        { name: "code", placeholder: "Your code here" },
      ],
      category: "Code",
    },
    {
      id: "html-div",
      name: "HTML Div",
      description: "Create a div element with class and content",
      content: '<div class="{{className}}">{{content}}</div>{{cursor}}',
      variables: [
        { name: "className", placeholder: "container" },
        { name: "content", placeholder: "Content here" },
      ],
      category: "HTML",
    },
    {
      id: "table-markdown",
      name: "Markdown Table",
      description: "Create a basic markdown table",
      content:
        "| {{header1}} | {{header2}} | {{header3}} |\n|-------------|-------------|-------------|\n| {{cell1}} | {{cell2}} | {{cell3}} |\n\n{{cursor}}",
      variables: [
        { name: "header1", placeholder: "Header 1" },
        { name: "header2", placeholder: "Header 2" },
        { name: "header3", placeholder: "Header 3" },
        { name: "cell1", placeholder: "Cell 1" },
        { name: "cell2", placeholder: "Cell 2" },
        { name: "cell3", placeholder: "Cell 3" },
      ],
      category: "Markdown",
    },
    {
      id: "link-markdown",
      name: "Markdown Link",
      description: "Insert a markdown link",
      content: "[{{text}}]({{url}}){{cursor}}",
      variables: [
        { name: "text", placeholder: "Link text" },
        { name: "url", placeholder: "https://example.com" },
      ],
      category: "Markdown",
    },
  ];
}
