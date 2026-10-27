// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {selectTileMatrixTiles} from '@loaders.gl/tiles/tile-matrix';
import {OGCAPITilesSource} from '@loaders.gl/ogc/wms';

/** A small illustrative UTM31 grid; the coarse level is one column by two rows. */
export const MATRIX_SET = {
  id: 'fixed-utm31', crs: 'EPSG:32631', orderedAxes: ['X', 'Y'],
  tileMatrices: [
    {id: '1', cellSize: 4, pointOfOrigin: [500000, 5200000], cornerOfOrigin: 'topLeft',
      tileWidth: 256, tileHeight: 256, matrixWidth: 1, matrixHeight: 2},
    {id: 'survey:detail', cellSize: 2, pointOfOrigin: [500000, 5200000], cornerOfOrigin: 'topLeft',
      tileWidth: 256, tileHeight: 128, matrixWidth: 2, matrixHeight: 8,
      variableMatrixWidths: [{coalesce: 2, minTileRow: 1, maxTileRow: 2}]}
  ]
};

/** A fixed frame in native metres; no viewport or projection conversion is assumed. */
export const FRAME = {crs: 'EPSG:32631', extent: [500000, 5198976, 501024, 5200000], resolution: 2};

/** Offline transport with placeholder encoded bytes, so this walkthrough needs no live service. */
export async function fetchExampleData(url) {
  return String(url).endsWith('/ogc')
    ? Response.json({title: 'Offline UTM31 request walkthrough'})
    : new Response(new Uint8Array([1, 2, 3]));
}

/** Selects a fixed native frame and sends the selected requests through the actual OGC source. */
export async function runFixedFrameExample(fetcher = fetchExampleData, signal) {
  const source = new OGCAPITilesSource('https://example.invalid/ogc', {
    core: {fetch: fetcher},
    'ogc-api': {
      tileTemplate: 'https://example.invalid/ogc/tiles/{tileMatrix}/{tileRow}/{tileCol}',
      tileMatrixSet: MATRIX_SET,
      tileMatrixSetLimits: [{tileMatrix: 'survey:detail', minTileRow: 1, maxTileRow: 2,
        minTileCol: 1, maxTileCol: 1}]
    }
  });
  const metadata = await source.getMetadata();
  const tiles = selectTileMatrixTiles(metadata.tileGrid, FRAME);
  const content = await Promise.all(tiles.map(tile => source.getTileData({...tile, signal})));
  return {tiles, content};
}
