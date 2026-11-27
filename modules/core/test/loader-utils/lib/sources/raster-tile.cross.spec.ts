// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createTileGrid, readRasterTile} from '@loaders.gl/core/loader-utils';
import type {
  GetRasterTileParameters,
  NumericRasterData,
  RasterData,
  RasterSource,
  TileGrid
} from '@loaders.gl/core/loader-utils';
import {expect, test, vi} from 'vitest';

/** Tile address beyond the first column but within the coalesced tile. */
const TILE_ADDRESS = {tileMatrix: '7', x: 1, y: 0};

/** Creates an observable source with one coalesced native matrix and explicit coverage. */
function createSource() {
  const grid: TileGrid = {
    ...createTileGrid('EPSG:4326', [
      {
        id: '7',
        origin: [0, 0],
        resolution: 1,
        tileSize: [2, 1],
        matrixSize: [4, 1],
        variableMatrixWidths: [{coalesce: 2, minTileRow: 0, maxTileRow: 0}]
      }
    ]),
    limits: [{tileMatrix: '7', minTileColumn: 1, maxTileColumn: 1, minTileRow: 0, maxTileRow: 0}]
  };
  const raster: RasterData = {
    data: new Uint8Array([1, 2]),
    width: 2,
    height: 1,
    dtype: 'uint8',
    overview: 7,
    bandCount: 1
  };
  const getMetadata = vi.fn<RasterSource['getMetadata']>().mockResolvedValue({
    width: 8,
    height: 1,
    bandCount: 1,
    dtype: 'uint8',
    tileGrid: grid
  });
  const getRasterTile = vi
    .fn<(parameters: GetRasterTileParameters) => Promise<NumericRasterData | null>>()
    .mockResolvedValue(raster);
  const getRaster = vi.fn<RasterSource['getRaster']>();
  return {source: {getMetadata, getRaster, getRasterTile}, raster};
}

test('native raster bridge canonicalizes aliases and forwards raster selections and cancellation', async () => {
  const {source, raster} = createSource();
  const signal = new AbortController().signal;
  const parameters = {
    ...TILE_ADDRESS,
    signal,
    bands: [0],
    selection: {time: 2, depth: 3, channel: 1},
    interleaved: true
  };
  await expect(readRasterTile(source, parameters)).resolves.toBe(raster);
  expect(source.getMetadata).toHaveBeenCalledExactlyOnceWith({signal});
  expect(source.getRasterTile).toHaveBeenCalledExactlyOnceWith({...parameters, x: 0});
  expect(source.getRaster).not.toHaveBeenCalled();
});

test('native raster bridge distinguishes coverage misses, unknown matrices and sparse results', async () => {
  const {source} = createSource();
  await expect(readRasterTile(source, {...TILE_ADDRESS, x: 2})).resolves.toBeNull();
  await expect(readRasterTile(source, {...TILE_ADDRESS, tileMatrix: 'missing'})).rejects.toThrow(
    /Unknown tile matrix/
  );
  expect(source.getRasterTile).not.toHaveBeenCalled();
  source.getRasterTile.mockResolvedValueOnce(null);
  await expect(readRasterTile(source, TILE_ADDRESS)).resolves.toBeNull();
});

test('native raster bridge rejects a storage matrix omitted from native-read discovery', async () => {
  const {source} = createSource();
  source.getMetadata.mockResolvedValue({
    ...(await source.getMetadata()),
    nativeTileMatrixIds: []
  });

  await expect(readRasterTile(source, TILE_ADDRESS)).rejects.toThrow(
    'Tile matrix "7" does not support native tile reads. Readable matrix IDs: []'
  );
  await expect(readRasterTile(source, {...TILE_ADDRESS, tileMatrix: 'missing'})).rejects.toThrow(
    'Unknown tile matrix "missing"'
  );
  expect(source.getRasterTile).not.toHaveBeenCalled();
  expect(source.getRaster).not.toHaveBeenCalled();
});

test('native raster bridge requires complete geometry and a source tile reader', async () => {
  const {source} = createSource();
  const {getMetadata, getRaster} = source;
  await expect(readRasterTile({getMetadata, getRaster}, TILE_ADDRESS)).rejects.toThrow(
    /does not support native tile reads/
  );
  getMetadata.mockResolvedValueOnce({
    ...(await getMetadata()),
    tileGrid: {matrices: [{id: '7'}]}
  });
  await expect(readRasterTile(source, TILE_ADDRESS)).rejects.toThrow(/complete native tile matrix/);
  expect(source.getRasterTile).not.toHaveBeenCalled();
  expect(getRaster).not.toHaveBeenCalled();
});

test.each([
  {changes: {width: 1}, error: 'dimensions'},
  {changes: {height: 2}, error: 'dimensions'}
])('native raster bridge rejects a mismatched $error', async ({changes, error}) => {
  const {source, raster} = createSource();
  source.getRasterTile.mockResolvedValueOnce({...raster, ...changes});
  await expect(readRasterTile(source, TILE_ADDRESS)).rejects.toThrow(error);
});

test('native raster bridge rejects an aborted read even while the source is still decoding', async () => {
  const {source} = createSource();
  const controller = new AbortController();
  let startRead!: () => void;
  let finishRead!: (value: null) => void;
  const started = new Promise<void>(resolve => {
    startRead = resolve;
  });
  const pending = new Promise<null>(resolve => {
    finishRead = resolve;
  });
  source.getRasterTile.mockImplementationOnce(() => {
    startRead();
    return pending;
  });
  const reading = readRasterTile(source, {...TILE_ADDRESS, signal: controller.signal});
  await started;
  controller.abort();
  await expect(reading).rejects.toMatchObject({name: 'AbortError'});
  finishRead(null);
});
