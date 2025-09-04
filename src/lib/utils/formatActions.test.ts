import { describe, it, expect } from "vitest";
import {
  applyFormatAction,
  getFormatState,
  canApplyFormat,
  TextSelectionUtils,
  FORMAT_PRESETS,
  type FormatContext,
  type TextSelection,
} from "./formatActions.js";
import type { FormatAction } from "../types/index.js";

describe("Format Actions", () => {
  describe("Wrap Actions", () => {
    it("should wrap selected text with bold formatting", () => {
      const action: FormatAction = {
        type: "wrap",
        before: "**",
        after: "**",
        placeholder: "bold text",
      };

      const context: FormatContext = {
        content: "Hello world",
        selection: { start: 6, end: 11, text: "world" },
        cursorPosition: 6,
      };

      const result = applyFormatAction(action, context);

      expect(result.content).toBe("Hello **world**");
      expect(result.cursorPosition).toBe(15);
      expect(result.selectionStart).toBe(8);
      expect(result.selectionEnd).toBe(13);
    });

    it("should insert placeholder when no text selected", () => {
      const action: FormatAction = {
        type: "wrap",
        before: "**",
        after: "**",
        placeholder: "bold text",
      };

      const context: FormatContext = {
        content: "Hello world",
        selection: { start: 6, end: 6, text: "" },
        cursorPosition: 6,
      };

      const result = applyFormatAction(action, context);

      expect(result.content).toBe("Hello **bold text**world");
      expect(result.cursorPosition).toBe(8);
      expect(result.selectionStart).toBe(8);
      expect(result.selectionEnd).toBe(17);
    });

    it("should handle HTML wrap formatting", () => {
      const action: FormatAction = {
        type: "wrap",
        before: "<strong>",
        after: "</strong>",
        placeholder: "bold text",
      };

      const context: FormatContext = {
        content: "Hello world",
        selection: { start: 6, end: 11, text: "world" },
        cursorPosition: 6,
      };

      const result = applyFormatAction(action, context);

      expect(result.content).toBe("Hello <strong>world</strong>");
      expect(result.cursorPosition).toBe(28);
    });
  });

  describe("Insert Actions", () => {
    it("should insert header formatting at line start", () => {
      const action: FormatAction = {
        type: "insert",
        before: "# ",
        placeholder: "Header 1",
      };

      const context: FormatContext = {
        content: "Hello world\nSecond line",
        selection: { start: 12, end: 12, text: "" },
        cursorPosition: 12,
      };

      const result = applyFormatAction(action, context);

      expect(result.content).toBe("Hello world\n# Header 1Second line");
      expect(result.cursorPosition).toBe(14);
    });

    it("should format multiple selected lines", () => {
      const action: FormatAction = {
        type: "insert",
        before: "- ",
        placeholder: "",
      };

      const context: FormatContext = {
        content: "First line\nSecond line\nThird line",
        selection: { start: 11, end: 22, text: "Second line" },
        cursorPosition: 11,
      };

      const result = applyFormatAction(action, context);

      expect(result.content).toBe("First line\n- Second line\nThird line");
    });

    it("should remove formatting if already present", () => {
      const action: FormatAction = {
        type: "insert",
        before: "# ",
        placeholder: "Header",
      };

      const context: FormatContext = {
        content: "# Already a header",
        selection: { start: 5, end: 5, text: "" },
        cursorPosition: 5,
      };

      const result = applyFormatAction(action, context);

      expect(result.content).toBe("Already a header");
      expect(result.cursorPosition).toBe(3); // Adjusted for removed formatting
    });
  });

  describe("Replace Actions", () => {
    it("should replace selected text", () => {
      const action: FormatAction = {
        type: "replace",
        before: "REPLACED: ",
        placeholder: "new text",
      };

      const context: FormatContext = {
        content: "Hello world",
        selection: { start: 6, end: 11, text: "world" },
        cursorPosition: 6,
      };

      const result = applyFormatAction(action, context);

      expect(result.content).toBe("Hello REPLACED: new text");
      expect(result.cursorPosition).toBe(24);
    });

    it("should insert at cursor when no selection", () => {
      const action: FormatAction = {
        type: "replace",
        before: "INSERT: ",
        placeholder: "text",
      };

      const context: FormatContext = {
        content: "Hello world",
        selection: { start: 6, end: 6, text: "" },
        cursorPosition: 6,
      };

      const result = applyFormatAction(action, context);

      expect(result.content).toBe("Hello INSERT: textworld");
      expect(result.cursorPosition).toBe(14);
    });
  });

  describe("Format State Detection", () => {
    it("should detect active wrap formatting", () => {
      const action: FormatAction = {
        type: "wrap",
        before: "**",
        after: "**",
      };

      const context: FormatContext = {
        content: "Hello **world**",
        selection: { start: 6, end: 15, text: "**world**" },
        cursorPosition: 6,
      };

      expect(getFormatState(action, context)).toBe(true);
    });

    it("should detect active insert formatting", () => {
      const action: FormatAction = {
        type: "insert",
        before: "# ",
      };

      const context: FormatContext = {
        content: "# Header text",
        selection: { start: 2, end: 2, text: "" },
        cursorPosition: 2,
      };

      expect(getFormatState(action, context)).toBe(true);
    });

    it("should detect inactive formatting", () => {
      const action: FormatAction = {
        type: "wrap",
        before: "**",
        after: "**",
      };

      const context: FormatContext = {
        content: "Hello world",
        selection: { start: 6, end: 11, text: "world" },
        cursorPosition: 6,
      };

      expect(getFormatState(action, context)).toBe(false);
    });
  });

  describe("Format Validation", () => {
    it("should validate format action can be applied", () => {
      const action: FormatAction = {
        type: "wrap",
        before: "**",
        after: "**",
      };

      const validContext: FormatContext = {
        content: "Hello world",
        selection: { start: 6, end: 11, text: "world" },
        cursorPosition: 6,
      };

      expect(canApplyFormat(action, validContext)).toBe(true);
    });

    it("should reject invalid context", () => {
      const action: FormatAction = {
        type: "wrap",
        before: "**",
        after: "**",
      };

      const invalidContext = {
        content: undefined,
        selection: undefined,
        cursorPosition: 0,
      } as any;

      expect(canApplyFormat(action, invalidContext)).toBe(false);
    });
  });

  describe("Text Selection Utils", () => {
    describe("expandToWordBoundaries", () => {
      it("should expand selection to word boundaries", () => {
        const content = "Hello world test";
        const selection: TextSelection = { start: 7, end: 10, text: "orl" };

        const expanded = TextSelectionUtils.expandToWordBoundaries(
          content,
          selection,
        );

        expect(expanded.start).toBe(6);
        expect(expanded.end).toBe(11);
        expect(expanded.text).toBe("world");
      });

      it("should handle selection at word boundaries", () => {
        const content = "Hello world test";
        const selection: TextSelection = { start: 6, end: 11, text: "world" };

        const expanded = TextSelectionUtils.expandToWordBoundaries(
          content,
          selection,
        );

        expect(expanded.start).toBe(6);
        expect(expanded.end).toBe(11);
        expect(expanded.text).toBe("world");
      });
    });

    describe("expandToLineBoundaries", () => {
      it("should expand selection to line boundaries", () => {
        const content = "First line\nSecond line\nThird line";
        const selection: TextSelection = { start: 15, end: 20, text: "ond l" };

        const expanded = TextSelectionUtils.expandToLineBoundaries(
          content,
          selection,
        );

        expect(expanded.start).toBe(11);
        expect(expanded.end).toBe(22);
        expect(expanded.text).toBe("Second line");
      });
    });

    describe("getCurrentLineInfo", () => {
      it("should get current line information", () => {
        const content = "First line\nSecond line\nThird line";
        const cursorPosition = 15; // Middle of "Second line"

        const lineInfo = TextSelectionUtils.getCurrentLineInfo(
          content,
          cursorPosition,
        );

        expect(lineInfo.lineNumber).toBe(2);
        expect(lineInfo.columnNumber).toBe(4);
        expect(lineInfo.lineContent).toBe("Second line");
        expect(lineInfo.lineStart).toBe(11);
        expect(lineInfo.lineEnd).toBe(22);
        expect(lineInfo.isEmptyLine).toBe(false);
      });

      it("should handle empty lines", () => {
        const content = "First line\n\nThird line";
        const cursorPosition = 11; // On empty line

        const lineInfo = TextSelectionUtils.getCurrentLineInfo(
          content,
          cursorPosition,
        );

        expect(lineInfo.lineNumber).toBe(2);
        expect(lineInfo.isEmptyLine).toBe(true);
      });
    });
  });

  describe("Format Presets", () => {
    it("should toggle bold formatting in markdown", () => {
      const context: FormatContext = {
        content: "Hello world",
        selection: { start: 6, end: 11, text: "world" },
        cursorPosition: 6,
      };

      const result = FORMAT_PRESETS.toggleBold(context, "markdown");

      expect(result.content).toBe("Hello **world**");
    });

    it("should toggle bold formatting in HTML", () => {
      const context: FormatContext = {
        content: "Hello world",
        selection: { start: 6, end: 11, text: "world" },
        cursorPosition: 6,
      };

      const result = FORMAT_PRESETS.toggleBold(context, "html");

      expect(result.content).toBe("Hello <strong>world</strong>");
    });

    it("should remove bold formatting when already applied", () => {
      const context: FormatContext = {
        content: "Hello **world**",
        selection: { start: 6, end: 15, text: "**world**" },
        cursorPosition: 6,
      };

      const result = FORMAT_PRESETS.toggleBold(context, "markdown");

      expect(result.content).toBe("Hello world");
    });
  });

  describe("Error Handling", () => {
    it("should throw error for unknown action type", () => {
      const invalidAction = {
        type: "unknown",
        before: "**",
      } as any;

      const context: FormatContext = {
        content: "Hello world",
        selection: { start: 6, end: 11, text: "world" },
        cursorPosition: 6,
      };

      expect(() => applyFormatAction(invalidAction, context)).toThrow(
        "Unknown format action type: unknown",
      );
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle nested formatting", () => {
      const action: FormatAction = {
        type: "wrap",
        before: "_",
        after: "_",
        placeholder: "italic",
      };

      // The content is 'Hello **bold world**'
      // Positions:    01234567890123456789
      // We want to select 'bold' which is at positions 8-12
      const context: FormatContext = {
        content: "Hello **bold world**",
        selection: { start: 8, end: 12, text: "bold" },
        cursorPosition: 8,
      };

      const result = applyFormatAction(action, context);

      expect(result.content).toBe("Hello **_bold_ world**");
    });

    it("should handle multiline selections", () => {
      const action: FormatAction = {
        type: "insert",
        before: "> ",
        placeholder: "",
      };

      const context: FormatContext = {
        content: "First line\nSecond line\nThird line",
        selection: { start: 0, end: 22, text: "First line\nSecond line" },
        cursorPosition: 0,
      };

      const result = applyFormatAction(action, context);

      expect(result.content).toBe("> First line\n> Second line\nThird line");
    });

    it("should preserve whitespace in formatting", () => {
      const action: FormatAction = {
        type: "wrap",
        before: "`",
        after: "`",
        placeholder: "code",
      };

      const context: FormatContext = {
        content: "Hello   world   test",
        selection: { start: 5, end: 15, text: "   world  " },
        cursorPosition: 5,
      };

      const result = applyFormatAction(action, context);

      expect(result.content).toBe("Hello`   world  ` test");
    });
  });
});
