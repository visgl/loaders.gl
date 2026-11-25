// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createDataSource, load} from '@loaders.gl/core';
import {GeoTIFFLoader, GeoTIFFRasterLoader} from '@loaders.gl/raster/geotiff';
// These cases exercise the root metadata descriptor, not the source implementation.
import {OMETiffLoader} from '@loaders.gl/raster/geotiff';
import {LERCLoader} from '@loaders.gl/raster/lerc';
import {TerrainLoader, QuantizedMeshLoader} from '@loaders.gl/raster/terrain';
import {
  GeoTIFFLoaderWithParser,
  GeoTIFFRasterLoaderWithParser
} from '@loaders.gl/raster/geotiff/bundled';
import {LERCLoaderWithParser} from '@loaders.gl/raster/lerc/bundled';
import {TerrainLoaderWithParser} from '@loaders.gl/raster/terrain/bundled';
import {QuantizedMeshLoaderWithParser} from '@loaders.gl/raster/quantized-mesh/bundled';

test.each([
  [GeoTIFFLoader, GeoTIFFLoaderWithParser],
  [GeoTIFFRasterLoader, GeoTIFFRasterLoaderWithParser],
  [LERCLoader, LERCLoaderWithParser],
  [TerrainLoader, TerrainLoaderWithParser],
  [QuantizedMeshLoader, QuantizedMeshLoaderWithParser]
])('metadata %s preloads its parser implementation', async (metadata, implementation) => {
  expect(metadata.module).toBe('raster');
  for (const method of ['parse', 'parseSync', 'parseText', 'parseInBatches'])
    expect(metadata).not.toHaveProperty(method);
  expect(await metadata.preload()).toBe(implementation);
});

test('raster source metadata defers constructors and keeps TIFF selection distinct', async () => {
  expect(GeoTIFFLoaderWithParser.testURL('https://example.com/a.tif')).toBe(true);
  expect(GeoTIFFLoaderWithParser.testURL('https://example.com/a.ome.tif')).toBe(false);
  expect(OMETiffLoader.testURL('https://example.com/a.ome.tif')).toBe(true);
  for (const metadata of [GeoTIFFLoader, OMETiffLoader]) {
    const implementation = await metadata.preload();
    expect(implementation.id).toBe(metadata.id);
    const source = implementation.createDataSourceSync(new Blob([]), {});
    expect(source).toBeDefined();
    expect((await createDataSource(new Blob([]), metadata)).constructor).toBe(source.constructor);
  }
});

test('synchronous OME-TIFF construction requires the implementation subpath', () => {
  expect(() => OMETiffLoader.createDataSourceSync(new Blob([]), {})).toThrow(
    'OMETiffLoader requires async createDataSource() or its source implementation subpath'
  );
});
