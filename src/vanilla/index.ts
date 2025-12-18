import { FeedbackReporterConfig, FeedbackData, IssueResponse } from '../types';
import { captureScreenshot, getSystemMetadata } from '../core/screenshot';

/**
 * Creates a feedback reporter instance for vanilla JS
 */
export function createFeedbackReporter(config: FeedbackReporterConfig) {
  let buttonElement: HTMLElement | null = null;

  /**
   * Creates and renders the feedback button
   */
  function renderButton(options?: {
    text?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    container?: HTMLElement;
  }) {
    const text = options?.text || '🐛 Report Issue';
    const position = options?.position || 'bottom-right';
    const container = options?.container || document.body;

    // Create button
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      padding: 12px 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      z-index: 9999;
    `;

    // Apply position
    const positions: Record<string, string> = {
      'bottom-right': 'position: fixed; bottom: 20px; right: 20px;',
      'bottom-left': 'position: fixed; bottom: 20px; left: 20px;',
      'top-right': 'position: fixed; top: 20px; right: 20px;',
      'top-left': 'position: fixed; top: 20px; left: 20px;',
    };
    button.style.cssText += positions[position];

    button.addEventListener('click', () => openModal());

    container.appendChild(button);
    buttonElement = button;

    return button;
  }

  /**
   * Opens the feedback modal
   */
  async function openModal() {
    // Capture screenshot
    const screenshot = await captureScreenshot();
    const screenshotUrl = screenshot ? URL.createObjectURL(screenshot) : null;

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
    `;

    modal.innerHTML = `
      <div style="
        background-color: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      ">
        <h2 style="margin-top: 0; margin-bottom: 20px;">Report an Issue</h2>
        <form id="feedback-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Title *</label>
            <input
              type="text"
              id="feedback-title"
              placeholder="Brief description of the issue"
              required
              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"
            />
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Description *</label>
            <textarea
              id="feedback-description"
              placeholder="Detailed description of the issue..."
              rows="5"
              required
              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; resize: vertical;"
            ></textarea>
          </div>
          ${screenshotUrl ? `
            <div style="margin-bottom: 16px;">
              <label style="display: flex; align-items: center; margin-bottom: 8px;">
                <input type="checkbox" id="include-screenshot" checked style="margin-right: 8px;">
                <span style="font-weight: 600;">Include screenshot</span>
              </label>
              <img
                id="screenshot-preview"
                src="${screenshotUrl}"
                alt="Screenshot preview"
                style="width: 100%; border: 1px solid #ddd; border-radius: 6px; margin-top: 8px;"
              />
            </div>
          ` : ''}
          <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
            <button
              type="button"
              id="cancel-btn"
              style="padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; margin-right: 10px; background-color: #f0f0f0; color: #333;"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-btn"
              style="padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; background-color: #4CAF50; color: white;"
            >
              Submit Issue
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    const form = modal.querySelector('#feedback-form') as HTMLFormElement;
    const submitBtn = modal.querySelector('#submit-btn') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement;
    const includeScreenshotCheckbox = modal.querySelector('#include-screenshot') as HTMLInputElement | null;
    const screenshotPreview = modal.querySelector('#screenshot-preview') as HTMLImageElement | null;

    if (includeScreenshotCheckbox && screenshotPreview) {
      includeScreenshotCheckbox.addEventListener('change', () => {
        screenshotPreview.style.display = includeScreenshotCheckbox.checked ? 'block' : 'none';
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const titleInput = modal.querySelector('#feedback-title') as HTMLInputElement;
      const descriptionInput = modal.querySelector('#feedback-description') as HTMLTextAreaElement;

      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      try {
        const feedbackData: FeedbackData = {
          title: titleInput.value.trim(),
          description: descriptionInput.value.trim(),
          screenshot: includeScreenshotCheckbox?.checked && screenshot ? screenshot : undefined,
          metadata: config.includeMetadata ? getSystemMetadata() : undefined,
        };

        const response = await config.adapter.createIssue(feedbackData);

        if (response) {
          config.onSuccess?.(response);
          alert(`Issue created successfully! View it at: ${response.url}`);
          closeModal();
        } else {
          throw new Error('Failed to create issue');
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        config.onError?.(err);
        alert('Failed to submit feedback. Please try again.');
      } finally {
        submitBtn.textContent = 'Submit Issue';
        submitBtn.disabled = false;
      }
    });

    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    function closeModal() {
      if (screenshotUrl) {
        URL.revokeObjectURL(screenshotUrl);
      }
      modal.remove();
    }
  }

  /**
   * Destroys the feedback reporter and removes the button
   */
  function destroy() {
    if (buttonElement) {
      buttonElement.remove();
      buttonElement = null;
    }
  }

  return {
    renderButton,
    openModal,
    destroy,
  };
}
