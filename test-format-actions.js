// Test script to verify format actions implementation
import {
  applyFormatAction,
  getFormatState,
  canApplyFormat,
} from "./src/lib/utils/formatActions.js";
import { MARKDOWN_ACTIONS, HTML_ACTIONS } from "./src/lib/types/toolbar.js";

console.log("Testing Format Actions Implementation...\n");

// Test 1: Markdown Bold Action
console.log("1. Testing Markdown Bold Action:");
const boldAction = MARKDOWN_ACTIONS.bold;
const context = {
  content: "Hello world",
  selection: { start: 6, end: 11, text: "world" },
  cursorPosition: 6,
};

const boldResult = applyFormatAction(boldAction, context);
console.log("Input:", context.content);
console.log("Output:", boldResult.content);
console.log("Expected: Hello **world**");
console.log("✓ Bold action works:", boldResult.content === "Hello **world**");
console.log("");

// Test 2: HTML Bold Action
console.log("2. Testing HTML Bold Action:");
const htmlBoldAction = HTML_ACTIONS.bold;
const htmlBoldResult = applyFormatAction(htmlBoldAction, context);
console.log("Input:", context.content);
console.log("Output:", htmlBoldResult.content);
console.log("Expected: Hello <strong>world</strong>");
console.log(
  "✓ HTML bold action works:",
  htmlBoldResult.content === "Hello <strong>world</strong>",
);
console.log("");

// Test 3: Markdown Header Action
console.log("3. Testing Markdown Header Action:");
const headerAction = MARKDOWN_ACTIONS.header1;
const headerContext = {
  content: "Hello world\nSecond line",
  selection: { start: 12, end: 12, text: "" },
  cursorPosition: 12,
};

const headerResult = applyFormatAction(headerAction, headerContext);
console.log("Input:", headerContext.content);
console.log("Output:", headerResult.content);
console.log("Expected: Hello world\\n# Header 1Second line");
console.log(
  "✓ Header action works:",
  headerResult.content.includes("# Header 1"),
);
console.log("");

// Test 4: Format State Detection
console.log("4. Testing Format State Detection:");
const activeContext = {
  content: "Hello **world**",
  selection: { start: 6, end: 15, text: "**world**" },
  cursorPosition: 6,
};

const isActive = getFormatState(boldAction, activeContext);
console.log("Content:", activeContext.content);
console.log("Selection:", activeContext.selection.text);
console.log("✓ Format state detection works:", isActive === true);
console.log("");

// Test 5: Validation
console.log("5. Testing Format Validation:");
const canApply = canApplyFormat(boldAction, context);
console.log("✓ Format validation works:", canApply === true);
console.log("");

// Test 6: All Markdown Actions
console.log("6. Testing All Markdown Actions:");
const markdownActions = Object.keys(MARKDOWN_ACTIONS);
console.log("Available Markdown Actions:", markdownActions);
console.log("✓ All markdown actions defined:", markdownActions.length >= 10);
console.log("");

// Test 7: All HTML Actions
console.log("7. Testing All HTML Actions:");
const htmlActions = Object.keys(HTML_ACTIONS);
console.log("Available HTML Actions:", htmlActions);
console.log("✓ All HTML actions defined:", htmlActions.length >= 10);
console.log("");

console.log("Format Actions Implementation Test Complete!");
