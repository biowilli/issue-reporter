import React, { useState, useEffect } from 'react';
import { FeedbackReporterConfig, FeedbackData, ModalStyles, TextLabels } from '../types';
import { captureScreenshot, getSystemMetadata } from '../core/screenshot';
import { ScreenshotEditor } from './ScreenshotEditor';

export interface FeedbackModalProps extends FeedbackReporterConfig {
  onClose: () => void;
  initialScreenshot?: Blob | null;
  modalStyles?: ModalStyles;
  textLabels?: TextLabels;
}

/**
 * Feedback Modal Component
 * Displays a modal for submitting feedback with screenshot
 */
export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  adapter,
  labels,
  includeMetadata = true,
  onSuccess,
  onError,
  onClose,
  initialScreenshot,
  modalStyles,
  textLabels,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<Blob | null>(initialScreenshot || null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [isEditingScreenshot, setIsEditingScreenshot] = useState(false);

  // Default text labels
  const defaultLabels = {
    modalTitle: 'Report an Issue',
    titleLabel: 'Title',
    titlePlaceholder: 'Brief description of the issue',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Detailed description of the issue...',
    screenshotLabel: 'Screenshot (optional)',
    screenshotHint: 'Upload a screenshot or press your print screen key and paste',
    includeScreenshotLabel: 'Include screenshot',
    editButtonText: 'Edit',
    removeButtonText: 'Remove',
    cancelButtonText: 'Cancel',
    submitButtonText: 'Submit Issue',
    submittingButtonText: 'Submitting...',
    ...textLabels,
  };

  // Use initial screenshot or capture on mount
  useEffect(() => {
    if (initialScreenshot) {
      // Use provided screenshot
      const url = URL.createObjectURL(initialScreenshot);
      setScreenshotPreview(url);
      setScreenshot(initialScreenshot);
    } else {
      // Fallback: capture screenshot
      const capture = async () => {
        const blob = await captureScreenshot();
        if (blob) {
          setScreenshot(blob);
          const url = URL.createObjectURL(blob);
          setScreenshotPreview(url);
        }
      };
      capture();
    }

    // Cleanup
    return () => {
      if (screenshotPreview) {
        URL.revokeObjectURL(screenshotPreview);
      }
    };
  }, [initialScreenshot]);

  const handleEditScreenshot = () => {
    setIsEditingScreenshot(true);
  };

  const handleSaveEditedScreenshot = (editedBlob: Blob) => {
    // Clean up old preview
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
    }

    // Set new screenshot
    setScreenshot(editedBlob);
    const url = URL.createObjectURL(editedBlob);
    setScreenshotPreview(url);
    setIsEditingScreenshot(false);
  };

  const handleCancelEdit = () => {
    setIsEditingScreenshot(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      alert('Please fill in both title and description');
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        title: title.trim(),
        description: description.trim(),
        screenshot: includeScreenshot && screenshot ? screenshot : undefined,
        metadata: includeMetadata ? getSystemMetadata() : undefined,
      };

      const response = await adapter.createIssue(feedbackData);

      if (response) {
        onSuccess?.(response);
        alert(`Issue created successfully! View it at: ${response.url}`);
        onClose();
      } else {
        throw new Error('Failed to create issue');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: modalStyles?.overlayBackgroundColor || 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px',
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: modalStyles?.backgroundColor || 'white',
    borderRadius: modalStyles?.borderRadius || '12px',
    padding: isEditingScreenshot ? '0' : (modalStyles?.padding || '24px'),
    maxWidth: isEditingScreenshot ? '90vw' : (modalStyles?.maxWidth || '600px'),
    width: '100%',
    maxHeight: '90vh',
    height: isEditingScreenshot ? '90vh' : 'auto',
    overflow: isEditingScreenshot ? 'hidden' : 'auto',
    boxShadow: modalStyles?.boxShadow || '0 4px 20px rgba(0,0,0,0.3)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    border: `1px solid ${modalStyles?.inputBorderColor || '#ddd'}`,
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '16px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    marginRight: '10px',
  };

  // Show screenshot editor
  if (isEditingScreenshot && screenshot) {
    return (
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={contentStyle}>
          <ScreenshotEditor
            screenshot={screenshot}
            onSave={handleSaveEditedScreenshot}
            onCancel={handleCancelEdit}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: modalStyles?.headerColor }}>
          {defaultLabels.modalTitle}
        </h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: modalStyles?.labelColor }}>
              {defaultLabels.titleLabel} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultLabels.titlePlaceholder}
              style={inputStyle}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: modalStyles?.labelColor }}>
              {defaultLabels.descriptionLabel} *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={defaultLabels.descriptionPlaceholder}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' }}
              required
              disabled={isSubmitting}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: modalStyles?.labelColor }}>
              {defaultLabels.screenshotLabel}
            </label>

            {!screenshotPreview && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setScreenshot(file);
                      const url = URL.createObjectURL(file);
                      setScreenshotPreview(url);
                      setIncludeScreenshot(true);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  disabled={isSubmitting}
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {defaultLabels.screenshotHint}
                </p>
              </div>
            )}

            {screenshotPreview && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={includeScreenshot}
                    onChange={(e) => setIncludeScreenshot(e.target.checked)}
                    style={{ marginRight: '8px' }}
                    disabled={isSubmitting}
                  />
                  <span style={{ fontWeight: '600', color: modalStyles?.labelColor }}>
                    {defaultLabels.includeScreenshotLabel}
                  </span>
                </label>
                {includeScreenshot && (
                  <div>
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      style={{
                        width: '100%',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        marginTop: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={handleEditScreenshot}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={handleEditScreenshot}
                        disabled={isSubmitting}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: modalStyles?.primaryButtonColor || '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        {defaultLabels.editButtonText}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (screenshotPreview) {
                            URL.revokeObjectURL(screenshotPreview);
                          }
                          setScreenshot(null);
                          setScreenshotPreview(null);
                          setIncludeScreenshot(false);
                        }}
                        disabled={isSubmitting}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: modalStyles?.dangerButtonColor || '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        {defaultLabels.removeButtonText}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...buttonStyle,
                backgroundColor: modalStyles?.secondaryButtonColor || '#f0f0f0',
                color: '#333'
              }}
              disabled={isSubmitting}
            >
              {defaultLabels.cancelButtonText}
            </button>
            <button
              type="submit"
              style={{
                ...buttonStyle,
                backgroundColor: modalStyles?.primaryButtonColor || '#4CAF50',
                color: 'white'
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? defaultLabels.submittingButtonText : defaultLabels.submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
