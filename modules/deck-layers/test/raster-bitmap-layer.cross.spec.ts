// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {BitmapLayer} from '@deck.gl/layers';
import {LayerManager, OrthographicViewport} from '@deck.gl/core';
import type {RasterData} from '@loaders.gl/core/loader-utils';
import {resolveShaderPlugins, WGSLShaderAssembler} from '@luma.gl/shaders';
import {expect, test, vi} from 'vitest';
import {colorizeRasterData, RasterBitmapLayer, RasterSourceLayer} from '../src';
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
  expect(result.source).not.toContain('bitmapTextureSampler');
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

  updateLayer({valueRange: [-10, 10], noData: -20, valueScale: 'log', interpolation: 'nearest'});
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

test('returns original picked texels and null for no-data, NaN, or a miss', () => {
  const layer = new RasterBitmapLayer({
    raster: {width: 2, height: 2, data: new Float64Array([1.00000001, -999, NaN, 4])},
    valueRange: [0, 4],
    noData: -999
  });
  const pick = (color: Uint8Array | null) =>
    layer.getPickingInfo({info: {color}, mode: 'hover', sourceLayer: null} as any);

  expect(pick(new Uint8Array([64, 64, 0]))).toMatchObject({
    bitmap: {pixel: [0, 0], uv: [0.25, 0.25], size: {width: 2, height: 2}},
    index: 0,
    value: 1.00000001
  });
  expect(pick(new Uint8Array([192, 64, 0])).value).toBeNull();
  expect(pick(new Uint8Array([64, 192, 0])).value).toBeNull();
  expect(pick(new Uint8Array([192, 192, 0])).value).toBe(4);
  expect(pick(null)).toMatchObject({bitmap: null, value: null});
  const info = pick(new Uint8Array([64, 64, 0]));
  info.bitmap!.pixel = [1, 1];
  expect(layer.getPickingInfo({info, mode: 'hover', sourceLayer: null}).value).toBe(4);

  const float32Layer = new RasterBitmapLayer({
    raster: {width: 1, height: 1, data: new Float32Array([-0.1])},
    valueRange: [0, 1],
    noData: -0.1
  });
  expect(
    float32Layer.getPickingInfo({
      info: {color: new Uint8Array([0, 0, 0])},
      mode: 'hover',
      sourceLayer: null
    } as any).value
  ).toBeNull();
});
