<script lang="ts">
  import type { EditorError, ErrorRecoveryAction } from '../utils/errorHandling.js';
  
  const {
    error,
    recoveryActions = [],
    showDetails = false,
    compact = false,
    dismissible = true,
    onDismiss,
    onRetry
  }: {
    error: EditorError;
    recoveryActions?: ErrorRecoveryAction[];
    showDetails?: boolean;
    compact?: boolean;
    dismissible?: boolean;
    onDismiss?: () => void;
    onRetry?: () => void;
  } = $props();

  let showFullDetails = $state(false);
  let isRetrying = $state(false);

  function getErrorIcon(type: EditorError['type']): string {
    switch (type) {
      case 'validation':
        return '⚠️';
      case 'parsing':
        return '🔧';
      case 'rendering':
        return '🎨';
      case 'network':
        return '🌐';
      case 'storage':
        return '💾';
      case 'accessibility':
        return '♿';
      default:
        return '❌';
    }
  }

  function getErrorTypeLabel(type: EditorError['type']): string {
    switch (type) {
      case 'validation':
        return 'Validation Error';
      case 'parsing':
        return 'Parsing Error';
      case 'rendering':
        return 'Rendering Error';
      case 'network':
        return 'Network Error';
      case 'storage':
        return 'Storage Error';
      case 'accessibility':
        return 'Accessibility Error';
      default:
        return 'Error';
    }
  }

  async function handleRecoveryAction(action: ErrorRecoveryAction) {
    try {
      isRetrying = true;
      await action.action();
      onDismiss?.();
    } catch (e) {
      console.error('Recovery action failed:', e);
    } finally {
      isRetrying = false;
    }
  }

  function handleRetry() {
    if (onRetry) {
      isRetrying = true;
      onRetry();
      setTimeout(() => {
        isRetrying = false;
      }, 1000);
    }
  }

  function toggleDetails() {
    showFullDetails = !showFullDetails;
  }
</script>

<div 
  class="error-display"
  class:compact
  class:validation={error.type === 'validation'}
  class:parsing={error.type === 'parsing'}
  class:rendering={error.type === 'rendering'}
  class:network={error.type === 'network'}
  class:storage={error.type === 'storage'}
  class:accessibility={error.type === 'accessibility'}
  role="alert"
  aria-live="assertive"
>
  <div class="error-header">
    <div class="error-icon" aria-hidden="true">
      {getErrorIcon(error.type)}
    </div>
    
    <div class="error-content">
      <div class="error-title">
        {getErrorTypeLabel(error.type)}
      </div>
      
      <div class="error-message">
        {error.message}
      </div>

      {#if error.line !== undefined || error.column !== undefined}
        <div class="error-location">
          {#if error.line !== undefined}
            Line {error.line}
          {/if}
          {#if error.column !== undefined}
            {error.line !== undefined ? ', ' : ''}Column {error.column}
          {/if}
        </div>
      {/if}
    </div>

    {#if dismissible}
      <button
        type="button"
        class="dismiss-button"
        onclick={onDismiss}
        aria-label="Dismiss error"
        title="Dismiss"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    {/if}
  </div>

  {#if error.suggestions && error.suggestions.length > 0}
    <div class="error-suggestions">
      <div class="suggestions-title">Suggestions:</div>
      <ul class="suggestions-list">
        {#each error.suggestions as suggestion}
          <li>{suggestion}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if recoveryActions.length > 0}
    <div class="recovery-actions">
      {#each recoveryActions as action}
        <button
          type="button"
          class="recovery-button"
          class:primary={action.primary}
          onclick={() => handleRecoveryAction(action)}
          disabled={isRetrying}
        >
          {#if isRetrying}
            <span class="loading-spinner" aria-hidden="true"></span>
          {/if}
          {action.label}
        </button>
      {/each}
      
      {#if onRetry}
        <button
          type="button"
          class="recovery-button"
          onclick={handleRetry}
          disabled={isRetrying}
        >
          {#if isRetrying}
            <span class="loading-spinner" aria-hidden="true"></span>
          {/if}
          Retry
        </button>
      {/if}
    </div>
  {/if}

  {#if showDetails && (error.context || error.code)}
    <div class="error-details">
      <button
        type="button"
        class="details-toggle"
        onclick={toggleDetails}
        aria-expanded={showFullDetails}
        aria-controls="error-details-content"
      >
        {showFullDetails ? 'Hide' : 'Show'} Details
        <svg 
          class="details-arrow" 
          class:expanded={showFullDetails}
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
      </button>
      
      {#if showFullDetails}
        <div id="error-details-content" class="details-content">
          {#if error.code}
            <div class="detail-item">
              <strong>Error Code:</strong> {error.code}
            </div>
          {/if}
          
          {#if error.context}
            <div class="detail-item">
              <strong>Context:</strong>
              <pre class="context-data">{JSON.stringify(error.context, null, 2)}</pre>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .error-display {
    border: 1px solid #fecaca;
    background-color: #fef2f2;
    border-radius: 6px;
    padding: 12px;
    margin: 8px 0;
    color: #991b1b;
  }

  .error-display.compact {
    padding: 8px;
    margin: 4px 0;
  }

  /* Error type specific styling */
  .error-display.validation {
    border-color: #fed7aa;
    background-color: #fff7ed;
    color: #c2410c;
  }

  .error-display.parsing {
    border-color: #fde68a;
    background-color: #fffbeb;
    color: #d97706;
  }

  .error-display.rendering {
    border-color: #ddd6fe;
    background-color: #f5f3ff;
    color: #7c3aed;
  }

  .error-display.network {
    border-color: #bfdbfe;
    background-color: #eff6ff;
    color: #1d4ed8;
  }

  .error-display.storage {
    border-color: #c7d2fe;
    background-color: #eef2ff;
    color: #4338ca;
  }

  .error-display.accessibility {
    border-color: #bbf7d0;
    background-color: #f0fdf4;
    color: #166534;
  }

  .error-header {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .error-icon {
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .compact .error-icon {
    font-size: 16px;
  }

  .error-content {
    flex: 1;
    min-width: 0;
  }

  .error-title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .compact .error-title {
    font-size: 12px;
    margin-bottom: 2px;
  }

  .error-message {
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 4px;
  }

  .compact .error-message {
    font-size: 12px;
  }

  .error-location {
    font-size: 12px;
    opacity: 0.8;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  }

  .compact .error-location {
    font-size: 10px;
  }

  .dismiss-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    color: inherit;
    opacity: 0.7;
    flex-shrink: 0;
  }

  .dismiss-button:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.1);
  }

  .dismiss-button svg {
    width: 16px;
    height: 16px;
  }

  .compact .dismiss-button svg {
    width: 14px;
    height: 14px;
  }

  .error-suggestions {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }

  .compact .error-suggestions {
    margin-top: 8px;
    padding-top: 8px;
  }

  .suggestions-title {
    font-weight: 600;
    font-size: 12px;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .suggestions-list {
    margin: 0;
    padding-left: 16px;
    font-size: 13px;
    line-height: 1.4;
  }

  .compact .suggestions-list {
    font-size: 11px;
    padding-left: 12px;
  }

  .suggestions-list li {
    margin-bottom: 4px;
  }

  .recovery-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    flex-wrap: wrap;
  }

  .compact .recovery-actions {
    margin-top: 8px;
    padding-top: 8px;
    gap: 6px;
  }

  .recovery-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border: 1px solid currentColor;
    background: transparent;
    color: inherit;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .compact .recovery-button {
    padding: 4px 8px;
    font-size: 10px;
  }

  .recovery-button:hover:not(:disabled) {
    background-color: currentColor;
    color: white;
  }

  .recovery-button.primary {
    background-color: currentColor;
    color: white;
  }

  .recovery-button.primary:hover:not(:disabled) {
    opacity: 0.9;
  }

  .recovery-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .compact .loading-spinner {
    width: 10px;
    height: 10px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-details {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }

  .compact .error-details {
    margin-top: 8px;
    padding-top: 8px;
  }

  .details-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    font-size: 12px;
    font-weight: 500;
    padding: 0;
  }

  .details-toggle:hover {
    opacity: 0.8;
  }

  .details-arrow {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }

  .details-arrow.expanded {
    transform: rotate(180deg);
  }

  .details-content {
    margin-top: 8px;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    font-size: 12px;
  }

  .compact .details-content {
    padding: 6px;
    font-size: 10px;
  }

  .detail-item {
    margin-bottom: 8px;
  }

  .detail-item:last-child {
    margin-bottom: 0;
  }

  .context-data {
    margin: 4px 0 0 0;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 11px;
    line-height: 1.4;
    overflow-x: auto;
    white-space: pre-wrap;
  }

  .compact .context-data {
    padding: 4px;
    font-size: 9px;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .error-display {
      border-color: #7f1d1d;
      background-color: #1f1917;
      color: #fca5a5;
    }

    .error-display.validation {
      border-color: #9a3412;
      background-color: #1c1917;
      color: #fed7aa;
    }

    .error-display.parsing {
      border-color: #a16207;
      background-color: #1c1917;
      color: #fde68a;
    }

    .error-display.rendering {
      border-color: #6d28d9;
      background-color: #1e1b3a;
      color: #ddd6fe;
    }

    .error-display.network {
      border-color: #1e40af;
      background-color: #1e293b;
      color: #bfdbfe;
    }

    .error-display.storage {
      border-color: #3730a3;
      background-color: #1e1b3a;
      color: #c7d2fe;
    }

    .error-display.accessibility {
      border-color: #166534;
      background-color: #14532d;
      color: #bbf7d0;
    }

    .dismiss-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .details-content {
      background-color: rgba(255, 255, 255, 0.05);
    }

    .context-data {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none;
    }

    .details-arrow {
      transition: none;
    }

    .recovery-button {
      transition: none;
    }
  }
</style>