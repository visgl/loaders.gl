// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';

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

test('Lance scaffold#exposes read-only metadata', t => {
  t.equal(LanceFormat.format, 'lance', 'identifies the Lance format');
  t.equal(LanceLoader.id, 'lance', 'exposes the table loader id');
  t.equal(LanceSourceLoader.type, 'lance', 'exposes the source type');
  t.equal(LanceSourceLoader.fromUrl, true, 'supports URL sources at the API boundary');
  t.equal(LanceSourceLoader.fromBlob, true, 'supports Blob sources at the API boundary');
  t.end();
});

test('Lance scaffold#advertises deferred capabilities', t => {
  const expectedCapabilities: LanceSourceCapabilities = {
    supportsCachedMetadata: true,
    supportsColumnProjection: false,
    supportsArrowBatches: true,
    supportsLazyBlobs: false,
    supportsPredicatePushdown: false,
    supportsBrowserDecoder: false,
    supportsWrite: false
  };

  t.ok(Object.isFrozen(LANCE_SOURCE_CAPABILITIES), 'freezes the capability descriptor');
  t.deepEqual(LANCE_SOURCE_CAPABILITIES, expectedCapabilities, 'keeps the scaffold honest');
  t.end();
});

test('Lance MVP#decodes manifest schema and fragments', t => {
  const manifest = parseLanceManifest(MANIFEST_FIXTURE);

  t.equal(manifest.version, 7, 'decodes the snapshot version');
  t.equal(manifest.fields[0].name, 'id', 'decodes field names');
  t.equal(manifest.fields[0].logicalType, 'int32', 'decodes logical types');
  t.equal(manifest.fragments[0].physicalRows, 2, 'decodes fragment row counts');
  t.equal(manifest.fragments[0].files[0].path, 'part.lance', 'decodes data file paths');
  t.deepEqual(manifest.fragments[0].files[0].fieldIds, [0], 'decodes data file field ids');
  t.end();
});

test('Lance MVP#decodes length-prefixed manifest sections', t => {
  const manifest = parseLanceManifest(FRAMED_MANIFEST_FIXTURE);

  t.equal(manifest.version, 7, 'decodes the framed snapshot version');
  t.equal(manifest.fields[0].name, 'id', 'decodes the framed schema');
  t.equal(manifest.fragments[0].files[0].path, 'part.lance', 'decodes the framed data file');
  t.end();
});

test('Lance MVP#caches Blob manifest metadata', async t => {
  const source = LanceSourceLoader.createDataSource(new Blob([MANIFEST_FIXTURE]), {});
  const firstMetadata = await source.getMetadata();
  const secondMetadata = await source.getMetadata();

  t.equal(firstMetadata, secondMetadata, 'caches the manifest promise');
  t.equal((await source.getSchema())[0].name, 'id', 'exposes manifest fields through getSchema');
  t.end();
});

test('Lance file MVP#decodes footer and metadata tables', t => {
  const metadata = parseLanceFileMetadata(FILE_FIXTURE);

  t.equal(metadata.majorVersion, 2, 'decodes the file major version');
  t.equal(metadata.minorVersion, 1, 'decodes the file minor version');
  t.equal(metadata.numColumns, 1, 'decodes the column count');
  t.equal(metadata.numGlobalBuffers, 1, 'decodes the global buffer count');
  t.equal(metadata.columns[0].pages[0].length, 3, 'decodes page length');
  t.deepEqual(metadata.columns[0].pages[0].bufferOffsets, [16, 32], 'decodes page offsets');
  t.deepEqual(metadata.columns[0].pages[0].bufferSizes, [4, 8], 'decodes page sizes');
  t.deepEqual(metadata.columns[0].bufferOffsets, [100], 'decodes column buffer offsets');
  t.deepEqual(Array.from(metadata.globalBuffers[0]), [9, 8], 'reads global buffer bytes');
  t.end();
});

test('Lance decoder#reads flat little-endian primitive pages', t => {
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

  t.deepEqual(Array.from(values), [1, -2, 300], 'decodes fixed-width values');
  t.end();
});

test('Lance decoder#rejects non-flat page shapes', t => {
  t.throws(
    () =>
      decodeLanceFlatPage(
        new ArrayBuffer(8),
        {bufferOffsets: [0, 4], bufferSizes: [4, 4], length: 2, priority: 0},
        'int32'
      ),
    LanceFlatPageUnsupportedError,
    'rejects pages with multiple buffers'
  );
  t.end();
});

test('Lance decoder#assembles flat columns from ordered pages', t => {
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

  t.deepEqual(Array.from(values), [1, 2, 3, 4], 'orders pages by row priority');
  t.end();
});

test('Lance loader#returns an Arrow table for a flat Lance file', async t => {
  const result = await LanceLoaderWithParser.parse(FLAT_FILE_FIXTURE.buffer, {
    lance: {columnTypes: ['int32'], columnNames: ['id']}
  });

  t.equal(result.shape, 'arrow-table', 'returns the Arrow table shape');
  t.equal(result.data.numRows, 3, 'returns the decoded row count');
  t.deepEqual(Array.from(result.data.getChild('id').toArray()), [10, 20, 30], 'returns values');
  t.end();
});

test('Lance source#emits an Arrow batch for a flat Lance file', async t => {
  const source = LanceSourceLoader.createDataSource(new Blob([FLAT_FILE_FIXTURE]), {
    lance: {columnTypes: ['int32'], columnNames: ['id']}
  });
  const batches = [];
  for await (const batch of source.readBatches()) batches.push(batch);

  t.equal(batches.length, 1, 'emits one Arrow batch');
  t.equal(batches[0].shape, 'arrow-table', 'emits the Arrow shape');
  t.deepEqual(Array.from(batches[0].data.getChild('id').toArray()), [10, 20, 30], 'emits values');
  t.end();
});

test('Lance scaffold#uses an explicit decoder error', async t => {
  const {LanceLoaderWithParser} = await import('../src/lance-loader');

  await t.rejects(
    LanceLoaderWithParser.parse(new ArrayBuffer(0)),
    LanceDecoderUnavailableError,
    'does not silently claim to parse unsupported data'
  );
  t.end();
});
