<script lang="ts">
  import type { LoadingState } from '../utils/loadingState.js';
  
  const {
    state,
    size = 'medium',
    variant = 'spinner',
    showMessage = true,
    showProgress = false,
    inline = false
  }: {
    state: LoadingState;
    size?: 'small' | 'medium' | 'large';
    variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
    showMessage?: boolean;
    showProgress?: boolean;
    inline?: boolean;
  } = $props();

  const progressValue = $derived(state.progress ?? 0);
  const hasError = $derived(!!state.error);
  const isLoading = $derived(state.isLoading);
</script>

{#if isLoading || hasError}
  <div 
    class="loading-indicator"
    class:inline
    class:small={size === 'small'}
    class:medium={size === 'medium'}
    class:large={size === 'large'}
    class:has-error={hasError}
    role="status"
    aria-live="polite"
    aria-label={state.message || (isLoading ? 'Loading' : 'Error occurred')}
  >
    {#if hasError}
      <!-- Error state -->
      <div class="error-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      {#if showMessage && state.error}
        <div class="error-message">
          {state.error}
        </div>
      {/if}
    {:else if isLoading}
      <!-- Loading state -->
      {#if variant === 'spinner'}
        <div class="spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
            </svg>
          </div>
      {:else if variant === 'dots'}
        <div class="dots" aria-hidden="true">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      {:else if variant === 'pulse'}
        <div class="pulse" aria-hidden="true"></div>
      {:else if variant === 'skeleton'}
        <div class="skeleton" aria-hidden="true">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
        </div>
      {/if}

      {#if showProgress && state.progress !== undefined}
        <div class="progress-container">
          <div 
            class="progress-bar"
            role="progressbar"
            aria-valuenow={progressValue}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Loading progress"
          >
            <div 
              class="progress-fill"
              style="width: {progressValue}%"
            ></div>
          </div>
          <div class="progress-text">
            {Math.round(progressValue)}%
          </div>
        </div>
      {/if}

      {#if showMessage && state.message}
        <div class="loading-message">
          {state.message}
        </div>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    color: #6b7280;
  }

  .loading-indicator.inline {
    flex-direction: row;
    padding: 4px 8px;
  }

  .loading-indicator.small {
    padding: 8px;
    gap: 4px;
  }

  .loading-indicator.large {
    padding: 24px;
    gap: 12px;
  }

  .loading-indicator.has-error {
    color: #dc2626;
  }

  /* Spinner variant */
  .spinner {
    width: 24px;
    height: 24px;
    color: #3b82f6;
  }

  .small .spinner {
    width: 16px;
    height: 16px;
  }

  .large .spinner {
    width: 32px;
    height: 32px;
  }

  .spinner svg {
    width: 100%;
    height: 100%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Dots variant */
  .dots {
    display: flex;
    gap: 4px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #3b82f6;
    animation: dot-bounce 1.4s ease-in-out infinite both;
  }

  .small .dot {
    width: 6px;
    height: 6px;
  }

  .large .dot {
    width: 10px;
    height: 10px;
  }

  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  .dot:nth-child(3) { animation-delay: 0s; }

  @keyframes dot-bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }

  /* Pulse variant */
  .pulse {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #3b82f6;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .small .pulse {
    width: 16px;
    height: 16px;
  }

  .large .pulse {
    width: 32px;
    height: 32px;
  }

  @keyframes pulse {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }

  /* Skeleton variant */
  .skeleton {
    width: 200px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .small .skeleton {
    width: 120px;
    gap: 4px;
  }

  .large .skeleton {
    width: 300px;
    gap: 12px;
  }

  .skeleton-line {
    height: 12px;
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: skeleton-loading 1.5s infinite;
  }

  .skeleton-line.short {
    width: 60%;
  }

  .small .skeleton-line {
    height: 8px;
  }

  .large .skeleton-line {
    height: 16px;
  }

  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  /* Progress bar */
  .progress-container {
    width: 100%;
    max-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
  }

  .inline .progress-container {
    max-width: 100px;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background-color: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: #3b82f6;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
  }

  /* Messages */
  .loading-message,
  .error-message {
    font-size: 14px;
    text-align: center;
    max-width: 300px;
  }

  .small .loading-message,
  .small .error-message {
    font-size: 12px;
    max-width: 200px;
  }

  .large .loading-message,
  .large .error-message {
    font-size: 16px;
    max-width: 400px;
  }

  .inline .loading-message,
  .inline .error-message {
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .error-message {
    color: #dc2626;
  }

  /* Error icon */
  .error-icon {
    width: 24px;
    height: 24px;
    color: #dc2626;
  }

  .small .error-icon {
    width: 16px;
    height: 16px;
  }

  .large .error-icon {
    width: 32px;
    height: 32px;
  }

  .error-icon svg {
    width: 100%;
    height: 100%;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .loading-indicator {
      color: #9ca3af;
    }

    .loading-indicator.has-error {
      color: #f87171;
    }

    .spinner,
    .dot,
    .pulse {
      color: #60a5fa;
    }

    .progress-fill {
      background-color: #60a5fa;
    }

    .progress-bar {
      background-color: #374151;
    }

    .skeleton-line {
      background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
      background-size: 200% 100%;
    }

    .error-icon {
      color: #f87171;
    }

    .error-message {
      color: #f87171;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .spinner svg,
    .dot,
    .pulse,
    .skeleton-line {
      animation: none;
    }

    .progress-fill {
      transition: none;
    }
  }
</style>