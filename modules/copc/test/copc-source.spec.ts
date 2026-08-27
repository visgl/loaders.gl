// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {expect, test as vitestTest, vi} from 'vitest';
import {validateWriter} from 'test/common/conformance';
import {createDataSource, encodeSync, fetchFile, isBrowser, parse} from '@loaders.gl/core';
import {
  COPCSourceLoader,
  COPCTileSource,
  COPCWriter,
  loadCOPCHierarchyPage,
  loadCOPCNodeData,
  openCOPC,
  type COPCRangeReader
} from '@loaders.gl/copc';
import {LASLoader} from '@loaders.gl/las';
import {decodeLAZChunk, decodeLAZChunkTable} from '@loaders.gl/loader-utils';
import {deduceMeshSchema} from '@loaders.gl/schema-utils';

const ELLIPSOID_FILE_PATH = 'modules/copc/test/data/ellipsoid.copc.laz';
const ELLIPSOID_BROWSER_URL = new URL('./data/ellipsoid.copc.laz', import.meta.url).href;

/** Test surface for the protected progressive range iterator. */
class TestCOPCTileSource extends COPCTileSource {
  /** Replace the byte-range getter after normal source initialization. */
  setRangeGetter(getter: COPCRangeReader): void {
    this._readRange = getter;
  }

  /** Expose ordered range prefetching for focused scheduling tests. */
  readNodeRanges(
    node: {pointCount: number; pointDataOffset: number; pointDataLength: number},
    rangeChunkSize: number,
    rangeConcurrency: number
  ): AsyncIterable<Uint8Array> {
    return this.loadCOPCNodeRangeChunks(node, rangeChunkSize, rangeConcurrency);
  }

  /** Expose child-key generation for maximum-depth coverage. */
  readChildKeys(tileId: string): string[] {
    return this.getChildKeys(tileId);
  }
}

test('COPCWriter#writer conformance', t => {
  validateWriter(t, COPCWriter, 'COPCWriter');
  t.end();
});

test('COPCSourceLoader#creates a source through createDataSource', async t => {
  const dataSource = createDataSource(await createEllipsoidSourceData(), [COPCSourceLoader], {
    core: {
      type: 'copc'
    },
    copc: {}
  });

  t.ok(dataSource instanceof COPCTileSource, 'createDataSource returns a COPC tile source');
  t.end();
});

test('COPCSourceLoader#loads normalized root and child tiles', async t => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const childTiles = await source.getChildren(rootTile);

  t.equal(rootTile.id, '0-0-0-0', 'root tile id uses COPC key format');
  t.ok(rootTile.pointCount > 0, 'root tile point count is exposed');
  t.ok(rootTile.boundingVolume.radius > 0, 'root tile has a bounding volume');
  t.ok(childTiles.length > 0, 'child tile headers are exposed');
  t.ok(
    childTiles.every(tile => tile.geometricError < rootTile.geometricError),
    'child tiles refine geometric error'
  );

  const grandChildTiles = await source.getChildren(childTiles[0]);
  t.ok(Array.isArray(grandChildTiles), 'deeper hierarchy traversal succeeds');
  t.end();
});

test('COPCSourceLoader#loads full point content for a tile', async t => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const childTiles = await source.getChildren(rootTile);
  const tile = childTiles[0] || rootTile;
  const content = await source.loadTileContent(tile);

  t.ok(content, 'tile content loads');
  t.equal(
    content?.data.data.getChild('POSITION')?.length,
    content?.pointCount,
    'Arrow table contains one position row per point'
  );
  t.equal(content?.data.shape, 'arrow-table', 'tile content is returned as an Arrow table');
  t.ok(content?.cartographicOrigin.length === 3, 'content includes a coordinate origin');
  t.end();
});

test('COPCSourceLoader#loads tile content with TypeScript LAZ decoder', async t => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const content = await source.loadTileContent(rootTile);

  t.ok(content, 'tile content loads');
  t.equal(
    content?.data.data.getChild('POSITION')?.length,
    content?.pointCount,
    'Arrow table contains one position row per point'
  );
  t.end();
});

test('COPCSourceLoader#implements the TileSource getTileData contract', async t => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const content = await source.getTileData({
    id: rootTile.id,
    index: {x: rootTile.x, y: rootTile.y, z: rootTile.level},
    bbox: {left: 0, top: 0, right: 0, bottom: 0}
  });

  t.ok(content, 'getTileData returns point-cloud content');
  t.equal((content as any)?.data.shape, 'arrow-table', 'getTileData returns an Arrow table');
  t.equal((content as any)?.pointCount, rootTile.pointCount, 'getTileData preserves point count');
  t.end();
});

test('COPCSourceLoader#applies selected columns to atomic TypeScript decoding', async t => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {
    core: {loadOptions: {core: {worker: false}}}
  });
  await source.initialize();

  const rootTile = await source.getRootTile();
  const content = await source.loadTileContent(rootTile, {
    columns: ['POSITION', 'COLOR_0', 'intensity', 'classification']
  });

  t.ok(content?.data.data.getChild('POSITION'), 'position is always returned');
  t.ok(content?.data.data.getChild('COLOR_0'), 'selected color is returned');
  t.ok(content?.data.data.getChild('intensity'), 'selected intensity is returned');
  t.ok(content?.data.data.getChild('classification'), 'selected classification is returned');
  t.notOk(content?.data.data.getChild('GPS_TIME'), 'unselected GPS time is omitted');
  t.notOk(content?.data.data.getChild('scanAngle'), 'unselected scan angle is omitted');
  t.end();
});

vitestTest('COPCSourceLoader#uses the shared TypeScript LAS worker for atomic nodes', async () => {
  const blob = await createEllipsoidBlob();
  const workerSource = createDataSource(blob, [COPCSourceLoader], {
    core: {
      type: 'copc',
      loadOptions: {
        core: {worker: true, reuseWorkers: false, _workerType: 'test'}
      }
    },
    copc: {decodeConcurrency: 2}
  });
  const mainThreadSource = COPCSourceLoader.createDataSource(blob, {
    core: {loadOptions: {core: {worker: false}}}
  });
  await Promise.all([workerSource.initialize(), mainThreadSource.initialize()]);
  const rootTile = await workerSource.getRootTile();
  const decodeNodeOnWorker = vi.spyOn(workerSource as any, 'decodeNodeOnWorker');

  const [workerContent, mainThreadContent] = await Promise.all([
    workerSource.loadTileContent(rootTile),
    mainThreadSource.loadTileContent(rootTile)
  ]);

  expect(decodeNodeOnWorker).toHaveBeenCalledOnce();
  expect(await decodeNodeOnWorker.mock.results[0].value).not.toBeNull();
  expect(readCOPCContentColumn(workerContent, 'POSITION')).toEqual(
    readCOPCContentColumn(mainThreadContent, 'POSITION')
  );
  expect(readCOPCContentColumn(workerContent, 'COLOR_0')).toEqual(
    readCOPCContentColumn(mainThreadContent, 'COLOR_0')
  );

  const repeatedContent = await workerSource.loadTileContent(rootTile);
  expect(readCOPCContentColumn(repeatedContent, 'POSITION')).toEqual(
    readCOPCContentColumn(workerContent, 'POSITION')
  );
  expect((await workerSource.getChildren(rootTile)).length).toBeGreaterThan(0);
});

vitestTest.each([6, 7, 8] as const)(
  'COPCSourceLoader#worker matches main-thread PDRF %i node decoding',
  async pointDataRecordFormat => {
    const blob = createWorkerCOPCBlob(pointDataRecordFormat);
    const workerSource = createDataSource(blob, [COPCSourceLoader], {
      core: {
        type: 'copc',
        loadOptions: {core: {worker: true, _workerType: 'test'}}
      },
      copc: {decodeConcurrency: 2}
    });
    const mainThreadSource = COPCSourceLoader.createDataSource(blob, {
      core: {loadOptions: {core: {worker: false}}}
    });
    await Promise.all([workerSource.initialize(), mainThreadSource.initialize()]);
    const rootTile = await workerSource.getRootTile();
    const decodeNodeOnWorker = vi.spyOn(workerSource as any, 'decodeNodeOnWorker');
    const [workerContent, mainThreadContent] = await Promise.all([
      workerSource.loadTileContent(rootTile),
      mainThreadSource.loadTileContent(rootTile)
    ]);

    expect(await decodeNodeOnWorker.mock.results[0].value).not.toBeNull();
    expect(readCOPCContentColumn(workerContent, 'POSITION')).toEqual(
      readCOPCContentColumn(mainThreadContent, 'POSITION')
    );
    expect(readCOPCContentColumn(workerContent, 'COLOR_0')).toEqual(
      readCOPCContentColumn(mainThreadContent, 'COLOR_0')
    );
    const repeatedContent = await workerSource.loadTileContent(rootTile);
    expect(readCOPCContentColumn(repeatedContent, 'POSITION')).toEqual(
      readCOPCContentColumn(workerContent, 'POSITION')
    );
  }
);

vitestTest('COPCSourceLoader#bounds complete node fetch and decode concurrency', async () => {
  const sourceBytes = new Uint8Array(await (await fetchFile(ELLIPSOID_BROWSER_URL)).arrayBuffer());
  const source = new TestCOPCTileSource(new Blob([sourceBytes]), {
    copc: {decodeConcurrency: 2},
    core: {loadOptions: {core: {worker: false}}}
  });
  await source.initialize();
  const rootTile = await source.getRootTile();
  let activeRequestCount = 0;
  let maximumActiveRequestCount = 0;
  source.setRangeGetter(async (begin, end) => {
    activeRequestCount++;
    maximumActiveRequestCount = Math.max(maximumActiveRequestCount, activeRequestCount);
    await new Promise(resolve => setTimeout(resolve, 10));
    activeRequestCount--;
    return sourceBytes.slice(begin, end);
  });

  const contents = await Promise.all(
    Array.from({length: 5}, () => source.loadTileContent(rootTile))
  );
  expect(maximumActiveRequestCount).toBe(2);
  expect(contents.every(content => content?.pointCount === rootTile.pointCount)).toBe(true);
});

vitestTest(
  'COPCSourceLoader#cancels an atomic node queued behind the concurrency bound',
  async () => {
    const sourceBytes = new Uint8Array(
      await (await fetchFile(ELLIPSOID_BROWSER_URL)).arrayBuffer()
    );
    const source = new TestCOPCTileSource(new Blob([sourceBytes]), {
      copc: {decodeConcurrency: 1},
      core: {loadOptions: {core: {worker: false}}}
    });
    await source.initialize();
    const rootTile = await source.getRootTile();
    let releaseRange!: () => void;
    let markRangeStarted!: () => void;
    const rangeStarted = new Promise<void>(resolve => {
      markRangeStarted = resolve;
    });
    const rangeReleased = new Promise<void>(resolve => {
      releaseRange = resolve;
    });
    let requestCount = 0;
    source.setRangeGetter(async (begin, end) => {
      requestCount++;
      markRangeStarted();
      await rangeReleased;
      return sourceBytes.slice(begin, end);
    });

    const activeLoad = source.loadTileContent(rootTile);
    await rangeStarted;
    const abortController = new AbortController();
    const queuedLoad = source.loadTileContent(rootTile, {signal: abortController.signal});
    abortController.abort();

    await expect(queuedLoad).rejects.toMatchObject({name: 'AbortError'});
    expect(requestCount).toBe(1);
    releaseRange();
    await expect(activeLoad).resolves.toMatchObject({pointCount: rootTile.pointCount});
  }
);

vitestTest('COPCSourceLoader#reports native range cancellation as AbortError', async () => {
  const abortController = new AbortController();
  abortController.abort();
  await expect(
    loadCOPCNodeData(
      async () => new Uint8Array(1),
      {pointCount: 1, pointDataOffset: 0, pointDataLength: 1},
      abortController.signal
    )
  ).rejects.toMatchObject({name: 'AbortError'});
});

vitestTest.each([0, 1.5])(
  'COPCSourceLoader#rejects invalid decode concurrency %s',
  decodeConcurrency => {
    expect(
      () =>
        new TestCOPCTileSource(new Blob(), {
          copc: {decodeConcurrency}
        })
    ).toThrow('COPC decodeConcurrency must be a positive integer');
  }
);

vitestTest('COPCSourceLoader#streams TypeScript tile content as Arrow batches', async () => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const atomicContent = await source.loadTileContent(rootTile);
  const streamedPositions: number[] = [];
  const streamedColors: number[] = [];
  let streamedPointCount = 0;

  for await (const batch of source.loadTileContentInBatches(rootTile, {
    batchSize: 127,
    rangeChunkSize: 257,
    rangeConcurrency: 3
  })) {
    const positions = batch.data.data.getChild('POSITION');
    const colors = batch.data.data.getChild('COLOR_0');
    streamedPointCount += batch.pointCount;
    for (let index = 0; index < batch.pointCount; index++) {
      streamedPositions.push(...(positions?.get(index)?.toArray() || []));
      streamedColors.push(...(colors?.get(index)?.toArray() || []));
    }
  }

  const atomicPositions = atomicContent?.data.data.getChild('POSITION');
  const atomicColors = atomicContent?.data.data.getChild('COLOR_0');
  const expectedPositions: number[] = [];
  const expectedColors: number[] = [];
  for (let index = 0; index < rootTile.pointCount; index++) {
    expectedPositions.push(...(atomicPositions?.get(index)?.toArray() || []));
    expectedColors.push(...(atomicColors?.get(index)?.toArray() || []));
  }

  expect(streamedPointCount).toBe(rootTile.pointCount);
  expect(streamedPositions).toEqual(expectedPositions);
  expect(streamedColors).toEqual(expectedColors);
});

vitestTest('COPCSourceLoader#selects progressive point-data columns', async () => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const columns = [
    'POSITION',
    'COLOR_0',
    'intensity',
    'classification',
    'synthetic',
    'keyPoint',
    'withheld',
    'overlap',
    'GPS_TIME',
    'scanAngle',
    'userData',
    'pointSourceId',
    'returnNumber',
    'numberOfReturns',
    'scannerChannel',
    'scanDirectionFlag',
    'edgeOfFlightLine'
  ] as const;
  const batches = source.loadTileContentInBatches(rootTile, {
    batchSize: 127,
    columns,
    rangeChunkSize: 257,
    rangeConcurrency: 2
  });
  let firstBatch;
  for await (const batch of batches) {
    firstBatch = batch;
    break;
  }

  expect(firstBatch).toBeTruthy();
  expect(firstBatch?.data.data.getChild('POSITION')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('COLOR_0')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('intensity')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('classification')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('synthetic')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('keyPoint')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('withheld')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('overlap')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('GPS_TIME')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('scanAngle')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('userData')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('pointSourceId')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('returnNumber')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('numberOfReturns')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('scannerChannel')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('scanDirectionFlag')).toBeTruthy();
  expect(firstBatch?.data.data.getChild('edgeOfFlightLine')).toBeTruthy();
});

test('COPCSourceLoader#streams position-only TypeScript tile batches', async t => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const atomicContent = await source.loadTileContent(rootTile);
  const atomicPositions = atomicContent?.data.data.getChild('POSITION');
  const streamedPositions: number[] = [];
  for await (const batch of source.loadTileContentInBatches(rootTile, {
    batchSize: 127,
    columns: ['POSITION'],
    rangeChunkSize: 257
  })) {
    t.notOk(batch.data.data.getChild('COLOR_0'), 'color output is omitted');
    const positions = batch.data.data.getChild('POSITION');
    for (let index = 0; index < batch.pointCount; index++) {
      streamedPositions.push(...(positions?.get(index)?.toArray() || []));
    }
  }

  const expectedPositions: number[] = [];
  for (let index = 0; index < rootTile.pointCount; index++) {
    expectedPositions.push(...(atomicPositions?.get(index)?.toArray() || []));
  }
  t.deepEqual(streamedPositions, expectedPositions, 'position-only batches match atomic output');
  t.end();
});

vitestTest('COPCSourceLoader#streams hierarchy pages', async () => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {});
  const batches = [];
  for await (const batch of source.loadHierarchyInBatches({maxPages: 1})) {
    batches.push(batch);
  }

  expect(batches).toHaveLength(1);
  expect(batches[0]?.pageId).toBe('root');
  expect(batches[0]?.nodes['0-0-0-0']).toBeTruthy();
});

vitestTest('COPCSourceLoader#handles abandoned prefetched range failures', async () => {
  const source = new TestCOPCTileSource(await createEllipsoidSourceData(), {});
  await source.initialize();
  let requestCount = 0;
  const unhandledRejections: unknown[] = [];
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault();
    unhandledRejections.push(event.reason);
  };
  globalThis.addEventListener('unhandledrejection', handleUnhandledRejection);
  source.setRangeGetter(async () => {
    const requestIndex = requestCount++;
    if (requestIndex === 1) {
      throw new Error('prefetched range failed');
    }
    return new Uint8Array([requestIndex]);
  });

  try {
    const iterator = source
      .readNodeRanges({pointCount: 1, pointDataOffset: 0, pointDataLength: 1_000_000_000}, 1, 3)
      [Symbol.asyncIterator]();
    expect(await iterator.next()).toEqual({done: false, value: new Uint8Array([0])});
    expect(requestCount).toBe(3);
    await iterator.return?.();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(unhandledRejections).toEqual([]);
  } finally {
    globalThis.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }
});

vitestTest('COPCSourceLoader#does not create children beyond depth 31', async () => {
  const source = new TestCOPCTileSource(await createEllipsoidSourceData(), {});
  await source.initialize();
  expect(source.readChildKeys('31-2147483647-2147483647-2147483647')).toEqual([]);
});

vitestTest('COPCSourceLoader#includes typed Extra Bytes dimensions in its schema', async () => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {});
  const metadata = await source.getMetadata();
  const copc = metadata.formatSpecificMetadata;
  copc.header.pointDataRecordLength += 1;
  copc.extraBytesDescriptors = [
    {
      dataType: 1,
      options: 0,
      name: 'quality',
      description: '',
      scale: 0,
      offset: 0,
      scales: [0, 0, 0],
      offsets: [0, 0, 0],
      data: new Uint8Array(192)
    }
  ];

  const schema = await source.getSchema();
  expect(schema.fields).toContainEqual({
    name: 'EXTRA_BYTES_quality',
    type: 'uint8',
    nullable: false
  });
});
test('COPCSourceLoader#loads tile content from a Blob', async t => {
  const blob = await createEllipsoidBlob();
  const source = COPCSourceLoader.createDataSource(blob, {});
  await source.initialize();

  const rootTile = await source.getRootTile();
  const content = await source.loadTileContent(rootTile);

  t.ok(content, 'Blob-backed tile content loads');
  t.equal(
    content?.data.data.getChild('POSITION')?.length,
    content?.pointCount,
    'Blob-backed Arrow table contains one position row per point'
  );
  t.end();
});

test('COPCSourceLoader#derives cartographic view metadata from the dataset', async t => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {});

  const metadata = await source.getMetadata();
  const schema = await source.getSchema();
  const firstPoint = await source.getPoints({nodeIndex: [0, 0, 0, 0]});
  const viewState = source.getViewState();

  t.ok(
    Array.isArray(metadata.viewState.cartographicCenter),
    'metadata includes a cartographic center'
  );
  t.ok(metadata.viewState.zoom > 0, 'metadata includes an inferred zoom');
  t.deepEqual(
    metadata.viewState.cartographicCenter,
    viewState.cartographicCenter,
    'metadata view state matches the source view state'
  );
  t.equal(
    metadata.formatSpecificMetadata.header.pointDataRecordFormat,
    7,
    'native metadata exposes the COPC point format'
  );
  t.ok(
    schema.fields.some(field => field.name === 'ScannerChannel'),
    'native schema exposes modern LAS fields without decoding the root node'
  );
  t.equal(firstPoint?.length, schema.fields.length, 'native point values match the source schema');
  t.end();
});

test('COPCWriter#encodes range-readable octree nodes', async t => {
  const mesh = createCOPCWriterMesh();
  const arrayBuffer = encodeSync(mesh, COPCWriter, {
    copc: {nodePointLimit: 4, maximumDepth: 4, pointDataRecordFormat: 7, scale: [0.01, 0.01, 0.01]}
  });
  const blob = new Blob([arrayBuffer]);
  const ranges: Array<[number, number]> = [];
  const getter = async (begin: number, end: number): Promise<Uint8Array> => {
    ranges.push([begin, end]);
    return new Uint8Array(await blob.slice(begin, end).arrayBuffer());
  };
  const copc = await openCOPC(getter);
  const hierarchy = await loadCOPCHierarchyPage(getter, copc.info.rootHierarchyPage);
  const nodes = Object.values(hierarchy.nodes);
  const rootNode = hierarchy.nodes['0-0-0-0'];

  t.equal(copc.header.pointDataRecordFormat, 7, 'writes PDRF 7');
  t.equal(copc.header.pointCount, mesh.attributes.POSITION.value.length / 3, 'writes point count');
  t.equal(copc.header.globalEncoding & 16, 16, 'sets the WKT global encoding bit');
  t.ok(rootNode, 'writes a root hierarchy node');
  t.equal(rootNode.pointCount, 4, 'root node respects the point target');
  t.ok(nodes.length > 1, 'partitions points into child nodes');
  t.equal(
    nodes.reduce((pointCount, node) => pointCount + node.pointCount, 0),
    copc.header.pointCount,
    'hierarchy assigns every point exactly once'
  );
  t.ok(
    ranges.some(
      ([begin, end]) =>
        begin === copc.info.rootHierarchyPage.pageOffset &&
        end - begin === copc.info.rootHierarchyPage.pageLength
    ),
    'hierarchy is loaded through its declared byte range'
  );

  const pointDataPositions: string[] = [];
  for (const node of nodes) {
    const compressed = await loadCOPCNodeData(getter, node);
    const rawPointData = decodeLAZChunk(compressed, {
      pointCount: node.pointCount,
      pointDataRecordFormat: copc.header.pointDataRecordFormat,
      pointDataRecordLength: copc.header.pointDataRecordLength
    });
    pointDataPositions.push(...readPointPositions(rawPointData, copc.header));
  }
  t.deepEqual(
    pointDataPositions.sort(),
    readMeshPositions(mesh).sort(),
    'independent node chunks preserve every source position'
  );
  const lasData = await parse(arrayBuffer.slice(0), LASLoader, {core: {worker: false}});
  t.deepEqual(
    readFlatPositions(lasData.attributes.POSITION.value).sort(),
    readMeshPositions(mesh).sort(),
    'ordinary variable-chunk LAZ parsing preserves every source position'
  );

  const dataView = new DataView(arrayBuffer);
  const chunkTableOffset = readUint64(dataView, copc.header.pointDataOffset);
  const chunkCount = dataView.getUint32(chunkTableOffset + 4, true);
  const chunkTable = decodeLAZChunkTable(
    new Uint8Array(
      arrayBuffer,
      chunkTableOffset + 8,
      copc.header.evlrOffset - chunkTableOffset - 8
    ),
    {
      chunkCount,
      pointCount: copc.header.pointCount,
      chunkSize: 0xffffffff,
      variable: true
    }
  );
  t.equal(chunkCount, nodes.length, 'variable chunk table covers every hierarchy node');
  t.equal(
    chunkTable.reduce((pointCount, chunk) => pointCount + chunk.pointCount, 0),
    copc.header.pointCount,
    'variable chunk table preserves node point counts'
  );

  const source = COPCSourceLoader.createDataSource(blob, {});
  await source.initialize();
  const rootTile = await source.getRootTile();
  const childTiles = await source.getChildren(rootTile);
  const content = await source.loadTileContent(childTiles[0] || rootTile);
  t.ok(childTiles.length > 0, 'range source exposes generated child tiles');
  t.ok(content?.pointCount, 'range source decodes generated tile content');
  t.end();
});

vitestTest('COPCWriter writes range-readable hierarchy pages and GPS bounds', async () => {
  const mesh = createCOPCWriterMesh();
  const arrayBuffer = encodeSync(mesh, COPCWriter, {
    copc: {
      nodePointLimit: 2,
      maximumDepth: 6,
      hierarchyPageDepth: 1,
      pointDataRecordFormat: 7,
      scale: [0.01, 0.01, 0.01]
    }
  });
  const blob = new Blob([arrayBuffer]);
  const ranges: Array<[number, number]> = [];
  const getter = async (begin: number, end: number): Promise<Uint8Array> => {
    ranges.push([begin, end]);
    return new Uint8Array(await blob.slice(begin, end).arrayBuffer());
  };
  const copc = await openCOPC(getter);
  const rootHierarchy = await loadCOPCHierarchyPage(getter, copc.info.rootHierarchyPage);
  const hierarchy = await loadCompleteHierarchy(getter, copc.info.rootHierarchyPage);

  expect(hierarchy.pageCount).toBeGreaterThan(1);
  expect(Object.keys(hierarchy.nodes).length).toBeGreaterThan(1);
  expect(Object.values(hierarchy.nodes).reduce((sum, node) => sum + node.pointCount, 0)).toBe(
    mesh.attributes.POSITION.value.length / 3
  );
  expect(copc.info.gpsTimeRange).toEqual([1_000, 1_039]);
  expect(ranges).toContainEqual([
    copc.info.rootHierarchyPage.pageOffset,
    copc.info.rootHierarchyPage.pageOffset + copc.info.rootHierarchyPage.pageLength
  ]);

  const boundarySource = COPCSourceLoader.createDataSource(blob, {});
  await boundarySource.initialize();
  const boundaryPageKey = Object.keys(rootHierarchy.pages)[0];
  expect(boundaryPageKey).toBeTruthy();
  const boundaryNodeIndex = boundaryPageKey.split('-').map(Number) as [
    number,
    number,
    number,
    number
  ];
  const boundaryNode = await boundarySource.getNode({nodeIndex: boundaryNodeIndex});
  expect(boundaryNode?.pointCount).toBeGreaterThan(0);

  const source = COPCSourceLoader.createDataSource(blob, {});
  await source.initialize();
  const pages = [];
  for await (const page of source.loadHierarchyInBatches()) {
    pages.push(page);
  }
  expect(pages).toHaveLength(hierarchy.pageCount);
});

test('COPCWriter#validates organization options', t => {
  const mesh = createCOPCWriterMesh();
  t.throws(
    () => encodeSync(mesh, COPCWriter, {copc: {nodePointLimit: 0}}),
    /invalid node point limit/,
    'rejects an empty node target'
  );
  t.throws(
    () => encodeSync(mesh, COPCWriter, {copc: {maximumDepth: 31}}),
    /invalid maximum depth/,
    'rejects octree depths outside Int32 key coordinates'
  );
  t.throws(
    () => encodeSync(mesh, COPCWriter, {copc: {hierarchyPageDepth: 0}}),
    /invalid hierarchy page depth/,
    'rejects empty hierarchy pages'
  );
  t.end();
});

test('COPCWriter#defaults to PDRF 6 without colors', async t => {
  const coloredMesh = createCOPCWriterMesh();
  const attributes = {POSITION: coloredMesh.attributes.POSITION};
  const mesh = {
    ...coloredMesh,
    attributes,
    schema: deduceMeshSchema(attributes, {topology: 'point-list', mode: '0'})
  };
  const arrayBuffer = encodeSync(mesh, COPCWriter, {
    copc: {nodePointLimit: 8, wkt: 'LOCAL_CS["loaders.gl test"]'}
  });
  const blob = new Blob([arrayBuffer]);
  const getter = async (begin: number, end: number): Promise<Uint8Array> =>
    new Uint8Array(await blob.slice(begin, end).arrayBuffer());
  const copc = await openCOPC(getter);
  const hierarchy = await loadCOPCHierarchyPage(getter, copc.info.rootHierarchyPage);

  t.equal(copc.header.pointDataRecordFormat, 6, 'selects PDRF 6');
  t.equal(copc.wkt, 'LOCAL_CS["loaders.gl test"]', 'writes an optional WKT VLR');
  t.ok(hierarchy.nodes['0-0-0-0'], 'PDRF 6 hierarchy is readable');
  t.end();
});

vitestTest('COPCWriter preserves PDRF 8 NIR values across paged nodes', async () => {
  const baseMesh = createCOPCWriterMesh();
  const pointCount = baseMesh.attributes.POSITION.value.length / 3;
  const nir = Uint16Array.from({length: pointCount}, (_, index) => index * 101);
  const attributes = {...baseMesh.attributes, nir: {value: nir, size: 1}};
  const mesh = {
    ...baseMesh,
    attributes,
    schema: deduceMeshSchema(attributes, {topology: 'point-list', mode: '0'})
  };
  const arrayBuffer = encodeSync(mesh, COPCWriter, {
    copc: {
      nodePointLimit: 2,
      hierarchyPageDepth: 1,
      pointDataRecordFormat: 8,
      scale: [0.01, 0.01, 0.01]
    }
  });
  const getter = async (begin: number, end: number): Promise<Uint8Array> =>
    new Uint8Array(arrayBuffer.slice(begin, end));
  const copc = await openCOPC(getter);
  const hierarchy = await loadCompleteHierarchy(getter, copc.info.rootHierarchyPage);
  const decodedNir: number[] = [];

  for (const node of Object.values(hierarchy.nodes)) {
    const compressed = await loadCOPCNodeData(getter, node);
    const pointData = decodeLAZChunk(compressed, {
      pointCount: node.pointCount,
      pointDataRecordFormat: 8,
      pointDataRecordLength: copc.header.pointDataRecordLength
    });
    const dataView = new DataView(pointData.buffer, pointData.byteOffset, pointData.byteLength);
    for (let pointIndex = 0; pointIndex < node.pointCount; pointIndex++) {
      decodedNir.push(
        dataView.getUint16(pointIndex * copc.header.pointDataRecordLength + 36, true)
      );
    }
  }

  expect(copc.header.pointDataRecordFormat).toBe(8);
  expect(decodedNir.sort((left, right) => left - right)).toEqual(
    Array.from(nir).sort((left, right) => left - right)
  );
});

/** Returns the COPC fixture input for the active test runner. */
async function createEllipsoidSourceData(): Promise<string | Blob> {
  return isBrowser ? await createEllipsoidBlob() : ELLIPSOID_FILE_PATH;
}

/** Loads the shared COPC fixture as a Blob in both Node and browser test runners. */
async function createEllipsoidBlob(): Promise<Blob> {
  const url = isBrowser ? ELLIPSOID_BROWSER_URL : ELLIPSOID_FILE_PATH;
  return new Blob([await (await fetchFile(url)).arrayBuffer()]);
}

/** Create a colored point cloud spanning all root octants. */
function createCOPCWriterMesh() {
  const positions: number[] = [];
  const colors: number[] = [];
  const gpsTimes: number[] = [];
  for (let z = 0; z < 2; z++) {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 5; x++) {
        positions.push(x * 10 - 20, y * 8 - 12, z * 30 - 15);
        colors.push(x * 10, y * 20, z * 100);
        gpsTimes.push(1_000 + gpsTimes.length);
      }
    }
  }
  const attributes = {
    POSITION: {value: new Float64Array(positions), size: 3},
    COLOR_0: {value: new Uint16Array(colors), size: 3},
    gpsTime: {value: new Float64Array(gpsTimes), size: 1}
  };
  return {
    attributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(attributes, {topology: 'point-list', mode: '0'})
  };
}

/** Create one small single-node COPC fixture for a modern point format. */
function createWorkerCOPCBlob(pointDataRecordFormat: 6 | 7 | 8): Blob {
  const baseMesh = createCOPCWriterMesh();
  const attributes =
    pointDataRecordFormat === 6
      ? {
          POSITION: baseMesh.attributes.POSITION,
          gpsTime: baseMesh.attributes.gpsTime
        }
      : pointDataRecordFormat === 8
        ? {
            ...baseMesh.attributes,
            nir: {
              value: Uint16Array.from(
                {length: baseMesh.attributes.POSITION.value.length / 3},
                (_, index) => index * 101
              ),
              size: 1
            }
          }
        : baseMesh.attributes;
  const mesh = {
    ...baseMesh,
    attributes,
    schema: deduceMeshSchema(attributes, {topology: 'point-list', mode: '0'})
  };
  return new Blob([
    encodeSync(mesh, COPCWriter, {
      copc: {
        nodePointLimit: 64,
        pointDataRecordFormat,
        scale: [0.01, 0.01, 0.01]
      }
    })
  ]);
}

/** Recursively load every hierarchy page through its declared byte range. */
async function loadCompleteHierarchy(
  getter: (begin: number, end: number) => Promise<Uint8Array>,
  rootPage: {pageOffset: number; pageLength: number}
): Promise<{
  nodes: Record<string, {pointCount: number; pointDataOffset: number; pointDataLength: number}>;
  pageCount: number;
}> {
  const nodes: Record<
    string,
    {pointCount: number; pointDataOffset: number; pointDataLength: number}
  > = {};
  const pending = [rootPage];
  let pageCount = 0;
  while (pending.length > 0) {
    const page = pending.shift()!;
    const hierarchy = await loadCOPCHierarchyPage(getter, page);
    Object.assign(nodes, hierarchy.nodes);
    pending.push(...Object.values(hierarchy.pages));
    pageCount++;
  }
  return {nodes, pageCount};
}

/** Read dequantized positions from raw LAS records. */
function readPointPositions(rawPointData: Uint8Array, header: any): string[] {
  const dataView = new DataView(
    rawPointData.buffer,
    rawPointData.byteOffset,
    rawPointData.byteLength
  );
  const positions: string[] = [];
  for (
    let pointIndex = 0;
    pointIndex < rawPointData.byteLength / header.pointDataRecordLength;
    pointIndex++
  ) {
    const byteOffset = pointIndex * header.pointDataRecordLength;
    positions.push(
      [
        dataView.getInt32(byteOffset, true) * header.scale[0] + header.offset[0],
        dataView.getInt32(byteOffset + 4, true) * header.scale[1] + header.offset[1],
        dataView.getInt32(byteOffset + 8, true) * header.scale[2] + header.offset[2]
      ].join(',')
    );
  }
  return positions;
}

/** Return source mesh positions as stable string keys. */
function readMeshPositions(mesh: ReturnType<typeof createCOPCWriterMesh>): string[] {
  return readFlatPositions(mesh.attributes.POSITION.value);
}

/** Return flat XYZ values as stable string keys. */
function readFlatPositions(positions: ArrayLike<number>): string[] {
  const result: string[] = [];
  for (let index = 0; index < positions.length; index += 3) {
    result.push([positions[index], positions[index + 1], positions[index + 2]].join(','));
  }
  return result;
}

/** Flatten one fixed-size-list Arrow column from COPC tile content. */
function readCOPCContentColumn(
  content: Awaited<ReturnType<COPCTileSource['loadTileContent']>>,
  columnName: 'POSITION' | 'COLOR_0'
): number[] {
  const column = content?.data.data.getChild(columnName);
  const values: number[] = [];
  for (let index = 0; index < (column?.length || 0); index++) {
    values.push(...(column?.get(index)?.toArray() || []));
  }
  return values;
}

/** Read a little-endian UInt64 that fits in JavaScript's safe integer range. */
function readUint64(dataView: DataView, byteOffset: number): number {
  return dataView.getUint32(byteOffset, true) + dataView.getUint32(byteOffset + 4, true) * 2 ** 32;
}
