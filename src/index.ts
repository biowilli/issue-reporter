// Core functionality
export { captureScreenshot, getSystemMetadata, blobToBase64 } from './core/screenshot';

// Types
export type {
  IssueTrackerConfig,
  FeedbackData,
  IssueResponse,
  IssueTrackerAdapter,
  FeedbackReporterConfig,
} from './types';

// Adapters
export { GitLabAdapter, GitHubAdapter } from './adapters';
export type { GitLabConfig, GitHubConfig } from './adapters';

// React components
export { FeedbackButton, FeedbackModal } from './react';
export type { FeedbackButtonProps, FeedbackModalProps } from './react';

// Vanilla JS
export { createFeedbackReporter } from './vanilla';
