// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {PotreeNodesSource} from '../src/lib/potree-node-source';

class TestPotreeSource extends PotreeNodesSource {
  override async initialize(): Promise<void> {}
}

function createSource(
  url = 'https://example.com/point-cloud'
): TestPotreeSource & Record<string, any> {
  return new TestPotreeSource(url, {}) as TestPotreeSource & Record<string, any>;
}

const BOUNDS = {lx: 0, ly: 0, lz: 0, ux: 8, uy: 8, uz: 8};

test('Potree source normalizes metadata URLs and reports content extensions', async () => {
  const direct = createSource('https://example.com/cloud/cloud.js?token=1#section');
  expect(direct.baseUrl).toBe('https://example.com/cloud');
  expect(direct.metadataUrl).toContain('cloud.js?token=1#section');
  expect(await direct.getMetadata()).toEqual({formatSpecificMetadata: null, viewState: {}});

  expect(direct.getContentExtension()).toBeNull();
  direct.isReady = true;
  direct.metadata = {version: '1.7', pointAttributes: 'LAS'};
  expect(direct.isSupported()).toBe(true);
  expect(direct.getContentExtension()).toBe('las');
  direct.metadata.pointAttributes = 'LAZ';
  expect(direct.getContentExtension()).toBe('laz');
  direct.metadata.pointAttributes = ['POSITION_CARTESIAN'];
  expect(direct.getContentExtension()).toBe('bin');
  direct.metadata.version = '2.0';
  expect(direct.isSupported()).toBe(false);
});

test('Potree source handles hierarchy availability and missing normalized tiles', async () => {
  const source = createSource();
  source.metadata = {
    version: '1.7',
    pointAttributes: ['POSITION_CARTESIAN'],
    hierarchy: [['r0', 1]],
    spacing: 8
  };
  source.isReady = true;
  expect(await source.isNodeAvailable('0')).toBe(true);
  expect(await source.isNodeAvailable('1')).toBe(false);

  source.metadata.hierarchy = undefined;
  expect(await source.isNodeAvailable('0')).toBe(false);
  await expect(source.getRootTile()).rejects.toThrow('root hierarchy is not initialized');
  expect(await source.getChildren({id: 'missing'})).toEqual([]);
  expect(source.getViewState()).toEqual({});
  expect(() => source.getNodeBounds('r0')).toThrow('bounding box is not initialized');
  expect(() => source.getNativeNodeBounds('r0')).toThrow('native bounding box is not initialized');
});

test('Potree source derives octree headers and child availability without loading files', async () => {
  const source = createSource();
  const child = {name: '0', level: 1, pointCount: 2, children: []};
  source.root = {name: '', level: 0, pointCount: 5, children: [child]};
  source.metadata = {version: '1.7', pointAttributes: ['POSITION_CARTESIAN'], spacing: 8};
  source.isReady = true;
  source.boundingBox = BOUNDS;
  source.hierarchyBoundingBox = BOUNDS;
  source.nativeHierarchyBoundingBox = BOUNDS;
  source.indexNodes();

  expect(await source.isNodeAvailable('0')).toBe(true);
  expect(await source.isNodeAvailable('07')).toBe(false);
  expect((await source.getRootTile()).geometricError).toBe(8);
  expect((await source.getChildren({id: 'r'}))[0]).toMatchObject({id: 'r0', pointCount: 2});
  expect(source.getViewState()).toMatchObject({cartographicCenter: [4, 4, 4]});
  expect(source.getNodeContentUrl('0', 'bin')).toContain('/r/r0.bin');
});

test('Potree source normalizes tile content and rejects incomplete meshes', async () => {
  const source = createSource();
  source.loadNodeContent = vi.fn().mockResolvedValueOnce(null);
  await expect(source.loadTileContent({id: 'r'})).resolves.toBeNull();

  source.loadNodeContent.mockResolvedValueOnce({attributes: {}});
  await expect(source.loadTileContent({id: 'r'})).resolves.toBeNull();

  source.loadNodeContent.mockResolvedValueOnce({
    header: {vertexCount: 1},
    attributes: {
      positions: {value: new Float32Array([1, 2, 3]), size: 3},
      colors: {value: new Uint8Array([10, 20, 30]), size: 3},
      normals: {value: new Float32Array([0, 0, 1]), size: 3}
    },
    cartographicOrigin: [0, 0, 0],
    coordinateSystem: 'cartesian'
  });
  const content = await source.loadTileContent({id: 'r'});
  expect(content).toMatchObject({pointCount: 1, coordinateSystem: 'cartesian'});
  expect(content?.data.shape).toBe('arrow-table');
});

test('Potree source covers loader fallbacks, failures, and color usability', async () => {
  const source = createSource();
  source.fetch = vi.fn(async () => new Response('missing', {status: 404}));
  await expect(source.loadWithCoreApi('missing.bin', {id: 'test', parse: vi.fn()})).rejects.toThrow(
    'Failed to load Potree resource: 404'
  );

  source.fetch = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])));
  await expect(source.loadWithCoreApi('data.bin', {id: 'test'})).rejects.toThrow(
    'does not support parse()'
  );
  const parse = vi.fn(async () => ({ok: true}));
  await expect(source.loadWithCoreApi('data.bin', {id: 'test', parse})).resolves.toEqual({
    ok: true
  });

  expect(source.hasUsableColors()).toBe(false);
  expect(source.hasUsableColors({value: new Uint8Array(), size: 3})).toBe(false);
  expect(source.hasUsableColors({value: new Float32Array([0, 0.5, 0]), size: 3})).toBe(true);
  expect(source.hasUsableColors({value: new Uint8Array([0, 0, 20]), size: 3})).toBe(true);

  expect(
    source.getNodeContentLoaderOptions([
      [0, 0, 0],
      [1, 1, 1]
    ])
  ).toBeUndefined();
  source.metadata = {version: '1.7', pointAttributes: 'LAS'};
  expect(
    source.getNodeContentLoaderOptions([
      [0, 0, 0],
      [1, 1, 1]
    ])
  ).toEqual({las: {colorDepth: 'auto'}});

  const sourceWithLoadOptions = createSource();
  sourceWithLoadOptions.metadata = {version: '1.7', pointAttributes: 'LAZ'};
  sourceWithLoadOptions.loadOptions = {core: {worker: false}};
  expect(
    sourceWithLoadOptions.getNodeContentLoaderOptions([
      [0, 0, 0],
      [1, 1, 1]
    ])
  ).toMatchObject({
    core: {worker: false},
    las: {colorDepth: 'auto'}
  });
});

test('Potree query metadata maps every supported attribute and metadata-only sources', async () => {
  const source = createSource();
  source.isReady = true;
  source.boundingBox = BOUNDS;
  source.nativeHierarchyBoundingBox = BOUNDS;
  source.metadata = {
    version: '1.7',
    points: 42,
    projection: 'EPSG:3857',
    pointAttributes: [
      'POSITION_CARTESIAN',
      'RGBA_PACKED',
      'COLOR_PACKED',
      'RGB_PACKED',
      'NORMAL_FLOATS',
      'INTENSITY',
      'CLASSIFICATION',
      'NORMAL_SPHEREMAPPED',
      'NORMAL_OCT16',
      'NORMAL',
      'IGNORED'
    ]
  };

  const metadata = await source.getQueryMetadata();
  expect(metadata.execution.status).toBe('supported');
  expect(metadata.schema.fields).toHaveLength(10);
  expect(metadata.statistics).toEqual({rowCount: 42});
  expect(
    Object.fromEntries(metadata.columns.map(column => [column.name, column.role]))
  ).toMatchObject({
    POSITION_CARTESIAN: 'x',
    RGB_PACKED: 'color',
    INTENSITY: 'intensity',
    CLASSIFICATION: 'classification',
    NORMAL: 'attribute'
  });

  source.metadata.version = '2.0';
  expect((await source.getQueryMetadata()).execution.status).toBe('metadata-only');
  source.metadata = {version: '1.7', pointAttributes: 'LAS'};
  expect((await source.getQueryMetadata()).schema.fields.map(field => field.name)).toEqual([
    'X',
    'Y',
    'Z'
  ]);
});

test('Potree scan filters source bounds and streams scalar and vector columns in batches', async () => {
  const source = createSource();
  source.isReady = true;
  source.boundingBox = BOUNDS;
  source.nativeHierarchyBoundingBox = BOUNDS;
  source.hierarchyBoundingBox = BOUNDS;
  source.metadata = {
    version: '1.7',
    spacing: 8,
    pointAttributes: ['POSITION_CARTESIAN', 'INTENSITY', 'RGB_PACKED']
  };
  source.getRootTile = vi.fn(async () => ({
    id: 'r',
    level: 0,
    pointCount: 3,
    geometricError: 8,
    boundingVolume: {}
  }));
  source.getChildren = vi.fn(async () => []);
  source.loadNodeContent = vi.fn(async () => ({
    header: {
      vertexCount: 3,
      boundingBox: [
        [0, 0, 0],
        [8, 8, 8]
      ]
    },
    attributes: {
      POSITION: {value: new Float32Array([1, 1, 1, 4, 4, 4, 7, 7, 7]), size: 3},
      INTENSITY: {value: new Uint16Array([10, 20, 30]), size: 1},
      RGB_PACKED: {value: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), size: 3}
    },
    cartographicOrigin: [0, 0, 0],
    coordinateSystem: 'cartesian'
  }));

  const batches: any[] = [];
  for await (const batch of source.scan({
    columns: ['POSITION_CARTESIAN', 'INTENSITY', 'RGB_PACKED'],
    bounds: {minimum: [0, 0, 0], maximum: [5, 5, 5]},
    batchSize: 1,
    limit: 2
  })) {
    batches.push(batch);
  }
  expect(batches).toHaveLength(2);
  expect(batches.flatMap(batch => Array.from(batch.data.getChild('INTENSITY')))).toEqual([10, 20]);

  await expect(async () => {
    for await (const _batch of source.scan({batchSize: 0})) {
      // Consume the iterator to trigger validation.
    }
  }).rejects.toThrow(/positive safe integer/);
  const controller = new AbortController();
  controller.abort();
  await expect(async () => {
    for await (const _batch of source.scan({signal: controller.signal})) {
      // Consume the iterator to trigger cancellation.
    }
  }).rejects.toThrow(/aborted/);
  const zeroLimit: any[] = [];
  for await (const batch of source.scan({limit: 0})) zeroLimit.push(batch);
  expect(zeroLimit).toEqual([]);
});

test('Potree bounds, URL layouts, loader options, and mesh normalization cover all branches', () => {
  const source = createSource('fixtures/potree/');
  source.isReady = true;
  source.metadata = {
    version: '1.7',
    octreeDir: 'data',
    pointAttributes: ['POSITION_CARTESIAN'],
    scale: 0.01
  };
  source.nativeHierarchyBoundingBox = BOUNDS;
  source.hierarchyBoundingBox = BOUNDS;

  for (let octant = 0; octant < 8; octant++) {
    const bounds = source.getChildNodeBounds(`r${octant}`, BOUNDS);
    expect(bounds.ux - bounds.lx).toBe(4);
    expect(bounds.uy - bounds.ly).toBe(4);
    expect(bounds.uz - bounds.lz).toBe(4);
  }
  expect(source.getTileBoundingBox('r7')).toEqual([
    [4, 4, 4],
    [8, 8, 8]
  ]);
  expect(source.getNodeContentUrl('0', 'bin')).toContain('/data/r/r0.bin');
  source.metadata.hierarchy = [['r', 1]];
  expect(source.getNodeContentUrl('0', 'bin')).toContain('/data/r0.bin');
  expect(
    source.getNodeContentLoaderOptions([
      [4, 4, 4],
      [8, 8, 8]
    ])
  ).toMatchObject({
    potree: {positionOrigin: [4, 4, 4], scale: 0.01}
  });

  const mesh = source.normalizeNodeMesh({
    header: {
      vertexCount: 1,
      boundingBox: [
        [10, 20, 30],
        [12, 22, 32]
      ]
    },
    attributes: {
      POSITION: {value: new Float32Array([11, 21, 31]), size: 3},
      COLOR_0: {value: new Uint8Array([9, 0, 0]), size: 3},
      NORMAL: {value: new Float32Array([0, 0, 1]), size: 3}
    }
  } as any);
  expect(mesh.coordinateSystem).toBe('cartesian');
  expect(mesh.attributes.positions).toBe(mesh.attributes.POSITION);
  expect(mesh.attributes.colors).toBe(mesh.attributes.COLOR_0);

  const table = source.getPointCloudTileTable(mesh);
  expect(table.data.numRows).toBe(1);
  expect(table.data.getChild('COLOR_0')).toBeTruthy();
  expect(table.data.getChild('NORMAL')).toBeTruthy();
});
