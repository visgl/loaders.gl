import {expect, test} from 'vitest';

import {encode} from '@loaders.gl/core';
import {BlobFile} from '@loaders.gl/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/schema';

import {ParquetJSWriter} from '../src/parquet-js-writer';
import {ParquetReader} from '../src/parquetjs/parser/parquet-reader';

const TABLE: ObjectRowTable = {
  shape: 'object-row-table',
  schema: {
    fields: [
      {name: 'label', type: 'utf8', nullable: true},
      {name: 'value', type: 'int32', nullable: true}
    ],
    metadata: {}
  },
  data: [
    {label: 'alpha', value: 1},
    {label: null, value: null},
    {label: 'beta', value: 2}
  ]
};

test('ParquetJSWriter emits optional SizeStatistics metadata', async () => {
  const parquetBuffer = await encode(TABLE, ParquetJSWriter, {
    worker: false,
    parquet: {writeSizeStatistics: true, writeStatistics: true}
  });
  const metadata = await new ParquetReader(new BlobFile(parquetBuffer)).getFileMetadata();
  const [label, value] = metadata.row_groups[0].columns.map(column => column.meta_data!);

  expect(new TextDecoder().decode(label.statistics?.min_value)).toBe('alpha');
  expect(new TextDecoder().decode(label.statistics?.max_value)).toBe('beta');
  expect(label.statistics?.null_count?.toNumber()).toBe(1);
  expect(value.statistics?.min_value?.[0]).toBe(1);
  expect(value.statistics?.max_value?.[0]).toBe(2);
  expect(value.statistics?.null_count?.toNumber()).toBe(1);
  expect(label.size_statistics).toBeDefined();
  expect(label.size_statistics?.unencoded_byte_array_data_bytes?.toNumber()).toBe(9);
  expect(label.size_statistics?.definition_level_histogram?.map(item => item.toNumber())).toEqual([
    1,
    2
  ]);
  expect(value.size_statistics?.definition_level_histogram?.map(item => item.toNumber())).toEqual([
    1,
    2
  ]);
  expect(value.size_statistics?.repetition_level_histogram?.map(item => item.toNumber())).toEqual([
    3
  ]);
});

test('ParquetJSWriter supports per-column standard statistics', async () => {
  const parquetBuffer = await encode(TABLE, ParquetJSWriter, {
    worker: false,
    parquet: {writeStatistics: {label: true}}
  });
  const metadata = await new ParquetReader(new BlobFile(parquetBuffer)).getFileMetadata();
  const [label, value] = metadata.row_groups[0].columns.map(column => column.meta_data!);

  expect(label.statistics).toBeDefined();
  expect(value.statistics).toBeUndefined();
});

test('ParquetJSWriter records declared row-group sorting columns', async () => {
  const parquetBuffer = await encode(TABLE, ParquetJSWriter, {
    worker: false,
    parquet: {sortingColumns: [{column: 'label'}, {column: 'value', descending: true, nullsFirst: true}]}
  });
  const metadata = await new ParquetReader(new BlobFile(parquetBuffer)).getFileMetadata();
  expect(metadata.row_groups[0].sorting_columns?.map(column => ({
    columnIndex: column.column_idx,
    descending: column.descending,
    nullsFirst: column.nulls_first
  }))).toEqual([
    {columnIndex: 0, descending: false, nullsFirst: false},
    {columnIndex: 1, descending: true, nullsFirst: true}
  ]);
});

test('ParquetJSWriter omits SizeStatistics by default', async () => {
  const parquetBuffer = await encode(TABLE, ParquetJSWriter, {worker: false});
  const metadata = await new ParquetReader(new BlobFile(parquetBuffer)).getFileMetadata();
  expect(metadata.row_groups[0].columns[0].meta_data?.size_statistics).toBeUndefined();
});
