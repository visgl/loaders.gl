// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import test from 'tape-promise/tape';
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

test('SplatLayer renders Gaussian splat Arrow table through binary attributes', t => {
  const layer = createLayer({data: createGaussianSplatTable()});
  const sublayer = layer.renderLayers() as any;
  const data = sublayer.props.data;

  t.equal(sublayer.constructor.layerName, 'SplatPrimitiveLayer', 'creates primitive splat layer');
  t.equal(data.length, 2, 'passes one rendered object per splat');
  t.deepEqual(
    Array.from(data.attributes.getPosition.value),
    [0, 0, 0, 1, 2, 3],
    'passes interleaved positions'
  );
  t.equal(data.attributes.getRadius.value[0], 3, 'decodes first log scale support radius');
  t.ok(
    Math.abs(data.attributes.getRadius.value[1] - Math.exp(0) * 3) < 1e-6,
    'decodes second log scale support radius from geometric mean'
  );
  t.deepEqual(
    Array.from(data.attributes.getColor.value.slice(0, 4)),
    [128, 128, 128, 128],
    'derives first color from SH DC and logit opacity'
  );
  t.end();
});

test('SplatLayer incrementally renders Arrow table batches', async t => {
  const splatBatches = createControlledAsyncIterable<ArrowTableBatch>();
  const layer = createLayer({data: splatBatches});
  layer.state = {} as any;
  layer.initializeState();
  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true}
  } as any);

  t.equal(asLayerArray(layer.renderLayers()).length, 0, 'renders no sublayers before batches load');

  splatBatches.push(createGaussianSplatBatch(createGaussianSplatTable()));
  await waitForAsyncIterator();

  let sublayers = asLayerArray(layer.renderLayers());
  t.equal(sublayers.length, 1, 'renders one sublayer after the first batch');
  t.equal((sublayers[0].props.data as any).length, 2, 'uses the first batch row count');

  splatBatches.push(createGaussianSplatBatch(createGaussianSplatTable()));
  await waitForAsyncIterator();

  sublayers = asLayerArray(layer.renderLayers());
  t.equal(sublayers.length, 1, 'keeps streaming batches in one engine-backed sublayer');
  t.equal((sublayers[0].props.data as any).length, 4, 'uses the accumulated batch row count');

  splatBatches.close();
  t.end();
});

test('SplatLayer reports invalid async batch shapes', async t => {
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

  t.throws(
    () => layer.renderLayers(),
    /requires ArrowTableBatch values/,
    'throws a stable error for invalid async batch values'
  );
  splatBatches.close();
  t.end();
});
