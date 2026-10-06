// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {sampleRaster, rasterCoordinateToPixel, computeRasterStatistics} from '../../../src';
import type {RasterData} from '../../../src';

/** Creates a minimal georeferenced float payload. */
function createRaster(): RasterData {
  return {
    data: new Float32Array([0, 2, 4, 6]),
    width: 2,
    height: 2,
    bandCount: 1,
    dtype: 'float32',
    crs: 'EPSG:3857',
    transform: [2, 1, 10, -1, -3, 20],
    bands: [{index: 5, dtype: 'float32', scale: 2, offset: 10}]
  };
}

test('sampling preserves raw zero and applies physical scaling once', () => {
  const raster = createRaster();
  expect(sampleRaster(raster, [0, 0]).values).toEqual([0]);
  expect(sampleRaster(raster, [0.5, 0.5], {method: 'bilinear', domain: 'physical'})).toMatchObject({
    values: [16],
    valid: [true],
    bands: [5]
  });
  expect(sampleRaster(raster, [-0.51, 0]).miss).toBe(true);
  expect(sampleRaster(raster, [-0.5, 0]).values).toEqual([0]);
});

test.each([
  false,
  true
])('sampling layouts share masks and original band identity (interleaved=%s)', interleaved => {
  const raster: RasterData = {
    data: interleaved
      ? new Int16Array([0, 10, 2, -1])
      : [new Int16Array([0, 2]), new Int16Array([10, -1])],
    width: 2,
    height: 1,
    bandCount: 2,
    dtype: 'int16',
    interleaved,
    bands: [
      {index: 2, dtype: 'int16'},
      {index: 7, dtype: 'int16', noData: -1}
    ],
    validityMasks: [{data: new Uint8Array([1, 0]), width: 2, height: 1, band: 0}]
  };
  expect(sampleRaster(raster, [0, 0]).values).toEqual([0, 10]);
  expect(sampleRaster(raster, [1, 0])).toMatchObject({
    values: [undefined, undefined],
    valid: [false, false],
    bands: [2, 7]
  });
  expect(sampleRaster(raster, [0.5, 0], {method: 'bilinear'}).valid).toEqual([false, false]);
});

test('float nodata compares at representable precision and valid masks do not override it', () => {
  const raster = createRaster();
  raster.data = new Float32Array([-9999.1, NaN, Infinity, 0]);
  raster.noData = -9999.1;
  raster.validityMasks = [{data: new Uint8Array([1, 1, 1, 1]), width: 2, height: 2}];
  expect(computeRasterStatistics(raster, 4)[0]).toMatchObject({
    min: 0,
    max: 0,
    validCount: 1,
    method: 'exact'
  });
  expect(computeRasterStatistics(raster, 1)[0]).toMatchObject({
    min: undefined,
    max: undefined,
    validCount: 0,
    method: 'sampled'
  });
  expect(() => computeRasterStatistics(raster, 0)).toThrow();
});

test('affine inverse preserves shear and registration and rejects absent or singular transforms', () => {
  const raster = createRaster();
  expect(rasterCoordinateToPixel(raster, [11.5, 18], 'EPSG:3857')).toEqual([0, 0]);
  raster.pixelRegistration = 'point';
  expect(rasterCoordinateToPixel(raster, [10, 20], 'EPSG:3857')).toEqual([0, 0]);
  expect(() => rasterCoordinateToPixel(raster, [10, 20], 'EPSG:4326')).toThrow('CRS');
  raster.transform = [1, 2, 0, 2, 4, 0];
  expect(() => rasterCoordinateToPixel(raster, [0, 0], 'EPSG:3857')).toThrow('Singular');
  raster.transform = undefined;
  expect(() => rasterCoordinateToPixel(raster, [0, 0], 'EPSG:3857')).toThrow('unavailable');
});

test('structured clone preserves metadata and typed buffers without mutating samples', () => {
  const original = createRaster();
  const cloned = structuredClone(original);
  expect(cloned.data).toBeInstanceOf(Float32Array);
  expect(sampleRaster(cloned, [0, 0], {domain: 'physical'}).values).toEqual([10]);
  expect(original.data[0]).toBe(0);
});

test.each([
  Uint8Array,
  Int16Array,
  Float32Array,
  Float64Array
])('numeric representations preserve valid zeros and constant ranges (%s)', typedArrayConstructor => {
  const raster = createRaster();
  raster.data = new typedArrayConstructor([0, 0, 0, 0]);
  raster.dtype =
    typedArrayConstructor === Uint8Array
      ? 'uint8'
      : typedArrayConstructor === Int16Array
        ? 'int16'
        : typedArrayConstructor === Float32Array
          ? 'float32'
          : 'float64';
  raster.bands = undefined;
  expect(sampleRaster(raster, [0, 0]).values).toEqual([0]);
  expect(computeRasterStatistics(raster, 4)[0]).toMatchObject({min: 0, max: 0, validCount: 4});
});

test('mixed representations retain per-band precision without inventing a common dtype', () => {
  const raster = {
    data: [new Int16Array([-2, 0]), new Float64Array([1e100, 2e100])],
    dtype: 'mixed' as const,
    interleaved: false as const,
    width: 2,
    height: 1,
    bandCount: 2,
    bands: [
      {index: 3, dtype: 'int16' as const},
      {index: 8, dtype: 'float64' as const}
    ]
  };
  expect(sampleRaster(raster, [0, 0])).toMatchObject({
    values: [-2, 1e100],
    valid: [true, true],
    bands: [3, 8]
  });
  expect(computeRasterStatistics(raster, 2)[1]).toMatchObject({min: 1e100, max: 2e100});
});

test('worker transfer retains scientific metadata and explicitly transfers ownership', () => {
  const raster = createRaster();
  raster.ownership = 'transferred';
  const buffer = (raster.data as Float32Array).buffer;
  const transferred = structuredClone(raster, {transfer: [buffer]});
  expect(buffer.byteLength).toBe(0);
  expect(transferred.data).toBeInstanceOf(Float32Array);
  expect(transferred.ownership).toBe('transferred');
  expect(sampleRaster(transferred, [1, 1], {domain: 'physical'}).values).toEqual([22]);
});

test('categorical bilinear requests use nearest and physical overflow remains invalid', () => {
  const raster = createRaster();
  raster.bands![0].categorical = true;
  expect(sampleRaster(raster, [0.5, 0.5], {method: 'bilinear'}).values).toEqual([6]);
  raster.bands![0].scale = Number.MAX_VALUE;
  expect(sampleRaster(raster, [1, 1], {domain: 'physical'}).valid).toEqual([false]);
});
