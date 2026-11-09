// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {beforeAll, expect, test, vi} from 'vitest';
import type {TableQuery} from '@loaders.gl/core/scan';
import {query, queryInBatches} from '@loaders.gl/core/scan';
import {convertSchemaToArrow} from '@loaders.gl/core/schema-utils';
import type {TableScanSource, TableScanReadOptions} from '@loaders.gl/core/loader-utils';
import type {Schema} from '@loaders.gl/core/schema';
import {CSVTableSource} from '@loaders.gl/tables/csv/index';
import {NDJSONTableSource} from '@loaders.gl/tables/json/index';
import {ArrowTableSource} from '@loaders.gl/tables/arrow/index';
import {ParquetSource} from '@loaders.gl/tables/parquet-source-loader';
import {ParquetJSWriter} from '@loaders.gl/tables/parquet/index';

const rows = [
  {id: 1, label: 'a', value: null},
  {id: 2, label: 'b', value: 2},
  {id: 3, label: 'c', value: 3},
  {id: 4, label: 'd', value: null},
  {id: 5, label: 'e', value: 5},
  {id: 6, label: 'f', value: 6}
];
const schema: Schema = {
  fields: [
    {name: 'id', type: 'float64', nullable: true},
    {name: 'label', type: 'utf8', nullable: true},
    {name: 'value', type: 'float64', nullable: true}
  ],
  metadata: {fixture: 'query-conformance'}
};
const formats = ['csv', 'ndjson', 'arrow', 'parquet'] as const;
let ipcBytes: Uint8Array;
let parquetBytes: ArrayBuffer;

beforeAll(async () => {
  const data = new arrow.Table({
    id: arrow.vectorFromArray(
      rows.map(row => row.id),
      new arrow.Float64()
    ),
    label: arrow.vectorFromArray(
      rows.map(row => row.label),
      new arrow.Utf8()
    ),
    value: arrow.vectorFromArray(
      rows.map(row => row.value),
      new arrow.Float64()
    )
  });
  data.schema.metadata.set('fixture', 'query-conformance');
  data.schema.fields[1].metadata.set('label-metadata', 'preserved');
  ipcBytes = arrow.tableToIPC(data.slice(0, 2).concat(data.slice(2, 4), data.slice(4)), 'stream');
  parquetBytes = await ParquetJSWriter.encode(
    {shape: 'object-row-table', schema, data: rows},
    {parquet: {rowGroupSize: 2, writeStatistics: true}}
  );
});

/** Creates fresh sources so cancellation and cached discovery cannot leak between cases. */
function createSource(format: (typeof formats)[number]): TableScanSource {
  switch (format) {
    case 'csv':
      return new CSVTableSource(
        new Blob([
          'id,label,value\n',
          ...rows.map(row => `${row.id},${row.label},${row.value ?? row.id}\n`)
        ]),
        {core: {batchSize: 2}}
      );
    case 'ndjson':
      return new NDJSONTableSource(new Blob(rows.map(row => `${JSON.stringify(row)}\n`)), {
        core: {batchSize: 2}
      });
    case 'arrow':
      return new ArrowTableSource(new Blob([new Uint8Array(ipcBytes)]));
    case 'parquet':
      return new ParquetSource(new Blob([parquetBytes]), {core: {worker: false}});
  }
}

/** Releases native source resources when supported. */
async function closeSource(source: TableScanSource): Promise<void> {
  await (source as TableScanSource & {close?: () => Promise<void>}).close?.();
}

for (const format of formats) {
  test(`${format}: collected and streamed aliases, hidden predicates, ordering and global limits agree`, async () => {
    const source = createSource(format);
    try {
      const metadata = await source.getQueryMetadata();
      expect(metadata.capabilities.table?.projection).toBe(
        format === 'parquet' ? 'pushdown' : 'residual'
      );
      const request: TableQuery = {
        select: ['label', {column: 'id', as: 'rowId'}],
        where: {
          op: 'or',
          args: [
            format === 'csv'
              ? {op: '=', args: [{property: 'id'}, 1]}
              : {op: 'isNull', args: [{property: 'value'}]},
            {
              op: 'and',
              args: [
                {op: '>=', args: [{property: 'value'}, 2]},
                {op: '<', args: [{property: 'value'}, 6]}
              ]
            }
          ]
        },
        limit: 3
      } as const;
      const result = await query(request, {source});
      expect(result.data.toArray().map(row => row.toJSON())).toEqual([
        {label: 'a', rowId: 1},
        {label: 'b', rowId: 2},
        {label: 'c', rowId: 3}
      ]);
      const streamed: unknown[] = [];
      for await (const batch of queryInBatches(request, {source}))
        streamed.push(...batch.data.toArray().map(row => row.toJSON()));
      expect(streamed).toEqual(result.data.toArray().map(row => row.toJSON()));
      const inputSchema = convertSchemaToArrow(metadata.schema);
      expect(result.data.schema.metadata).toEqual(inputSchema.metadata);
      expect(result.data.schema.fields[0].metadata).toEqual(
        inputSchema.fields.find(field => field.name === 'label')!.metadata
      );
      expect(result.data.schema.fields.map(field => field.name)).toEqual(['label', 'rowId']);
    } finally {
      await closeSource(source);
    }
  });

  test(`${format}: SQL null semantics and empty aliased schemas survive filtering`, async () => {
    const source = createSource(format);
    try {
      const result = await query(
        {select: ['label'], where: {op: 'not', args: [{op: '>', args: [{property: 'value'}, 3]}]}},
        {source}
      );
      expect(result.data.toArray().map(row => row.label)).toEqual(
        format === 'csv' ? ['a', 'b', 'c'] : ['b', 'c']
      );
      const empty = await query(
        {select: [{column: 'label', as: 'name'}], where: {op: '>', args: [{property: 'id'}, 100]}},
        {source}
      );
      expect(empty.data.numRows).toBe(0);
      expect(empty.data.schema.fields.map(field => field.name)).toEqual(['name']);
    } finally {
      await closeSource(source);
    }
  });

  test(`${format}: zero limits avoid reads and completion is reported once`, async () => {
    const source = createSource(format);
    try {
      const read = vi.fn((options?: TableScanReadOptions) => source.read(options));
      const observed: TableScanSource = {
        getQueryMetadata: options => source.getQueryMetadata(options),
        read
      };
      const onQueryComplete = vi.fn();
      const result = await query(
        {select: [{column: 'id', as: 'rowId'}], limit: 0},
        {source: observed, onQueryComplete}
      );
      expect(result.data.numRows).toBe(0);
      expect(read).not.toHaveBeenCalled();
      expect(onQueryComplete).toHaveBeenCalledTimes(1);
      expect(onQueryComplete.mock.calls[0][0]).toMatchObject({
        sourcesRead: 0,
        rowsReturned: 0,
        earlyTerminationReason: 'limit'
      });
    } finally {
      await closeSource(source);
    }
  });

  test(`${format}: consumer backpressure and cancellation close the source iterator`, async () => {
    const source = createSource(format);
    let closed = false;
    let pulls = 0;
    const observed: TableScanSource = {
      getQueryMetadata: options => source.getQueryMetadata(options),
      read: async function* (options) {
        try {
          for await (const batch of source.read(options)) {
            pulls++;
            yield batch;
          }
        } finally {
          closed = true;
        }
      }
    };
    try {
      const controller = new AbortController();
      const iterator = queryInBatches(
        {select: ['label']},
        {source: observed, signal: controller.signal}
      )[Symbol.asyncIterator]();
      expect(pulls).toBe(0);
      await iterator.next();
      expect(pulls).toBe(1);
      controller.abort();
      await expect(iterator.next()).rejects.toThrow();
      expect(closed).toBe(true);
      expect(pulls).toBe(1);
    } finally {
      await closeSource(source);
    }
  });
}

test('CSV blank fields remain empty strings rather than SQL null', async () => {
  const source = new CSVTableSource(new Blob(['label\na\n""\n']), {core: {batchSize: 2}});
  const result = await query({where: {op: 'isNull', args: [{property: 'label'}]}}, {source});
  expect(result.data.numRows).toBe(0);
});

test('NDJSON infers nullable primitives across a batch and retains types in later null batches', async () => {
  const source = new NDJSONTableSource(
    new Blob(['{"value":null}\n{"value":2}\n{"value":null}\n{"value":null}\n']),
    {core: {batchSize: 2}}
  );
  const metadata = await source.getQueryMetadata();
  expect(metadata.schema.fields[0].type).toBe('float32');
  const result = await query({}, {source});
  expect(result.data.toArray().map(row => row.value)).toEqual([null, 2, null, null]);
});

test('NDJSON declared schema supports discovery when the first batch is entirely null', async () => {
  const source = new NDJSONTableSource(
    new Blob(['{"value":null}\n{"value":null}\n{"value":3}\n']),
    {
      core: {batchSize: 2},
      ndjson: {
        schema: {
          fields: [{name: 'value', type: 'float64', nullable: true}],
          metadata: {}
        } satisfies Schema
      }
    }
  );
  const result = await query({}, {source});
  expect(result.data.toArray().map(row => row.value)).toEqual([null, null, 3]);
});

test('Parquet prunes row groups but still applies the exact predicate before the limit', async () => {
  const source = createSource('parquet') as ParquetSource;
  try {
    const result = await query(
      {select: ['label'], where: {op: '>', args: [{property: 'id'}, 3]}, limit: 1},
      {source}
    );
    expect(result.data.toArray().map(row => row.label)).toEqual(['d']);
    expect(source.getTelemetry().rowGroupsPrunedByStatistics).toBeGreaterThan(0);
    expect(source.getTelemetry().rowGroupsDecoded).toBeLessThan(3);
  } finally {
    await closeSource(source);
  }
});

test('NDJSON rejects inferred output type changes instead of dropping later values', async () => {
  const source = new NDJSONTableSource(
    new Blob(['{"value":null}\n{"value":null}\n{"value":3}\n']),
    {core: {batchSize: 2}}
  );
  await expect(query({}, {source})).rejects.toThrow('Query output schema does not match');
});

test('NDJSON requires a declared type for nested inferred values', async () => {
  const source = new NDJSONTableSource(new Blob(['{"value":{"nested":1}}\n']));
  await expect(query({}, {source})).rejects.toThrow('Declare ndjson.schema');
});

test('NDJSON accepts native Arrow schemas without mutating their metadata', async () => {
  const declaredSchema = new arrow.Schema(
    [new arrow.Field('value', new arrow.Float64(), true, new Map([['unit', 'meters']]))],
    new Map([['origin', 'declared']])
  );
  const source = new NDJSONTableSource(new Blob(['{"value":null}\n{"value":3}\n']), {
    ndjson: {schema: declaredSchema}
  });
  const result = await query({}, {source});
  expect(result.data.toArray().map(row => row.value)).toEqual([null, 3]);
  expect(result.data.schema.metadata.get('origin')).toBe('declared');
  expect(result.data.schema.fields[0].metadata.get('unit')).toBe('meters');
  expect(declaredSchema.fields[0].type).toBeInstanceOf(arrow.Float64);
});

test('NDJSON array rows preserve positional columns and nullable inference', async () => {
  const source = new NDJSONTableSource(new Blob(['[null,"a"]\n[2,"b"]\n[null,"c"]\n']), {
    core: {batchSize: 2}
  });
  const metadata = await source.getQueryMetadata();
  const names = metadata.schema.fields.map(field => field.name);
  const result = await query(
    {
      select: [
        {column: names[0], as: 'value'},
        {column: names[1], as: 'label'}
      ]
    },
    {source}
  );
  expect(result.data.toArray().map(row => row.toJSON())).toEqual([
    {value: null, label: 'a'},
    {value: 2, label: 'b'},
    {value: null, label: 'c'}
  ]);
});

test('NDJSON source accepts declared schema alongside Arrow-only parser controls', async () => {
  const source = new NDJSONTableSource(new Blob(['{"value":null}\n{"value":3}\n']), {
    ndjson: {
      schema: {fields: [{name: 'value', type: 'float64', nullable: true}], metadata: {}},
      arrowConversion: {}
    }
  });
  expect((await query({}, {source})).data.toArray().map(row => row.value)).toEqual([null, 3]);
});
