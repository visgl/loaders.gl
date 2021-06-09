import test from 'tape-promise/tape';

import {isBrowser} from '@loaders.gl/core';
import {CrunchWorkerLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';
import {setLoaderOptions} from '@loaders.gl/core';

const CRUNCH_URL = '@loaders.gl/textures/test/data/shannon-dxt1.crn';

setLoaderOptions({
  _workerType: 'test',
  CDN: null
});

test('CrunchWorkerLoader#imports', (t) => {
  t.ok(CrunchWorkerLoader, 'CrunchWorkerLoader defined');
  t.end();
});

test.skip('CrunchWorkerLoader#load', async (t) => {
  // Decoder lib `src/libs/crunch.js` works only in browser
  if (isBrowser) {
    const texture = await load(CRUNCH_URL, CrunchWorkerLoader, {worker: false});
    t.ok(texture, 'Crunch container loaded OK');
  }
  t.end();
});
