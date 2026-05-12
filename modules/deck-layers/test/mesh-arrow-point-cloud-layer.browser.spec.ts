// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
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

test('MeshArrowPointCloudLayer renders a static Mesh Arrow table', t => {
  const meshArrowTable = convertMeshToTable(
    createPointCloudMesh([0, 0, 0, 1, 2, 3]),
    'arrow-table'
  );
  const layer = createLayer({data: meshArrowTable});
  const [sublayer] = asLayerArray(layer.renderLayers());

  t.equal(sublayer.constructor.layerName, 'PointCloudLayer', 'creates a PointCloudLayer');
  t.equal((sublayer.props.data as any).length, 2, 'passes one rendered object per point');
  t.end();
});

test('MeshArrowPointCloudLayer applies defaultPointColor without table colors', t => {
  const meshArrowTable = convertMeshToTable(createPointCloudMesh([0, 0, 0]), 'arrow-table');
  const layer = createLayer({
    data: meshArrowTable,
    defaultPointColor: [1, 2, 3]
  });
  const [sublayer] = asLayerArray(layer.renderLayers());

  t.deepEqual(sublayer.props.getColor, [1, 2, 3], 'passes defaultPointColor to PointCloudLayer');
  t.end();
});

test('MeshArrowPointCloudLayer incrementally renders Arrow table batches', async t => {
  const pointCloudBatches = createControlledAsyncIterable<ArrowTableBatch>();
  const layer = createLayer({data: pointCloudBatches});
  layer.state = {};
  layer.initializeState();
  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true}
  } as any);

  t.equal(asLayerArray(layer.renderLayers()).length, 0, 'renders no sublayers before batches load');

  pointCloudBatches.push(createArrowTableBatch([0, 0, 0, 1, 1, 1]));
  await waitForAsyncIterator();

  let sublayers = asLayerArray(layer.renderLayers());
  t.equal(sublayers.length, 1, 'renders one sublayer after the first batch');
  t.equal((sublayers[0].props.data as any).length, 2, 'uses the first batch row count');

  pointCloudBatches.push(createArrowTableBatch([2, 2, 2, 3, 3, 3, 4, 4, 4]));
  await waitForAsyncIterator();

  sublayers = asLayerArray(layer.renderLayers());
  t.equal(sublayers.length, 2, 'renders one sublayer per loaded batch');
  t.equal((sublayers[1].props.data as any).length, 3, 'uses the second batch row count');

  pointCloudBatches.close();
  t.end();
});

test('MeshArrowPointCloudLayer reports invalid async batch shapes', async t => {
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

  t.throws(
    () => layer.renderLayers(),
    /requires ArrowTableBatch values/,
    'throws a stable error for invalid async batch values'
  );
  pointCloudBatches.close();
  t.end();
});
