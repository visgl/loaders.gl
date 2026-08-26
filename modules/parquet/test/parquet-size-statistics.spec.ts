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

test('ParquetJSWriter emits page statistics for V1 and V2 data pages', async () => {
  for (const useDataPageV2 of [false, true]) {
    const parquetBuffer = await encode(TABLE, ParquetJSWriter, {
      worker: false,
      parquet: {pageSize: 1, writeStatistics: true, useDataPageV2}
    });
    const reader = new ParquetReader(new BlobFile(parquetBuffer));
    const metadata = await reader.getFileMetadata();
    const rowGroup = await reader.readRowGroup(await reader.getSchema(), metadata.row_groups[0], []);
    const pageHeaders = rowGroup.columnData.label.pageHeaders;

    expect(pageHeaders).toHaveLength(3);
    expect(pageHeaders[0].data_page_header?.statistics?.min_value?.length ??
      pageHeaders[0].data_page_header_v2?.statistics?.min_value?.length).toBeGreaterThan(0);
    expect(pageHeaders[1].data_page_header?.statistics?.null_count?.toNumber() ??
      pageHeaders[1].data_page_header_v2?.statistics?.null_count?.toNumber()).toBe(1);
  }
});

test('ParquetJSWriter omits SizeStatistics by default', async () => {
  const parquetBuffer = await encode(TABLE, ParquetJSWriter, {worker: false});
  const metadata = await new ParquetReader(new BlobFile(parquetBuffer)).getFileMetadata();
  expect(metadata.row_groups[0].columns[0].meta_data?.size_statistics).toBeUndefined();
});
