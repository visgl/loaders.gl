// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {CoreAPI} from '@loaders.gl/loader-utils';
import type {MVTLoaderOptions} from '@loaders.gl/mvt';
import {PMTilesTileSource} from '../src/pmtiles-source-loader';

test('PMTilesTileSource#getVectorTile forwards requested layers to the decoder', async () => {
  const receivedOptions: MVTLoaderOptions[] = [];
  const source = Object.assign(Object.create(PMTilesTileSource.prototype), {
    options: {pmtiles: {shape: 'arrow-table'}},
    loadOptions: {mvt: {layerProperty: 'sourceLayer', layers: ['fallback']}},
    coreApi: {
      async parse(_data: unknown, _loaders: unknown, options: MVTLoaderOptions) {
        receivedOptions.push(options);
        return {shape: 'arrow-table'};
      }
    } as unknown as CoreAPI,
    async getTile() {
      return new ArrayBuffer(1);
    }
  }) as PMTilesTileSource;

  await source.getVectorTile({x: 2, y: 1, z: 3, layers: ['roads']});
  await source.getVectorTile({x: 2, y: 1, z: 3, layers: []});

  expect(receivedOptions[0].mvt).toMatchObject({
    shape: 'arrow-table',
    coordinates: 'wgs84',
    tileIndex: {x: 2, y: 1, z: 3},
    layerProperty: 'sourceLayer',
    layers: ['roads']
  });
  expect(receivedOptions[1].mvt?.layers).toEqual(['fallback']);
});
