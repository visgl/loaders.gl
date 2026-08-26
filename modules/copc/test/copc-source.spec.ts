// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {validateWriter} from 'test/common/conformance';
import {createDataSource, encodeSync, fetchFile, isBrowser, parse} from '@loaders.gl/core';
import {COPCSourceLoader, COPCTileSource, COPCWriter} from '@loaders.gl/copc';
import {LASLoader} from '@loaders.gl/las';
import {decodeLAZChunk, decodeLAZChunkTable} from '@loaders.gl/loader-utils';
import {deduceMeshSchema} from '@loaders.gl/schema-utils';
import {Copc} from 'copc';

const ELLIPSOID_FILE_PATH = 'modules/copc/test/data/ellipsoid.copc.laz';
const ELLIPSOID_BROWSER_URL = new URL('./data/ellipsoid.copc.laz', import.meta.url).href;

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
  if (isBrowser) {
    t.comment('Skipping browser content decode until laz-perf wasm is served as an asset');
    t.end();
    return;
  }

  const source = COPCSourceLoader.createDataSource(ELLIPSOID_FILE_PATH, {});
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
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {
    copc: {decoder: 'typescript-laz'}
  });
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

test('COPCSourceLoader#streams TypeScript tile content as Arrow batches', async t => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {
    copc: {decoder: 'typescript-laz'}
  });
  await source.initialize();

  const rootTile = await source.getRootTile();
  const atomicContent = await source.loadTileContent(rootTile);
  const streamedPositions: number[] = [];
  const streamedColors: number[] = [];
  let streamedPointCount = 0;

  for await (const batch of source.loadTileContentInBatches(rootTile, {batchSize: 127})) {
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

  t.equal(streamedPointCount, rootTile.pointCount, 'all points are yielded');
  t.deepEqual(streamedPositions, expectedPositions, 'batched positions match atomic output');
  t.deepEqual(streamedColors, expectedColors, 'batched colors match atomic output');
  t.end();
});

test('COPCSourceLoader#streams position-only TypeScript tile batches', async t => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {
    copc: {decoder: 'typescript-laz'}
  });
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

test('COPCSourceLoader#streams hierarchy pages', async t => {
  const source = COPCSourceLoader.createDataSource(await createEllipsoidSourceData(), {});
  const batches = [];
  for await (const batch of source.loadHierarchyInBatches({maxPages: 1})) {
    batches.push(batch);
  }

  t.equal(batches.length, 1, 'maxPages limits hierarchy loading');
  t.equal(batches[0]?.pageId, 'root', 'first hierarchy batch is the root page');
  t.ok(batches[0]?.nodes['0-0-0-0'], 'root page exposes the root node');
  t.end();
});

test('COPCSourceLoader#TypeScript tile attributes match laz-perf', async t => {
  if (isBrowser) {
    t.comment('Skipping browser parity until laz-perf wasm is served as an asset');
    t.end();
    return;
  }

  const lazPerfSource = COPCSourceLoader.createDataSource(ELLIPSOID_FILE_PATH, {});
  const typescriptSource = COPCSourceLoader.createDataSource(ELLIPSOID_FILE_PATH, {
    copc: {decoder: 'typescript-laz'}
  });
  await Promise.all([lazPerfSource.initialize(), typescriptSource.initialize()]);

  const rootTile = await typescriptSource.getRootTile();
  const [lazPerfContent, typescriptContent] = await Promise.all([
    lazPerfSource.loadTileContent(rootTile),
    typescriptSource.loadTileContent(rootTile)
  ]);
  const lazPerfPositions = lazPerfContent?.data.data.getChild('POSITION');
  const typescriptPositions = typescriptContent?.data.data.getChild('POSITION');
  const lazPerfColors = lazPerfContent?.data.data.getChild('COLOR_0');
  const typescriptColors = typescriptContent?.data.data.getChild('COLOR_0');

  t.equal(typescriptContent?.pointCount, lazPerfContent?.pointCount, 'point counts match');
  t.deepEqual(
    Array.from({length: rootTile.pointCount}, (_, index) =>
      typescriptPositions?.get(index)?.toArray()
    ),
    Array.from({length: rootTile.pointCount}, (_, index) =>
      lazPerfPositions?.get(index)?.toArray()
    ),
    'tile-relative positions match laz-perf'
  );
  t.deepEqual(
    Array.from({length: rootTile.pointCount}, (_, index) =>
      typescriptColors?.get(index)?.toArray()
    ),
    Array.from({length: rootTile.pointCount}, (_, index) => lazPerfColors?.get(index)?.toArray()),
    'raw colors match laz-perf'
  );
  t.end();
});

test('COPCSourceLoader#loads tile content from a Blob', async t => {
  if (isBrowser) {
    t.comment('Skipping browser content decode until laz-perf wasm is served as an asset');
    t.end();
    return;
  }

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
  const copc = await Copc.create(getter);
  const hierarchy = await Copc.loadHierarchyPage(getter, copc.info.rootHierarchyPage);
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
    const compressed = await Copc.loadCompressedPointDataBuffer(getter, node);
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

  const source = COPCSourceLoader.createDataSource(blob, {copc: {decoder: 'typescript-laz'}});
  await source.initialize();
  const rootTile = await source.getRootTile();
  const childTiles = await source.getChildren(rootTile);
  const content = await source.loadTileContent(childTiles[0] || rootTile);
  t.ok(childTiles.length > 0, 'range source exposes generated child tiles');
  t.ok(content?.pointCount, 'range source decodes generated tile content');
  t.end();
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
  const copc = await Copc.create(getter);
  const hierarchy = await Copc.loadHierarchyPage(getter, copc.info.rootHierarchyPage);

  t.equal(copc.header.pointDataRecordFormat, 6, 'selects PDRF 6');
  t.equal(copc.wkt, 'LOCAL_CS["loaders.gl test"]', 'writes an optional WKT VLR');
  t.ok(hierarchy.nodes['0-0-0-0'], 'PDRF 6 hierarchy is readable');
  t.end();
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
  for (let z = 0; z < 2; z++) {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 5; x++) {
        positions.push(x * 10 - 20, y * 8 - 12, z * 30 - 15);
        colors.push(x * 10, y * 20, z * 100);
      }
    }
  }
  const attributes = {
    POSITION: {value: new Float64Array(positions), size: 3},
    COLOR_0: {value: new Uint16Array(colors), size: 3}
  };
  return {
    attributes,
    topology: 'point-list' as const,
    mode: 0,
    schema: deduceMeshSchema(attributes, {topology: 'point-list', mode: '0'})
  };
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

/** Read a little-endian UInt64 that fits in JavaScript's safe integer range. */
function readUint64(dataView: DataView, byteOffset: number): number {
  return dataView.getUint32(byteOffset, true) + dataView.getUint32(byteOffset + 4, true) * 2 ** 32;
}
