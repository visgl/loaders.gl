import test from 'tape-promise/tape';

import {getSupportedGPUTextureFormats} from '@loaders.gl/textures';
import {isBrowser} from '@loaders.gl/core';

test('getSupportedGPUTextureFormats', t => {
  if (isBrowser) {
    // Minimal test as this is WebGL dependent
    const formats = getSupportedGPUTextureFormats();
    formats.forEach(format => t.ok(typeof format === 'string'));
    t.end();
  } else {
    const formats = getSupportedGPUTextureFormats();
    t.equal(formats.size, 0);
    t.end();
  }
});
