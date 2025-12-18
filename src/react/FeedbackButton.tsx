import React, { useState } from 'react';
import { FeedbackReporterConfig } from '../types';
import { FeedbackModal } from './FeedbackModal';
import { captureScreenshot } from '../core/screenshot';

export interface FeedbackButtonProps extends FeedbackReporterConfig {
  buttonClassName?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'none';
}

/**
 * React Feedback Button Component
 * Displays a floating button that opens a feedback modal
 */
export const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  adapter,
  labels,
  includeMetadata = true,
  onSuccess,
  onError,
  buttonStyles,
  modalStyles,
  textLabels,
  buttonClassName,
  position = 'bottom-right',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [capturedScreenshot, setCapturedScreenshot] = useState<Blob | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Default text labels
  const defaultLabels = {
    buttonText: 'Report Issue',
    capturingButtonText: 'Capturing...',
    ...textLabels,
  };

  const handleOpenModal = async () => {
    setIsCapturing(true);

    // Capture screenshot BEFORE opening modal
    const screenshot = await captureScreenshot();
    setCapturedScreenshot(screenshot);

    setIsCapturing(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCapturedScreenshot(null);
  };

  const positionStyles: Record<string, React.CSSProperties> = {
    'bottom-right': { position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 },
    'bottom-left': { position: 'fixed', bottom: '20px', left: '20px', zIndex: 9999 },
    'top-right': { position: 'fixed', top: '20px', right: '20px', zIndex: 9999 },
    'top-left': { position: 'fixed', top: '20px', left: '20px', zIndex: 9999 },
    'none': {},
  };

  const defaultButtonStyle: React.CSSProperties = {
    padding: buttonStyles?.padding || '12px 20px',
    backgroundColor: buttonStyles?.backgroundColor || '#4CAF50',
    color: buttonStyles?.color || 'white',
    border: buttonStyles?.border || 'none',
    borderRadius: buttonStyles?.borderRadius || '25px',
    cursor: 'pointer',
    fontSize: buttonStyles?.fontSize || '14px',
    fontWeight: buttonStyles?.fontWeight || '600',
    boxShadow: buttonStyles?.boxShadow || '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={buttonClassName}
        style={position !== 'none' ? { ...defaultButtonStyle, ...positionStyles[position] } : undefined}
        aria-label="Report an issue"
        data-feedback-button
        disabled={isCapturing}
        onMouseEnter={(e) => {
          if (buttonStyles?.hoverBackgroundColor) {
            e.currentTarget.style.backgroundColor = buttonStyles.hoverBackgroundColor;
          }
          if (buttonStyles?.hoverColor) {
            e.currentTarget.style.color = buttonStyles.hoverColor;
          }
        }}
        onMouseLeave={(e) => {
          if (buttonStyles?.backgroundColor) {
            e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor;
          }
          if (buttonStyles?.color) {
            e.currentTarget.style.color = buttonStyles.color;
          }
        }}
      >
        {isCapturing ? defaultLabels.capturingButtonText : defaultLabels.buttonText}
      </button>

      {isModalOpen && (
        <FeedbackModal
          adapter={adapter}
          labels={labels}
          includeMetadata={includeMetadata}
          onSuccess={onSuccess}
          onError={onError}
          onClose={handleCloseModal}
          initialScreenshot={capturedScreenshot}
          modalStyles={modalStyles}
          textLabels={textLabels}
        />
      )}
    </>
  );
};
