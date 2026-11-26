import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

let dark = false;
const media = new EventTarget();

export function setSystemDark(value: boolean) {
  dark = value;
  media.dispatchEvent(new Event('change'));
}

beforeEach(() => {
  dark = false;
  localStorage.clear();
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      get matches() {
        return query === '(prefers-color-scheme: dark)' && dark;
      },
      media: query,
      addEventListener: media.addEventListener.bind(media),
      removeEventListener: media.removeEventListener.bind(media),
    })),
  );
});

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
