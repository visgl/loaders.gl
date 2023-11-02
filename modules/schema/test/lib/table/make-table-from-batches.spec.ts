// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {makeTableFromBatches, makeTableFromData, makeBatchesFromTable, getTableLength} from '@loaders.gl/schema';

// import * from '../../data/table/tables';
import {
  TABLES,
  // ALL_TYPES_DICTIONARY_PLAIN_TABLE,
  ALL_TYPES_PLAIN_PLAIN_TABLE
  // ALL_TYPES_PLAIN_SNAPPY_PLAIN_TABLE,
  // BINARY_PLAIN_TABLE,
  // DECIMAL_PLAIN_TABLE,
  // DICT_PLAIN_TABLE,
  // LIST_COLUMNS_PLAIN_TABLE,
  // NESTED_LIST_PLAIN_TABLE,
  // NESTED_MAPS_PLAIN_TABLE,
  // NO_NULLABLE_PLAIN_TABLE,
  // NULLABLE_PLAIN_TABLE,
  // NULLS_PLAIN_TABLE,
  // REPEATED_NO_ANNOTATION_PLAIN_TABLE,
  // LZ4_RAW_COMPRESSED_LARGER_FIRST_PLAIN_TABLE,
  // LZ4_RAW_COMPRESSED_LARGER_LAST_PLAIN_TABLE,
  // LZ4_RAW_COMPRESSED_PLAIN_TABLE,
  // NON_HADOOP_LZ4_COMPRESSED_PLAIN_TABLE
} from '../../data/table/tables';

test.skip('makeTableFromBatches', async (t) => {
  const tempTable = makeTableFromData(ALL_TYPES_PLAIN_PLAIN_TABLE);
  const batches = makeBatchesFromTable(tempTable);
  const table = await makeTableFromBatches(batches);
  t.equal(getTableLength(table!), 8);
  t.end();
});

test.only('makeTableFromBatches', async (t) => {
  for (const tc of TABLES) {
    const tempTable = makeTableFromData(tc.table);
    const batches = makeBatchesFromTable(tempTable);
    const table = await makeTableFromBatches(batches);
    t.equal(getTableLength(table!), tc.length, tc.name);
  }
  t.end();
});
