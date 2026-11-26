// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {BitmapLayer} from '@deck.gl/layers';
import {LayerManager, OrthographicViewport} from '@deck.gl/core';
import type {RasterData} from '@loaders.gl/core/loader-utils';
import {resolveShaderPlugins, WGSLShaderAssembler} from '@luma.gl/shaders';
import {expect, test, vi} from 'vitest';
import {colorizeRasterData, RasterBitmapLayer, RasterSourceLayer} from '../src';
import {getRasterUploadData} from '../src/raster-bitmap-layer';
import {createRasterViewport} from '../src/raster-source-layer';

test('inherits BitmapLayer and defaults to a linear scale with the default colormap', () => {
  const layer = new RasterBitmapLayer({raster: null, bounds: [0, 0, 1, 1]});
  expect(layer).toBeInstanceOf(BitmapLayer);
  expect(layer.props).toMatchObject({
    raster: null,
    noData: null,
    colormap: 'default',
    valueRange: [0, 1],
    valueScale: 'linear',
    interpolation: 'linear'
  });
});

test('matches CPU RGBA within one byte using the GPU percentile stretch and default colormap', () => {
  const width = 4097;
  const values = Float32Array.from({length: width}, (_, index) => index / 8 - 256);
  values[0] = -10000;
  values[1] = NaN;
  values[2] = -9999;
  values[width - 1] = 10000;
  const mask = new Uint8Array(width).fill(1);
  mask[Math.floor(width / 2)] = 0;
  const metadata = {width, height: 1, bandCount: 1, dtype: 'float32', noData: -9999} as const;
  const raster: RasterData = {
    ...metadata,
    data: values,
    validityMasks: [{width, height: 1, data: mask}]
  };
  const source = new RasterSourceLayer({
    id: 'raster-bitmap-cpu-parity',
    rendering: 'gpu',
    data: {getMetadata: async () => metadata, getRaster: async () => raster}
  });
  source.initializeState();
  source.state.metadata = metadata;
  const viewport = createRasterViewport(new OrthographicViewport({width, height: 1}), metadata);
  source['handleRasterLoad']({requestId: 0, raster, parameters: {viewport}});
  const bitmap = source.renderLayers() as RasterBitmapLayer;
  const createTexture = vi.fn((_options: {data: Float32Array | Uint8Array}) => ({}));
  bitmap.context = {device: {createTexture}} as any;
  bitmap.state = {subdivisionStep: 0, bounds: [0, 0, 0, 0], coordinateConversion: 0};
  bitmap.updateState({
    props: bitmap.props,
    oldProps: bitmap.clone({raster: null}).props,
    changeFlags: {propsChanged: 'test props'},
    context: bitmap.context
  } as Parameters<RasterBitmapLayer['updateState']>[0]);
  const setProps = vi.fn();
  bitmap.state.model = {shaderInputs: {setProps}, draw: vi.fn()} as any;
  bitmap.draw({shaderModuleProps: {picking: {isActive: false}}} as Parameters<
    RasterBitmapLayer['draw']
  >[0]);

  const [[{data: samples}], [{data: table}]] = createTexture.mock.calls;
  const {valueRange, noData, valueScale, interpolateColormap} =
    setProps.mock.calls[0][0].rasterBitmap;
  expect(table).toHaveLength(256 * 4);
  expect(valueScale).toBe(1);
  expect(interpolateColormap).toBe(1);

  const expected = colorizeRasterData(raster).data;
  const [lowerBound, upperBound] = valueRange;
  let maxDifference = 0;
  for (const [index, sample] of samples.entries()) {
    const valid = Number.isFinite(sample) && sample !== noData;
    const normalized = Math.max(0, Math.min(1, (sample - lowerBound) / (upperBound - lowerBound)));
    const colorIndex = Math.sqrt(normalized) * 255;
    const lowerIndex = Math.floor(colorIndex);
    const upperIndex = Math.min(lowerIndex + 1, 255);
    for (let channel = 0; channel < 4; channel++) {
      const lowerColor = table[lowerIndex * 4 + channel];
      const upperColor = table[upperIndex * 4 + channel];
      const actual = valid
        ? Math.round(lowerColor + (upperColor - lowerColor) * (colorIndex - lowerIndex))
        : 0;
      maxDifference = Math.max(maxDifference, Math.abs(actual - expected[index * 4 + channel]));
    }
  }
  expect(maxDifference).toBeLessThanOrEqual(1);
});

test('assembles WebGPU BitmapLayer shaders with an unfilterable float texture binding', () => {
  const layer = new RasterBitmapLayer({raster: null});
  const viewport = new OrthographicViewport({width: 1, height: 1});
  const layerManager = new LayerManager({type: 'webgpu', info: {shadingLanguage: 'wgsl'}} as any, {
    viewport
  });
  layer.context = {...layerManager.context, viewport};
  const shaders = layer.getShaders();
  const plugins = resolveShaderPlugins(shaders.plugins, 'wgsl');
  const assembler = layer.context.shaderAssembler as WGSLShaderAssembler;
  const result = assembler.assembleWGSLShader({
    ...shaders,
    platformInfo: {
      type: 'webgpu',
      shaderLanguage: 'wgsl',
      shaderLanguageVersion: 300,
      gpu: 'test',
      features: new Set()
    },
    defines: {...plugins.defines, ...shaders.defines},
    pluginInjectionTargets: plugins.injectionTargets,
    pluginInjections: plugins.injections,
    pluginInterStageVariables: plugins.interStageVariables,
    pluginVertexInputs: plugins.vertexInputs
  });
  const [rasterBinding] = shaders.shaderLayout.bindings;
  expect(rasterBinding.sampleType).toBe('unfilterable-float');
  expect(result.shaderLayout?.bindings).toContainEqual(
    expect.objectContaining({name: rasterBinding.name, location: rasterBinding.location})
  );
  expect(result.source).toContain('let bitmapColor = raster_sample(uv);');
  expect(result.source.match(/raster_pickingColor\(uv\)/g)).toHaveLength(2);
  expect(result.source).not.toContain('bitmapTextureSampler');
});

test.each([
  {data: new Uint32Array([16777216, 16777217]), noData: 16777217, expected: [16777216, NaN]},
  {data: new Int16Array([-20, 15]), noData: -20, expected: [NaN, 15]},
  {data: new Uint8Array([0, 255]), noData: 255, expected: [0, NaN]},
  {data: new Uint8Array([0, 255]), noData: null, expected: [0, 255]}
])('masks converted upload samples before rounding ($data, noData=$noData)', ({
  data,
  noData,
  expected
}) => {
  const upload = getRasterUploadData({width: 2, height: 1, data}, noData);
  expect(upload.data).toEqual(new Float32Array(expected));
  expect(upload.useNoData).toBe(false);
});

test('uploads Float32Array samples without copying and compares a finite sentinel in the shader', () => {
  const data = new Float32Array([0.1, 1]);
  const raster = {width: 2, height: 1, data};
  const upload = getRasterUploadData(raster, 0.1);
  expect(upload.data).toBe(data);
  expect(upload.useNoData).toBe(true);
  expect(getRasterUploadData(raster, null).useNoData).toBe(false);
});

test('converts raster uploads and replaces only the changed textures', () => {
  const makeTexture = () => ({destroy: vi.fn()});
  const initialRasterTexture = makeTexture();
  const initialColormapTexture = makeTexture();
  const updatedColormapTexture = makeTexture();
  const updatedRasterTexture = makeTexture();
  const createTexture = vi
    .fn()
    .mockReturnValueOnce(initialRasterTexture)
    .mockReturnValueOnce(initialColormapTexture)
    .mockReturnValueOnce(updatedColormapTexture)
    .mockReturnValueOnce(updatedRasterTexture);
  const raster = {width: 2, height: 1, data: new Int16Array([-20, 15])};
  const layer = new RasterBitmapLayer({raster, colormap: 'gray', valueRange: [-20, 15]});
  layer.context = {device: {createTexture}} as any;
  layer.state = {subdivisionStep: 0, bounds: [0, 0, 0, 0], coordinateConversion: 0};

  const updateLayer = (props: Partial<typeof layer.props>, oldProps = layer.props) => {
    layer.updateState({
      props: new RasterBitmapLayer({raster, colormap: 'gray', valueRange: [-20, 15], ...props})
        .props,
      oldProps,
      changeFlags: {
        dataChanged: false,
        propsChanged: 'test props',
        updateTriggersChanged: false,
        extensionsChanged: false,
        viewportChanged: false,
        projectionChanged: false,
        stateChanged: false,
        propsOrDataChanged: true,
        somethingChanged: true
      },
      context: layer.context
    });
  };
  updateLayer({}, new RasterBitmapLayer({raster: null, colormap: 'gray'}).props);
  expect(createTexture).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      format: 'r32float',
      width: 2,
      height: 1,
      data: new Float32Array([-20, 15])
    })
  );
  const gray = createTexture.mock.calls[1][0];
  expect(gray).toMatchObject({format: 'rgba8unorm', width: 256, height: 1});
  expect(gray.data.slice(-8)).toEqual(new Uint8Array([254, 254, 254, 255, 255, 255, 255, 255]));

  updateLayer({valueRange: [-10, 10], valueScale: 'log', interpolation: 'nearest'});
  expect(createTexture).toHaveBeenCalledTimes(2);
  const customColormap = new Uint8Array(1024).fill(123);
  updateLayer({colormap: customColormap});
  expect(createTexture.mock.calls[2][0].data).toBe(customColormap);
  expect(initialColormapTexture.destroy).toHaveBeenCalledOnce();
  expect(initialRasterTexture.destroy).not.toHaveBeenCalled();

  const floatData = new Float32Array([0.5, 1.5]);
  updateLayer({raster: {...raster, data: floatData}});
  expect(createTexture.mock.calls[3][0].data).toBe(floatData);
  expect(initialRasterTexture.destroy).toHaveBeenCalledOnce();
  expect(() => updateLayer({colormap: new Uint8Array(4)})).toThrow('1024 bytes');

  updateLayer({raster: null});
  expect(updatedRasterTexture.destroy).toHaveBeenCalledOnce();
  layer.context = null as any;
  layer.finalizeState({} as any);
  expect(updatedRasterTexture.destroy).toHaveBeenCalledOnce();
  expect(updatedColormapTexture.destroy).toHaveBeenCalledOnce();
});

test.each([
  {
    name: 'converted',
    data: new Uint32Array([16777216, 16777217]),
    noData: 16777217,
    textureCount: 3,
    uniform: {noData: 0, useNoData: 0}
  },
  {
    name: 'Float32Array',
    data: new Float32Array([0.1, 1]),
    noData: 0.1,
    textureCount: 2,
    uniform: {noData: Math.fround(0.1), useNoData: 1}
  }
])('applies a noData change to $name rasters', ({data, noData, textureCount, uniform}) => {
  const initialLayer = new RasterBitmapLayer({raster: {width: 2, height: 1, data}});
  const createTexture = vi.fn((_options: {data: Float32Array | Uint8Array}) => ({
    destroy: vi.fn()
  }));
  const setProps = vi.fn();
  initialLayer.context = {device: {createTexture}} as any;
  initialLayer.state = {
    subdivisionStep: 0,
    bounds: [0, 0, 0, 0],
    coordinateConversion: 0,
    model: {shaderInputs: {setProps}, draw: vi.fn()} as any
  };
  initialLayer.updateState({
    props: initialLayer.props,
    oldProps: initialLayer.clone({raster: null}).props,
    changeFlags: {propsChanged: 'test raster'},
    context: initialLayer.context
  } as Parameters<RasterBitmapLayer['updateState']>[0]);
  const initialRasterTexture = initialLayer.state.rasterTexture;
  const initialColormapTexture = initialLayer.state.colormapTexture;

  const layer = initialLayer.clone({noData});
  layer.context = initialLayer.context;
  layer.state = initialLayer.state;
  layer.updateState({
    props: layer.props,
    oldProps: initialLayer.props,
    changeFlags: {propsChanged: 'test noData'},
    context: layer.context
  } as Parameters<RasterBitmapLayer['updateState']>[0]);
  layer.draw({shaderModuleProps: {picking: {isActive: false}}} as Parameters<
    RasterBitmapLayer['draw']
  >[0]);

  expect(createTexture).toHaveBeenCalledTimes(textureCount);
  expect(layer.state.colormapTexture).toBe(initialColormapTexture);
  expect(setProps.mock.calls[0][0].rasterBitmap).toMatchObject(uniform);
  if (data instanceof Float32Array) {
    expect(layer.state.rasterTexture).toBe(initialRasterTexture);
    expect(initialRasterTexture?.destroy).not.toHaveBeenCalled();
  } else {
    expect(layer.state.rasterTexture).not.toBe(initialRasterTexture);
    expect(initialRasterTexture?.destroy).toHaveBeenCalledOnce();
    expect(createTexture.mock.calls[2][0].data).toEqual(new Float32Array([16777216, NaN]));
  }
});

test('picks a valid Uint32 texel that would round to the same float32 as noData', () => {
  const layer = new RasterBitmapLayer({
    raster: {width: 2, height: 1, data: new Uint32Array([16777216, 16777217])},
    noData: 16777217
  });
  const pick = (red: number) =>
    layer.getPickingInfo({
      info: {color: new Uint8Array([red, 0, 0, 1])},
      mode: 'hover',
      sourceLayer: null
    } as any);
  expect(pick(0).value).toBe(16777216);
  expect(pick(1).value).toBeNull();
});

test('returns original picked texels and null for no-data, NaN, or a miss', () => {
  const layer = new RasterBitmapLayer({
    raster: {width: 2, height: 2, data: new Float64Array([1.00000001, -999, NaN, 4])},
    valueRange: [0, 4],
    noData: -999
  });
  const pick = (color: Uint8Array | null) =>
    layer.getPickingInfo({info: {color}, mode: 'hover', sourceLayer: null} as any);

  expect(pick(new Uint8Array([0, 0, 0, 1]))).toMatchObject({
    bitmap: {pixel: [0, 0], uv: [0.25, 0.25], size: {width: 2, height: 2}},
    index: 0,
    value: 1.00000001
  });
  expect(pick(new Uint8Array([1, 0, 0, 1])).value).toBeNull();
  expect(pick(new Uint8Array([2, 0, 0, 1])).value).toBeNull();
  expect(pick(new Uint8Array([3, 0, 0, 1])).value).toBe(4);
  expect(pick(null)).toMatchObject({bitmap: null, value: null});

  const float32Layer = new RasterBitmapLayer({
    raster: {width: 1, height: 1, data: new Float32Array([-0.1])},
    valueRange: [0, 1],
    noData: -0.1
  });
  expect(
    float32Layer.getPickingInfo({
      info: {color: new Uint8Array([0, 0, 0, 1])},
      mode: 'hover',
      sourceLayer: null
    } as any).value
  ).toBeNull();
});

test.each([
  {width: 1, height: 1, pixels: [[0, 0]]},
  {
    width: 4096,
    height: 4096,
    pixels: [
      [4095, 0],
      [0, 1],
      [4095, 4095]
    ]
  },
  {
    width: 8192,
    height: 1,
    pixels: [
      [0, 0],
      [1, 0],
      [2, 0],
      [8191, 0]
    ]
  },
  {
    width: 1,
    height: 8192,
    pixels: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 8191]
    ]
  },
  {
    width: 16384,
    height: 1024,
    pixels: [
      [16383, 0],
      [0, 1],
      [16383, 1023]
    ]
  },
  {
    width: 3,
    height: 5,
    pixels: [
      [2, 0],
      [0, 1],
      [2, 4]
    ]
  }
])('round-trips picking colors for a $width x $height raster', ({width, height, pixels}) => {
  const data = new Uint8Array(width * height);
  const layer = new RasterBitmapLayer({raster: {width, height, data}});
  const rowStride = 2 ** Math.ceil(Math.log2(width));
  for (const [index, [column, row]] of pixels.entries()) {
    const value = index + 10;
    data[row * width + column] = value;
    const packedIndex = column + row * rowStride;
    const color = new Uint8Array([packedIndex, packedIndex >>> 8, packedIndex >>> 16, 1]);
    expect(
      layer.getPickingInfo({info: {color}, mode: 'hover', sourceLayer: null} as any)
    ).toMatchObject({
      bitmap: {
        pixel: [column, row],
        uv: [(column + 0.5) / width, (row + 0.5) / height],
        size: {width, height}
      },
      index: 0,
      value
    });
  }
});

test('returns no texel when the raster needs more than 24 picking bits', () => {
  const width = 8192;
  const height = 4096;
  const data = new Uint8Array(width * height);
  data[0] = 42;
  const layer = new RasterBitmapLayer({raster: {width, height, data}});
  const color = new Uint8Array([0, 0, 0, 1]);
  expect(
    layer.getPickingInfo({info: {color}, mode: 'hover', sourceLayer: null} as any)
  ).toMatchObject({bitmap: null, index: 0, value: null});
});
