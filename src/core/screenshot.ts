import domtoimage from 'dom-to-image-more';
import type { ScreenshotArea } from '../types';

export interface CaptureOptions {
  area?: ScreenshotArea;
}

async function cropToViewport(blob: Blob, element: HTMLElement): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const ratio = bitmap.width / element.scrollWidth;
  const bounds = element.getBoundingClientRect();
  const x = Math.max(0, Math.round(-bounds.left * ratio));
  const y = Math.max(0, Math.round(-bounds.top * ratio));
  const width = Math.min(bitmap.width - x, Math.round(document.documentElement.clientWidth * ratio));
  const height = Math.min(bitmap.height - y, Math.round(document.documentElement.clientHeight * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return blob;
  }
  context.drawImage(bitmap, x, y, width, height, 0, 0, width, height);
  bitmap.close();

  const cropped = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  return cropped ?? blob;
}

/**
 * Captures a screenshot of the current page using dom-to-image-more
 * @param element Optional element to capture (defaults to document.body)
 * @param options `area: 'viewport'` keeps only the part currently visible on screen (defaults to the whole element)
 * @returns Promise resolving to a Blob of the screenshot
 */
export async function captureScreenshot(
  element?: HTMLElement,
  options: CaptureOptions = {}
): Promise<Blob | null> {
  try {
    console.log('[issue-reporter] Starting screenshot capture with dom-to-image-more...');

    // Hide feedback buttons during capture
    const feedbackButtons = document.querySelectorAll('[data-feedback-button]');
    feedbackButtons.forEach((btn) => {
      (btn as HTMLElement).style.visibility = 'hidden';
    });

    const targetElement = element || document.body;

    console.log('[issue-reporter] Capturing element:', targetElement);

    // Use dom-to-image-more which handles modern CSS better
    const blob = await domtoimage.toBlob(targetElement, {
      quality: 0.95,
      bgcolor: '#ffffff',
      cacheBust: false, // Disable cache busting to prevent black boxes
      imagePlaceholder: undefined, // Don't use placeholder for failed images
      copyDefaultStyles: false, // Only copy inline styles to prevent rendering issues
      skipFonts: false, // Include web fonts
      skipAutoScale: false, // Keep proper scaling
      preferredFontFormat: 'woff', // Prefer WOFF fonts for better compatibility
      filter: (node: HTMLElement) => {
        // Filter out feedback-related elements
        if (node.hasAttribute && node.hasAttribute('data-feedback-button')) {
          return false;
        }
        if (node.classList && (
          node.classList.contains('feedback-modal') ||
          node.classList.contains('feedback-button')
        )) {
          return false;
        }
        // Skip iframes as they can cause issues
        if (node.tagName === 'IFRAME') {
          return false;
        }
        // Skip video and canvas elements that might cause black boxes
        if (node.tagName === 'VIDEO' || node.tagName === 'CANVAS') {
          return false;
        }
        return true;
      },
      style: {
        // Force remove problematic CSS properties
        'animation': 'none',
        'transition': 'none',
        'transform': 'none',
      },
    });

    // Show feedback buttons again
    feedbackButtons.forEach((btn) => {
      (btn as HTMLElement).style.visibility = '';
    });

    console.log('[issue-reporter] Screenshot blob created:', blob ? `${blob.size} bytes` : 'null');
    if (blob && options.area === 'viewport') {
      return await cropToViewport(blob, targetElement);
    }
    return blob;
  } catch (error) {
    console.error('[issue-reporter] Error capturing screenshot:', error);

    // Show feedback buttons again even on error
    const feedbackButtons = document.querySelectorAll('[data-feedback-button]');
    feedbackButtons.forEach((btn) => {
      (btn as HTMLElement).style.visibility = '';
    });

    return null;
  }
}

/**
 * Converts a Blob to a Base64 string
 * @param blob The blob to convert
 * @returns Promise resolving to a base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Gets system metadata for debugging
 * @returns Object containing system information
 */
export function getSystemMetadata(): Record<string, unknown> {
  // Parse user agent for browser info
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  if (ua.includes('Firefox/')) {
    browserName = 'Firefox';
    browserVersion = ua.split('Firefox/')[1]?.split(' ')[0] || 'Unknown';
  } else if (ua.includes('Edg/')) {
    browserName = 'Edge';
    browserVersion = ua.split('Edg/')[1]?.split(' ')[0] || 'Unknown';
  } else if (ua.includes('Chrome/')) {
    browserName = 'Chrome';
    browserVersion = ua.split('Chrome/')[1]?.split(' ')[0] || 'Unknown';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browserName = 'Safari';
    browserVersion = ua.split('Version/')[1]?.split(' ')[0] || 'Unknown';
  }

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Get timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Get current date and time in readable format
  const now = new Date();
  const dateTime = now.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Check if online
  const isOnline = navigator.onLine;

  // Get device pixel ratio
  const devicePixelRatio = window.devicePixelRatio || 1;

  // Get color depth
  const colorDepth = window.screen.colorDepth;

  // Check if cookies are enabled
  const cookiesEnabled = navigator.cookieEnabled;

  // Get available memory if available (Chrome only)
  const memory = (navigator as any).deviceMemory
    ? `${(navigator as any).deviceMemory} GB`
    : 'Unknown';

  // Get number of CPU cores if available
  const cpuCores = navigator.hardwareConcurrency || 'Unknown';

  return {
    // Browser information
    browser: browserName,
    browserVersion: browserVersion,
    userAgent: ua,

    // Operating System
    os: os,
    platform: navigator.platform,

    // Language and Location
    language: navigator.language,
    languages: navigator.languages.join(', '),
    timezone: timezone,

    // Date and Time
    timestamp: now.toISOString(),
    dateTime: dateTime,

    // Screen and Display
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    devicePixelRatio: devicePixelRatio,
    colorDepth: `${colorDepth}-bit`,

    // Page information
    url: window.location.href,
    referrer: document.referrer || 'Direct',
    pageTitle: document.title,

    // Connection and Performance
    online: isOnline,
    connectionType: (navigator as any).connection?.effectiveType || 'Unknown',

    // Hardware (if available)
    memory: memory,
    cpuCores: cpuCores,

    // Other
    cookiesEnabled: cookiesEnabled,
    touchSupport: 'ontouchstart' in window,
  };
}
