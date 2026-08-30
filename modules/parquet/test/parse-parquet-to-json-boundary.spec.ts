// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeEach, expect, test, vi} from 'vitest';

const parquetMocks = vi.hoisted(() => ({
  batches: [] as Array<Array<Record<string, unknown>>>,
  constructorOptions: null as Record<string, unknown> | null,
  iterationOptions: null as Record<string, unknown> | undefined,
  preloadCompressions: vi.fn(),
  schema: {
    fields: [
      {name: 'id', type: 'int32'},
      {name: 'name', type: 'utf8'}
    ],
    metadata: {source: 'mock'}
  }
}));

vi.mock('../src/parquetjs/parser/parquet-reader', () => ({
  ParquetReader: class {
    constructor(_file: unknown, options: Record<string, unknown>) {
      parquetMocks.constructorOptions = options;
    }

    async *rowBatchIterator(options?: Record<string, unknown>) {
      parquetMocks.iterationOptions = options;
      for (const batch of parquetMocks.batches) yield batch;
    }
  }
}));

vi.mock('../src/lib/parsers/get-parquet-schema', () => ({
  getSchemaFromParquetReader: vi.fn(async () => parquetMocks.schema)
}));

vi.mock('../src/parquetjs/compression', () => ({
  preloadCompressions: parquetMocks.preloadCompressions
}));

import {
  parseParquetFile,
  parseParquetFileInBatches
} from '../src/lib/parsers/parse-parquet-to-json';

beforeEach(() => {
  parquetMocks.batches = [];
  parquetMocks.constructorOptions = null;
  parquetMocks.iterationOptions = undefined;
  parquetMocks.preloadCompressions.mockClear();
});

test('parseParquetFile applies projection, offset, and limits to mocked row batches', async () => {
  parquetMocks.batches = [[{id: 0, name: 'zero'}, {id: 1, name: 'one'}], [{id: 2, name: 'two'}]];

  const table = await parseParquetFile({} as never, {
    parquet: {
      columns: ['name'],
      offset: 1,
      limit: 1,
      preserveBinary: true,
      int96AsTimestamp: false,
      verifyFooterSignature: true
    }
  });

  expect(table.data).toEqual([{id: 1, name: 'one'}]);
  expect(table.schema.fields.map(field => field.name)).toEqual(['name']);
  expect(parquetMocks.iterationOptions).toEqual({columnList: ['name']});
  expect(parquetMocks.constructorOptions).toMatchObject({
    preserveBinary: true,
    int96AsTimestamp: false,
    verifyFooterSignature: true,
    retainByteArrayViews: true,
    useTypedValueBuffers: true,
    useTypedLevelBuffers: true,
    useArrowByteArrayBuffers: true
  });
  expect(parquetMocks.preloadCompressions).toHaveBeenCalledOnce();
});

test('parseParquetFileInBatches slices output batches and stops exactly at the row limit', async () => {
  parquetMocks.batches = [
    Array.from({length: 6}, (_value, id) => ({id, name: `row-${id}`}))
  ];

  const batches = await collect(
    parseParquetFileInBatches({} as never, {
      parquet: {columns: ['id'], offset: 1, limit: 4, batchSize: 2}
    })
  );

  expect(batches.map(batch => batch.data.map(row => row.id))).toEqual([
    [1, 2],
    [3, 4]
  ]);
  expect(batches.map(batch => batch.length)).toEqual([2, 2]);
  expect(batches[0].schema.fields.map(field => field.name)).toEqual(['id']);
  expect(batches.every(batch => batch.batchType === 'data')).toBe(true);
});

test('parseParquetFileInBatches preserves source batches when output sizing is disabled', async () => {
  parquetMocks.batches = [[], [{id: 1, name: 'one'}], [{id: 2, name: 'two'}]];

  const batches = await collect(
    parseParquetFileInBatches({} as never, {parquet: {batchSize: 0}})
  );

  expect(batches.map(batch => batch.data)).toEqual([
    [{id: 1, name: 'one'}],
    [{id: 2, name: 'two'}]
  ]);
  expect(parquetMocks.iterationOptions).toBeUndefined();
  expect(batches[0].schema).toBe(parquetMocks.schema);
});

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const values: T[] = [];
  for await (const value of iterable) values.push(value);
  return values;
}
