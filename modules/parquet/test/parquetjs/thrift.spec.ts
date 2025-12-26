// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import test from 'tape-promise/tape';

import * as parquetThrift from '@loaders.gl/parquet/parquetjs/parquet-thrift';
import {decodeThrift, serializeThrift} from '@loaders.gl/parquet/parquetjs/utils/read-utils';

// TODO v4 disabled because of Node.js Buffer dependency
test.skip('thrift#should correctly en/decode literal zeroes with the CompactProtocol', assert => {
  const obj = new parquetThrift.ColumnMetaData({
    type: parquetThrift.Type.BOOLEAN,
    path_in_schema: ['test'],
    codec: parquetThrift.CompressionCodec.UNCOMPRESSED,
    encodings: [parquetThrift.Encoding.PLAIN],
    num_values: 0,
    total_uncompressed_size: 100,
    total_compressed_size: 100,
    data_page_offset: 0
  });

  // tslint:disable-next-line:variable-name
  const obj_bin = serializeThrift(obj);
  assert.equal(obj_bin.length, 25);
  assert.end();
});

test('thrift helpers#should serialize to Uint8Array and decode from typed inputs', assert => {
  const columnMetadata = new parquetThrift.ColumnMetaData({
    type: parquetThrift.Type.BOOLEAN,
    path_in_schema: ['test'],
    codec: parquetThrift.CompressionCodec.UNCOMPRESSED,
    encodings: [parquetThrift.Encoding.PLAIN],
    num_values: 0,
    total_uncompressed_size: 100,
    total_compressed_size: 100,
    data_page_offset: 0
  });

  const serialized = serializeThrift(columnMetadata);
  assert.ok(serialized instanceof Uint8Array, 'serializeThrift should return Uint8Array');
  assert.false(Buffer.isBuffer(serialized), 'serializeThrift should not return Buffer');

  const decodedFromTypedArray = new parquetThrift.ColumnMetaData();
  const bytesConsumedFromTypedArray = decodeThrift(decodedFromTypedArray, serialized);

  assert.equal(bytesConsumedFromTypedArray, serialized.length, 'decodeThrift returns consumed byte count');
  assert.equal(decodedFromTypedArray.type, columnMetadata.type);
  assert.deepEqual(decodedFromTypedArray.path_in_schema, columnMetadata.path_in_schema);
  assert.equal(decodedFromTypedArray.codec, columnMetadata.codec);
  assert.deepEqual(decodedFromTypedArray.encodings, columnMetadata.encodings);
  assert.equal(decodedFromTypedArray.num_values, columnMetadata.num_values);
  assert.equal(decodedFromTypedArray.total_uncompressed_size, columnMetadata.total_uncompressed_size);
  assert.equal(decodedFromTypedArray.total_compressed_size, columnMetadata.total_compressed_size);
  assert.equal(decodedFromTypedArray.data_page_offset, columnMetadata.data_page_offset);

  const paddedBuffer = new Uint8Array(serialized.length + 4);
  paddedBuffer.set(serialized, 2);

  const decodedFromArrayBuffer = new parquetThrift.ColumnMetaData();
  const bytesConsumedFromArrayBuffer = decodeThrift(
    decodedFromArrayBuffer,
    paddedBuffer.buffer,
    2
  );

  assert.equal(bytesConsumedFromArrayBuffer, serialized.length, 'decodeThrift should honor offset');
  assert.equal(decodedFromArrayBuffer.type, columnMetadata.type);
  assert.deepEqual(decodedFromArrayBuffer.path_in_schema, columnMetadata.path_in_schema);
  assert.equal(decodedFromArrayBuffer.codec, columnMetadata.codec);
  assert.deepEqual(decodedFromArrayBuffer.encodings, columnMetadata.encodings);
  assert.equal(decodedFromArrayBuffer.num_values, columnMetadata.num_values);
  assert.equal(decodedFromArrayBuffer.total_uncompressed_size, columnMetadata.total_uncompressed_size);
  assert.equal(decodedFromArrayBuffer.total_compressed_size, columnMetadata.total_compressed_size);
  assert.equal(decodedFromArrayBuffer.data_page_offset, columnMetadata.data_page_offset);

  assert.end();
});
