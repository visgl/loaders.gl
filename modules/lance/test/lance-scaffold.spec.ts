// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {LanceFormat} from '../src/lance-format';
import {LanceLoader} from '../src/lance-loader-types';
import {LanceDecoderUnavailableError, LanceLoaderWithParser} from '../src/lance-loader';
import {parseLanceFileMetadata} from '../src/lance-file';
import {
  decodeLanceFlatColumn,
  decodeLanceFlatPage,
  LanceFlatPageUnsupportedError
} from '../src/lance-decoder';
import {parseLanceManifest} from '../src/lance-manifest';
import {
  LANCE_SOURCE_CAPABILITIES,
  type LanceSourceCapabilities
} from '../src/lance-source-capabilities';
import {LanceSourceLoader} from '../src/lance-source-loader';
import {readLanceRemoteCoordinatesToArrow, readLanceRemoteFileToArrow} from '../src/lance-arrow';

const MANIFEST_FIXTURE = Uint8Array.from([
  0x0a, 0x0d, 0x12, 0x02, 0x69, 0x64, 0x18, 0x00, 0x2a, 0x05, 0x69, 0x6e, 0x74, 0x33, 0x32, 0x30,
  0x01, 0x12, 0x14, 0x08, 0x01, 0x20, 0x02, 0x12, 0x0e, 0x0a, 0x0a, 0x70, 0x61, 0x72, 0x74, 0x2e,
  0x6c, 0x61, 0x6e, 0x63, 0x65, 0x10, 0x00, 0x18, 0x07
]);

const FRAMED_MANIFEST_FIXTURE = new Uint8Array(MANIFEST_FIXTURE.length + 4);
new DataView(FRAMED_MANIFEST_FIXTURE.buffer).setUint32(0, MANIFEST_FIXTURE.length, true);
FRAMED_MANIFEST_FIXTURE.set(MANIFEST_FIXTURE, 4);

const FILE_FIXTURE = new Uint8Array(128);
const FILE_FIXTURE_VIEW = new DataView(FILE_FIXTURE.buffer);
FILE_FIXTURE.set(
  [
    0x12, 0x0c, 0x0a, 0x02, 0x10, 0x20, 0x12, 0x02, 0x04, 0x08, 0x18, 0x03, 0x28, 0x00, 0x1a, 0x01,
    0x64, 0x22, 0x01, 0x02
  ],
  8
);
FILE_FIXTURE.set([0x09, 0x08], 64);
FILE_FIXTURE_VIEW.setBigUint64(32, 8n, true);
FILE_FIXTURE_VIEW.setBigUint64(40, 20n, true);
FILE_FIXTURE_VIEW.setBigUint64(48, 64n, true);
FILE_FIXTURE_VIEW.setBigUint64(56, 2n, true);
FILE_FIXTURE_VIEW.setBigUint64(88, 8n, true);
FILE_FIXTURE_VIEW.setBigUint64(96, 32n, true);
FILE_FIXTURE_VIEW.setBigUint64(104, 48n, true);
FILE_FIXTURE_VIEW.setUint32(112, 1, true);
FILE_FIXTURE_VIEW.setUint32(116, 1, true);
FILE_FIXTURE_VIEW.setUint16(120, 2, true);
FILE_FIXTURE_VIEW.setUint16(122, 1, true);
FILE_FIXTURE.set([0x4c, 0x41, 0x4e, 0x43], 124);

const FLAT_FILE_FIXTURE = new Uint8Array(128);
const FLAT_FILE_FIXTURE_VIEW = new DataView(FLAT_FILE_FIXTURE.buffer);
FLAT_FILE_FIXTURE_VIEW.setInt32(0, 10, true);
FLAT_FILE_FIXTURE_VIEW.setInt32(4, 20, true);
FLAT_FILE_FIXTURE_VIEW.setInt32(8, 30, true);
FLAT_FILE_FIXTURE.set([0x12, 0x0a, 0x0a, 0x01, 0x00, 0x12, 0x01, 0x0c, 0x18, 0x03, 0x28, 0x00], 16);
FLAT_FILE_FIXTURE_VIEW.setBigUint64(32, 16n, true);
FLAT_FILE_FIXTURE_VIEW.setBigUint64(40, 12n, true);
FLAT_FILE_FIXTURE_VIEW.setBigUint64(48, 48n, true);
FLAT_FILE_FIXTURE_VIEW.setUint32(56, 0, true);
FLAT_FILE_FIXTURE_VIEW.setUint32(60, 1, true);
FLAT_FILE_FIXTURE_VIEW.setUint16(64, 2, true);
FLAT_FILE_FIXTURE_VIEW.setUint16(66, 1, true);
FLAT_FILE_FIXTURE_VIEW.setBigUint64(88, 16n, true);
FLAT_FILE_FIXTURE_VIEW.setBigUint64(96, 32n, true);
FLAT_FILE_FIXTURE_VIEW.setBigUint64(104, 48n, true);
FLAT_FILE_FIXTURE_VIEW.setUint32(112, 0, true);
FLAT_FILE_FIXTURE_VIEW.setUint32(116, 1, true);
FLAT_FILE_FIXTURE_VIEW.setUint16(120, 2, true);
FLAT_FILE_FIXTURE_VIEW.setUint16(122, 1, true);
FLAT_FILE_FIXTURE.set([0x4c, 0x41, 0x4e, 0x43], 124);

const COORDINATE_FILE_FIXTURE = createCoordinateFileFixture();

test('Lance scaffold exposes read-only metadata', () => {
  expect(LanceFormat.format).toBe('lance');
  expect(LanceLoader.id).toBe('lance');
  expect(LanceSourceLoader.type).toBe('lance');
  expect(LanceSourceLoader.fromUrl).toBe(true);
  expect(LanceSourceLoader.fromBlob).toBe(true);
});

test('Lance scaffold advertises deferred capabilities', () => {
  const expectedCapabilities: LanceSourceCapabilities = {
    supportsCachedMetadata: true,
    supportsColumnProjection: false,
    supportsArrowBatches: true,
    supportsLazyBlobs: false,
    supportsPredicatePushdown: false,
    supportsBrowserDecoder: false,
    supportsWrite: false
  };

  expect(Object.isFrozen(LANCE_SOURCE_CAPABILITIES)).toBe(true);
  expect(LANCE_SOURCE_CAPABILITIES).toEqual(expectedCapabilities);
});

test('Lance MVP decodes manifest schema and fragments', () => {
  const manifest = parseLanceManifest(MANIFEST_FIXTURE);

  expect(manifest.version).toBe(7);
  expect(manifest.fields[0].name).toBe('id');
  expect(manifest.fields[0].logicalType).toBe('int32');
  expect(manifest.fragments[0].physicalRows).toBe(2);
  expect(manifest.fragments[0].files[0].path).toBe('part.lance');
  expect(manifest.fragments[0].files[0].fieldIds).toEqual([0]);
});

test('Lance MVP decodes length-prefixed manifest sections', () => {
  const manifest = parseLanceManifest(FRAMED_MANIFEST_FIXTURE);

  expect(manifest.version).toBe(7);
  expect(manifest.fields[0].name).toBe('id');
  expect(manifest.fragments[0].files[0].path).toBe('part.lance');
});

test('Lance MVP caches Blob manifest metadata', async () => {
  const source = LanceSourceLoader.createDataSource(new Blob([MANIFEST_FIXTURE]), {});
  const firstMetadata = await source.getMetadata();
  const secondMetadata = await source.getMetadata();

  expect(firstMetadata).toBe(secondMetadata);
  expect((await source.getSchema())[0].name).toBe('id');
});

test('Lance file MVP decodes footer and metadata tables', () => {
  const metadata = parseLanceFileMetadata(FILE_FIXTURE);

  expect(metadata.majorVersion).toBe(2);
  expect(metadata.minorVersion).toBe(1);
  expect(metadata.numColumns).toBe(1);
  expect(metadata.numGlobalBuffers).toBe(1);
  expect(metadata.columns[0].pages[0].length).toBe(3);
  expect(metadata.columns[0].pages[0].bufferOffsets).toEqual([16, 32]);
  expect(metadata.columns[0].pages[0].bufferSizes).toEqual([4, 8]);
  expect(metadata.columns[0].bufferOffsets).toEqual([100]);
  expect(Array.from(metadata.globalBuffers[0])).toEqual([9, 8]);
});

test('Lance decoder reads flat little-endian primitive pages', () => {
  const bytes = new ArrayBuffer(12);
  const view = new DataView(bytes);
  view.setInt32(0, 1, true);
  view.setInt32(4, -2, true);
  view.setInt32(8, 300, true);
  const values = decodeLanceFlatPage(
    bytes,
    {bufferOffsets: [0], bufferSizes: [12], length: 3, priority: 0},
    'int32'
  );

  expect(Array.from(values)).toEqual([1, -2, 300]);
});

test('Lance decoder supports every fixed-width primitive type', () => {
  const primitiveTypes = [
    ['int8', new Int8Array([-1, 2])],
    ['uint8', new Uint8Array([1, 255])],
    ['int16', new Int16Array([-2, 300])],
    ['uint16', new Uint16Array([2, 300])],
    ['int32', new Int32Array([-2, 300])],
    ['uint32', new Uint32Array([2, 300])],
    ['int64', new BigInt64Array([-2n, 300n])],
    ['uint64', new BigUint64Array([2n, 300n])],
    ['float', new Float32Array([-2.5, 300.5])],
    ['double', new Float64Array([-2.5, 300.5])]
  ] as const;

  for (const [type, expected] of primitiveTypes) {
    const bytes = expected.buffer.slice(0);
    const values = decodeLanceFlatPage(
      bytes,
      {bufferOffsets: [0], bufferSizes: [bytes.byteLength], length: expected.length, priority: 0},
      type
    );
    expect(Array.from(values)).toEqual(Array.from(expected));
  }
});

test('Lance decoder rejects invalid page ranges and priorities', () => {
  const page = {bufferOffsets: [0], bufferSizes: [4], length: 1, priority: 0};
  expect(() =>
    decodeLanceFlatPage(new ArrayBuffer(4), {...page, bufferOffsets: [-1]}, 'int32')
  ).toThrow('invalid value buffer range');
  expect(() =>
    decodeLanceFlatPage(new ArrayBuffer(4), {...page, bufferSizes: [3]}, 'int32')
  ).toThrow('does not match its page type');
  expect(() =>
    decodeLanceFlatPage(new ArrayBuffer(4), {...page, length: Number.MAX_SAFE_INTEGER + 1}, 'int32')
  ).toThrow('exceeds JavaScript limits');
  expect(() =>
    decodeLanceFlatColumn(
      new ArrayBuffer(8),
      {
        pages: [
          {...page, priority: 1},
          {...page, priority: 1}
        ],
        bufferOffsets: [],
        bufferSizes: []
      },
      'int32'
    )
  ).toThrow('invalid priorities');
});

test('Lance decoder rejects non-flat page shapes', () => {
  expect(() =>
    decodeLanceFlatPage(
      new ArrayBuffer(8),
      {bufferOffsets: [0, 4], bufferSizes: [4, 4], length: 2, priority: 0},
      'int32'
    )
  ).toThrow(LanceFlatPageUnsupportedError);
});

test('Lance decoder assembles flat columns from ordered pages', () => {
  const bytes = new ArrayBuffer(16);
  const view = new DataView(bytes);
  view.setInt32(0, 1, true);
  view.setInt32(4, 2, true);
  view.setInt32(8, 3, true);
  view.setInt32(12, 4, true);
  const values = decodeLanceFlatColumn(
    bytes,
    {
      pages: [
        {bufferOffsets: [8], bufferSizes: [8], length: 2, priority: 2},
        {bufferOffsets: [0], bufferSizes: [8], length: 2, priority: 0}
      ],
      bufferOffsets: [],
      bufferSizes: []
    },
    'int32'
  );

  expect(Array.from(values)).toEqual([1, 2, 3, 4]);
});

test('Lance loader returns an Arrow table for a flat Lance file', async () => {
  const result = await LanceLoaderWithParser.parse(FLAT_FILE_FIXTURE.buffer, {
    lance: {columnTypes: ['int32'], columnNames: ['id']}
  });

  expect(result.shape).toBe('arrow-table');
  expect(result.data.numRows).toBe(3);
  expect(Array.from(result.data.getChild('id').toArray())).toEqual([10, 20, 30]);
});

test('Lance source emits an Arrow batch for a flat Lance file', async () => {
  const source = LanceSourceLoader.createDataSource(new Blob([FLAT_FILE_FIXTURE]), {
    lance: {columnTypes: ['int32'], columnNames: ['id']}
  });
  const batches = [];
  for await (const batch of source.readBatches()) batches.push(batch);

  expect(batches).toHaveLength(1);
  expect(batches[0].shape).toBe('arrow-table');
  expect(Array.from(batches[0].data.getChild('id').toArray())).toEqual([10, 20, 30]);
});

test('Lance loader emits Arrow batches from an input iterator', async () => {
  const batches = [];
  for await (const batch of LanceLoaderWithParser.parseInBatches([FLAT_FILE_FIXTURE], {
    lance: {columnTypes: ['int32'], columnNames: ['id']}
  })) {
    batches.push(batch);
  }

  expect(batches).toHaveLength(1);
  expect(batches[0].length).toBe(3);
  expect(Array.from(batches[0].data.getChild('id').toArray())).toEqual([10, 20, 30]);
});

test('Lance source reads file metadata directly from a Blob', async () => {
  const source = LanceSourceLoader.createDataSource(new Blob([FILE_FIXTURE]), {});
  const metadata = await source.getFileMetadata();

  expect(metadata.majorVersion).toBe(2);
  expect(metadata.columns[0].pages[0].length).toBe(3);
});

test('Lance source loader identifies dataset and data-file URLs', async () => {
  expect(LanceSourceLoader.testURL('https://example.com/table.lance')).toBe(true);
  expect(LanceSourceLoader.testURL('https://example.com/table.lance/data/part.lance')).toBe(true);
  expect(LanceSourceLoader.testURL('https://example.com/table.parquet')).toBe(false);
  await expect(LanceSourceLoader.preload()).resolves.toBe(LanceSourceLoader);
});

test('Lance scaffold uses an explicit decoder error', async () => {
  const {LanceLoaderWithParser} = await import('../src/lance-loader');

  await expect(LanceLoaderWithParser.parse(new ArrayBuffer(0))).rejects.toBeInstanceOf(
    LanceDecoderUnavailableError
  );
});

test('Lance remote reader projects and slices flat primitive columns', async () => {
  const fetchFunction = createRangeFetch(FLAT_FILE_FIXTURE);
  const table = await readLanceRemoteFileToArrow(
    'https://example.com/part.lance',
    FLAT_FILE_FIXTURE.byteLength,
    [{index: 0, name: 'id', type: 'int32'}],
    1,
    1,
    fetchFunction
  );

  expect(Array.from(table.data.getChild('id').toArray())).toEqual([20]);

  const emptyTable = await readLanceRemoteFileToArrow(
    'https://example.com/part.lance',
    FLAT_FILE_FIXTURE.byteLength,
    [{index: 0, name: 'id', type: 'int32'}],
    0,
    0,
    fetchFunction
  );
  expect(emptyTable.data.numRows).toBe(0);
});

test('Lance remote coordinate reader extracts interleaved float pairs', async () => {
  const table = await readLanceRemoteCoordinatesToArrow(
    'https://example.com/coordinates.lance',
    COORDINATE_FILE_FIXTURE.byteLength,
    [{index: 0, xName: 'x', yName: 'y'}],
    2,
    1,
    createRangeFetch(COORDINATE_FILE_FIXTURE)
  );

  expect(Array.from(table.data.getChild('x').toArray())).toEqual([2, 3]);
  expect(Array.from(table.data.getChild('y').toArray())).toEqual([20, 30]);
});

test('Lance remote readers reject invalid requests and responses', async () => {
  const url = 'https://example.com/part.lance';
  const fetchFunction = createRangeFetch(FLAT_FILE_FIXTURE);
  const column = [{index: 0, name: 'id', type: 'int32' as const}];
  const coordinateColumn = [{index: 0, xName: 'x', yName: 'y'}];

  await expect(
    readLanceRemoteFileToArrow(
      url,
      FLAT_FILE_FIXTURE.byteLength,
      column,
      undefined,
      -1,
      fetchFunction
    )
  ).rejects.toThrow('Invalid Lance remote row offset -1');
  await expect(
    readLanceRemoteFileToArrow(url, FLAT_FILE_FIXTURE.byteLength, column, -1, 0, fetchFunction)
  ).rejects.toThrow('Invalid Lance remote row limit -1');
  await expect(
    readLanceRemoteCoordinatesToArrow(
      url,
      COORDINATE_FILE_FIXTURE.byteLength,
      coordinateColumn,
      undefined,
      -1,
      createRangeFetch(COORDINATE_FILE_FIXTURE)
    )
  ).rejects.toThrow('Invalid Lance coordinate offset -1');
  await expect(
    readLanceRemoteCoordinatesToArrow(
      url,
      COORDINATE_FILE_FIXTURE.byteLength,
      coordinateColumn,
      -1,
      0,
      createRangeFetch(COORDINATE_FILE_FIXTURE)
    )
  ).rejects.toThrow('Invalid Lance coordinate limit -1');

  await expect(
    readLanceRemoteFileToArrow(
      url,
      FLAT_FILE_FIXTURE.byteLength,
      [{index: 1, name: 'id', type: 'int32'}],
      undefined,
      0,
      fetchFunction
    )
  ).rejects.toThrow('Invalid Lance remote column index 1');
  await expect(
    readLanceRemoteCoordinatesToArrow(
      url,
      COORDINATE_FILE_FIXTURE.byteLength,
      [{index: 1, xName: 'x', yName: 'y'}],
      undefined,
      0,
      createRangeFetch(COORDINATE_FILE_FIXTURE)
    )
  ).rejects.toThrow('Invalid Lance coordinate column index 1');

  const badMagic = FLAT_FILE_FIXTURE.slice();
  badMagic.fill(0, badMagic.byteLength - 4);
  await expect(
    readLanceRemoteFileToArrow(
      url,
      badMagic.byteLength,
      column,
      undefined,
      0,
      createRangeFetch(badMagic)
    )
  ).rejects.toThrow('Invalid Lance remote file footer');
  await expect(
    readLanceRemoteCoordinatesToArrow(
      url,
      badMagic.byteLength,
      coordinateColumn,
      undefined,
      0,
      createRangeFetch(badMagic)
    )
  ).rejects.toThrow('Invalid Lance remote file footer');

  await expect(
    readLanceRemoteFileToArrow(
      url,
      FILE_FIXTURE.byteLength,
      column,
      undefined,
      0,
      createRangeFetch(FILE_FIXTURE)
    )
  ).rejects.toThrow('has a non-flat page');
  await expect(
    readLanceRemoteCoordinatesToArrow(
      url,
      FILE_FIXTURE.byteLength,
      coordinateColumn,
      undefined,
      0,
      createRangeFetch(FILE_FIXTURE)
    )
  ).rejects.toThrow('invalid float buffer size');

  await expect(
    readLanceRemoteFileToArrow(
      url,
      FLAT_FILE_FIXTURE.byteLength,
      column,
      undefined,
      0,
      async () => new Response(null, {status: 500})
    )
  ).rejects.toThrow('Failed to read Lance byte range');
  await expect(
    readLanceRemoteFileToArrow(
      url,
      FLAT_FILE_FIXTURE.byteLength,
      column,
      undefined,
      0,
      async () => new Response(new Uint8Array(0), {status: 206})
    )
  ).rejects.toThrow('range response returned 0 bytes');
});

function createRangeFetch(bytes: Uint8Array) {
  return async (_url: string, options?: RequestInit): Promise<Response> => {
    const headers = new Headers(options?.headers);
    const match = /^bytes=(\d+)-(\d+)$/.exec(headers.get('Range') || '');
    if (!match) {
      return new Response(null, {status: 400});
    }
    const start = Number(match[1]);
    const end = Number(match[2]);
    return new Response(bytes.slice(start, end + 1), {status: 206});
  };
}

function createCoordinateFileFixture(): Uint8Array {
  const bytes = new Uint8Array(200);
  const dataView = new DataView(bytes.buffer);
  const columnMetadata = Uint8Array.from([
    0x12, 0x0d, 0x0a, 0x03, 0x00, 0x80, 0x01, 0x12, 0x02, 0x08, 0x20, 0x18, 0x03, 0x28, 0x00
  ]);
  bytes.set(columnMetadata, 16);
  dataView.setBigUint64(64, 16n, true);
  dataView.setBigUint64(72, BigInt(columnMetadata.byteLength), true);

  const coordinateView = new DataView(bytes.buffer, 136, 24);
  [1, 10, 2, 20, 3, 30].forEach((value, index) =>
    coordinateView.setFloat32(index * 4, value, true)
  );

  const footerOffset = bytes.byteLength - 40;
  dataView.setBigUint64(footerOffset, 16n, true);
  dataView.setBigUint64(footerOffset + 8, 64n, true);
  dataView.setBigUint64(footerOffset + 16, 80n, true);
  dataView.setUint32(footerOffset + 24, 0, true);
  dataView.setUint32(footerOffset + 28, 1, true);
  dataView.setUint16(footerOffset + 32, 2, true);
  dataView.setUint16(footerOffset + 34, 1, true);
  bytes.set([0x4c, 0x41, 0x4e, 0x43], footerOffset + 36);
  return bytes;
}
