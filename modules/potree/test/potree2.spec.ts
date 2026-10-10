// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Potree2Loader, Potree2SourceLoader, encodePotreeDataset} from '@loaders.gl/potree';
import {Potree2Source} from '@loaders.gl/potree/potree2-source';
import {Potree2SourceLoaderWithParser} from '@loaders.gl/potree/potree2-source-loader';
import {Potree2LoaderWithParser} from '@loaders.gl/potree/potree2-loader';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import {
  parsePotree2Metadata,
  parsePotree2Hierarchy,
  parsePotree2Points
} from '../src/parsers/parse-potree2';
import {parsePotreeHierarchyChunk} from '../src/parsers/parse-potree-hierarchy-chunk';
import {parseVersion} from '../src/utils/parse-version';
import {createPoints, createDatasetFetch} from './potree-format-fixtures';
import type {Potree2Metadata} from '../src/potree2-types';

/** Independently specified wire declaration for tiny golden byte fixtures. */
function createMetadata(): Potree2Metadata {
  return {
    version: '2.0',
    points: 2,
    spacing: 1,
    scale: [0.5, 1, 2],
    offset: [10, 20, 30],
    boundingBox: {min: [0, 0, 0], max: [100, 100, 100]},
    hierarchy: {firstChunkSize: 22, stepSize: 5, depth: 1},
    encoding: 'DEFAULT',
    attributes: [
      {name: 'position', type: 'int32', numElements: 3, elementSize: 4, size: 12},
      {name: 'rgb', type: 'uint16', numElements: 3, elementSize: 2, size: 6},
      {name: 'intensity', type: 'uint16', numElements: 1, elementSize: 2, size: 2}
    ]
  };
}

/** Constructs a hierarchy fixture independently of the dataset writer. */
function createHierarchy(
  records: {type: number; mask?: number; count?: number; offset?: bigint; size?: bigint}[]
): Uint8Array {
  const bytes = new Uint8Array(records.length * 22),
    view = new DataView(bytes.buffer);
  records.forEach((record, index) => {
    const offset = index * 22;
    view.setUint8(offset, record.type);
    view.setUint8(offset + 1, record.mask || 0);
    view.setUint32(offset + 2, record.count || 0, true);
    view.setBigUint64(offset + 6, record.offset || 0n, true);
    view.setBigUint64(offset + 14, record.size || 0n, true);
  });
  return bytes;
}

test('metadata root exports preload implementation through the public subpaths', async () => {
  expect(Potree2Loader).not.toHaveProperty('parse');
  expect(Potree2SourceLoader.createDataSource).toThrow('preload');
  expect(await Potree2Loader.preload()).toBe(Potree2LoaderWithParser);
  expect(await Potree2SourceLoader.preload()).toBe(Potree2SourceLoaderWithParser);
  expect(Potree2SourceLoader.testURL('https://example.com/metadata.json?token=1')).toBe(true);
  expect(Potree2SourceLoader.testURL('https://example.com/cloud.js')).toBe(false);
  expect(Potree2Loader.testText(JSON.stringify(createMetadata()))).toBe(true);
  expect(() => Potree2SourceLoaderWithParser.createDataSource(new Blob())).toThrow('dataset URL');
  const text = JSON.stringify(createMetadata());
  expect(Potree2LoaderWithParser.parseTextSync(text)).toEqual(createMetadata());
  expect(await Potree2LoaderWithParser.parse(new TextEncoder().encode(text).buffer)).toEqual(
    createMetadata()
  );
});

test('independent default and Brotli/Morton fixtures decode axis scales, RGB and scalar widths', async () => {
  const metadata = createMetadata(),
    bytes = new Uint8Array(20),
    view = new DataView(bytes.buffer);
  view.setInt32(0, -1, true);
  view.setInt32(4, 2, true);
  view.setInt32(8, 3, true);
  [257, 514, 771, 42].forEach((value, index) => view.setUint16(12 + index * 2, value, true));
  const plain = await parsePotree2Points(bytes.buffer, metadata, 1);
  expect(Array.from(plain.attributes.POSITION.value)).toEqual([9.5, 22, 36]);
  expect(Array.from(plain.attributes.intensity.value)).toEqual([42]);
  expect(Array.from(plain.attributes.COLOR_0.value)).toEqual([257, 514, 771]);
  // Node zlib Brotli compression of a 26-byte golden attribute-major Morton record: XYZ 1/2/3, RGB 257/514/771, intensity 42.
  const brotli = new Uint8Array([
    27, 25, 0, 248, 39, 1, 84, 106, 74, 146, 134, 34, 128, 3, 12, 88, 0
  ]);
  const decoded = await parsePotree2Points(brotli.buffer, {...metadata, encoding: 'BROTLI'}, 1);
  expect(Array.from(decoded.attributes.POSITION.value)).toEqual([10.5, 22, 36]);
  expect(Array.from(decoded.attributes.COLOR_0.value)).toEqual([257, 514, 771]);
  expect(Array.from(decoded.attributes.intensity.value)).toEqual([42]);
  expect(decoded.attributes.POSITION.value).toBeInstanceOf(Float64Array);
});

test.each([
  {version: '2.1'},
  {points: -1},
  {spacing: 0},
  {scale: [0, 1, 1]},
  {offset: [0, 1]},
  {boundingBox: {min: [10, 0, 0], max: [0, 1, 1]}},
  {boundingBox: {min: [-1e308, 0, 0], max: [1e308, 1, 1]}},
  {encoding: 'LAS'},
  {attributes: []},
  {hierarchy: {firstChunkSize: 23, stepSize: 5, depth: 1}},
  {hierarchy: {firstChunkSize: 22, stepSize: 0, depth: 1}},
  {hierarchy: {firstChunkSize: 22, stepSize: 5, depth: 65}}
])('rejects invalid modern metadata %j', invalid => {
  expect(() => parsePotree2Metadata(JSON.stringify({...createMetadata(), ...invalid}))).toThrow();
});

test('metadata rejects duplicate, reserved, incompatible and malformed attribute descriptions', () => {
  const metadata = createMetadata();
  for (const attributes of [
    [...metadata.attributes, metadata.attributes[0]],
    [{...metadata.attributes[0], type: 'uint32'}],
    [{...metadata.attributes[0], size: 11}],
    [{...metadata.attributes[0], numElements: 17}],
    [{...metadata.attributes[0], name: 'POSITION'}],
    [...metadata.attributes, {...metadata.attributes[1], name: 'rgba', numElements: 4, size: 8}],
    [metadata.attributes[0], {...metadata.attributes[1], type: 'uint8', elementSize: 1, size: 3}],
    [metadata.attributes[0], {...metadata.attributes[1], name: '__proto__'}]
  ])
    expect(() => parsePotree2Metadata(JSON.stringify({...metadata, attributes}))).toThrow();
  expect(parsePotree2Metadata('\uFEFF' + JSON.stringify(metadata))).toEqual(metadata);
});

test('hierarchy validates BFS ownership, proxies, depth, node limits and exact uint64 ranges', () => {
  const bytes = createHierarchy([
    {type: 0, mask: 128, count: 1},
    {type: 2, count: 1, offset: 9007199254740993n, size: 22n}
  ]);
  expect(parsePotree2Hierarchy(bytes.buffer)[1]).toMatchObject({
    id: 'r7',
    byteOffset: 9007199254740993n
  });
  for (const malformed of [
    new Uint8Array(0),
    new Uint8Array(23),
    createHierarchy([{type: 3}]),
    createHierarchy([{type: 1, mask: 1}]),
    createHierarchy([{type: 0, mask: 1}]),
    createHierarchy([{type: 1}, {type: 1}]),
    createHierarchy([{type: 2, size: 23n}])
  ])
    expect(() => parsePotree2Hierarchy(malformed.buffer)).toThrow();
  expect(() => parsePotree2Hierarchy(bytes.buffer, 'r', 1)).toThrow();
  expect(() => parsePotree2Hierarchy(bytes.buffer, 'x')).toThrow();
  expect(() => parsePotree2Hierarchy(bytes.buffer, 'r' + '0'.repeat(65))).toThrow();
  expect(() => parsePotree2Hierarchy(bytes.buffer, 'r', 0)).toThrow();
});

test('point decoder rejects lengths and allocation budgets before creating attributes', async () => {
  const metadata = createMetadata();
  await expect(parsePotree2Points(new ArrayBuffer(19), metadata, 1)).rejects.toThrow('byte length');
  for (const [count, limit] of [
    [-1, 64],
    [1, 0],
    [1, 20],
    [1e10, 64]
  ])
    await expect(parsePotree2Points(new ArrayBuffer(20), metadata, count, limit)).rejects.toThrow(
      'budget'
    );
  const empty = await parsePotree2Points(new ArrayBuffer(0), metadata, 0);
  expect(empty.header?.vertexCount).toBe(0);
});

test('modern source incrementally reads one hierarchy and each requested point range in native coordinates', async () => {
  const dataset = await encodePotreeDataset(
    [
      {id: 'r', mesh: createPoints([0, 0, 0])},
      {id: 'r7', mesh: createPoints([8, 8, 8])}
    ],
    {potree: {projection: 'EPSG:4978'}}
  );
  const transport = createDatasetFetch(dataset);
  const source = Potree2SourceLoaderWithParser.createDataSource(
    'https://example.com/dataset?token=1',
    {
      core: {fetch: transport.fetch}
    }
  );
  try {
    expect(source.isReady).toBe(false);
    await source.initialize();
    const root = await source.getRootTile();
    expect(root).toMatchObject({id: 'r', level: 0, pointCount: 1});
    expect(transport.requests).toHaveLength(2);
    const [child] = await source.getChildren(root);
    expect(child).toMatchObject({id: 'r7', level: 1});
    const content = await source.loadTileContent({...child, pointCount: 999});
    expect(content?.pointCount).toBe(1);
    expect(content?.coordinateSystem).toBe('cartesian');
    expect(Array.from(convertTableToMesh(content!.data).attributes.POSITION.value)).toEqual([
      8, 8, 8
    ]);
    expect(transport.requests).toHaveLength(3);
    expect(transport.requests.every(request => new URL(request.url).search === '?token=1')).toBe(
      true
    );
    const metadata = await source.getMetadata();
    metadata.points = 999;
    expect((await source.getMetadata()).points).toBe(2);
    await expect(source.getChildren({...root, id: 'unknown'})).rejects.toThrow('Unknown');
  } finally {
    source.close();
    source.close();
  }
  await expect(source.getRootTile()).rejects.toThrow('closed');
});

test('modern source hydrates proxies once, preserving final metadata URL and query credentials', async () => {
  const dataset = await encodePotreeDataset([
    {id: 'r', mesh: createPoints([0, 0, 0])},
    {id: 'r7', mesh: createPoints([8, 8, 8])}
  ]);
  const files = new Map(dataset.files);
  const hierarchy = new Uint8Array(66);
  hierarchy.set(createHierarchy([{type: 2, mask: 128, count: 1, offset: 22n, size: 44n}]));
  hierarchy.set(dataset.files.get('hierarchy.bin')!, 22);
  files.set('hierarchy.bin', hierarchy);
  const metadata = {...dataset.metadata, hierarchy: {firstChunkSize: 22, stepSize: 5, depth: 1}};
  files.set('metadata.json', new TextEncoder().encode(JSON.stringify(metadata)));
  const transport = createDatasetFetch({...dataset, files});
  const fetch = async (input: string | Request | URL, init?: RequestInit) => {
    const response = await transport.fetch(String(input).replace('/latest/', '/dataset/'), init);
    if (String(input).includes('metadata.json'))
      Object.defineProperty(response, 'url', {
        value: 'https://example.com/dataset/metadata.json?redirect=1'
      });
    return response;
  };
  const source = new Potree2Source('https://example.com/latest/metadata.json', {core: {fetch}});
  try {
    const [first, second] = await Promise.all([source.getRootTile(), source.getRootTile()]);
    expect(first).toEqual(second);
    expect(transport.requests.filter(request => request.range === 'bytes=22-65')).toHaveLength(1);
    expect(
      transport.requests.slice(1).every(request => new URL(request.url).search === '?redirect=1')
    ).toBe(true);
  } finally {
    source.close();
  }
});

test.each([
  'maxMetadataBytes',
  'maxHierarchyBytes',
  'maxPointBytes',
  'maxNodes'
])('modern source rejects invalid %s', limit => {
  expect(() => new Potree2Source('https://example.com/dataset', {potree2: {[limit]: 0}})).toThrow(
    'limit'
  );
});

test('modern source rejects status, metadata, range, hierarchy budgets and missing point data', async () => {
  const dataset = await encodePotreeDataset(createPoints());
  const transport = createDatasetFetch(dataset);
  for (const potree2 of [{maxMetadataBytes: 2}, {maxHierarchyBytes: 21}]) {
    const source = new Potree2Source('https://example.com/dataset', {
      core: {fetch: transport.fetch},
      potree2
    });
    await expect(source.initialize()).rejects.toThrow('budget');
    expect(source.isReady).toBe(false);
  }
  for (const response of [
    new Response(null, {status: 404}),
    new Response('{}'),
    new Response(null)
  ]) {
    const source = new Potree2Source('https://example.com/dataset', {
      core: {fetch: async () => response}
    });
    await expect(source.initialize()).rejects.toThrow();
  }
  for (const contentRange of [null, 'bytes 0-21/21', 'bytes 1-22/44']) {
    const source = new Potree2Source('https://example.com/dataset', {
      core: {
        fetch: async (url, init) =>
          String(url).endsWith('metadata.json')
            ? transport.fetch(url, init)
            : new Response(new Uint8Array(22), {
                status: 206,
                headers: contentRange ? {'Content-Range': contentRange} : {}
              })
      }
    });
    await expect(source.initialize()).rejects.toThrow('honor');
  }
  const source = new Potree2Source('https://example.com/dataset', {
    core: {fetch: transport.fetch},
    potree2: {maxPointBytes: 1}
  });
  const root = await source.getRootTile();
  await expect(source.loadTileContent(root)).rejects.toThrow('range');
  source.close();
});

test('modern source handles empty tiles and cancellation of a transport that ignores request signals', async () => {
  const dataset = await encodePotreeDataset(createPoints([]));
  const transport = createDatasetFetch(dataset);
  const source = new Potree2Source('https://example.com/dataset', {core: {fetch: transport.fetch}});
  expect(await source.loadTileContent(await source.getRootTile())).toBeNull();
  source.close();
  let startRead!: () => void;
  const started = new Promise<void>(resolve => {
    startRead = resolve;
  });
  const cancel = vi.fn();
  const blocked = new Potree2Source('https://example.com/dataset', {
    core: {fetch: async () => new Response(new ReadableStream({pull: startRead, cancel}))}
  });
  await started;
  blocked.close();
  await expect(blocked.initialize()).rejects.toThrow('closed');
  expect(cancel).toHaveBeenCalledOnce();
});

test('legacy hierarchy and version boundaries reject malformed pages', () => {
  expect(parseVersion('1.0RC')).toEqual({major: 1, minor: 0});
  expect(parseVersion('nonsense').major).toBeNaN();
  for (const bytes of [
    new Uint8Array(0),
    new Uint8Array(4),
    new Uint8Array([1, 1, 0, 0, 0]),
    new Uint8Array(10)
  ])
    expect(() => parsePotreeHierarchyChunk(bytes.buffer)).toThrow();
});

test('Brotli positions use separate high/low 16-bit Morton words, including signed coordinates', async () => {
  const metadata = createMetadata();
  metadata.encoding = 'BROTLI';
  metadata.scale = [1, 1, 1];
  metadata.offset = [0, 0, 0];
  metadata.attributes = [metadata.attributes[0]];
  // Independent zlib-compressed high/low Morton words; each word contains 48 significant bits.
  const bytes = new Uint8Array([
    27, 31, 0, 248, 31, 167, 199, 154, 24, 122, 183, 6, 168, 73, 90, 26, 146, 69, 66, 90, 146, 100,
    20, 4, 76, 128, 0, 183, 12, 0
  ]);
  const mesh = await parsePotree2Points(bytes.buffer, metadata, 2);
  expect(Array.from(mesh.attributes.POSITION.value)).toEqual([
    65537, 131074, 196611, -1, 65536, -2147483648
  ]);
});
