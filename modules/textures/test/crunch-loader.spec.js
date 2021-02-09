import test from 'tape-promise/tape';

import {isBrowser} from '@loaders.gl/core';
import {CrunchLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';
// import {setLoaderOptions} from '@loaders.gl/core';

const CRUNCH_URL = '@loaders.gl/textures/test/data/shannon-dxt1.crn';

// setLoaderOptions({
//   CDN: null,
//   basis: {
//     workerUrl: 'modules/textures/dist/crunch-loader.worker.js'
//   }
// });

test('CrunchLoader#imports', t => {
  t.ok(CrunchLoader, 'CrunchLoader defined');
  t.end();
});

test('CrunchLoader#load', async t => {
  // Decoder lib `src/libs/crunch.js` works only in browser
  if (isBrowser) {
    const texture = await load(CRUNCH_URL, CrunchLoader, {worker: false});
    t.ok(texture, 'Crunch container loaded OK');
  }
  t.end();
});
