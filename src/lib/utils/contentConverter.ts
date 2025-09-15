// Advanced content conversion utilities with data loss minimization
import { createMarkdownProcessor } from "./markdown.js";
import { createHtmlProcessor } from "./html.js";

export interface ConversionOptions {
  preserveWhitespace?: boolean;
  preserveComments?: boolean;
  preserveUnknownTags?: boolean;
  enableFallback?: boolean;
}

export interface ConversionResult {
  content: string;
  warnings: string[];
  dataLoss: boolean;
  originalLength: number;
  convertedLength: number;
}

export interface ContentConverter {
  htmlToMarkdown: (
    html: string,
    options?: ConversionOptions,
  ) => ConversionResult;
  markdownToHtml: (
    markdown: string,
    options?: ConversionOptions,
  ) => ConversionResult;
  detectContentType: (
    content: string,
  ) => "html" | "markdown" | "mixed" | "plain";
  validateConversion: (
    original: string,
    converted: string,
    fromType: string,
    toType: string,
  ) => boolean;
}

export function createContentConverter(): ContentConverter {
  const markdownProcessor = createMarkdownProcessor();
  const htmlProcessor = createHtmlProcessor();

  return {
    htmlToMarkdown: (html: string, options: ConversionOptions = {}) => {
      const warnings: string[] = [];
      let dataLoss = false;
      const originalLength = html.length;

      try {
        // Pre-process HTML to handle special cases
        let processedHtml = html;

        // Preserve HTML comments if requested
        if (options.preserveComments) {
          const comments = html.match(/<!--[\s\S]*?-->/g) || [];
          comments.forEach((comment, index) => {
            processedHtml = processedHtml.replace(
              comment,
              `__COMMENT_${index}__`,
            );
          });
        }

        // Detect and warn about potential data loss
        const complexElements = [
          "style",
          "script",
          "form",
          "input",
          "button",
          "select",
          "textarea",
          "canvas",
          "svg",
          "video",
          "audio",
          "iframe",
          "object",
          "embed",
        ];

        complexElements.forEach((element) => {
          const regex = new RegExp(`<${element}[^>]*>`, "gi");
          if (regex.test(html)) {
            warnings.push(
              `Complex element '${element}' detected - may lose functionality in Markdown`,
            );
            dataLoss = true;
          }
        });

        // Check for CSS styles that will be lost
        if (html.includes("style=")) {
          warnings.push(
            "Inline styles detected - will be lost in Markdown conversion",
          );
          dataLoss = true;
        }

        // Convert using HTML processor
        let markdown = htmlProcessor.toMarkdown(processedHtml);

        // Post-process to restore preserved elements
        if (options.preserveComments) {
          const comments = html.match(/<!--[\s\S]*?-->/g) || [];
          comments.forEach((comment, index) => {
            markdown = markdown.replace(`__COMMENT_${index}__`, comment);
          });
        }

        // Handle unknown tags if preservation is requested
        if (options.preserveUnknownTags) {
          // Keep certain HTML tags that don't have Markdown equivalents
          const preserveTags = [
            "sup",
            "sub",
            "mark",
            "kbd",
            "var",
            "samp",
            "details",
            "summary",
          ];
          preserveTags.forEach((tag) => {
            const regex = new RegExp(
              `&lt;${tag}[^&]*&gt;(.*?)&lt;/${tag}&gt;`,
              "gi",
            );
            markdown = markdown.replace(regex, `<${tag}>$1</${tag}>`);
          });
        }

        return {
          content: markdown,
          warnings,
          dataLoss,
          originalLength,
          convertedLength: markdown.length,
        };
      } catch (error) {
        warnings.push(
          `Conversion error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );

        if (options.enableFallback !== false) {
          // Fallback: return original content with warning
          return {
            content: html,
            warnings: [
              ...warnings,
              "Conversion failed, returning original HTML",
            ],
            dataLoss: true,
            originalLength,
            convertedLength: html.length,
          };
        }

        throw error;
      }
    },

    markdownToHtml: (markdown: string, options: ConversionOptions = {}) => {
      const warnings: string[] = [];
      const dataLoss = false;
      const originalLength = markdown.length;

      try {
        // Pre-process Markdown to handle special cases
        const processedMarkdown = markdown;

        // Detect potential issues
        if (markdown.includes("<") && markdown.includes(">")) {
          warnings.push(
            "HTML tags detected in Markdown - may affect rendering",
          );
        }

        // Check for complex Markdown features that might not convert perfectly
        const complexFeatures = [
          { pattern: /\[.*\]\(.*\s+".*"\)/, message: "Link titles detected" },
          { pattern: /!\[.*\]\(.*\s+".*"\)/, message: "Image titles detected" },
          { pattern: /^\s*\|.*\|.*$/m, message: "Tables detected" },
          { pattern: /^```[\s\S]*?```$/m, message: "Code blocks detected" },
          { pattern: /^\s*- \[[ x]\]/m, message: "Task lists detected" },
        ];

        complexFeatures.forEach(({ pattern, message }) => {
          if (pattern.test(markdown)) {
            warnings.push(message);
          }
        });

        // Convert using Markdown processor
        let html = markdownProcessor.toHtml(processedMarkdown);

        // Sanitize the result
        html = markdownProcessor.sanitize(html);

        return {
          content: html,
          warnings,
          dataLoss,
          originalLength,
          convertedLength: html.length,
        };
      } catch (error) {
        warnings.push(
          `Conversion error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );

        if (options.enableFallback !== false) {
          // Fallback: return original content with warning
          return {
            content: markdown,
            warnings: [
              ...warnings,
              "Conversion failed, returning original Markdown",
            ],
            dataLoss: true,
            originalLength,
            convertedLength: markdown.length,
          };
        }

        throw error;
      }
    },

    detectContentType: (content: string) => {
      const trimmed = content.trim();

      if (!trimmed) return "plain";

      // Check for HTML tags
      const htmlTagCount = (trimmed.match(/<[^>]+>/g) || []).length;
      const markdownPatterns = [
        /^#{1,6}\s+/m, // Headers
        /\*\*.*?\*\*/, // Bold
        /\*.*?\*/, // Italic
        /\[.*?\]\(.*?\)/, // Links
        /!\[.*?\]\(.*?\)/, // Images
        /^[-*+]\s+/m, // Lists
        /^\d+\.\s+/m, // Numbered lists
        /^```/m, // Code blocks
        /^>/m, // Blockquotes
      ];

      const markdownMatches = markdownPatterns.reduce((count, pattern) => {
        return count + (pattern.test(trimmed) ? 1 : 0);
      }, 0);

      // Determine content type based on patterns
      if (htmlTagCount > 0 && markdownMatches > 0) {
        return "mixed";
      } else if (htmlTagCount > 0) {
        return "html";
      } else if (markdownMatches > 0) {
        return "markdown";
      } else {
        return "plain";
      }
    },

    validateConversion: (
      original: string,
      converted: string,
      fromType: string,
      toType: string,
    ) => {
      // Basic validation checks
      if (!converted || converted.trim().length === 0) {
        return false;
      }

      // Check if conversion resulted in significant content loss
      const originalWords = original
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      const convertedWords = converted
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      // Allow up to 10% word count difference
      const wordCountDifference =
        Math.abs(originalWords - convertedWords) / originalWords;
      if (wordCountDifference > 0.1) {
        console.warn(
          `Significant word count difference detected: ${(wordCountDifference * 100).toFixed(1)}%`,
        );
      }

      // Check for basic structure preservation
      if (fromType === "html" && toType === "markdown") {
        // Check if headers were preserved
        const originalHeaders = (original.match(/<h[1-6][^>]*>/gi) || [])
          .length;
        const convertedHeaders = (converted.match(/^#{1,6}\s+/gm) || []).length;

        if (originalHeaders > 0 && convertedHeaders === 0) {
          console.warn("Headers may not have been converted properly");
        }
      }

      return true;
    },
  };
}

// Utility function to get conversion statistics
export function getConversionStats(result: ConversionResult): string {
  const stats = [
    `Original: ${result.originalLength} chars`,
    `Converted: ${result.convertedLength} chars`,
    `Data loss: ${result.dataLoss ? "Yes" : "No"}`,
  ];

  if (result.warnings.length > 0) {
    stats.push(`Warnings: ${result.warnings.length}`);
  }

  return stats.join(", ");
}
