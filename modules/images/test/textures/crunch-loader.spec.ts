// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load, setLoaderOptions} from '@loaders.gl/core';
import {CrunchLoader} from '@loaders.gl/images';
const CRUNCH_URL = '@loaders.gl/images/test/textures/data/shannon-dxt1.crn';
setLoaderOptions({core: {_workerType: 'test', CDN: null}});
test('CrunchLoader#imports', () => {
  expect(CrunchLoader, 'CrunchLoader defined').toBeTruthy();
});
test.skip('CrunchLoader#load', async () => {
  // Decoder lib `src/libs/crunch.js` works only in browser

  const texture = await load(CRUNCH_URL, CrunchLoader, {
    core: {worker: false}
  });
  expect(texture, 'Crunch container loaded OK').toBeTruthy();
});
