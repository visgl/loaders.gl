// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {BitmapLayer} from '@deck.gl/layers';
import type {
  RasterBandMetadata,
  RasterData,
  RasterSourceMetadata
} from '@loaders.gl/core/loader-utils';
import {RasterSet} from '@loaders.gl/tiles/raster-set';
import {RasterBitmapLayer} from '../src/raster-bitmap-layer';
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

/** Builds band metadata in the same order as the sample arrays. */
function createBandMetadata(
  dtype: RasterBandMetadata['dtype'],
  ...roles: RasterBandMetadata['colorInterpretation'][]
): RasterBandMetadata[] {
  return roles.map((colorInterpretation, index) => ({index, dtype, colorInterpretation}));
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

  test('uses tagged RGB order and alpha in its original scale even when it equals nodata', () => {
    const image = colorizeRasterData(
      createRaster(new Uint8Array([0, 20, 30, 40, 128, 0, 0, 0, 255, 40, 0, 20]), {
        width: 3,
        height: 1,
        bandCount: 4,
        dtype: 'uint8',
        interleaved: true,
        bands: createBandMetadata('uint8', 'alpha', 'blue', 'red', 'green'),
        noData: 0
      }),
      {stretch: 'range'}
    );

    expect(Array.from(image.data)).toEqual([0, 0, 0, 0, 0, 0, 0, 128, 0, 0, 255, 255]);
  });

  test('shows 8-bit RGB with alpha as stored and keeps transparent fill transparent', () => {
    const raster = createRaster(
      new Uint8Array([0, 0, 0, 0, 10, 20, 30, 255, 20, 40, 60, 255, 30, 60, 90, 255]),
      {
        bandCount: 4,
        dtype: 'uint8',
        interleaved: true,
        bands: createBandMetadata('uint8', 'red', 'green', 'blue', 'alpha')
      }
    );

    expect(Array.from(colorizeRasterData(raster).data)).toEqual([
      0, 0, 0, 0, 10, 20, 30, 255, 20, 40, 60, 255, 30, 60, 90, 255
    ]);
  });

  test('excludes transparent fill from an explicit percentile stretch of the color bands', () => {
    const image = colorizeRasterData(
      createRaster(
        new Uint8Array([0, 0, 0, 0, 10, 20, 30, 255, 20, 40, 60, 255, 30, 60, 90, 255]),
        {
          bandCount: 4,
          dtype: 'uint8',
          interleaved: true,
          bands: createBandMetadata('uint8', 'red', 'green', 'blue', 'alpha')
        }
      ),
      {stretch: 'percentile'}
    );

    expect(Array.from(image.data)).toEqual([
      0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255
    ]);
  });

  test.each([
    {
      dtype: 'uint16',
      alpha: new Uint16Array([65535, 32768, 0, 16384]),
      expected: [255, 128, 0, 64]
    },
    {dtype: 'int16', alpha: new Int16Array([-32, 128, 255, 256]), expected: [0, 128, 255, 255]},
    {dtype: 'float32', alpha: new Float32Array([-1, 0.5, 2, NaN]), expected: [0, 128, 255, 0]}
  ] as const)('renders gray with $dtype alpha', ({dtype, alpha, expected}) => {
    const bands = createBandMetadata(dtype, 'gray', 'alpha');
    bands[1].noData = alpha[1];
    const image = colorizeRasterData({
      data: [new Uint8Array([10, 10, 20, 20]), alpha],
      width: 2,
      height: 2,
      bandCount: 2,
      dtype: 'mixed',
      interleaved: false,
      bands: [{...bands[0], dtype: 'uint8'}, bands[1]]
    });

    expect(Array.from(image.data.filter((_value, index) => index % 4 === 3))).toEqual(expected);
    expect(Array.from(image.data.slice(4, 7))).toEqual([8, 29, 88]);
  });

  test('requires all tagged RGB channels to match nodata and still rejects masked and non-finite samples', () => {
    const raster = createRaster(
      new Float32Array([0, 10, 20, 0, 0, 0, 1, 10, 20, NaN, 10, 20, 1, 10, 20]),
      {
        width: 5,
        height: 1,
        bandCount: 3,
        interleaved: true,
        noData: 0,
        validityMasks: [{band: 1, width: 5, height: 1, data: new Uint8Array([1, 1, 0, 1, 1])}]
      }
    );
    const image = colorizeRasterData({
      ...raster,
      bands: createBandMetadata('float32', 'red', 'green', 'blue')
    });

    expect(Array.from(image.data)).toEqual([
      0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255
    ]);
    expect(Array.from(colorizeRasterData(raster).data)).toEqual([...new Array(19).fill(0), 255]);
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
    expect(renderResult.coordinateSystem).toBe('cartesian');
  });

  test('requires a custom request projection for unsupported CRS values', () => {
    const metadata = {...GEOGRAPHIC_METADATA, crs: 'EPSG:999999'};
    expect(() => createRasterViewport(createViewport([0, 0, 1, 1]), metadata)).toThrow(
      /EPSG:999999.*Provide getRasterParameters/
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
    expect(result.coordinateSystem).toBe('lnglat');
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
    expect(result.coordinateSystem).toBe('lnglat');
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
  test('stretches each single-band response and applies explicit styling without reloading', async () => {
    const firstRaster = createRaster([new Float32Array([2, -9999, NaN, 10])]);
    const secondRaster = createRaster(new Float32Array([100, 150, 200, 300]));
    const getRaster = vi
      .fn()
      .mockResolvedValueOnce(firstRaster)
      .mockResolvedValueOnce(secondRaster);
    const source = {getMetadata: async () => GEOGRAPHIC_METADATA, getRaster};
    const metadata = {...GEOGRAPHIC_METADATA, noData: -9999};
    const colorizeRaster = vi.fn();
    const onRasterLoad = vi.fn();
    const renderSubLayer = vi.fn(props => new RasterBitmapLayer(props));
    const layer = createRasterLayer({
      data: source,
      metadata,
      rendering: 'gpu',
      pickable: true,
      colorizeRaster,
      onRasterLoad,
      renderSubLayer
    });
    layer.context = {viewport: createViewport([-10, -5, 20, 15])};
    layer.initializeState();
    let matchedLayer = layer;
    layer.getCurrentLayer = () => matchedLayer;

    await layer.resolveSource(layer.props);
    await vi.waitFor(() => expect(onRasterLoad).toHaveBeenCalledTimes(1));
    expect(getRaster).toHaveBeenCalledWith(expect.objectContaining({bands: [0]}));
    const firstBitmap = layer.renderLayers();
    expect(renderSubLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        valueRange: [2, 3],
        valueScale: 'sqrt',
        colormap: 'default',
        pickable: true,
        noData: -9999
      })
    );
    expect(firstBitmap.props.raster.data).toBe(firstRaster.data[0]);
    // The 2 x 2 raster packs the texel index as column + row * 2 in the red channel.
    const pick = (column: number, row: number) => {
      const parameters = {info: {color: new Uint8Array([column + row * 2, 0, 0])}, mode: 'hover'};
      const info = firstBitmap.getPickingInfo(parameters);
      return layer.getPickingInfo({...parameters, info, sourceLayer: firstBitmap}).value;
    };
    expect(pick(0, 0)).toBe(2);
    expect(pick(1, 0)).toBeNull();
    expect(pick(0, 1)).toBeNull();

    const nextViewport = createViewport([30, 35, 60, 55]);
    layer.requestRaster(nextViewport, 0);
    await vi.waitFor(() => expect(onRasterLoad).toHaveBeenCalledTimes(2));
    const secondBitmap = layer.renderLayers();
    expect(secondBitmap.props.valueRange).toEqual([100, 200]);
    expect(secondBitmap.props.raster.data).toBe(secondRaster.data);

    const styledLayer = createRasterLayer({
      ...layer.props,
      valueRange: [100, 300],
      colormap: 'gray',
      valueScale: 'log'
    });
    styledLayer.state = layer.state;
    styledLayer.context = {viewport: nextViewport};
    matchedLayer = styledLayer;
    styledLayer.updateState({
      props: styledLayer.props,
      oldProps: layer.props,
      changeFlags: {propsChanged: 'valueRange, colormap, valueScale'}
    });
    const styledBitmap = styledLayer.renderLayers();
    expect(styledBitmap.props).toMatchObject({
      valueRange: [100, 300],
      colormap: 'gray',
      valueScale: 'log'
    });
    expect(styledBitmap.props.raster).toBe(secondBitmap.props.raster);
    expect(getRaster).toHaveBeenCalledTimes(2);
    expect(colorizeRaster).not.toHaveBeenCalled();

    const replacementLayer = createRasterLayer({
      ...layer.props,
      data: {...source, getRaster: async () => secondRaster}
    });
    replacementLayer.state = layer.state;
    replacementLayer.context = styledLayer.context;
    matchedLayer = replacementLayer;
    await replacementLayer.resolveSource(replacementLayer.props);
    await vi.waitFor(() => expect(onRasterLoad).toHaveBeenCalledTimes(3));
    expect(replacementLayer.renderLayers().props.valueRange).toEqual([100, 200]);
    replacementLayer.releaseRasterSet();
  });

  test('keeps CPU colorization as the default and for multiband requests', () => {
    const metadata = {...GEOGRAPHIC_METADATA, bandCount: 3};
    const parameters = {viewport: createRasterViewport(createViewport([-1, -1, 1, 1]), metadata)};
    const rasters = [
      {layer: createRasterLayer(), raster: createRaster(new Float32Array([1, 2, 3, 4]))},
      {
        layer: createRasterLayer({rendering: 'gpu'}),
        raster: createRaster(new Uint8Array(12), {bandCount: 3, dtype: 'uint8', interleaved: true})
      }
    ];
    expect(rasters[0].layer.props.rendering).toBe('cpu');
    for (const {layer, raster} of rasters) {
      layer.initializeState();
      layer.state.metadata = metadata;
      layer.handleRasterLoad({requestId: 0, raster, parameters});
      const bitmap = layer.renderLayers();
      expect(bitmap.constructor).toBe(BitmapLayer);
      expect(bitmap.props.image).toEqual(colorizeRasterData(raster));
    }
  });

  test('stretches the current raster when an explicit range is cleared', () => {
    const layer = createRasterLayer({rendering: 'gpu', valueRange: [0, 1]});
    const parameters = {
      viewport: createRasterViewport(createViewport([-1, -1, 1, 1]), GEOGRAPHIC_METADATA)
    };
    layer.initializeState();
    layer.state.metadata = GEOGRAPHIC_METADATA;
    layer.handleRasterLoad({
      requestId: 0,
      raster: createRaster(new Float32Array([2, 4, 6, 8])),
      parameters
    });
    layer.handleRasterLoad({
      requestId: 1,
      raster: createRaster(new Float32Array([20, 30, 40, 50])),
      parameters
    });
    const explicitBitmap = layer.renderLayers();
    expect(explicitBitmap.props.valueRange).toEqual([0, 1]);

    const automatic = createRasterLayer({
      ...layer.props,
      valueRange: undefined,
      valueScale: undefined,
      colormap: undefined
    });
    automatic.state = layer.state;
    automatic.updateState({
      props: automatic.props,
      oldProps: layer.props,
      changeFlags: {propsChanged: 'valueRange'}
    });
    const automaticBitmap = automatic.renderLayers();
    expect(automaticBitmap.props).toMatchObject({
      valueRange: [20, 40],
      valueScale: 'sqrt',
      colormap: 'default'
    });
    expect(automaticBitmap.props.raster).toBe(explicitBitmap.props.raster);
  });

  test('renders transparently when the CPU sampling pattern finds no valid samples', () => {
    const layer = createRasterLayer({rendering: 'gpu'});
    const samples = new Float32Array(4097).fill(NaN);
    samples[samples.length - 1] = 17;
    const raster = createRaster(samples, {width: samples.length, height: 1});
    const parameters = {
      viewport: createRasterViewport(createViewport([-1, -1, 1, 1]), GEOGRAPHIC_METADATA)
    };
    layer.initializeState();
    layer.state.metadata = GEOGRAPHIC_METADATA;
    layer.handleRasterLoad({requestId: 0, raster, parameters});

    expect(layer.renderLayers().props.raster).toBeNull();
    expect(colorizeRasterData(raster).data.every(byte => byte === 0)).toBe(true);
  });

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
      coordinateSystem: 'lnglat'
    };
    const bitmapLayer = layer.renderLayers();
    expect(bitmapLayer.props.bounds).toEqual([-10, -5, 20, 15]);
    expect(bitmapLayer.props.coordinateSystem).toBe('lnglat');
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
      projectedCRS: null,
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

  test.each([
    'cpu',
    'gpu'
  ])('uses CPU colorization for tagged gray and alpha with %s rendering', rendering => {
    const layer = createRasterLayer({rendering});
    const requestRaster = vi.fn();
    const metadata = {
      ...GEOGRAPHIC_METADATA,
      bandCount: 3,
      bands: createBandMetadata('uint8', 'alpha', 'gray', 'undefined')
    };
    layer.state = {rasterSet: {requestRaster}, metadata, projectedCRS: null};
    layer.requestRaster(createViewport([-10, -5, 20, 15]));

    expect(requestRaster).toHaveBeenCalledWith(
      expect.objectContaining({bands: [1, 0]}),
      expect.any(Number)
    );
    const parameters = requestRaster.mock.calls[0][0];
    const raster = createRaster(
      [new Uint8Array([10, 20, 30, 40]), new Uint8Array([64, 128, 192, 255])],
      {
        bandCount: 2,
        dtype: 'uint8'
      }
    );
    layer.handleRasterLoad({requestId: 0, raster, parameters});
    const bitmap = layer.renderLayers();
    expect(bitmap).toBeInstanceOf(BitmapLayer);
    expect(bitmap.props.image.data[3]).toBe(64);
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
      createDataSourceSync: () => source
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
      loaders: [sourceLoader],
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

test('raster placement retains affine shear and reports unsupported CRS values', () => {
  const raster = createRaster(new Float32Array([0, 1, 2, 3]), {
    transform: [1, 0.5, 10, 0.25, -1, 20],
    pixelRegistration: 'area'
  });
  const parameters = {
    viewport: createRasterViewport(createViewport([-10, -5, 20, 15]), GEOGRAPHIC_METADATA)
  };
  expect(createDefaultRasterRenderResult(raster, parameters, GEOGRAPHIC_METADATA).bounds).toEqual([
    [11, 18],
    [10, 20],
    [12, 20.5],
    [13, 18.5]
  ]);
  const projected = {...raster, crs: 'EPSG:999999'};
  expect(() =>
    createDefaultRasterRenderResult(projected, parameters, {
      ...GEOGRAPHIC_METADATA,
      crs: 'EPSG:999999'
    })
  ).toThrow('unsupported source CRS (EPSG:999999)');
  const custom = createRasterRenderResult(
    {requestId: 0, raster: projected, parameters},
    {...GEOGRAPHIC_METADATA, crs: 'EPSG:999999'},
    () => ({
      image: colorizeRasterData(projected),
      bounds: [0, 0, 1, 1],
      coordinateSystem: 'cartesian'
    })
  );
  expect(custom.coordinateSystem).toBe('cartesian');
});

test('raster placement uses an affine when neither source nor payload supplies a bbox', () => {
  const raster = createRaster(new Float32Array([0, 1, 2, 3]), {
    transform: [1, 0, 10, 0, -1, 20],
    pixelRegistration: 'area'
  });
  const metadata = {width: 2, height: 2, bandCount: 1, dtype: 'float32'} as RasterSourceMetadata;
  const parameters = {viewport: createRasterViewport(createViewport([0, 0, 1, 1]), metadata)};
  const result = createDefaultRasterRenderResult(raster, parameters, metadata);
  expect(result.bounds).toEqual([10, 18, 12, 20]);
  expect(result.coordinateSystem).toBe('cartesian');
});
