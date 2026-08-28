// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  MeshArrowPointCloudLayer,
  type MeshArrowPointCloudLayerProps
} from '../src/mesh-arrow-point-cloud-layer';
import type {ArrowTableBatch, Mesh} from '@loaders.gl/schema';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
type ControlledAsyncIterable<T> = AsyncIterable<T> & {
  push: (value: T) => void;
  close: () => void;
};
/** Creates a MeshArrowPointCloudLayer instance for testing. */
function createLayer(props: MeshArrowPointCloudLayerProps): MeshArrowPointCloudLayer {
  return new MeshArrowPointCloudLayer({
    id: 'test-mesh-arrow-point-cloud-layer',
    ...props
  });
}
/** Creates a minimal point cloud Mesh. */
function createPointCloudMesh(positions: number[]): Mesh {
  return {
    topology: 'point-list',
    mode: 0,
    attributes: {
      POSITION: {
        value: new Float32Array(positions),
        size: 3
      }
    },
    schema: {
      fields: [],
      metadata: {}
    }
  };
}
/** Creates a loaders.gl Arrow table batch from point positions. */
function createArrowTableBatch(positions: number[]): ArrowTableBatch {
  const meshArrowTable = convertMeshToTable(createPointCloudMesh(positions), 'arrow-table');
  return {
    shape: 'arrow-table',
    batchType: 'data',
    schema: meshArrowTable.schema,
    data: meshArrowTable.data,
    length: meshArrowTable.data.numRows
  };
}
/** Normalizes a layer render result to an array. */
function asLayerArray(layerResult: ReturnType<MeshArrowPointCloudLayer['renderLayers']>) {
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
}
test('MeshArrowPointCloudLayer renders a static Mesh Arrow table', () => {
  const meshArrowTable = convertMeshToTable(
    createPointCloudMesh([0, 0, 0, 1, 2, 3]),
    'arrow-table'
  );
  const layer = createLayer({data: meshArrowTable});
  const [sublayer] = asLayerArray(layer.renderLayers());
  expect(sublayer.constructor.layerName, 'creates a PointCloudLayer').toBe('PointCloudLayer');
  expect((sublayer.props.data as any).length, 'passes one rendered object per point').toBe(2);
});
test('MeshArrowPointCloudLayer applies defaultPointColor without table colors', () => {
  const meshArrowTable = convertMeshToTable(createPointCloudMesh([0, 0, 0]), 'arrow-table');
  const layer = createLayer({
    data: meshArrowTable,
    defaultPointColor: [1, 2, 3]
  });
  const [sublayer] = asLayerArray(layer.renderLayers());
  expect(sublayer.props.getColor, 'passes defaultPointColor to PointCloudLayer').toEqual([1, 2, 3]);
});
test('MeshArrowPointCloudLayer incrementally renders Arrow table batches', async () => {
  const pointCloudBatches = createControlledAsyncIterable<ArrowTableBatch>();
  const layer = createLayer({data: pointCloudBatches});
  layer.state = {};
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
  pointCloudBatches.push(createArrowTableBatch([0, 0, 0, 1, 1, 1]));
  await waitForAsyncIterator();
  let sublayers = asLayerArray(layer.renderLayers());
  expect(sublayers.length, 'renders one sublayer after the first batch').toBe(1);
  expect((sublayers[0].props.data as any).length, 'uses the first batch row count').toBe(2);
  pointCloudBatches.push(createArrowTableBatch([2, 2, 2, 3, 3, 3, 4, 4, 4]));
  await waitForAsyncIterator();
  sublayers = asLayerArray(layer.renderLayers());
  expect(sublayers.length, 'renders one sublayer per loaded batch').toBe(2);
  expect((sublayers[1].props.data as any).length, 'uses the second batch row count').toBe(3);
  pointCloudBatches.close();
});
test('MeshArrowPointCloudLayer reports invalid async batch shapes', async () => {
  const pointCloudBatches = createControlledAsyncIterable<ArrowTableBatch>();
  const layer = createLayer({data: pointCloudBatches});
  layer.state = {};
  layer.initializeState();
  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true}
  } as any);
  pointCloudBatches.push({shape: 'object-row-table', batchType: 'data', length: 1} as any);
  await waitForAsyncIterator();
  expect(
    () => layer.renderLayers(),
    'throws a stable error for invalid async batch values'
  ).toThrow(/requires ArrowTableBatch values/);
  pointCloudBatches.close();
});
