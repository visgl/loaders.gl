import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/loader-utils';

import {isImageFormatSupported, getSupportedImageFormats} from '@loaders.gl/images';

export const TEST_CASES = [
  {
    mimeType: 'image/png',
    supported: true
  },
  {
    mimeType: 'image/jpeg',
    supported: true
  },
  {
    mimeType: 'image/gif',
    supported: true
  },
  {
    mimeType: 'image/svg',
    supported: isBrowser
  },
  {
    mimeType: 'image/bmp',
    supported: isBrowser
  },
  {
    mimeType: 'image/tiff',
    supported: isBrowser
  },
  {
    mimeType: 'image/webp',
    supported: isBrowser
  },
  {
    mimeType: 'image/avif',
    supported: false,
    supportedAsync: isBrowser
  }
];

test('Image Category#isImageFormatSupported', (t) => {
  for (const tc of TEST_CASES) {
    const isSupported = isImageFormatSupported(tc.mimeType);
    t.equal(isSupported, tc.supported, `${tc.mimeType} support ${isSupported}`);
  }
  t.end();
});

test('Image Category#getSupportedImageFormats', async (t) => {
  const supportedImageFormats = await getSupportedImageFormats();
  for (const tc of TEST_CASES) {
    const isSupported = supportedImageFormats.has(tc.mimeType);
    t.equal(
      isSupported,
      Boolean(tc.supported || tc.supportedAsync),
      `${tc.mimeType} support ${isSupported}`
    );
  }
  t.end();
});
