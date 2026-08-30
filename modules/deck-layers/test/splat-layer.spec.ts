// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {SplatLayer, type SplatLayerProps} from '../src/splat-layer';
import type {ArrowTableBatch} from '@loaders.gl/schema';
type ControlledAsyncIterable<T> = AsyncIterable<T> & {
  push: (value: T) => void;
  close: () => void;
};
/** Creates a SplatLayer instance for testing. */
function createLayer(props: SplatLayerProps): SplatLayer {
  const layer = new SplatLayer({
    id: 'test-splat-layer',
    ...props
  });
  layer.context = {device: {type: 'webgl'}} as any;
  return layer;
}
/** Creates a minimal Gaussian splat Arrow table. */
function createGaussianSplatTable(): arrow.Table {
  return arrow.tableFromArrays({
    POSITION: [
      [0, 0, 0],
      [1, 2, 3]
    ],
    f_dc_0: [0, 1],
    f_dc_1: [0, 0],
    f_dc_2: [0, -1],
    opacity: [0, 2],
    scale_0: [0, 1],
    scale_1: [0, 0],
    scale_2: [0, -1],
    rot_0: [1, 1],
    rot_1: [0, 0],
    rot_2: [0, 0],
    rot_3: [0, 0]
  });
}
/** Creates a loaders.gl Arrow table batch from a Gaussian splat table. */
function createGaussianSplatBatch(table: arrow.Table): ArrowTableBatch {
  return {
    shape: 'arrow-table',
    batchType: 'data',
    data: table,
    length: table.numRows
  };
}
/** Normalizes a layer render result to an array. */
function asLayerArray(layerResult: ReturnType<SplatLayer['renderLayers']>) {
  if (!layerResult) {
    return [];
  }
  return Array.isArray(layerResult) ? layerResult : [layerResult];
}
/** Creates a manually advanced async iterable. */
function createControlledAsyncIterable<T>(): ControlledAsyncIterable<T> {
  const queuedValues: T[] = [];
  const queuedResolves: ((result: IteratorResult<T>) => void)[] = [];
  let closed = false;
  return {
    push(value: T): void {
      const resolve = queuedResolves.shift();
      if (resolve) {
        resolve({value, done: false});
      } else {
        queuedValues.push(value);
      }
    },
    close(): void {
      closed = true;
      while (queuedResolves.length > 0) {
        queuedResolves.shift()?.({value: undefined as T, done: true});
      }
    },
    [Symbol.asyncIterator](): AsyncIterator<T> {
      return {
        next(): Promise<IteratorResult<T>> {
          const value = queuedValues.shift();
          if (value) {
            return Promise.resolve({value, done: false});
          }
          if (closed) {
            return Promise.resolve({value: undefined as T, done: true});
          }
          return new Promise(resolve => queuedResolves.push(resolve));
        }
      };
    }
  };
}
/** Lets pending async iterator work settle. */
async function waitForAsyncIterator(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
test('SplatLayer renders Gaussian splat Arrow table through binary attributes', () => {
  const layer = createLayer({data: createGaussianSplatTable()});
  const sublayer = layer.renderLayers() as any;
  const data = sublayer.props.data;
  expect(sublayer.constructor.layerName, 'creates primitive splat layer').toBe(
    'SplatPrimitiveLayer'
  );
  expect(data.length, 'passes one rendered object per splat').toBe(2);
  expect(Array.from(data.attributes.getPosition.value), 'passes interleaved positions').toEqual([
    0, 0, 0, 1, 2, 3
  ]);
  expect(data.attributes.getRadius.value[0], 'decodes first log scale support radius').toBe(3);
  expect(
    Math.abs(data.attributes.getRadius.value[1] - Math.exp(0) * 3) < 1e-6,
    'decodes second log scale support radius from geometric mean'
  ).toBeTruthy();
  expect(
    Array.from(data.attributes.getColor.value.slice(0, 4)),
    'derives first color from SH DC and logit opacity'
  ).toEqual([128, 128, 128, 128]);
});
test('SplatLayer incrementally renders Arrow table batches', async () => {
  const splatBatches = createControlledAsyncIterable<ArrowTableBatch>();
  const layer = createLayer({data: splatBatches});
  layer.state = {} as any;
  layer.initializeState();
  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true}
  } as any);
  expect(
    asLayerArray(layer.renderLayers()).length,
    'renders no sublayers before batches load'
  ).toBe(0);
  splatBatches.push(createGaussianSplatBatch(createGaussianSplatTable()));
  await waitForAsyncIterator();
  let sublayers = asLayerArray(layer.renderLayers());
  expect(sublayers.length, 'renders one sublayer after the first batch').toBe(1);
  expect((sublayers[0].props.data as any).length, 'uses the first batch row count').toBe(2);
  splatBatches.push(createGaussianSplatBatch(createGaussianSplatTable()));
  await waitForAsyncIterator();
  sublayers = asLayerArray(layer.renderLayers());
  expect(sublayers.length, 'keeps streaming batches in one engine-backed sublayer').toBe(1);
  expect((sublayers[0].props.data as any).length, 'uses the accumulated batch row count').toBe(4);
  splatBatches.close();
});
test('SplatLayer reports invalid async batch shapes', async () => {
  const splatBatches = createControlledAsyncIterable<ArrowTableBatch>();
  const layer = createLayer({data: splatBatches});
  layer.state = {} as any;
  layer.initializeState();
  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true}
  } as any);
  splatBatches.push({shape: 'object-row-table', batchType: 'data', length: 1} as any);
  await waitForAsyncIterator();
  expect(
    () => layer.renderLayers(),
    'throws a stable error for invalid async batch values'
  ).toThrow(/requires ArrowTableBatch values/);
  splatBatches.close();
});

test('SplatLayer covers static engine lifecycle, prop refreshes, and CPU policy', () => {
  const table = createGaussianSplatTable();
  const layer = createLayer({
    data: table,
    renderMode: 'cpu',
    sortMode: 'tile',
    alphaCutoff: 0,
    screenSizeCutoffPixels: 0,
    gaussianSupportRadius: 0,
    kernel2DSize: 0,
    maxScreenSpaceSplatSize: 1
  });
  layer.state = {} as any;
  layer.initializeState();

  const calls: string[] = [];
  let engineProps: any;
  const engine = {
    setProps(props: any) {
      calls.push('setProps');
      engineProps = props;
    },
    setData(data: unknown, color: unknown) {
      expect(data).toBe(table);
      expect(color).toEqual([255, 255, 255, 255]);
      calls.push('setData');
    },
    getSplatCount: () => 2,
    getWebGLAttributes: () => ({length: 2, attributes: {}}),
    destroy: () => calls.push('destroy')
  };
  layer.state.splatEngine = engine as any;

  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true}
  } as any);
  expect(calls).toEqual(['setProps', 'setData']);
  expect(engineProps).toMatchObject({
    sortMode: 'tile',
    alphaCutoff: 0,
    screenSizeCutoffPixels: 0,
    gaussianSupportRadius: 0,
    kernel2DSize: 0,
    maxScreenSpaceSplatSize: 1
  });

  engineProps.onDataUpdate();
  expect(layer.state.engineDataVersion).toBe(1);
  const streamError = new Error('stream failed');
  engineProps.onDataError(streamError);
  expect(layer.state.streamError).toBe(streamError);

  layer.updateState({
    props: layer.props,
    oldProps: layer.props,
    changeFlags: {dataChanged: false, propsChanged: true}
  } as any);
  expect(calls.filter(call => call === 'setData')).toHaveLength(2);
  expect((layer as any).shouldUseGpuEngine()).toBe(false);

  const rendered = layer.renderLayers() as any;
  expect(rendered.props.data).toEqual({length: 2, attributes: {}});

  const noDataLayer = createLayer({data: null});
  noDataLayer.state = {...layer.state, splatEngine: engine} as any;
  noDataLayer.updateState({
    props: noDataLayer.props,
    oldProps: {...noDataLayer.props, data: table},
    changeFlags: {dataChanged: true}
  } as any);
  expect(calls).toContain('destroy');
  expect(noDataLayer.renderLayers()).toBeNull();
});

test('SplatLayer covers GPU policy and streamed engine render branches', () => {
  const stream = createControlledAsyncIterable<ArrowTableBatch>();
  const layer = createLayer({data: stream, renderMode: 'gpu'});
  layer.state = {} as any;
  layer.initializeState();
  expect(() => (layer as any).shouldUseGpuEngine()).toThrow(/requires a WebGPU device/);

  const destroyed: number[] = [];
  const engine = {
    setProps: () => {},
    setData: () => {},
    getSplatCount: () => 3,
    getWebGLAttributes: () => ({length: 3, attributes: {marker: true}}),
    destroy: () => destroyed.push(1)
  };
  layer.state.splatEngine = engine as any;
  layer.state.streamEngines = [engine as any, null];
  layer.context = {device: {type: 'webgpu'}} as any;
  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true}
  } as any);
  expect((layer.renderLayers() as any).props.data.length).toBe(3);

  expect((layer as any).shouldUseGpuEngine()).toBe(true);
  expect((layer.renderLayers() as any).props.data).toEqual({length: 3, attributes: {}});

  layer.state.streamError = new Error('render stream failed');
  expect(() => layer.renderLayers()).toThrow('render stream failed');
  layer.state.streamError = null;
  (layer as any).destroyStreamEngineResources();
  expect(destroyed).toEqual([1]);
});

test('Splat primitive draw covers WebGL, WebGPU, picking, and viewport inputs', () => {
  const layer = createLayer({data: createGaussianSplatTable()});
  const primitive = layer.renderLayers() as any;
  const operations: unknown[] = [];
  const model = {
    shaderInputs: {setProps: (props: unknown) => operations.push(props)},
    setBindings: (bindings: unknown) => operations.push(bindings),
    setInstanceCount: (count: number) => operations.push(['instances', count]),
    setVertexCount: (count: number) => operations.push(['vertices', count]),
    draw: (renderPass: unknown) => operations.push(['draw', renderPass])
  };
  const splatEngine = {
    update: (props: unknown) => operations.push(props),
    getRenderBindings: () => ({storage: true}),
    getRenderSplatCount: () => 2
  };
  primitive.state = {model};
  primitive.context = {
    device: {type: 'webgl'},
    viewport: null,
    renderPass: 'webgl-pass'
  };
  Object.defineProperty(primitive, 'props', {
    configurable: true,
    value: {...primitive.props, splatEngine}
  });
  primitive.draw();
  expect(operations).toContainEqual({radiusScale: 1});
  expect(operations).toContainEqual(['draw', 'webgl-pass']);

  operations.length = 0;
  primitive.context = {
    device: {type: 'webgpu'},
    viewport: {
      width: 0,
      height: 0,
      viewProjectionMatrix: [1],
      getFrustumPlanes: () => ({
        near: {normal: {clone: () => ({negate: () => [0, 0, -1]})}, distance: 1}
      })
    },
    renderPass: 'webgpu-pass'
  };
  primitive.draw({shaderModuleProps: {picking: {isActive: true}}});
  expect(operations).toEqual([]);
  primitive.draw();
  expect(operations).toContainEqual({storage: true});
  expect(operations).toContainEqual(['instances', 2]);
  expect(operations).toContainEqual(['vertices', 4]);

  Object.defineProperty(primitive, 'props', {
    configurable: true,
    value: {...primitive.props, splatEngine: null}
  });
  primitive.draw();
  primitive.state = {};
  primitive.draw();
});
