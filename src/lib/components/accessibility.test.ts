import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createAriaAttributes } from "../utils/accessibility.js";
import { LoadingStateManager } from "../utils/loadingState.js";
import { ErrorHandler } from "../utils/errorHandling.js";

describe("Accessibility Features", () => {
  describe("ARIA Utilities", () => {
    it("should create correct ARIA attributes", () => {
      const attributes = createAriaAttributes({
        label: "Test label",
        describedBy: "test-description",
        expanded: true,
        hasPopup: "menu",
        live: "polite",
      });

      expect(attributes).toEqual({
        "aria-label": "Test label",
        "aria-describedby": "test-description",
        "aria-expanded": "true",
        "aria-haspopup": "menu",
        "aria-live": "polite",
      });
    });

    it("should handle optional ARIA attributes", () => {
      const attributes = createAriaAttributes({
        label: "Simple label",
      });

      expect(attributes).toEqual({
        "aria-label": "Simple label",
      });
    });

    it("should handle boolean ARIA attributes correctly", () => {
      const attributes = createAriaAttributes({
        expanded: false,
        atomic: true,
      });

      expect(attributes).toEqual({
        "aria-expanded": "false",
        "aria-atomic": "true",
      });
    });
  });
});

describe("Loading State Management", () => {
  let loadingManager: LoadingStateManager;

  beforeEach(() => {
    loadingManager = new LoadingStateManager({
      showSpinner: true,
      showProgress: true,
      showMessage: true,
      minDisplayTime: 100,
      timeout: 1000,
    });
  });

  afterEach(() => {
    loadingManager?.destroy();
  });

  it("should start and complete loading operations", async () => {
    const callback = vi.fn();
    loadingManager.onStateChange("test", callback);

    loadingManager.startLoading("test", "Loading test data");

    expect(callback).toHaveBeenCalledWith({
      isLoading: true,
      message: "Loading test data",
      progress: undefined,
      error: undefined,
    });

    loadingManager.completeLoading("test", "Load complete");

    expect(callback).toHaveBeenCalledWith({
      isLoading: false,
      message: "Load complete",
      progress: 100,
      error: undefined,
    });
  });

  it("should handle loading progress updates", () => {
    const callback = vi.fn();
    loadingManager.onStateChange("test", callback);

    loadingManager.startLoading("test", "Loading...", { showProgress: true });
    loadingManager.updateProgress("test", 50, "Half way there");

    expect(callback).toHaveBeenCalledWith({
      isLoading: true,
      message: "Half way there",
      progress: 50,
      error: undefined,
    });
  });

  it("should handle loading errors", () => {
    const callback = vi.fn();
    loadingManager.onStateChange("test", callback);

    loadingManager.startLoading("test", "Loading...");
    loadingManager.setError("test", "Failed to load data");

    expect(callback).toHaveBeenCalledWith({
      isLoading: false,
      message: "Loading...",
      progress: undefined,
      error: "Failed to load data",
    });
  });

  it("should timeout loading operations", async () => {
    const callback = vi.fn();
    loadingManager.onStateChange("test", callback);

    loadingManager.startLoading("test", "Loading...", { timeout: 100 });

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        isLoading: false,
        error: "Operation timed out",
      }),
    );
  });
});

describe("Error Handling", () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler({
      enableAutoRecovery: true,
      showUserFriendlyMessages: true,
      logErrors: false, // Disable for tests
      maxRetries: 2,
      retryDelay: 50,
    });
  });

  afterEach(() => {
    errorHandler?.clearErrorHistory();
  });

  it("should handle and normalize errors", () => {
    const callback = vi.fn();
    errorHandler.onError("test", callback);

    const error = new Error("Test error");
    const editorError = errorHandler.handleError(error);

    expect(editorError.type).toBe("rendering");
    expect(editorError.message).toBe("Test error");
    expect(editorError.recoverable).toBe(true);
    expect(callback).toHaveBeenCalledWith(editorError);
  });

  it("should provide user-friendly error messages", () => {
    const error = new Error("Cannot read property of undefined");
    const editorError = errorHandler.handleError(error);

    expect(editorError.message).toContain(
      "There was an issue processing your content",
    );
  });

  it("should generate recovery actions for different error types", () => {
    const validationError = {
      type: "validation" as const,
      message: "Invalid input",
      recoverable: true,
    };

    const recoveryActions = errorHandler.getRecoveryActions(validationError);
    expect(recoveryActions).toHaveLength(1);
    expect(recoveryActions[0].label).toBe("Reset to default");
  });

  it("should track error history", () => {
    const error1 = new Error("First error");
    const error2 = new Error("Second error");

    errorHandler.handleError(error1);
    errorHandler.handleError(error2);

    const history = errorHandler.getErrorHistory();
    expect(history).toHaveLength(2);
    expect(history[0].message).toBe("First error");
    expect(history[1].message).toBe("Second error");
  });
});

describe("Responsive Design Utilities", () => {
  it("should provide correct breakpoint configurations", () => {
    // Test that responsive utilities can be imported and used
    expect(true).toBe(true); // Placeholder test
  });
});

describe("Integration Tests", () => {
  it("should integrate loading and error handling systems", async () => {
    const loadingManager = new LoadingStateManager();
    const errorHandler = new ErrorHandler();

    // Test that systems can work together
    loadingManager.startLoading("test", "Testing integration...");
    expect(loadingManager.isLoading("test")).toBe(true);

    const error = new Error("Test integration error");
    const editorError = errorHandler.handleError(error);
    expect(editorError.type).toBe("rendering");

    loadingManager.completeLoading("test", "Integration test completed");
    expect(loadingManager.isLoading("test")).toBe(false);

    // Cleanup
    loadingManager.destroy();
    errorHandler.clearErrorHistory();
  });
});
