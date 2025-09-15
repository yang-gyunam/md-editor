import { describe, it, expect } from "vitest";

describe("Snippet Components Integration", () => {
  it("should import all snippet components without errors", async () => {
    // Test that all components can be imported
    const SnippetManager = await import("./SnippetManager.svelte");
    const SnippetSelector = await import("./SnippetSelector.svelte");
    const SnippetEditor = await import("./SnippetEditor.svelte");
    const SnippetSettings = await import("./SnippetSettings.svelte");

    expect(SnippetManager.default).toBeDefined();
    expect(SnippetSelector.default).toBeDefined();
    expect(SnippetEditor.default).toBeDefined();
    expect(SnippetSettings.default).toBeDefined();
  });

  it("should import all snippet utilities without errors", async () => {
    const snippetUtils = await import("../utils/snippet.js");
    const snippetStorage = await import("../utils/snippetStorage.js");

    expect(snippetUtils.parsePlaceholders).toBeDefined();
    expect(snippetUtils.insertSnippet).toBeDefined();
    expect(snippetUtils.filterSnippets).toBeDefined();
    expect(snippetUtils.validateSnippetShortcut).toBeDefined();

    expect(snippetStorage.loadSnippets).toBeDefined();
    expect(snippetStorage.saveSnippets).toBeDefined();
    expect(snippetStorage.loadSnippetSettings).toBeDefined();
    expect(snippetStorage.saveSnippetSettings).toBeDefined();
  });

  it("should import all snippet types without errors", async () => {
    const types = await import("../types/template.js");

    // These should be available as types (we can't test types directly in runtime,
    // but we can test that the module imports successfully)
    expect(types).toBeDefined();
  });
});
