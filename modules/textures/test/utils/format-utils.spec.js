import test from 'tape-promise/tape';

import {getSupportedGPUTextureFormats} from '@loaders.gl/textures';

test('getSupportedGPUTextureFormats', t => {
  // Minimal test as this is WebGL dependent
  const formats = getSupportedGPUTextureFormats();
  t.ok(formats.every(format => typeof format === 'string'));
  t.end();
});
