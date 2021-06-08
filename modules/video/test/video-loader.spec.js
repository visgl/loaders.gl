import test from 'tape-promise/tape';

import {VideoLoader} from '@loaders.gl/video';
import {isBrowser} from '@loaders.gl/core';

test('video loaders#imports', (t) => {
  t.ok(VideoLoader, 'ImageLoader defined');
  t.end();
});

test('VideoLoader#load(URL)', async (t) => {
  if (!isBrowser) {
    t.end();
    return;
  }

  t.end();
});
