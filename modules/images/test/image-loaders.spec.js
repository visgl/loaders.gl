import {ImageLoader, ImageBitmapLoader, HTMLImageLoader} from '@loaders.gl/images';

import test from 'tape-promise/tape';

test('image loaders#imports', t => {
  t.ok(ImageLoader, 'ImageLoader defined');
  t.ok(ImageBitmapLoader, 'ImageBitmapLoader defined');
  t.ok(HTMLImageLoader, 'HTMLImageLoader defined');
  t.end();
});
