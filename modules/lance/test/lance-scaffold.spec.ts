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

test('Lance scaffold uses an explicit decoder error', async () => {
  const {LanceLoaderWithParser} = await import('../src/lance-loader');

  await expect(LanceLoaderWithParser.parse(new ArrayBuffer(0))).rejects.toBeInstanceOf(
    LanceDecoderUnavailableError
  );
});
