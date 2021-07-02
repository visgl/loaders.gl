/* eslint-disable camelcase */
import test from 'tape-promise/tape';

import {ColumnMetaData} from '@loaders.gl/parquet/libs/parquet-types';
import {serializeThrift} from '@loaders.gl/parquet/parquetjs/util';

test('thrift#should correctly en/decode literal zeroes with the CompactProtocol', assert => {
  const obj = new ColumnMetaData();
  obj.num_values = 0;

  const obj_bin = serializeThrift(obj);
  assert.equal(obj_bin.length, 3);
  assert.end();
});
