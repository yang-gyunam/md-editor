import { describe, it, expect } from "vitest";
import { createContentConverter } from "./contentConverter.js";

describe("Mode Switch Integration", () => {
  const converter = createContentConverter();

  it("should convert HTML to Markdown and back with minimal data loss", () => {
    const originalHtml = `
      <h1>Hello World</h1>
      <p>This is a <strong>test</strong> paragraph with <em>formatting</em>.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
      <blockquote>This is a quote</blockquote>
    `;

    // Convert HTML to Markdown
    const htmlToMdResult = converter.htmlToMarkdown(originalHtml);
    expect(htmlToMdResult.content).toContain("# Hello World");
    expect(htmlToMdResult.content).toContain("**test**");
    expect(htmlToMdResult.content).toContain("*formatting*");
    expect(htmlToMdResult.content).toContain("- Item 1");
    expect(htmlToMdResult.content).toContain("> This is a quote");

    // Convert back to HTML
    const mdToHtmlResult = converter.markdownToHtml(htmlToMdResult.content);
    expect(mdToHtmlResult.content).toContain("<h1>Hello World</h1>");
    expect(mdToHtmlResult.content).toContain("<strong>test</strong>");
    expect(mdToHtmlResult.content).toContain("<em>formatting</em>");
    expect(mdToHtmlResult.content).toContain("<li>Item 1</li>");
  });

  it("should convert Markdown to HTML and back with minimal data loss", () => {
    const originalMarkdown = `
# Hello World

This is a **test** paragraph with *formatting*.

- Item 1
- Item 2

> This is a quote

[Link](https://example.com)

![Image](image.jpg)
    `;

    // Convert Markdown to HTML
    const mdToHtmlResult = converter.markdownToHtml(originalMarkdown);
    expect(mdToHtmlResult.content).toContain("<h1>Hello World</h1>");
    expect(mdToHtmlResult.content).toContain("<strong>test</strong>");
    expect(mdToHtmlResult.content).toContain("<em>formatting</em>");
    expect(mdToHtmlResult.content).toContain("<li>Item 1</li>");
    expect(mdToHtmlResult.content).toContain(
      '<a href="https://example.com">Link</a>',
    );
    expect(mdToHtmlResult.content).toContain(
      '<img src="image.jpg" alt="Image">',
    );

    // Convert back to Markdown
    const htmlToMdResult = converter.htmlToMarkdown(mdToHtmlResult.content);
    expect(htmlToMdResult.content).toContain("# Hello World");
    expect(htmlToMdResult.content).toContain("**test**");
    expect(htmlToMdResult.content).toContain("*formatting*");
    expect(htmlToMdResult.content).toContain("- Item 1");
    expect(htmlToMdResult.content).toContain("[Link](https://example.com)");
    expect(htmlToMdResult.content).toContain("![Image](image.jpg)");
  });

  it("should handle complex HTML structures", () => {
    const complexHtml = `
      <table>
        <thead>
          <tr><th>Name</th><th>Age</th></tr>
        </thead>
        <tbody>
          <tr><td>John</td><td>30</td></tr>
          <tr><td>Jane</td><td>25</td></tr>
        </tbody>
      </table>
    `;

    const result = converter.htmlToMarkdown(complexHtml);
    expect(result.content).toContain("|");
    expect(result.content).toContain("Name");
    expect(result.content).toContain("Age");
    expect(result.content).toContain("John");
    expect(result.content).toContain("Jane");
  });

  it("should detect content types correctly", () => {
    expect(converter.detectContentType("<p>HTML content</p>")).toBe("html");
    expect(converter.detectContentType("# Markdown content")).toBe("markdown");
    expect(converter.detectContentType("# Mixed <p>content</p>")).toBe("mixed");
    expect(converter.detectContentType("Plain text content")).toBe("plain");
  });

  it("should provide conversion warnings for complex elements", () => {
    const htmlWithScript =
      '<div><script>alert("test")</script><p>Content</p></div>';
    const result = converter.htmlToMarkdown(htmlWithScript);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.dataLoss).toBe(true);
    expect(result.warnings.some((w) => w.includes("script"))).toBe(true);
  });
});
