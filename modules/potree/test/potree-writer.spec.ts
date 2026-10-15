// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import {encodePotreeDataset, PotreeWriter} from '@loaders.gl/potree';
import {PotreeNodesSource} from '../src/lib/potree-node-source';
import {parsePotreeBin} from '../src/parsers/parse-potree-bin';
import {
  parsePotree2Metadata,
  parsePotree2Hierarchy,
  parsePotree2Points
} from '../src/parsers/parse-potree2';
import {createPoints, createDatasetFetch} from './potree-format-fixtures';
import type {PotreeMetadata} from '../src/types/potree-metadata';
import type {Potree2Metadata} from '../src/potree2-types';

test.each(
  Array.from({length: 9}, (_, minor) => `1.${minor}`)
)('writes and reads Potree %s with the declared binary layout', async version => {
  const input = createPoints([-4, -3, -2, 4, 5, 6]);
  const dataset = await encodePotreeDataset(input, {potree: {version}});
  const metadata = dataset.metadata as PotreeMetadata;
  const minor = Number(version.split('.')[1]);
  const path = minor >= 5 ? 'data/r/r.bin' : `data/r${minor >= 4 ? '.bin' : ''}`;
  const bytes = dataset.files.get(path)!;
  expect(dataset.metadataPath).toBe('cloud.js');
  expect(bytes.length).toBe(2 * (minor <= 3 ? 16 : 15));
  expect(
    minor <= 3
      ? new DataView(bytes.buffer).getFloat32(0, true)
      : new DataView(bytes.buffer).getUint32(0, true)
  ).toBe(minor <= 3 ? -4 : 0);
  const decoded = parsePotreeBin(bytes.buffer, 0, {
    potree: {
      version,
      scale: metadata.scale,
      positionOrigin: [-4, -3, -2],
      pointAttributes: metadata.pointAttributes as never
    }
  });
  expect(Array.from(decoded.attributes.POSITION_CARTESIAN.value)).toEqual([-4, -3, -2, 4, 5, 6]);
  expect(Array.from(decoded.attributes.COLOR_0.value)).toEqual(Array(6).fill(17));
  const transport = createDatasetFetch(dataset);
  const source = new PotreeNodesSource('https://example.com/dataset/cloud.js?token=1', {
    core: {fetch: transport.fetch}
  });
  await source.initialize();
  expect(source.isSupported()).toBe(true);
  expect((await source.loadNodeContent(''))?.header?.vertexCount).toBe(2);
  expect(transport.requests.every(request => new URL(request.url).search === '?token=1')).toBe(
    true
  );
});

test('early Potree defaults to RGBA and accepts metadata without later optional fields', async () => {
  const input = createPoints([1, 2, 3]);
  delete input.attributes.COLOR_0;
  const dataset = await encodePotreeDataset(input, {potree: {version: '1.0'}});
  expect(Array.from(dataset.files.get('data/r')!.slice(12))).toEqual([255, 255, 255, 255]);
  const metadata = {...dataset.metadata};
  delete metadata.tightBoundingBox;
  delete metadata.scale;
  delete metadata.hierarchyStepSize;
  const files = new Map(dataset.files);
  files.set('cloud.js', new TextEncoder().encode(JSON.stringify(metadata)));
  const transport = createDatasetFetch({...dataset, files});
  const source = new PotreeNodesSource('https://example.com/dataset/cloud.js', {
    core: {fetch: transport.fetch}
  });
  await source.initialize();
  expect(source.metadata?.scale).toBe(1);
  expect(source.metadata?.hierarchyStepSize).toBe(5);
});

test('legacy hierarchy pages hydrate a boundary once and keep global node names and directories', async () => {
  const dataset = await encodePotreeDataset(
    [
      {id: 'r', mesh: createPoints([8, 8, 8])},
      {id: 'r0', mesh: createPoints([2, 2, 2])},
      {id: 'r00', mesh: createPoints([0, 0, 0])}
    ],
    {potree: {version: '1.8', hierarchyStepSize: 1}}
  );
  expect(dataset.files.has('data/r/0/r0.hrc')).toBe(true);
  expect(dataset.files.has('data/r/0/0/r00.bin')).toBe(true);
  const transport = createDatasetFetch(dataset);
  const source = new PotreeNodesSource('https://example.com/dataset/cloud.js?key=1', {
    core: {fetch: transport.fetch}
  });
  const root = await source.getRootTile();
  const [child] = await source.getChildren(root);
  const [first, second] = await Promise.all([source.getChildren(child), source.getChildren(child)]);
  expect(first.map(tile => tile.id)).toEqual(['r00']);
  expect(second).toEqual(first);
  expect((await source.loadNodeContent('00'))?.header?.vertexCount).toBe(1);
  expect(transport.requests.filter(request => request.url.includes('/0/r0.hrc')).length).toBe(1);
});

test('modern writer preserves every scalar width, normalized colors and exact 64-bit IDs', async () => {
  const input = createPoints([0, 0, 0]);
  const scalars = {
    signed8: new Int8Array([-7]),
    unsigned8: new Uint8Array([255]),
    signed16: new Int16Array([-32000]),
    unsigned16: new Uint16Array([65535]),
    signed32: new Int32Array([-2147483648]),
    unsigned32: new Uint32Array([4294967295]),
    signed64: new BigInt64Array([-9007199254740993n]),
    unsigned64: new BigUint64Array([18446744073709551615n]),
    floating32: new Float32Array([1.25]),
    floating64: new Float64Array([Math.PI])
  };
  for (const [name, value] of Object.entries(scalars))
    input.attributes[name] = {value, size: 1} as never;
  const dataset = await encodePotreeDataset(input, {potree: {projection: 'EPSG:4978'}});
  const metadata = parsePotree2Metadata(
    new TextDecoder().decode(dataset.files.get('metadata.json'))
  );
  const hierarchy = parsePotree2Hierarchy(dataset.files.get('hierarchy.bin')!.buffer);
  expect(hierarchy[0]).toMatchObject({id: 'r', type: 1, pointCount: 1, byteOffset: 0n});
  const mesh = await parsePotree2Points(dataset.files.get('octree.bin')!.buffer, metadata, 1);
  for (const [name, value] of Object.entries(scalars)) {
    expect(mesh.attributes[name].value.constructor).toBe(value.constructor);
    expect(Array.from(mesh.attributes[name].value as never)).toEqual(Array.from(value as never));
  }
  expect(mesh.attributes.COLOR_0.normalized).toBe(true);
  expect(Array.from(mesh.attributes.COLOR_0.value)).toEqual([4369, 4369, 4369]);
  expect(mesh.loaderData.projection).toBe('EPSG:4978');
  expect(JSON.parse(new TextDecoder().decode(PotreeWriter.encodeSync(metadata)))).toEqual(metadata);
  expect(await PotreeWriter.encode(metadata)).toEqual(PotreeWriter.encodeSync(metadata));
});

test('writer accepts Arrow, strided positions, empty roots and RGBA without mutating input', async () => {
  const input = createPoints([1, 2, 3]);
  input.attributes.COLOR_0 = {value: new Uint8Array([1, 2, 3, 4]), size: 4, normalized: true};
  input.attributes.POSITION = {
    value: new Float64Array([99, 1, 2, 3, 88]),
    size: 3,
    byteOffset: 8,
    byteStride: 40
  };
  input.header = {vertexCount: 1};
  const dataset = await encodePotreeDataset(input);
  const mesh = await parsePotree2Points(
    dataset.files.get('octree.bin')!.buffer,
    dataset.metadata as Potree2Metadata,
    1
  );
  expect(Array.from(mesh.attributes.POSITION.value)).toEqual([1, 2, 3]);
  expect(Array.from(mesh.attributes.COLOR_0.value)).toEqual([257, 514, 771, 1028]);
  expect(Array.from(input.attributes.POSITION.value)).toEqual([99, 1, 2, 3, 88]);
  await expect(
    encodePotreeDataset(convertMeshToTable(createPoints(), 'arrow-table'))
  ).resolves.toHaveProperty('metadataPath', 'metadata.json');
  const empty = await encodePotreeDataset(createPoints([]));
  expect(empty.files.get('octree.bin')!.length).toBe(0);
  expect((empty.metadata as Potree2Metadata).attributes[0].min).toEqual([0, 0, 0]);
  const root = createPoints([]),
    child = createPoints([4, 4, 4]);
  const tree = await encodePotreeDataset([
    {id: 'r', mesh: root},
    {id: 'r7', mesh: child}
  ]);
  expect((tree.metadata as Potree2Metadata).attributes[0].min).toEqual([4, 4, 4]);
});

test.each([
  {version: '3.0'},
  {version: '1.9'},
  {scale: [0, 1, 1]},
  {version: '1.8', scale: [1, 2, 3]},
  {maxPositionError: -1},
  {hierarchyStepSize: 0},
  {hierarchyStepSize: 25},
  {maxOutputBytes: 0},
  {maxOutputBytes: 10},
  {maxNodes: 0},
  {spacing: 0}
])('rejects unsupported writer options %j', async potree => {
  await expect(encodePotreeDataset(createPoints(), {potree: potree as never})).rejects.toThrow();
});

test('writer rejects unsupported layouts, disconnected trees, bounds, precision and cancellation', async () => {
  const cases = [
    {...createPoints(), topology: 'triangle-list'},
    {...createPoints(), indices: {value: new Uint16Array([0]), size: 1}},
    {...createPoints(), header: {vertexCount: 9}},
    {...createPoints(), attributes: {POSITION: {value: new Int32Array([0, 0, 0]), size: 3}}},
    {
      ...createPoints(),
      attributes: {POSITION: {value: new Float64Array([0, 0, 0]), size: 3, byteStride: 32}}
    },
    {...createPoints(), attributes: {POSITION: {value: new Float64Array([NaN, 0, 0]), size: 3}}}
  ];
  for (const input of cases) await expect(encodePotreeDataset(input as never)).rejects.toThrow();
  for (const nodes of [
    [],
    [{id: 'r1', mesh: createPoints()}],
    [
      {id: 'r', mesh: createPoints()},
      {id: 'r', mesh: createPoints()}
    ],
    [
      {id: 'r', mesh: createPoints()},
      {id: 'r8', mesh: createPoints()}
    ]
  ])
    await expect(encodePotreeDataset(nodes)).rejects.toThrow();
  await expect(
    encodePotreeDataset([
      {id: 'r', mesh: createPoints()},
      {id: 'r0', mesh: createPoints([8, 8, 8])}
    ])
  ).rejects.toThrow('octant');
  await expect(encodePotreeDataset(createPoints([0, 0, 0, 1e12, 0, 0]))).rejects.toThrow(
    'quantization'
  );
  await expect(
    encodePotreeDataset(createPoints([0, 0, 0, 0.4, 0, 0]), {
      potree: {scale: [1, 1, 1], maxPositionError: 0}
    })
  ).rejects.toThrow('precision');
  await expect(encodePotreeDataset(createPoints([-1e308, 0, 0, 1e308, 0, 0]))).rejects.toThrow(
    'overflow'
  );
  const controller = new AbortController();
  controller.abort(new Error('stop writing'));
  await expect(
    encodePotreeDataset(createPoints(), {potree: {signal: controller.signal}})
  ).rejects.toThrow('stop writing');
  const custom = createPoints();
  custom.attributes.feature = {value: new Uint8Array([1, 2]), size: 1};
  await expect(encodePotreeDataset(custom, {potree: {version: '1.8'}})).rejects.toThrow(
    'map it explicitly'
  );
  await expect(encodePotreeDataset(custom, {potree: {version: '1.0'}})).rejects.toThrow(
    'RGBA only'
  );
});
