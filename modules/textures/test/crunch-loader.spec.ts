// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {isBrowser, load, setLoaderOptions} from '@loaders.gl/core';
import {CrunchWorkerLoader} from '@loaders.gl/textures';
const CRUNCH_URL = '@loaders.gl/textures/test/data/shannon-dxt1.crn';
setLoaderOptions({
  _workerType: 'test',
  CDN: null
});
test('CrunchWorkerLoader#imports', () => {
  expect(CrunchWorkerLoader, 'CrunchWorkerLoader defined').toBeTruthy();
});
test.skip('CrunchWorkerLoader#load', async () => {
  // Decoder lib `src/libs/crunch.js` works only in browser
  if (isBrowser) {
    const texture = await load(CRUNCH_URL, CrunchWorkerLoader, {
      core: {worker: false}
    });
    expect(texture, 'Crunch container loaded OK').toBeTruthy();
  }
});
