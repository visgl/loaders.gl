// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {makeTableFromData} from '@loaders.gl/schema-utils';
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
test.skip('makeTableFromData', async () => {
  const table = makeTableFromData(ALL_TYPES_PLAIN_PLAIN_TABLE);
  expect(table.data.length).toBe(8);
});
test('makeTableFromData', async () => {
  for (const tc of TABLES) {
    const table = makeTableFromData(tc.table);
    expect(table.data.length, tc.name).toBe(tc.length);
  }
});
