// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {fetchFile} from '@loaders.gl/core';
import {BlobFile} from '@loaders.gl/loader-utils';

import {PARQUET_CODECS} from '../src/parquetjs/codecs/index';
import {decodeFileMetadata, decodePageHeader} from '../src/parquetjs/utils/read-utils';
import {ParquetReader} from '../src/parquetjs/parser/parquet-reader';
import {ParquetEncoder} from '../src/parquetjs/encoder/parquet-encoder';
import {ParquetSchema} from '../src/parquetjs/schema/schema';
import {materializeRows} from '../src/parquetjs/schema/shred';
import {concatUint8Arrays} from '../src/parquetjs/utils/binary-utils';

const PARQUET_DIR = '@loaders.gl/parquet/test/data';
const TEXT_DECODER = new TextDecoder();

type MutableGlobalThis = typeof globalThis & {
  Buffer?: typeof Buffer;
};

/** Copy bytes into an ArrayBuffer that has no hidden prefix or suffix bytes. */
function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer;
}

/** Read a parquet fixture into Uint8Array to avoid Node Buffer parser inputs. */
async function readTestBytes(path: string): Promise<Uint8Array> {
  const response = await fetchFile(`${PARQUET_DIR}/${path}`);
  return new Uint8Array(await response.arrayBuffer());
}

/** Read a little-endian unsigned 32-bit value from any Uint8Array view. */
function readUInt32LE(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, true);
}

/** Extract the thrift metadata footer byte range from a complete parquet file. */
function decodeMetadataBytes(parquetBytes: Uint8Array): Uint8Array {
  const trailerOffset = parquetBytes.length - 8;
  const metadataSize = readUInt32LE(parquetBytes, trailerOffset);
  const metadataOffset = trailerOffset - metadataSize;
  return parquetBytes.subarray(metadataOffset, trailerOffset);
}

/** Temporarily remove global Buffer while exercising browser-compatible parquet paths. */
async function withoutGlobalBuffer<T>(callback: () => Promise<T>): Promise<T> {
  const testGlobalThis = globalThis as MutableGlobalThis;
  const originalBuffer = testGlobalThis.Buffer;
  testGlobalThis.Buffer = undefined;

  try {
    return await callback();
  } finally {
    testGlobalThis.Buffer = originalBuffer;
  }
}

/** Write rows to an in-memory stream and return the complete parquet envelope. */
async function writeParquetBytes(schema: ParquetSchema, rows: any[]): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const outputStream = {
    write(chunk: Uint8Array, callback: (error?: Error) => void) {
      chunks.push(chunk.slice());
      callback();
    },
    close(callback: (error?: Error) => void) {
      callback();
    }
  };

  const encoder = await ParquetEncoder.openStream(schema, outputStream as any);
  for (const row of rows) {
    await encoder.appendRow(row);
  }
  await encoder.close();
  return concatUint8Arrays(chunks);
}

/** Read every row from an in-memory parquet envelope. */
async function readParquetRows(parquetBytes: Uint8Array): Promise<any[]> {
  const reader = new ParquetReader(new BlobFile(toExactArrayBuffer(parquetBytes)));
  const rows: any[] = [];
  for await (const row of reader.rowIterator()) {
    rows.push(row);
  }
  reader.close();
  return rows;
}

test('Parquet thrift metadata decodes from Uint8Array and Uint8Array subarray', async t => {
  const parquetBytes = await readTestBytes('fruits.parquet');
  const metadataBytes = decodeMetadataBytes(parquetBytes);

  const decodedMetadata = decodeFileMetadata(metadataBytes).metadata;
  t.equal(Number(decodedMetadata.num_rows), 40000, 'decoded row count');
  t.equal(decodedMetadata.schema[0].name, 'root', 'decoded root schema');

  const paddedBytes = new Uint8Array(metadataBytes.byteLength + 11);
  paddedBytes.set(metadataBytes, 7);
  const metadataSubarray = paddedBytes.subarray(7, 7 + metadataBytes.byteLength);
  const decodedMetadataFromSubarray = decodeFileMetadata(metadataSubarray).metadata;
  t.equal(Number(decodedMetadataFromSubarray.num_rows), 40000, 'decoded subarray row count');

  t.end();
});

test('Parquet page header decodes from Uint8Array without Buffer', async t => {
  const parquetBytes = await readTestBytes('fruits.parquet');
  const metadata = decodeFileMetadata(decodeMetadataBytes(parquetBytes)).metadata;
  const firstPageOffset = Number(metadata.row_groups[0].columns[0].meta_data?.data_page_offset);
  const firstPageBytes = parquetBytes.subarray(firstPageOffset);

  const {pageHeader, length} = decodePageHeader(firstPageBytes);

  t.ok(length > 0, 'advanced page-header cursor');
  t.equal(pageHeader.compressed_page_size, 39936, 'decoded page compressed byte length');
  t.equal(pageHeader.data_page_header?.num_values, 4096, 'decoded page value count');
  t.end();
});

test('Parquet PLAIN codec decodes primitive values from Uint8Array', t => {
  const values = new DataView(new ArrayBuffer(16));
  values.setInt32(0, 42, true);
  values.setFloat32(4, 23.5, true);
  values.setFloat64(8, 123.25, true);

  const int32Cursor = {buffer: new Uint8Array(values.buffer), offset: 0};
  const floatCursor = {buffer: new Uint8Array(values.buffer), offset: 4};
  const doubleCursor = {buffer: new Uint8Array(values.buffer), offset: 8};

  t.deepEqual(PARQUET_CODECS.PLAIN.decodeValues('INT32', int32Cursor, 1, {}), [42]);
  t.deepEqual(PARQUET_CODECS.PLAIN.decodeValues('FLOAT', floatCursor, 1, {}), [23.5]);
  t.deepEqual(PARQUET_CODECS.PLAIN.decodeValues('DOUBLE', doubleCursor, 1, {}), [123.25]);
  t.end();
});

test('Parquet PLAIN codec encodes primitive values into Uint8Array without Buffer', async t => {
  await withoutGlobalBuffer(async () => {
    const int32Bytes = PARQUET_CODECS.PLAIN.encodeValues('INT32', [42], {});
    const floatBytes = PARQUET_CODECS.PLAIN.encodeValues('FLOAT', [23.5], {});
    const doubleBytes = PARQUET_CODECS.PLAIN.encodeValues('DOUBLE', [123.25], {});
    const byteArrayBytes = PARQUET_CODECS.PLAIN.encodeValues(
      'BYTE_ARRAY',
      [new Uint8Array([102, 111, 111])],
      {}
    );

    t.ok(int32Bytes instanceof Uint8Array, 'encoded INT32 is Uint8Array');
    t.deepEqual(PARQUET_CODECS.PLAIN.decodeValues('INT32', {buffer: int32Bytes, offset: 0}, 1, {}), [
      42
    ]);
    t.deepEqual(PARQUET_CODECS.PLAIN.decodeValues('FLOAT', {buffer: floatBytes, offset: 0}, 1, {}), [
      23.5
    ]);
    t.deepEqual(
      PARQUET_CODECS.PLAIN.decodeValues('DOUBLE', {buffer: doubleBytes, offset: 0}, 1, {}),
      [123.25]
    );
    t.deepEqual(Array.from(byteArrayBytes), [3, 0, 0, 0, 102, 111, 111]);
  });
  t.end();
});

test('Parquet RLE codec encodes and decodes without Buffer', async t => {
  await withoutGlobalBuffer(async () => {
    const encoded = PARQUET_CODECS.RLE.encodeValues(
      'INT32',
      [1, 1, 1, 1, 2, 3, 4, 5, 5, 5],
      {bitWidth: 3}
    );
    t.ok(encoded instanceof Uint8Array, 'encoded RLE is Uint8Array');
    t.deepEqual(
      PARQUET_CODECS.RLE.decodeValues('INT32', {buffer: encoded, offset: 0}, 10, {bitWidth: 3}),
      [1, 1, 1, 1, 2, 3, 4, 5, 5, 5],
      'decoded RLE round-trip'
    );
  });
  t.end();
});

test('ParquetEncoder writes readable parquet without global Buffer', async t => {
  await withoutGlobalBuffer(async () => {
    const schema = new ParquetSchema({
      name: {type: 'UTF8'},
      count: {type: 'INT32'},
      price: {type: 'DOUBLE'},
      raw: {type: 'BYTE_ARRAY'},
      fixed: {type: 'FIXED_LEN_BYTE_ARRAY', typeLength: 3},
      metadata: {type: 'JSON'},
      interval: {type: 'INTERVAL'}
    });

    const parquetBytes = await writeParquetBytes(schema, [
      {
        name: 'apple',
        count: 7,
        price: 2.5,
        raw: new Uint8Array([1, 2, 3]),
        fixed: new Uint8Array([4, 5, 6]),
        metadata: {ripe: true},
        interval: {months: 1, days: 2, milliseconds: 3}
      }
    ]);
    const rows = await readParquetRows(parquetBytes);

    t.equal(rows[0].name, 'apple', 'UTF8 writer value round-trips as string');
    t.equal(rows[0].count, 7, 'INT32 writer value round-trips as number');
    t.equal(rows[0].price, 2.5, 'DOUBLE writer value round-trips as number');
    t.deepEqual(Array.from(rows[0].raw), [1, 2, 3], 'raw BYTE_ARRAY writer value round-trips');
    t.deepEqual(
      Array.from(rows[0].fixed),
      [4, 5, 6],
      'FIXED_LEN_BYTE_ARRAY writer value round-trips'
    );
    t.deepEqual(rows[0].metadata, {ripe: true}, 'JSON writer value round-trips as object');
    t.deepEqual(
      rows[0].interval,
      {months: 1, days: 2, milliseconds: 3},
      'INTERVAL writer value round-trips'
    );
  });
  t.end();
});

test('ParquetEncoder writes compressed readable parquet without global Buffer', async t => {
  await withoutGlobalBuffer(async () => {
    const schema = new ParquetSchema({
      name: {type: 'UTF8'},
      count: {type: 'INT32'}
    }).compress('GZIP');

    const parquetBytes = await writeParquetBytes(schema, [
      {name: 'apple', count: 7},
      {name: 'orange', count: 9}
    ]);
    const rows = await readParquetRows(parquetBytes);

    t.deepEqual(rows, [
      {name: 'apple', count: 7},
      {name: 'orange', count: 9}
    ]);
  });
  t.end();
});

test('Parquet PLAIN and dictionary codecs decode BYTE_ARRAY as Uint8Array', t => {
  const plainByteArrayCursor = {
    buffer: new Uint8Array([3, 0, 0, 0, 102, 111, 111, 3, 0, 0, 0, 98, 97, 114]),
    offset: 0
  };
  const plainValues = PARQUET_CODECS.PLAIN.decodeValues(
    'BYTE_ARRAY',
    plainByteArrayCursor,
    2,
    {}
  );

  t.ok(plainValues[0] instanceof Uint8Array, 'decoded BYTE_ARRAY is Uint8Array');
  t.equal(TEXT_DECODER.decode(plainValues[0]), 'foo', 'decoded first BYTE_ARRAY');
  t.equal(TEXT_DECODER.decode(plainValues[1]), 'bar', 'decoded second BYTE_ARRAY');

  const dictionaryCursor = {
    buffer: new Uint8Array([2, 16, 1]),
    offset: 0
  };
  t.deepEqual(
    PARQUET_CODECS.PLAIN_DICTIONARY.decodeValues('INT32', dictionaryCursor, 8, {}),
    [1, 1, 1, 1, 1, 1, 1, 1],
    'dictionary bit width is read from a Uint8Array byte'
  );
  t.end();
});

test('Parquet row materializer decodes dictionary-backed UTF8 bytes as strings', t => {
  const schema = new ParquetSchema({
    name: {
      type: 'UTF8'
    }
  });

  const rows = materializeRows(schema, {
    rowCount: 1,
    columnData: {
      name: {
        dlevels: [0],
        rlevels: [0],
        values: [new Uint8Array([104, 101, 108, 108, 111])],
        count: 1,
        pageHeaders: []
      }
    }
  });

  t.equal(rows[0].name, 'hello', 'dictionary-selected UTF8 primitive materializes as string');
  t.end();
});

test('ParquetReader and ParquetJSLoader parse without global Buffer', async t => {
  const fruitsBytes = await readTestBytes('fruits.parquet');
  const binaryBytes = await readTestBytes('apache/good/binary.parquet');
  const snappyBytes = await readTestBytes('apache/good/alltypes_plain.snappy.parquet');
  const originalBuffer = (globalThis as MutableGlobalThis).Buffer;

  await withoutGlobalBuffer(async () => {
    const [{ParquetJSLoader}] = await Promise.all([import('../src/index')]);

    const reader = new ParquetReader(new BlobFile(toExactArrayBuffer(fruitsBytes)));
    const metadata = await reader.getSchemaMetadata();
    t.deepEqual(metadata, {myuid: '420', fnord: 'dronf'}, 'reader metadata parsed');

    const binaryTable = await ParquetJSLoader.parse(toExactArrayBuffer(binaryBytes), {
      core: {worker: false}
    });
    t.equal(binaryTable.shape, 'object-row-table', 'binary table shape');
    t.ok(binaryTable.data[0].foo instanceof Uint8Array, 'raw binary field is Uint8Array');
    t.deepEqual(Array.from(binaryTable.data[11].foo), [11], 'raw binary bytes are preserved');

    const snappyTable = await ParquetJSLoader.parse(toExactArrayBuffer(snappyBytes), {
      core: {worker: false}
    });
    t.equal(snappyTable.data[0].id, 6, 'compressed physical INT32 materializes as number');
    t.ok(
      snappyTable.data[0].date_string_col instanceof Uint8Array,
      'compressed raw date_string_col BYTE_ARRAY is bytes'
    );
    t.ok(snappyTable.data[0].string_col instanceof Uint8Array, 'compressed raw BYTE_ARRAY is bytes');
  });

  t.equal((globalThis as MutableGlobalThis).Buffer, originalBuffer, 'test restored global Buffer');
  t.end();
});
