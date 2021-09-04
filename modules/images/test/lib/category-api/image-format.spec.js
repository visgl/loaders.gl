import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/loader-utils';

import {_isImageFormatSupported} from '@loaders.gl/images';

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
  }
];

test('Image Category#isImageFormatSupported', (t) => {
  for (const tc of TEST_CASES) {
    const isSupported = _isImageFormatSupported(tc.mimeType);
    t.equal(isSupported, tc.supported, `${tc.mimeType} support ${isSupported}`);
  }
  t.end();
});
