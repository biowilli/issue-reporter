import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { captureScreenshot, getSystemMetadata } from '../src/core/screenshot';

const PAGE_HEIGHT = 2400;

const buildLongPage = () => {
  document.body.style.margin = '0';
  document.body.innerHTML = `
    <div style="height:${PAGE_HEIGHT}px;background:linear-gradient(#ff0000 0 50%, #0000ff 50% 100%)"></div>
    <button data-feedback-button style="position:fixed;bottom:0;right:0">Feedback</button>
  `;
};

const imageSize = async (blob: Blob) => {
  const bitmap = await createImageBitmap(blob);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
};

describe('captureScreenshot', () => {
  beforeEach(buildLongPage);

  afterEach(() => {
    window.scrollTo(0, 0);
    document.body.innerHTML = '';
  });

  it('captures the whole page by default, not just the visible part', async () => {
    const blob = await captureScreenshot();

    expect(blob).not.toBeNull();
    const size = await imageSize(blob!);
    expect(size.width).toBe(document.body.scrollWidth);
    expect(size.height).toBe(PAGE_HEIGHT);
  });

  it('shows the feedback button again after capturing', async () => {
    await captureScreenshot();

    const button = document.querySelector<HTMLElement>('[data-feedback-button]')!;
    expect(button.style.visibility).toBe('');
  });
});

describe('getSystemMetadata', () => {
  it('reports the page address and the viewport size', () => {
    const metadata = getSystemMetadata();

    expect(metadata.url).toBe(window.location.href);
    expect(metadata.viewportWidth).toBe(window.innerWidth);
    expect(metadata.viewportHeight).toBe(window.innerHeight);
  });
});
