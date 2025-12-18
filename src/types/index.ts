/**
 * Configuration for issue tracker adapters
 */
export interface IssueTrackerConfig {
  baseUrl: string;
  projectId: string;
  accessToken: string;
}

/**
 * Feedback data structure
 */
export interface FeedbackData {
  title: string;
  description: string;
  screenshot?: Blob;
  metadata?: Record<string, unknown>;
}

/**
 * Issue response from tracker
 */
export interface IssueResponse {
  id: string | number;
  url: string;
  title: string;
}

/**
 * Issue tracker adapter interface
 */
export interface IssueTrackerAdapter {
  createIssue(feedback: FeedbackData): Promise<IssueResponse | null>;
  uploadScreenshot?(screenshot: Blob): Promise<string | null>;
}

/**
 * Button styling options
 */
export interface ButtonStyles {
  backgroundColor?: string;
  color?: string;
  hoverBackgroundColor?: string;
  hoverColor?: string;
  borderRadius?: string;
  padding?: string;
  fontSize?: string;
  fontWeight?: string;
  border?: string;
  boxShadow?: string;
}

/**
 * Modal styling options
 */
export interface ModalStyles {
  overlayBackgroundColor?: string;
  backgroundColor?: string;
  borderRadius?: string;
  padding?: string;
  maxWidth?: string;
  boxShadow?: string;
  headerColor?: string;
  labelColor?: string;
  inputBorderColor?: string;
  inputFocusBorderColor?: string;
  primaryButtonColor?: string;
  primaryButtonHoverColor?: string;
  secondaryButtonColor?: string;
  secondaryButtonHoverColor?: string;
  dangerButtonColor?: string;
  dangerButtonHoverColor?: string;
}

/**
 * Text customization
 */
export interface TextLabels {
  buttonText?: string;
  modalTitle?: string;
  titleLabel?: string;
  titlePlaceholder?: string;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  screenshotLabel?: string;
  screenshotHint?: string;
  includeScreenshotLabel?: string;
  editButtonText?: string;
  removeButtonText?: string;
  cancelButtonText?: string;
  submitButtonText?: string;
  submittingButtonText?: string;
  capturingButtonText?: string;
}

/**
 * Feedback reporter configuration
 */
export interface FeedbackReporterConfig {
  adapter: IssueTrackerAdapter;
  labels?: string[];
  includeMetadata?: boolean;
  onSuccess?: (response: IssueResponse) => void;
  onError?: (error: Error) => void;
  buttonStyles?: ButtonStyles;
  modalStyles?: ModalStyles;
  textLabels?: TextLabels;
}
