// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {
  DataSourceOptions,
  GetImageParameters,
  GetRasterParameters,
  GetTileDataParameters,
  GetTileParameters,
  ImageSource,
  ImageSourceMetadata,
  ImageType,
  RasterData,
  RasterSource,
  RasterSourceMetadata,
  TableScanSource,
  TileSource
} from '../../../src';
import {createScanQueryMetadata, DataSource} from '../../../src';

type CompositeSourceMetadata = ImageSourceMetadata & RasterSourceMetadata;

/** Test source that exposes several independent capabilities from one runtime object. */
class CompositeSource
  extends DataSource<string, DataSourceOptions>
  implements ImageSource, RasterSource, TileSource, TableScanSource<string>
{
  /** Creates a source with shared `DataSource` state for every capability. */
  constructor() {
    super('composite://source', {});
  }

  /** Returns one rich metadata object that satisfies each visual capability. */
  async getMetadata(): Promise<CompositeSourceMetadata> {
    return {
      name: 'composite',
      keywords: [],
      layers: [],
      width: 1,
      height: 1,
      bandCount: 1,
      dtype: 'uint8'
    };
  }

  /** Returns a one-pixel image. */
  async getImage(parameters: GetImageParameters): Promise<ImageType> {
    return {data: new Uint8Array([parameters.width]), width: 1, height: 1};
  }

  /** Returns a one-pixel typed raster. */
  async getRaster(parameters: GetRasterParameters): Promise<RasterData> {
    return {
      data: new Uint8Array([parameters.viewport.width]),
      width: 1,
      height: 1,
      bandCount: 1,
      dtype: 'uint8'
    };
  }

  /** Returns one tile payload. */
  async getTile(parameters: GetTileParameters): Promise<unknown> {
    return parameters;
  }

  /** Adapts the deck.gl tile request shape to the flat tile method. */
  async getTileData(parameters: GetTileDataParameters): Promise<unknown> {
    return this.getTile(parameters.index);
  }

  /** Describes the source's table-scan capability. */
  async getQueryMetadata() {
    return createScanQueryMetadata({
      sourceType: 'composite',
      queryType: 'table',
      execution: {status: 'supported', method: 'read'},
      schema: {fields: [], metadata: {}},
      capabilities: {
        table: {
          projection: 'unsupported',
          predicate: 'unsupported',
          limit: 'unsupported',
          streaming: true,
          cancellation: true
        }
      }
    });
  }

  /** Emits one deterministic batch through the scan capability. */
  async *read(): AsyncIterable<string> {
    yield 'batch';
  }
}

test('DataSource capability interfaces compose on one runtime object', async () => {
  const source = new CompositeSource();
  const imageSource: ImageSource = source;
  const rasterSource: RasterSource = source;
  const tileSource: TileSource = source;
  const tableScanSource: TableScanSource<string> = source;

  expect((await imageSource.getMetadata()).name).toBe('composite');
  expect((await rasterSource.getMetadata()).width).toBe(1);
  expect(await imageSource.getImage(createImageParameters())).toMatchObject({width: 1, height: 1});
  expect(await rasterSource.getRaster({viewport: createRasterViewport()})).toMatchObject({
    width: 1,
    height: 1,
    bandCount: 1
  });
  expect(await tileSource.getTile({x: 1, y: 2, z: 3})).toMatchObject({x: 1, y: 2, z: 3});
  expect((await tableScanSource.getQueryMetadata()).execution).toEqual({
    status: 'supported',
    method: 'read'
  });

  const batches: string[] = [];
  for await (const batch of tableScanSource.read()) {
    batches.push(batch);
  }
  expect(batches).toEqual(['batch']);
});

/** Creates the smallest valid image request. */
function createImageParameters(): GetImageParameters {
  return {
    layers: [],
    boundingBox: [
      [0, 0],
      [1, 1]
    ],
    width: 1,
    height: 1
  };
}

/** Creates the smallest valid raster viewport. */
function createRasterViewport(): GetRasterParameters['viewport'] {
  return {
    id: 'composite',
    width: 1,
    height: 1,
    zoom: 0,
    center: [0, 0],
    bounds: [
      [0, 0],
      [1, 1]
    ],
    project: coordinates => coordinates,
    unprojectPosition: position => position as [number, number, number]
  };
}
