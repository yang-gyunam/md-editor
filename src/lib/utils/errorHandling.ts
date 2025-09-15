// Error handling and recovery utilities

export interface EditorError {
  type:
    | "validation"
    | "parsing"
    | "rendering"
    | "network"
    | "storage"
    | "accessibility";
  message: string;
  code?: string;
  line?: number;
  column?: number;
  recoverable: boolean;
  suggestions?: string[];
  context?: Record<string, any>;
}

export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

export interface ErrorHandlerConfig {
  enableAutoRecovery: boolean;
  showUserFriendlyMessages: boolean;
  logErrors: boolean;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Manages error handling and recovery for the editor
 */
export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorHistory: EditorError[] = [];
  private retryAttempts: Map<string, number> = new Map();
  private errorCallbacks: Map<string, (error: EditorError) => void> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableAutoRecovery: true,
      showUserFriendlyMessages: true,
      logErrors: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * Handle an error with automatic recovery attempts
   */
  handleError(
    error: Error | EditorError,
    context?: Record<string, any>,
  ): EditorError {
    const editorError = this.normalizeError(error, context);

    if (this.config.logErrors) {
      console.error("Editor Error:", editorError);
    }

    this.errorHistory.push(editorError);
    this.notifyErrorCallbacks(editorError);

    // Attempt auto-recovery if enabled and error is recoverable
    if (this.config.enableAutoRecovery && editorError.recoverable) {
      this.attemptRecovery(editorError);
    }

    return editorError;
  }

  /**
   * Normalize different error types to EditorError
   */
  private normalizeError(
    error: Error | EditorError,
    context?: Record<string, any>,
  ): EditorError {
    if (this.isEditorError(error)) {
      return { ...error, context: { ...error.context, ...context } };
    }

    // Convert regular Error to EditorError
    const editorError: EditorError = {
      type: "rendering",
      message: this.config.showUserFriendlyMessages
        ? this.getUserFriendlyMessage(error.message)
        : error.message,
      recoverable: true,
      context,
    };

    // Try to extract more specific error information
    if (error.name === "SyntaxError") {
      editorError.type = "parsing";
      editorError.suggestions = this.getSyntaxErrorSuggestions(error.message);
    } else if (error.name === "TypeError") {
      editorError.type = "validation";
      editorError.suggestions = this.getValidationErrorSuggestions(
        error.message,
      );
    }

    return editorError;
  }

  /**
   * Check if error is already an EditorError
   */
  private isEditorError(error: unknown): error is EditorError {
    return (
      error &&
      typeof error === "object" &&
      "type" in error &&
      "recoverable" in error
    );
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(message: string): string {
    const friendlyMessages: Record<string, string> = {
      "Cannot read property":
        "There was an issue processing your content. Please check for any unusual formatting.",
      "Unexpected token":
        "There appears to be a syntax error in your content. Please check for missing or extra characters.",
      "Network request failed":
        "Unable to connect to the server. Please check your internet connection.",
      "Quota exceeded":
        "Storage limit reached. Please clear some data or reduce content size.",
      "Permission denied": "Access denied. Please check your permissions.",
    };

    for (const [key, friendlyMessage] of Object.entries(friendlyMessages)) {
      if (message.includes(key)) {
        return friendlyMessage;
      }
    }

    return message;
  }

  /**
   * Get suggestions for syntax errors
   */
  private getSyntaxErrorSuggestions(message: string): string[] {
    const suggestions: string[] = [];

    if (message.includes("Unexpected token")) {
      suggestions.push(
        "Check for missing or extra brackets, quotes, or commas",
      );
      suggestions.push(
        "Ensure all opening tags have corresponding closing tags",
      );
    }

    if (message.includes("Unterminated string")) {
      suggestions.push("Check for missing closing quotes");
      suggestions.push("Escape any quotes within strings");
    }

    if (message.includes("Invalid character")) {
      suggestions.push(
        "Remove any special characters that may not be supported",
      );
      suggestions.push("Check for invisible or non-printable characters");
    }

    return suggestions;
  }

  /**
   * Get suggestions for validation errors
   */
  private getValidationErrorSuggestions(message: string): string[] {
    const suggestions: string[] = [];

    if (message.includes("Cannot read property")) {
      suggestions.push("Check that all required fields are filled");
      suggestions.push("Verify the content structure is correct");
    }

    if (message.includes("is not a function")) {
      suggestions.push(
        "This appears to be a system error. Try refreshing the page",
      );
      suggestions.push("Clear your browser cache and try again");
    }

    return suggestions;
  }

  /**
   * Attempt automatic error recovery
   */
  private async attemptRecovery(error: EditorError): Promise<void> {
    const errorKey = `${error.type}-${error.message}`;
    const attempts = this.retryAttempts.get(errorKey) || 0;

    if (attempts >= this.config.maxRetries) {
      console.warn("Max retry attempts reached for error:", error);
      return;
    }

    this.retryAttempts.set(errorKey, attempts + 1);

    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));

    try {
      await this.performRecovery(error);
      this.retryAttempts.delete(errorKey);
    } catch (recoveryError) {
      console.error("Recovery failed:", recoveryError);
    }
  }

  /**
   * Perform specific recovery actions based on error type
   */
  private async performRecovery(error: EditorError): Promise<void> {
    switch (error.type) {
      case "parsing":
        // Try to fix common parsing issues
        await this.recoverFromParsingError(error);
        break;

      case "validation":
        // Reset to last known good state
        await this.recoverFromValidationError(error);
        break;

      case "rendering":
        // Force re-render
        await this.recoverFromRenderingError(error);
        break;

      case "storage":
        // Clear corrupted storage
        await this.recoverFromStorageError(error);
        break;

      case "network":
        // Retry network operation
        await this.recoverFromNetworkError(error);
        break;

      case "accessibility":
        // Reset accessibility state
        await this.recoverFromAccessibilityError(error);
        break;
    }
  }

  /**
   * Recovery methods for specific error types
   */
  private async recoverFromParsingError(error: EditorError): Promise<void> {
    // Implementation would depend on the specific parsing error
    console.log("Attempting parsing error recovery:", error);
  }

  private async recoverFromValidationError(error: EditorError): Promise<void> {
    // Implementation would reset to last valid state
    console.log("Attempting validation error recovery:", error);
  }

  private async recoverFromRenderingError(error: EditorError): Promise<void> {
    // Force component re-render
    console.log("Attempting rendering error recovery:", error);
  }

  private async recoverFromStorageError(error: EditorError): Promise<void> {
    // Clear corrupted storage data
    try {
      localStorage.removeItem("editor-state");
      localStorage.removeItem("editor-templates");
      localStorage.removeItem("editor-snippets");
    } catch (e) {
      console.warn("Could not clear storage:", e);
    }
  }

  private async recoverFromNetworkError(error: EditorError): Promise<void> {
    // Retry network operation with exponential backoff
    console.log("Attempting network error recovery:", error);
  }

  private async recoverFromAccessibilityError(
    error: EditorError,
  ): Promise<void> {
    // Reset accessibility manager state
    console.log("Attempting accessibility error recovery:", error);
  }

  /**
   * Get recovery actions for an error
   */
  getRecoveryActions(error: EditorError): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    switch (error.type) {
      case "parsing":
        actions.push({
          label: "Clear content and start over",
          action: () => this.clearContent(),
          primary: false,
        });
        actions.push({
          label: "Undo last change",
          action: () => this.undoLastChange(),
          primary: true,
        });
        break;

      case "validation":
        actions.push({
          label: "Reset to default",
          action: () => this.resetToDefault(),
          primary: true,
        });
        break;

      case "rendering":
        actions.push({
          label: "Refresh editor",
          action: () => this.refreshEditor(),
          primary: true,
        });
        break;

      case "storage":
        actions.push({
          label: "Clear storage and restart",
          action: () => this.clearStorageAndRestart(),
          primary: true,
        });
        break;

      case "network":
        actions.push({
          label: "Retry",
          action: () => this.retryLastOperation(),
          primary: true,
        });
        actions.push({
          label: "Work offline",
          action: () => this.enableOfflineMode(),
          primary: false,
        });
        break;

      case "accessibility":
        actions.push({
          label: "Reset accessibility settings",
          action: () => this.resetAccessibilitySettings(),
          primary: true,
        });
        break;
    }

    return actions;
  }

  /**
   * Recovery action implementations
   */
  private clearContent(): void {
    // Implementation would clear editor content
    console.log("Clearing content");
  }

  private undoLastChange(): void {
    // Implementation would undo last change
    console.log("Undoing last change");
  }

  private resetToDefault(): void {
    // Implementation would reset to default state
    console.log("Resetting to default");
  }

  private refreshEditor(): void {
    // Implementation would refresh the editor
    console.log("Refreshing editor");
  }

  private clearStorageAndRestart(): void {
    // Implementation would clear storage and restart
    this.recoverFromStorageError({} as EditorError);
    window.location.reload();
  }

  private retryLastOperation(): void {
    // Implementation would retry the last failed operation
    console.log("Retrying last operation");
  }

  private enableOfflineMode(): void {
    // Implementation would enable offline mode
    console.log("Enabling offline mode");
  }

  private resetAccessibilitySettings(): void {
    // Implementation would reset accessibility settings
    console.log("Resetting accessibility settings");
  }

  /**
   * Register error callback
   */
  onError(id: string, callback: (error: EditorError) => void): void {
    this.errorCallbacks.set(id, callback);
  }

  /**
   * Unregister error callback
   */
  offError(id: string): void {
    this.errorCallbacks.delete(id);
  }

  /**
   * Notify error callbacks
   */
  private notifyErrorCallbacks(error: EditorError): void {
    for (const callback of this.errorCallbacks.values()) {
      try {
        callback(error);
      } catch (e) {
        console.error("Error in error callback:", e);
      }
    }
  }

  /**
   * Get error history
   */
  getErrorHistory(): EditorError[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.retryAttempts.clear();
  }

  /**
   * Create error from validation result
   */
  static createValidationError(
    message: string,
    line?: number,
    column?: number,
    suggestions?: string[],
  ): EditorError {
    return {
      type: "validation",
      message,
      line,
      column,
      recoverable: true,
      suggestions,
    };
  }

  /**
   * Create error from parsing failure
   */
  static createParsingError(
    message: string,
    line?: number,
    column?: number,
  ): EditorError {
    return {
      type: "parsing",
      message,
      line,
      column,
      recoverable: true,
      suggestions: [
        "Check syntax for errors",
        "Ensure all brackets and quotes are properly closed",
      ],
    };
  }
}
