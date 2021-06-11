/* eslint-disable camelcase */
import test from 'tape-promise/tape';

import * as parquetThrift from '@loaders.gl/parquet/parquetjs/parquet-thrift';
import {serializeThrift} from '@loaders.gl/parquet/parquetjs/utils/read-utils';

test('thrift#should correctly en/decode literal zeroes with the CompactProtocol', assert => {
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
