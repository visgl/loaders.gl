// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {expect, test} from 'vitest';

const require = createRequire(import.meta.url);

test('installed ESM and CommonJS point sources expose the same decoded-data API', async () => {
  const esm = await import('../dist/point-cloud-tile-source-loader.js');
  const commonjs = require('../dist/point-cloud-tile-source-loader.cjs');
  for (const runtime of [esm, commonjs]) {
    const source = runtime.PointCloudTileSourceLoaderWithParser.createDataSource({
      topology: 'point-list',
      mode: 0,
      schema: {fields: [], metadata: {}},
      attributes: {POSITION: {value: new Float64Array([1, 2, 3]), size: 3}}
    });
    try {
      expect(await source.getMetadata()).toEqual({pointCount: 1, refinement: 'ADD'});
      expect((await source.getRootTile()).id).toBe('r');
    } finally {
      source.close();
    }
  }
  for (const metadata of [await import('../dist/index.js'), require('../dist/index.cjs')]) {
    expect(metadata.PointCloudTileSource).toBeUndefined();
    expect(metadata.PointCloudTileSourceLoader.createDataSource).toThrow('preload');
  }
});
