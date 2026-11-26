import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FeedbackButton } from '../src/react/FeedbackButton';
import type { IssueTrackerAdapter, ScreenshotArea } from '../src/types';

const PAGE_HEIGHT = 2400;

const adapter: IssueTrackerAdapter = {
  createIssue: vi.fn(async () => ({ id: 1, url: 'https://example.org/1', title: 'x' })),
};

let host: HTMLDivElement;
let root: Root;

const waitForPreview = async () => {
  await vi.waitFor(
    () => {
      const preview = document.querySelector<HTMLImageElement>('img[src^="blob:"]');
      if (!preview || !preview.complete || preview.naturalHeight === 0) throw new Error('no preview yet');
    },
    { timeout: 10000 }
  );
  return document.querySelector<HTMLImageElement>('img[src^="blob:"]')!;
};

const openWith = async (screenshotArea?: ScreenshotArea) => {
  await act(async () => {
    root.render(<FeedbackButton adapter={adapter} screenshotArea={screenshotArea} />);
  });
  window.scrollTo(0, 1500);
  await act(async () => {
    document.querySelector<HTMLButtonElement>('[data-feedback-button]')!.click();
  });
  return waitForPreview();
};

describe('FeedbackButton', () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    document.body.style.margin = '0';
    document.body.innerHTML = `<div style="height:${PAGE_HEIGHT}px"></div>`;
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    window.scrollTo(0, 0);
    document.body.innerHTML = '';
  });

  it('previews the visible part of the page when screenshotArea is viewport', async () => {
    const preview = await openWith('viewport');

    expect(preview.naturalHeight).toBe(document.documentElement.clientHeight);
  });

  it('still previews the whole page without the option', async () => {
    const preview = await openWith();

    expect(preview.naturalHeight).toBeGreaterThanOrEqual(PAGE_HEIGHT);
  });
});
