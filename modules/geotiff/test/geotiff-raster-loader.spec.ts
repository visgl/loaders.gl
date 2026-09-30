// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {fetchFile, load, parse} from '@loaders.gl/core';
import {GeoTIFFRasterLoader} from '@loaders.gl/geotiff';
import type {GeoTIFFRasterData} from '@loaders.gl/geotiff';
import {GeoTIFFRasterLoaderWithParser} from '@loaders.gl/geotiff/geotiff-raster-loader';

const fixture = (name: string) => `@loaders.gl/geotiff/test/data/numeric/${name}.tif`;
let point: GeoTIFFRasterData;
let nestedBytes: ArrayBuffer;
beforeAll(async () => {
  point = await load(fixture('point-float32'), GeoTIFFRasterLoader);
  nestedBytes = await (await fetchFile(fixture('nested-grids'))).arrayBuffer();
});

test('numeric metadata loader preloads its parser and returns cloneable raw Float32 samples', () => {
  expect(GeoTIFFRasterLoader).not.toHaveProperty('parse');
  const result = structuredClone(point);
  expect(result).toEqual(point);
  const image = result.images[0];
  expect(image).toMatchObject({index: 0, width: 4, height: 4, crs: 'EPSG:4326', noData: null});
  expect(image.bands[0].data).toBeInstanceOf(Float32Array);
  expect(Array.from(image.bands[0].data)).toEqual([
    22, 24, 28.5, 32, 19, 21.25, 24.5, 26, 15, 17.5, 18, 20.25, 12.5, 13.25, 14.5, 16
  ]);
  expect(image.metadata).toEqual({TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL'});
  expect(image.bands[0].metadata).toEqual({DESCRIPTION: 'geoid_undulation', UNITTYPE: 'metre'});
  expect(image.geoKeys?.GTRasterTypeGeoKey).toBe(2);
  expect(Array.from(image.fileDirectory.ModelTiepoint as ArrayLike<number>)).toEqual([
    0, 0, 0, 10, 43, 0
  ]);
});

test('Deflate and PixelIsArea retain original samples and corner registration', async () => {
  const {
    images: [image]
  } = await load(fixture('area-deflate'), GeoTIFFRasterLoader);
  expect(image.bands).toEqual(point.images[0].bands);
  expect(image.geoKeys?.GTRasterTypeGeoKey).toBe(1);
  expect(Array.from(image.fileDirectory.ModelTiepoint as ArrayLike<number>)).toEqual([
    0, 0, 0, 9.5, 43.5, 0
  ]);
});

test('signed big-endian samples remain unscaled with per-band scale and offset', async () => {
  const {
    images: [image]
  } = await load(fixture('scaled-int16-big-endian'), GeoTIFFRasterLoader);
  expect(image.bands[0].data).toBeInstanceOf(Int16Array);
  expect(image.bands[0].data[0]).toBe(128);
  expect(image.bands[0].metadata).toMatchObject({SCALE: '0.25', OFFSET: '-10'});
});

test('nodata is preserved in its declared and stored precisions without replacement', async () => {
  const {
    images: [image]
  } = await load(fixture('nodata'), GeoTIFFRasterLoader);
  expect(image.noData).toBe(-9999.1);
  expect(image.bands[0].data[12]).toBe(Math.fround(-9999.1));
});

test('nonzero tiepoint indices survive decoding without assuming the first pixel', async () => {
  const {
    images: [image]
  } = await load(fixture('nonzero-tiepoint'), GeoTIFFRasterLoader);
  expect(Array.from(image.fileDirectory.ModelTiepoint as ArrayLike<number>)).toEqual([
    2, 1, 0, 12, 42, 0
  ]);
});

test('nested images stay in file order and selections retain original identities', async () => {
  const result = await parse(nestedBytes, GeoTIFFRasterLoader, {geotiff: {imageIndices: [1, 0]}});
  expect(result.images.map(image => [image.index, image.width, image.height])).toEqual([
    [0, 4, 4],
    [1, 3, 3]
  ]);
  expect(result.images[1].bands[0].data[0]).toBe(109);
  const selected = await parse(nestedBytes, GeoTIFFRasterLoaderWithParser, {
    geotiff: {imageIndices: [1], bands: [0]}
  });
  expect(selected.images).toEqual([result.images[1]]);
});

for (const selection of [[], [-1], [0.5], [0, 0], [2], [NaN]]) {
  test(`rejects invalid image and band selection ${JSON.stringify(selection)}`, async () => {
    for (const field of ['imageIndices', 'bands']) {
      await expect(
        parse(nestedBytes, GeoTIFFRasterLoader, {geotiff: {[field]: selection}})
      ).rejects.toThrow('unique valid indices');
    }
  });
}

test('multiple bands are planar and selection preserves band index and distinct GDAL metadata', async () => {
  const bytes = await (await fetchFile(fixture('multiband'))).arrayBuffer();
  const result = await parse(bytes, GeoTIFFRasterLoader, {geotiff: {bands: [1, 0]}});
  expect(
    result.images[0].bands.map(band => [band.index, Array.from(band.data), band.metadata])
  ).toEqual([
    [0, [-2, 2, 3, 4], {DESCRIPTION: 'height'}],
    [1, [11, 12, 13, 14], {DESCRIPTION: 'uncertainty'}]
  ]);
  expect(result.images[0].metadata).toEqual({NAME: 'test'});
  expect(result.images[0].fileDirectory.NewSubfileType).toBe(1);
  expect(result.images[0].crs).toBeUndefined();
  const selected = await parse(bytes, GeoTIFFRasterLoader, {geotiff: {bands: [1]}});
  expect(selected.images[0].bands).toEqual([result.images[0].bands[1]]);
});

test('invalid TIFF input rejects without returning partial data', async () => {
  await expect(parse(new ArrayBuffer(32), GeoTIFFRasterLoader)).rejects.toThrow();
});
