// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {
  GeoTIFFLoader,
  GeoTIFFRasterLoader,
  LERCLoader,
  TerrainLoader,
  QuantizedMeshLoader,
  GeoTIFFSourceLoader,
  OMETiffSourceLoader
} from '@loaders.gl/raster';
import {GeoTIFFLoaderWithParser, GeoTIFFRasterLoaderWithParser} from '@loaders.gl/raster/geotiff';
import {LERCLoaderWithParser} from '@loaders.gl/raster/lerc';
import {TerrainLoaderWithParser} from '@loaders.gl/raster/terrain';
import {QuantizedMeshLoaderWithParser} from '@loaders.gl/raster/quantized-mesh';

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
  expect(GeoTIFFSourceLoader.testURL('https://example.com/a.tif')).toBe(true);
  expect(GeoTIFFSourceLoader.testURL('https://example.com/a.ome.tif')).toBe(false);
  expect(OMETiffSourceLoader.testURL('https://example.com/a.ome.tif')).toBe(true);
  for (const metadata of [GeoTIFFSourceLoader, OMETiffSourceLoader]) {
    expect(() => metadata.createDataSource(new Blob([]), {})).toThrow('requires async load()');
    const implementation = await metadata.preload();
    expect(implementation.id).toBe(metadata.id);
    const source = implementation.createDataSource(new Blob([]), {});
    expect(source).toBeDefined();
    expect((await load(new Blob([]), metadata)).constructor).toBe(source.constructor);
  }
});
