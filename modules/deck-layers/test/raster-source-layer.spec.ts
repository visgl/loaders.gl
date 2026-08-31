// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {describe, expect, test, vi} from 'vitest';
import type {RasterData, RasterSourceMetadata} from '@loaders.gl/loader-utils';
import {RasterSet} from '@loaders.gl/tiles';
import {
  RasterSourceLayer,
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

  test('accepts an authority-coded CRS object from current RasterSource metadata', () => {
    const metadata = {
      ...GEOGRAPHIC_METADATA,
      crs: {id: {authority: 'EPSG', code: 4326}}
    } as RasterSourceMetadata;
    const viewport = createRasterViewport(createViewport([-10, -5, 20, 15]), metadata);

    expect(viewport.crs).toBe('EPSG:4326');
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

  test('uses metadata no-data values when a response omits the repeated field', () => {
    const raster = createRaster(new Float32Array([0, 10, 20, 30]));
    const metadata = {...GEOGRAPHIC_METADATA, noData: 10};
    const result = createDefaultRasterRenderResult(
      raster,
      {viewport: createRasterViewport(createViewport([-10, -5, 20, 15]), metadata), bands: [0]},
      metadata
    );

    const image = result.image as {data: Uint8ClampedArray};
    expect(Array.from(image.data.slice(4, 8))).toEqual([0, 0, 0, 0]);
  });
});

describe('RasterSourceLayer lifecycle', () => {
  test('initializes, updates, and renders accepted raster results', () => {
    const layer = createRasterLayer();
    layer.initializeState();
    expect(layer.shouldUpdateState()).toBe(true);
    expect(layer.renderLayers()).toBeNull();
    expect(layer.isLoaded).toBe(false);

    const requestRaster = vi.fn();
    layer.context = {viewport: createViewport([-10, -5, 20, 15])};
    layer.state.rasterSet = {requestRaster, isLoaded: true};
    layer.state.metadata = GEOGRAPHIC_METADATA;
    layer.updateState({
      props: layer.props,
      oldProps: layer.props,
      changeFlags: {dataChanged: false, viewportChanged: true}
    });
    expect(requestRaster).toHaveBeenCalledTimes(1);

    layer.getSubLayerProps = (props: any) => props;
    layer.state.renderResult = {
      image: {data: new Uint8ClampedArray(4), width: 1, height: 1},
      bounds: [-10, -5, 20, 15],
      coordinateSystem: COORDINATE_SYSTEM.LNGLAT
    };
    const bitmapLayer = layer.renderLayers();
    expect(bitmapLayer.props.bounds).toEqual([-10, -5, 20, 15]);
    expect(bitmapLayer.props.coordinateSystem).toBe(COORDINATE_SYSTEM.LNGLAT);
  });

  test('requests default and custom raster bands from viewport metadata', () => {
    const getRasterParameters = vi.fn(viewport => ({viewport, bands: [2], custom: true}));
    const layer = createRasterLayer({
      rasterParameters: {bands: [1]},
      getRasterParameters,
      debounceTime: 15
    });
    const requestRaster = vi.fn();
    layer.state = {
      resolvedSource: null,
      rasterSet: {requestRaster},
      unsubscribeRasterSetEvents: null,
      metadata: {...GEOGRAPHIC_METADATA, bandCount: 4},
      renderResult: null
    };
    layer.requestRaster(createViewport([-10, -5, 20, 15]));
    expect(getRasterParameters).toHaveBeenCalled();
    expect(requestRaster).toHaveBeenCalledWith(
      expect.objectContaining({bands: [2], custom: true}),
      15
    );

    layer.state.metadata = null;
    layer.requestRaster(createViewport([-10, -5, 20, 15]));
    expect(requestRaster).toHaveBeenCalledTimes(1);
  });

  test('handles metadata and raster events and releases request managers', () => {
    const onMetadataLoad = vi.fn();
    const onRasterLoad = vi.fn();
    const layer = createRasterLayer({onMetadataLoad, onRasterLoad});
    const requestRaster = vi.fn();
    const unsubscribe = vi.fn();
    const finalize = vi.fn();
    layer.context = {viewport: createViewport([-10, -5, 20, 15])};
    layer.setState = (update: any) => Object.assign(layer.state, update);
    layer.state = {
      resolvedSource: null,
      rasterSet: {requestRaster, finalize},
      unsubscribeRasterSetEvents: unsubscribe,
      metadata: null,
      renderResult: null
    };
    layer.handleRasterLoad({} as any);
    expect(onRasterLoad).not.toHaveBeenCalled();

    layer.handleMetadataLoad(GEOGRAPHIC_METADATA);
    expect(onMetadataLoad).toHaveBeenCalledWith(GEOGRAPHIC_METADATA);
    expect(requestRaster).toHaveBeenCalled();
    layer.handleRasterLoad({
      requestId: 1,
      raster: createRaster(new Float32Array([0, 1, 2, 3])),
      parameters: {
        viewport: createRasterViewport(createViewport([-10, -5, 20, 15]), GEOGRAPHIC_METADATA),
        bands: [0]
      }
    });
    expect(layer.state.renderResult).toBeTruthy();
    expect(onRasterLoad).toHaveBeenCalled();

    layer.releaseRasterSet();
    expect(unsubscribe).toHaveBeenCalled();
    expect(finalize).toHaveBeenCalled();
    expect(layer.state.rasterSet).toBeNull();
  });

  test('resolves direct raster sources with supplied metadata', async () => {
    const rasterSource = {
      async getMetadata() {
        return GEOGRAPHIC_METADATA;
      },
      async getRaster() {
        return createRaster(new Float32Array([0, 1, 2, 3]));
      }
    };
    const layer = createRasterLayer({data: rasterSource as any, metadata: GEOGRAPHIC_METADATA});
    layer.context = {viewport: createViewport([-10, -5, 20, 15])};
    layer.setState = (update: any) => Object.assign(layer.state, update);
    layer.raiseError = vi.fn();
    layer.initializeState();
    await layer.resolveSource(layer.props);
    expect(layer.state.resolvedSource?.source).toBe(rasterSource);
    expect(layer.state.metadata).toBe(GEOGRAPHIC_METADATA);
    expect(layer.state.rasterSet).toBeTruthy();
    layer.releaseRasterSet();
  });

  test('forwards every RasterSet event and finalizes an owned source', async () => {
    const callbacks = {
      onLoadingStateChange: vi.fn(),
      onMetadataLoad: vi.fn(),
      onMetadataLoadError: vi.fn(),
      onRasterLoadStart: vi.fn(),
      onRasterLoad: vi.fn(),
      onRasterLoadError: vi.fn()
    };
    const close = vi.fn(async () => {});
    const source = {
      async getMetadata() {
        return GEOGRAPHIC_METADATA;
      },
      async getRaster() {
        return createRaster(new Float32Array([0, 1, 2, 3]));
      },
      close
    };
    const sourceLoader = {
      id: 'raster-source',
      name: 'Raster source',
      module: 'test',
      version: '1',
      extensions: ['raster'],
      mimeTypes: [],
      type: 'raster',
      fromUrl: true,
      fromBlob: false,
      testURL: () => true,
      createDataSource: () => source
    };
    let subscriber: any;
    const rasterSet = {
      metadata: null,
      subscribe(value: any) {
        subscriber = value;
        return vi.fn();
      },
      loadMetadata: vi.fn(async () => {}),
      requestRaster: vi.fn(),
      finalize: vi.fn()
    };
    const fromRasterSource = vi
      .spyOn(RasterSet, 'fromRasterSource')
      .mockReturnValue(rasterSet as any);
    const layer = createRasterLayer({
      data: 'memory.raster',
      sources: [sourceLoader],
      ...callbacks
    });
    layer.context = {viewport: createViewport([-10, -5, 20, 15])};
    layer.setState = (update: any) => Object.assign(layer.state, update);
    layer.setNeedsUpdate = vi.fn();
    layer.raiseError = vi.fn();
    layer.initializeState();

    await layer.resolveSource(layer.props);
    subscriber.onLoadingStateChange(true);
    subscriber.onMetadataLoadError(new Error('metadata'));
    subscriber.onRasterLoadStart(7);
    subscriber.onRasterLoadError(7, new Error('raster'));
    subscriber.onUpdate();
    subscriber.onMetadataLoad(GEOGRAPHIC_METADATA);
    subscriber.onRasterLoad({
      requestId: 7,
      raster: createRaster(new Float32Array([0, 1, 2, 3])),
      parameters: {viewport: createRasterViewport(layer.context.viewport, GEOGRAPHIC_METADATA)}
    });

    expect(callbacks.onLoadingStateChange).toHaveBeenCalledWith(true);
    expect(callbacks.onMetadataLoadError).toHaveBeenCalledOnce();
    expect(callbacks.onRasterLoadStart).toHaveBeenCalledWith(7);
    expect(callbacks.onRasterLoadError).toHaveBeenCalledOnce();
    expect(callbacks.onMetadataLoad).toHaveBeenCalledWith(GEOGRAPHIC_METADATA);
    expect(callbacks.onRasterLoad).toHaveBeenCalledOnce();
    expect(layer.setNeedsUpdate).toHaveBeenCalledOnce();

    layer.context = null;
    layer.finalizeState({} as any);
    await Promise.resolve();
    expect(close).toHaveBeenCalledOnce();
    fromRasterSource.mockRestore();
  });

  test('reports incompatible sources and covers raster placement fallbacks', async () => {
    const onSourceError = vi.fn();
    const layer = createRasterLayer({
      data: {
        async getMetadata() {
          return {layers: []};
        },
        async getSchema() {
          return {fields: []};
        },
        async getFeatures() {
          return {shape: 'geojson-table', type: 'FeatureCollection', features: []};
        }
      },
      onSourceError
    });
    layer.initializeState();
    layer.raiseError = vi.fn();
    await layer.resolveSource(layer.props);
    expect(onSourceError).toHaveBeenCalledOnce();

    const metadata = {...GEOGRAPHIC_METADATA, boundingBox: undefined};
    const viewport = createRasterViewport(createViewport([-1, -1, 1, 1]), metadata);
    const result = createDefaultRasterRenderResult(
      createRaster(new Float32Array([Number.NaN, Number.POSITIVE_INFINITY, 1, 1]), {
        boundingBox: undefined
      }),
      {viewport: {...viewport, bounds: undefined}, bands: [0]},
      metadata
    );
    expect(result.bounds).toEqual([0, 2, 2, 0]);
    expect(Array.from((result.image as any).data)).toHaveLength(16);
  });
});

function createRasterLayer(overrides: Record<string, unknown> = {}) {
  return new RasterSourceLayer({
    id: 'raster-test',
    data: {
      async getMetadata() {
        return GEOGRAPHIC_METADATA;
      },
      async getRaster() {
        return createRaster(new Float32Array([0, 1, 2, 3]));
      }
    } as any,
    ...overrides
  } as any) as any;
}
