// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {describe, expect, test} from 'vitest';
import type {RasterData, RasterSourceMetadata} from '@loaders.gl/loader-utils';
import {
  colorizeRasterData,
  createDefaultRasterRenderResult,
  createRasterRenderResult,
  createRasterViewport
} from '../src/raster-source-layer';

const GEOGRAPHIC_METADATA: RasterSourceMetadata = {
  width: 1000,
  height: 500,
  bandCount: 1,
  dtype: 'float32',
  crs: 'EPSG:4326',
  boundingBox: [
    [-180, -90],
    [180, 90]
  ]
};

function createViewport(bounds: [number, number, number, number]) {
  return {
    id: 'test-viewport',
    width: 400,
    height: 200,
    zoom: 4,
    getBounds: () => bounds,
    project: (position: number[]) => position,
    unprojectPosition: (position: number[]) => [position[0], position[1], position[2] || 0]
  } as any;
}

function createRaster(data: RasterData['data'], overrides: Partial<RasterData> = {}): RasterData {
  return {
    data,
    width: 2,
    height: 2,
    bandCount: 1,
    dtype: 'float32',
    ...overrides
  };
}

describe('raster colorization', () => {
  test('applies percentile scaling and transparent no-data pixels to a single band', () => {
    const image = colorizeRasterData(createRaster(new Float32Array([0, 10, 20, 30]), {noData: 10}));

    expect(image.width).toBe(2);
    expect(image.height).toBe(2);
    expect(Array.from(image.data.filter((_value, index) => index % 4 === 3))).toEqual([
      255, 0, 255, 255
    ]);
    expect(Array.from(image.data.slice(0, 3))).toEqual([8, 29, 88]);
    expect(Array.from(image.data.slice(12, 15))).toEqual([252, 217, 98]);
  });

  test('creates RGB composites from separate bands', () => {
    const image = colorizeRasterData(
      createRaster(
        [
          new Uint16Array([0, 100, 0, 100]),
          new Uint16Array([10, 10, 20, 20]),
          new Uint16Array([50, 0, 50, 0])
        ],
        {bandCount: 3, dtype: 'uint16'}
      )
    );

    expect(Array.from(image.data.slice(0, 8))).toEqual([0, 0, 255, 255, 255, 0, 0, 255]);
  });

  test('creates RGB composites from interleaved bands', () => {
    const image = colorizeRasterData(
      createRaster(new Uint8Array([0, 10, 50, 100, 20, 0, 50, 10, 50, 100, 20, 0]), {
        bandCount: 3,
        dtype: 'uint8',
        interleaved: true
      })
    );

    expect(Array.from(image.data.slice(0, 8))).toEqual([0, 0, 255, 255, 255, 255, 0, 255]);
  });
});

describe('raster viewport and placement', () => {
  test('uses geographic bounds directly for EPSG:4326', () => {
    const viewport = createRasterViewport(
      createViewport([-10, -5, 20, 15]),
      GEOGRAPHIC_METADATA,
      1024
    );

    expect(viewport.bounds).toEqual([
      [-10, -5],
      [20, 15]
    ]);
    expect(viewport.crs).toBe('EPSG:4326');
    expect(viewport.width).toBeGreaterThanOrEqual(400);
  });

  test('projects viewport bounds for EPSG:3857', () => {
    const viewport = createRasterViewport(
      createViewport([0, 0, 1, 1]),
      {...GEOGRAPHIC_METADATA, crs: 'EPSG:3857'},
      1024
    );

    expect(viewport.bounds?.[1][0]).toBeCloseTo(111319.49, 0);
    expect(viewport.bounds?.[1][1]).toBeCloseTo(111325.14, 0);
  });

  test('uses a full pixel-coordinate plane for non-geospatial rasters', () => {
    const metadata = {...GEOGRAPHIC_METADATA, crs: undefined, boundingBox: undefined};
    const viewport = createRasterViewport(createViewport([-10, -5, 20, 15]), metadata, 1024);
    const renderResult = createDefaultRasterRenderResult(
      createRaster(new Float32Array([0, 1, 2, 3])),
      {viewport, bands: [0]},
      metadata
    );

    expect(viewport.bounds).toEqual([
      [0, 0],
      [1000, 500]
    ]);
    expect(renderResult.bounds).toEqual([0, 500, 1000, 0]);
    expect(renderResult.coordinateSystem).toBe(COORDINATE_SYSTEM.CARTESIAN);
  });

  test('requires a custom request projection for unsupported CRS values', () => {
    const metadata = {...GEOGRAPHIC_METADATA, crs: 'EPSG:27700'};
    expect(() => createRasterViewport(createViewport([0, 0, 1, 1]), metadata)).toThrow(
      'Provide getRasterParameters()'
    );
    expect(() =>
      createRasterViewport(createViewport([0, 0, 1, 1]), metadata, 1024, true)
    ).not.toThrow();
  });

  test('converts EPSG:3857 response bounds back to longitude and latitude', () => {
    const raster = createRaster(new Float32Array([0, 1, 2, 3]), {
      crs: 'EPSG:3857',
      boundingBox: [
        [0, 0],
        [111319.4908, 111325.1429]
      ]
    });
    const viewport = createRasterViewport(createViewport([0, 0, 1, 1]), {
      ...GEOGRAPHIC_METADATA,
      crs: 'EPSG:3857'
    });
    const result = createDefaultRasterRenderResult(
      raster,
      {viewport, bands: [0]},
      {...GEOGRAPHIC_METADATA, crs: 'EPSG:3857'}
    );

    expect(result.bounds?.[2]).toBeCloseTo(1, 5);
    expect(result.bounds?.[3]).toBeCloseTo(1, 5);
    expect(result.coordinateSystem).toBe(COORDINATE_SYSTEM.LNGLAT);
  });

  test('custom colorization inherits inferred geographic placement', () => {
    const raster = createRaster(new Float32Array([0, 1, 2, 3]));
    const viewport = createRasterViewport(createViewport([-10, -5, 20, 15]), GEOGRAPHIC_METADATA);
    const customImage = {data: new Uint8ClampedArray(16), width: 2, height: 2};
    const result = createRasterRenderResult(
      {requestId: 1, raster, parameters: {viewport, bands: [0]}},
      GEOGRAPHIC_METADATA,
      () => ({image: customImage})
    );

    expect(result.image).toBe(customImage);
    expect(result.bounds).toEqual([-10, -5, 20, 15]);
    expect(result.coordinateSystem).toBe(COORDINATE_SYSTEM.LNGLAT);
  });
});
