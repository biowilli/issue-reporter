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

const colourAt = async (blob: Blob, x: number, y: number) => {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const [red, green, blue] = context.getImageData(x, y, 1, 1).data;
  return { red, green, blue };
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

  it('keeps only the visible part of the page when asked for the viewport', async () => {
    window.scrollTo(0, 1500);

    const blob = await captureScreenshot(undefined, { area: 'viewport' });

    expect(blob).not.toBeNull();
    const size = await imageSize(blob!);
    expect(size.width).toBe(document.documentElement.clientWidth);
    expect(size.height).toBe(document.documentElement.clientHeight);
    const centre = await colourAt(blob!, size.width / 2, size.height / 2);
    expect(centre).toEqual({ red: 0, green: 0, blue: 255 });
  });

  it('crops the viewport from the top while the page is not scrolled', async () => {
    const blob = await captureScreenshot(undefined, { area: 'viewport' });

    const size = await imageSize(blob!);
    expect(size.height).toBe(document.documentElement.clientHeight);
    const centre = await colourAt(blob!, size.width / 2, size.height / 2);
    expect(centre).toEqual({ red: 255, green: 0, blue: 0 });
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
