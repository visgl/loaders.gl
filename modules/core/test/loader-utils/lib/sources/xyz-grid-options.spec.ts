// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createWebMercatorTileGrid} from '@loaders.gl/core/loader-utils';
import {getXYZTileGridOptions} from '@loaders.gl/core/loader-utils/tile-grid';

test('shared XYZ assessment distinguishes complete compatibility from unknown metadata', () => {
  expect(getXYZTileGridOptions()).toEqual({
    status: 'unknown',
    options: {minZoom: 0, maxZoom: 30, tileSize: 256}
  });
  expect(getXYZTileGridOptions({tileGrid: {matrices: [{id: 'partial'}]}}).status).toBe('unknown');
  const grid = createWebMercatorTileGrid(2, 3, 512);
  expect(getXYZTileGridOptions({tileGrid: grid})).toEqual({
    status: 'compatible',
    options: {minZoom: 2, maxZoom: 3, tileSize: 512}
  });
  expect(() =>
    getXYZTileGridOptions({
      tileGrid: {...grid, tileMatrixSet: {...grid.tileMatrixSet!, crs: 'EPSG:32631'}}
    })
  ).toThrow('requires');
  expect(() =>
    getXYZTileGridOptions({
      tileGrid: {
        matrices: [
          {id: 'partial', variableMatrixWidths: [{coalesce: 2, minTileRow: 0, maxTileRow: 0}]}
        ]
      }
    })
  ).toThrow('coalesced');
});
