import {
  ImageBitmapLoader,
  HTMLImageLoader,
  PlatformImageLoader
} from '@loaders.gl/core';

import test from 'tape-promise/tape';

test('image loaders#imports', t => {
  t.ok(ImageBitmapLoader, 'ImageBitmapLoader defined');
  t.ok(HTMLImageLoader, 'HTMLImageLoader defined');
  t.ok(PlatformImageLoader, 'PlatformImageLoader defined');
  t.end();
});
