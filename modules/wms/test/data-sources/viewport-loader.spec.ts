// loaders.gl, MIT license

import test from 'tape-promise/tape';

import {ViewportLoader} from '@loaders.gl/wms';

test.only('ViewportLoader', async (t) => {
  let loaded = false;
  const viewportLoader = new ViewportLoader<string>({
    viewports: [{id: 'test-viewport', width: 256, height: 256, bounds: [30, 70, 35, 75]}],
    onLoadViewport() {
      return 'loaded';
    },
    onViewportLoad(viewport, data) {
      t.equal(data, 'loaded', 'viewportLoader.onViewportLoaded() called correctly');
      loaded = true;
    }
  });

  t.ok(viewportLoader);

  await new Promise((resolve) => setTimeout(resolve, 100));
  t.ok(loaded, 'loaded');
  t.end();
});
