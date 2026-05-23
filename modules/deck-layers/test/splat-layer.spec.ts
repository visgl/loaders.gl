// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import test from 'tape-promise/tape';
import {
  RADSplatLayer,
  SplatLayer,
  _getRADCompactedRenderChunksForTesting,
  _getRADChunkRequestIndicesForTesting,
  _getRADLoadedRenderFrontierForTesting,
  _getRADRenderFrontierSignatureForTesting,
  _getRADRenderFrontierSplatChunksForTesting,
  _getRADRenderPageSplatCountForTesting,
  _getRADViewportLoadSignatureForTesting,
  type RADSplatLayerProps,
  type SplatLayerProps
} from '../src/splat-layer';
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

/** Creates a RADSplatLayer instance for testing. */
function createRADLayer(props: RADSplatLayerProps): RADSplatLayer {
  const layer = new RADSplatLayer({
    id: 'test-rad-splat-layer',
    ...props
  });
  layer.context = {
    device: {type: 'webgl'},
    viewport: {
      width: 800,
      height: 600,
      cameraPosition: [0, 0, 5],
      viewMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      viewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      fovy: 50
    }
  } as any;
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

/** Creates decoded RAD chunk values for frontier tests. */
function createRADChunk(
  chunkIndex: number,
  base: number,
  childCounts: number[],
  childStarts: number[]
) {
  const splatCount = childCounts.length;
  const positions = new Float32Array(splatCount * 3);
  const scales = new Float32Array(splatCount * 3).fill(1);
  const rotations = new Float32Array(splatCount * 4);
  const colors = new Uint8Array(splatCount * 3).fill(255);
  const opacities = new Float32Array(splatCount).fill(1);
  for (let rowIndex = 0; rowIndex < splatCount; rowIndex++) {
    positions[rowIndex * 3] = base + rowIndex;
    rotations[rowIndex * 4] = 1;
  }
  return {
    chunkIndex,
    splats: {
      splatCount,
      positions,
      scales,
      rotations,
      colors,
      opacities,
      loaderData: {
        base,
        count: splatCount,
        childCounts: new Uint16Array(childCounts),
        childStarts: new Uint32Array(childStarts)
      }
    }
  };
}

/** Creates a minimal RAD source with trackable chunk requests. */
function createRADSource(chunks: ReturnType<typeof createRADChunk>[]) {
  const requestedChunkIndices: number[] = [];
  const chunkRequestOptions: unknown[] = [];
  return {
    requestedChunkIndices,
    chunkRequestOptions,
    async getMetadata() {
      return {
        count: chunks.reduce((total, chunk) => total + chunk.splats.splatCount, 0),
        chunkSize: 1,
        chunks: chunks.map(chunk => ({
          base: chunk.splats.loaderData.base as number,
          count: chunk.splats.splatCount
        }))
      };
    },
    async getChunkSplats(chunkIndex: number, options?: unknown) {
      requestedChunkIndices.push(chunkIndex);
      chunkRequestOptions.push(options);
      await Promise.resolve();
      return chunks[chunkIndex].splats;
    }
  };
}

/** Creates a minimal RAD source that fails every chunk request. */
function createFailingRADSource(errorMessage: string) {
  const requestedChunkIndices: number[] = [];
  return {
    requestedChunkIndices,
    async getMetadata() {
      return {
        count: 1,
        chunkSize: 1,
        chunks: [{base: 0, count: 1}]
      };
    },
    async getChunkSplats(chunkIndex: number) {
      requestedChunkIndices.push(chunkIndex);
      throw new Error(errorMessage);
    }
  };
}

/** Returns x positions from frontier chunks for compact assertions. */
function getFrontierPositionXs(frontierChunks: any[]): number[] {
  return frontierChunks.flatMap(chunk => {
    const positions = chunk.positions as Float32Array;
    const xs: number[] = [];
    for (let positionIndex = 0; positionIndex < positions.length; positionIndex += 3) {
      xs.push(positions[positionIndex]);
    }
    return xs;
  });
}

/** Returns x positions from row-level render frontier chunks. */
function getLoadedFrontierPositionXs(frontierChunks: any[]): number[] {
  return frontierChunks.flatMap(frontierChunk => {
    const positions = frontierChunk.chunk.splats.positions as Float32Array;
    const rowCount = frontierChunk.chunk.splats.splatCount as number;
    const rowWeights = frontierChunk.rowWeights as Float32Array | undefined;
    const rows = rowWeights
      ? Array.from({length: rowCount}, (_, rowIndex) => rowIndex).filter(
          rowIndex => rowWeights[rowIndex] > 0
        )
      : frontierChunk.visibleRows
        ? Array.from(frontierChunk.visibleRows as Uint32Array)
        : Array.from({length: rowCount}, (_, rowIndex) => rowIndex);
    return rows.map(rowIndex => positions[rowIndex * 3]);
  });
}

/** Returns opacities from compacted RAD render chunks. */
function getCompactedOpacities(compactedChunks: any[]): number[] {
  return compactedChunks.flatMap(chunk => Array.from(chunk.opacities as Float32Array));
}

/** Creates RAD LoD frontier options for unit tests. */
function createRADFrontierOptions(overrides: Record<string, unknown> = {}) {
  return {
    startChunkIndex: 0,
    maxChunks: 8,
    maxSplats: 8,
    maxConcurrentChunkRequests: 4,
    viewport: {
      width: 800,
      height: 600,
      viewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      fovy: 50
    },
    modelMatrix: null,
    radiusScale: 1,
    gaussianSupportRadius: 3,
    lodSplatScale: 1,
    lodRenderScale: 1,
    coneFov0: 0.25,
    coneFov: 1,
    behindFoveate: 0.2,
    coneFoveate: 0.4,
    maxCachedChunks: 16,
    ...overrides
  } as any;
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

/** Lets RAD runtime metadata, chunk, and reselection promises settle. */
async function waitForRADRuntime(): Promise<void> {
  for (let passIndex = 0; passIndex < 6; passIndex++) {
    await Promise.resolve();
    await waitForFrame();
  }
}

/** Lets bounded RAD chunk retries exhaust. */
async function waitForRADChunkRetries(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 450));
  await waitForRADRuntime();
}

/** Lets queued animation-frame work settle in browser and Node test projects. */
async function waitForFrame(): Promise<void> {
  await new Promise<void>(resolve => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
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

test('RADSplatLayer frontier keeps parents for partially loaded children', t => {
  const parentChunk = createRADChunk(0, 0, [400, 0], [2, 0]);
  const partialChildChunk = createRADChunk(1, 2, [0, 0], [0, 0]);

  const frontierChunks = _getRADRenderFrontierSplatChunksForTesting([
    parentChunk,
    partialChildChunk
  ]);

  t.deepEqual(
    getFrontierPositionXs(frontierChunks),
    [0, 1],
    'keeps parent rows and suppresses partial descendants'
  );
  t.end();
});

test('RADSplatLayer frontier preserves large partial descendants', t => {
  const parentChunk = createRADChunk(0, 0, [70000, 0], [2, 0]);
  const partialChildChunk = createRADChunk(1, 2, [0, 0], [0, 0]);

  const frontierChunks = _getRADRenderFrontierSplatChunksForTesting([
    parentChunk,
    partialChildChunk
  ]);

  t.deepEqual(
    getFrontierPositionXs(frontierChunks),
    [0, 1, 2, 3],
    'keeps coarse parents without suppressing broad partially loaded child ranges'
  );
  t.end();
});

test('RADSplatLayer frontier descends into fully loaded children', t => {
  const parentChunk = createRADChunk(0, 0, [2, 0], [2, 0]);
  const childChunk = createRADChunk(1, 2, [0, 0], [0, 0]);

  const frontierChunks = _getRADRenderFrontierSplatChunksForTesting([parentChunk, childChunk]);

  t.deepEqual(
    getFrontierPositionXs(frontierChunks),
    [1, 2, 3],
    'replaces covered parent rows with loaded child rows'
  );
  t.end();
});

test('RADSplatLayer loaded LoD frontier selects rows instead of whole chunks', t => {
  const parentChunk = createRADChunk(0, 0, [3, 0, 0], [1, 0, 0]);
  const childChunk = createRADChunk(1, 3, [0], [0]);
  const metadata = {
    count: 4,
    chunkSize: 3,
    chunks: [
      {base: 0, count: 3},
      {base: 3, count: 1}
    ]
  };

  const frontierChunks = _getRADLoadedRenderFrontierForTesting(
    [parentChunk, childChunk],
    metadata,
    createRADFrontierOptions({maxSplats: 3})
  );

  t.deepEqual(
    getLoadedFrontierPositionXs(frontierChunks),
    [1, 2, 3],
    'replaces the loaded parent row with direct child rows without rendering unrelated chunk rows'
  );
  t.end();
});

test('RADSplatLayer loaded LoD frontier keeps parent while child chunks load', t => {
  const parentChunk = createRADChunk(0, 0, [3, 0, 0], [1, 0, 0]);
  const metadata = {
    count: 4,
    chunkSize: 3,
    chunks: [
      {base: 0, count: 3},
      {base: 3, count: 1}
    ]
  };

  const frontierChunks = _getRADLoadedRenderFrontierForTesting(
    [parentChunk],
    metadata,
    createRADFrontierOptions({maxSplats: 3})
  );

  t.deepEqual(
    getLoadedFrontierPositionXs(frontierChunks),
    [0],
    'keeps the coherent parent row until all direct child chunks are available'
  );
  t.end();
});

test('RADSplatLayer compacts selected render frontier rows before upload', t => {
  const sourceChunk = createRADChunk(0, 0, [0, 0, 0], [0, 0, 0]);
  const rowWeights = new Float32Array(sourceChunk.splats.splatCount);
  rowWeights[0] = 0.25;
  rowWeights[2] = 1;

  const compactedChunks = _getRADCompactedRenderChunksForTesting(
    [
      {
        chunk: sourceChunk,
        visibleSplatCount: 2,
        visibleRows: new Uint32Array([0, 2]),
        rowWeights
      }
    ],
    4
  );

  t.deepEqual(getFrontierPositionXs(compactedChunks), [0, 2], 'uploads only selected rows');
  t.deepEqual(
    getCompactedOpacities(compactedChunks),
    [0.25, 1],
    'folds row-level parent fade weights into compacted opacities'
  );
  t.end();
});

test('RADSplatLayer render cache signature tracks upload-time props', t => {
  const sourceChunk = createRADChunk(0, 0, [0], [0]);
  const frontierChunks = [{chunk: sourceChunk, visibleSplatCount: 1}];
  const baseSignature = _getRADRenderFrontierSignatureForTesting(
    frontierChunks,
    [255, 255, 255, 255],
    3
  );

  t.notEqual(
    _getRADRenderFrontierSignatureForTesting(frontierChunks, [255, 0, 0, 255], 3),
    baseSignature,
    'changes when fallback color changes'
  );
  t.notEqual(
    _getRADRenderFrontierSignatureForTesting(frontierChunks, [255, 255, 255, 255], 5),
    baseSignature,
    'changes when upload-time support radius changes'
  );
  t.end();
});

test('RADSplatLayer uses one render page only for global sorting', t => {
  const sourceChunk = createRADChunk(0, 0, [0, 0, 0], [0, 0, 0]);
  const frontierChunks = [{chunk: sourceChunk, visibleSplatCount: 3}];

  t.equal(
    _getRADRenderPageSplatCountForTesting(frontierChunks, 'global'),
    3,
    'uses the selected splat count for globally sorted render pages'
  );
  t.ok(
    _getRADRenderPageSplatCountForTesting(frontierChunks, 'tile') > 3,
    'keeps bounded pages when tile sorting can still sort inside each render page'
  );
  t.ok(
    _getRADRenderPageSplatCountForTesting(frontierChunks, 'none') > 3,
    'keeps bounded pages when sorting is disabled'
  );
  t.end();
});

test('RADSplatLayer request plan prefetches prioritized child chunks', t => {
  const rootChunk = createRADChunk(0, 0, [4], [1]);
  const childChunks = [
    createRADChunk(1, 1, [0], [0]),
    createRADChunk(2, 2, [0], [0]),
    createRADChunk(3, 3, [0], [0]),
    createRADChunk(4, 4, [0], [0])
  ];
  const metadata = {
    count: 5,
    chunkSize: 1,
    chunks: [rootChunk, ...childChunks].map(chunk => ({
      base: chunk.splats.loaderData.base,
      count: chunk.splats.splatCount
    }))
  };

  t.deepEqual(
    _getRADChunkRequestIndicesForTesting([2], [rootChunk], [rootChunk], metadata, [3], {}, 3),
    [2, 1, 4],
    'keeps immediate misses first, skips unavailable chunks, and fills with child prefetches'
  );
  t.end();
});

test('RADSplatLayer reports chunk failures after retries exhaust', async t => {
  const source = createFailingRADSource('network failed');
  const progressEvents: any[] = [];
  const layer = createRADLayer({
    data: source,
    maxChunks: 1,
    maxSplats: 1,
    onLoadProgress: progress => progressEvents.push(progress)
  });
  layer.state = {} as any;
  layer.initializeState();
  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true, propsOrDataChanged: true}
  } as any);
  await waitForRADChunkRetries();

  const errorProgress = progressEvents.find(progress => progress.error);
  t.equal(source.requestedChunkIndices.length, 3, 'tries the initial request and two retries');
  t.match(
    errorProgress?.error,
    /RADSplatLayer failed to load RAD chunk 0: network failed/,
    'reports the failed chunk and underlying error'
  );
  t.throws(
    () => layer.renderLayers(),
    /RADSplatLayer failed to load RAD chunk 0: network failed/,
    'surfaces chunk failure through the layer error path'
  );
  (layer.state as any).runtime?.destroy();
  t.end();
});

test('RADSplatLayer keeps resident progress across viewport reselection', async t => {
  const rootChunk = createRADChunk(0, 0, [1], [1]);
  const childChunk = createRADChunk(1, 1, [0], [0]);
  const source = createRADSource([rootChunk, childChunk]);
  const progressEvents: any[] = [];
  const layer = createRADLayer({
    data: source,
    maxChunks: 2,
    maxSplats: 2,
    onLoadProgress: progress => progressEvents.push(progress)
  });
  layer.state = {} as any;
  layer.initializeState();
  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true, propsOrDataChanged: true}
  } as any);
  await waitForRADRuntime();

  const firstRootRequestCount = source.requestedChunkIndices.filter(
    chunkIndex => chunkIndex === 0
  ).length;
  const firstLoadedSplatCount = Math.max(
    ...progressEvents.map(progress => progress.loadedSplatCount)
  );
  t.equal(firstRootRequestCount, 1, 'loads the root chunk once');
  t.ok(firstLoadedSplatCount > 0, 'reports resident loaded splats after first load');

  layer.context = {
    ...layer.context,
    viewport: {
      ...(layer.context.viewport as any),
      cameraPosition: [1, 0, 5],
      bearing: 20
    }
  } as any;
  layer.updateState({
    props: layer.props,
    oldProps: layer.props,
    changeFlags: {viewportChanged: true}
  } as any);
  await waitForRADRuntime();

  const latestProgress = progressEvents[progressEvents.length - 1];
  t.equal(
    source.requestedChunkIndices.filter(chunkIndex => chunkIndex === 0).length,
    1,
    'does not refetch resident chunks on viewport change'
  );
  t.ok(
    latestProgress.loadedSplatCount >= firstLoadedSplatCount,
    'does not reset progress to zero on viewport change'
  );
  (layer.state as any).runtime?.destroy();
  t.end();
});

test('RADSplatLayer retains previous render pages while child chunks refine', async t => {
  const rootChunk = createRADChunk(0, 0, [1], [1]);
  const childChunk = createRADChunk(1, 1, [0], [0]);
  const source = createRADSource([rootChunk, childChunk]);
  const layer = createRADLayer({
    data: source,
    maxChunks: 2,
    maxSplats: 2
  });
  layer.state = {} as any;
  layer.initializeState();
  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true, propsOrDataChanged: true}
  } as any);
  await waitForRADRuntime();

  const sublayers = asLayerArray(layer.renderLayers());
  t.ok(sublayers.length >= 1, 'renders resident pages after progressive loading');
  t.ok(
    source.requestedChunkIndices.includes(1),
    'requests child chunks without clearing the root page'
  );
  t.ok(
    source.chunkRequestOptions.every(
      (options: any) => options?.radChunk?.includeSphericalHarmonics === true
    ),
    'requests spherical harmonic coefficients for RAD render chunks'
  );
  (layer.state as any).runtime?.destroy();
  t.end();
});

test('RADSplatLayer viewport signature tracks FoV and camera buckets', t => {
  const baseViewport = {
    cameraPosition: [1, 2, 3],
    viewMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    fovy: 50,
    zoom: 1,
    pitch: 10,
    bearing: 20,
    width: 1024,
    height: 768
  };

  const baseSignature = _getRADViewportLoadSignatureForTesting(baseViewport);
  t.notEqual(
    _getRADViewportLoadSignatureForTesting({...baseViewport, fovy: 60}),
    baseSignature,
    'changes when FoV changes'
  );
  t.notEqual(
    _getRADViewportLoadSignatureForTesting({...baseViewport, cameraPosition: [1.3, 2, 3]}),
    baseSignature,
    'changes when camera position crosses a fine bucket'
  );
  t.notEqual(
    _getRADViewportLoadSignatureForTesting({...baseViewport, bearing: 25}),
    baseSignature,
    'changes when view orientation changes'
  );
  t.end();
});
