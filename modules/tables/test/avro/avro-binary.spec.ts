// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test, vi} from 'vitest';
import {AvroWriter} from '../../src/avro/avro-writer';
import {
  parseAvro,
  parseAvroFromFile,
  parseAvroFromUrl,
  parseAvroInBatches,
  parseAvroInBatchesFromFile,
  parseAvroInBatchesFromUrl
} from '../../src/avro/lib/parsers/parse-avro';

const PAYLOADS = [
  null,
  new Uint8Array([1, 2, 3]),
  new Uint8Array([4, 5, 6, 7, 8]),
  new Uint8Array([9]),
  new Uint8Array()
];
const SCHEMA = {type: 'record', name: 'Row', fields: [{name: 'payload', type: ['null', 'bytes']}]};

/** Writes a small binary fixture with independently sized values. */
async function encodeFixture(
  encoding: 'ocf' | 'raw' | 'single-object' = 'ocf'
): Promise<ArrayBuffer> {
  const values = encoding === 'ocf' ? PAYLOADS : [PAYLOADS[2]];
  return AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: new arrow.Table({
        payload: arrow.vectorFromArray(values, new arrow.Binary())
      })
    },
    {avro: {schema: SCHEMA, encoding, blockSize: 1}}
  );
}

/** Checks the binary type and each value without coercing Arrow structs back to arrays. */
function expectPayloads(table: arrow.Table, values = PAYLOADS): void {
  const column = table.getChild('payload')!;
  expect(column.type).toBeInstanceOf(arrow.Binary);
  expect(Array.from(column, value => (value === null ? null : Array.from(value)))).toEqual(
    values.map(value => (value === null ? null : Array.from(value)))
  );
}

test('Avro preserves variable-length bytes, including first-row null and empty bytes', async () => {
  expectPayloads((await parseAvro(await encodeFixture())).data);
});

test.each(['raw', 'single-object'] as const)('Avro preserves bytes in %s input', async encoding => {
  expectPayloads(
    (await parseAvro(await encodeFixture(encoding), {encoding, schema: SCHEMA})).data,
    [PAYLOADS[2]]
  );
});

test('Avro keeps binary types across batch boundaries', async () => {
  const batches = [];
  for await (const batch of parseAvroInBatches(await encodeFixture(), 1)) batches.push(batch.data);
  expectPayloads(batches[0].concat(...batches.slice(1)));
});

test.each([
  false,
  true
])('Avro preserves binary values through file loading (ranged=%s)', async ranged => {
  const bytes = new Uint8Array(await encodeFixture());
  const file = {
    size: ranged ? 2048 : bytes.length,
    bigsize: BigInt(ranged ? 2048 : bytes.length),
    read: async (offset: number, length: number) => {
      if (offset >= bytes.length) return new Uint8Array(2).buffer;
      return bytes.slice(offset, offset + length).buffer;
    }
  };
  const options = {batchSize: 1, rangeChunkSize: 1024};
  expectPayloads((await parseAvroFromFile(file as any, options)).data);
  const batches = [];
  for await (const batch of parseAvroInBatchesFromFile(file as any, options))
    batches.push(batch.data);
  expectPayloads(batches[0].concat(...batches.slice(1)));
});

test.each([
  false,
  true
])('Avro preserves binary values through URL loading (ranged=%s)', async ranged => {
  const bytes = new Uint8Array(await encodeFixture());
  vi.stubGlobal('fetch', async (_url: string, options: RequestInit) => {
    if (!ranged) return new Response(bytes);
    const range = /^bytes=(\d+)-(\d+)$/.exec(new Headers(options.headers).get('Range')!)!;
    const start = Number(range[1]);
    if (start >= bytes.length) return new Response(null, {status: 416});
    return new Response(bytes.slice(start, Number(range[2]) + 1), {status: 206});
  });
  try {
    const options = {batchSize: 1, rangeChunkSize: 1024};
    expectPayloads((await parseAvroFromUrl('https://avro.invalid/fixture', options)).data);
    const batches = [];
    for await (const batch of parseAvroInBatchesFromUrl('https://avro.invalid/fixture', options))
      batches.push(batch.data);
    expectPayloads(batches[0].concat(...batches.slice(1)));
  } finally {
    vi.unstubAllGlobals();
  }
});

test('Avro applies binary schemas inside records, arrays, maps, and named fixed references', async () => {
  const {createAvroTable} = await import('../../src/avro/lib/parsers/create-avro-table');
  const schema = {
    type: 'record',
    name: 'Nested',
    fields: [
      {
        name: 'record',
        type: {type: 'record', name: 'Child', fields: [{name: 'bytes', type: 'bytes'}]}
      },
      {name: 'list', type: {type: 'array', items: 'bytes'}},
      {name: 'map', type: {type: 'map', values: 'bytes'}},
      {name: 'fixed', type: {type: 'fixed', name: 'Pair', size: 2}},
      {name: 'reference', type: 'Pair'},
      {name: 'unknownLogical', type: {type: 'bytes', logicalType: 'custom-bytes'}}
    ]
  };
  const values = PAYLOADS.slice(1);
  const rows = values.map(bytes => ({
    record: {bytes},
    list: [bytes],
    map: new Map([['key', bytes]]),
    fixed: new Uint8Array([8, 9]),
    reference: new Uint8Array([6, 7]),
    unknownLogical: bytes
  }));
  const result = createAvroTable(rows, schema);
  for (let index = 0; index < rows.length; index++) {
    expect(Array.from(result.getChild('record')!.get(index).bytes)).toEqual(
      Array.from(values[index]!)
    );
    expect(Array.from(result.getChild('list')!.get(index).get(0))).toEqual(
      Array.from(values[index]!)
    );
    expect(Array.from(result.getChild('map')!.get(index).key)).toEqual(Array.from(values[index]!));
    expect(Array.from(result.getChild('fixed')!.get(index))).toEqual([8, 9]);
    expect(Array.from(result.getChild('reference')!.get(index))).toEqual([6, 7]);
    expect(Array.from(result.getChild('unknownLogical')!.get(index))).toEqual(
      Array.from(values[index]!)
    );
  }
});

test('Avro uses reader field names and preserves binary types in empty tables', async () => {
  const {createAvroTable} = await import('../../src/avro/lib/parsers/create-avro-table');
  expectPayloads(createAvroTable([], SCHEMA), []);
  const readerSchema = {
    type: 'record',
    name: 'Row',
    fields: [{name: 'renamed', aliases: ['payload'], type: ['null', 'bytes']}]
  };
  const result = await parseAvro(await encodeFixture(), {readerSchema});
  const column = result.data.getChild('renamed')!;
  expect(column.type).toBeInstanceOf(arrow.Binary);
  expect(Array.from(column, value => (value === null ? null : Array.from(value)))).toEqual(
    PAYLOADS.map(value => (value === null ? null : Array.from(value)))
  );
});

test('Avro preserves the reported three unequal byte lengths', async () => {
  const values = PAYLOADS.slice(1, 4);
  const encoded = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: new arrow.Table({payload: arrow.vectorFromArray(values, new arrow.Binary())})
    },
    {avro: {schema: SCHEMA}}
  );
  expectPayloads((await parseAvro(encoded)).data, values);
});

test('Avro converts reader binary defaults by code point instead of UTF-8', async () => {
  const readerSchema = {
    type: 'record',
    name: 'Row',
    fields: [
      {name: 'payload', type: ['null', 'bytes']},
      {name: 'bytesDefault', type: 'bytes', default: '\u00ff\u0000'},
      {name: 'fixedDefault', type: {type: 'fixed', name: 'Pair', size: 2}, default: '\u00ff\u0000'}
    ]
  };
  const table = (await parseAvro(await encodeFixture(), {readerSchema})).data;
  for (const name of ['bytesDefault', 'fixedDefault']) {
    expect(Array.from(table.getChild(name)!.get(0))).toEqual([255, 0]);
  }
});

test('Avro preserves nullable bigint column types across batches', async () => {
  const schema = {type: 'record', name: 'Longs', fields: [{name: 'value', type: ['null', 'long']}]};
  const encoded = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: new arrow.Table({
        value: arrow.vectorFromArray([null, 9007199254740993n], new arrow.Int64())
      })
    },
    {avro: {schema}}
  );
  const batches = [];
  for await (const batch of parseAvroInBatches(encoded, 1, {longType: 'bigint'}))
    batches.push(batch.data);
  expect(Array.from(batches[0].concat(batches[1]).getChild('value')!)).toEqual([
    null,
    9007199254740993n
  ]);
});

test('Avro normalizes promoted longs and reader defaults for bigint columns', async () => {
  const schema = {type: 'record', name: 'Promoted', fields: [{name: 'value', type: 'int'}]};
  const readerSchema = {
    type: 'record',
    name: 'Promoted',
    fields: [
      {name: 'value', type: 'long'},
      {name: 'added', type: 'long', default: 7}
    ]
  };
  const encoded = await AvroWriter.encode(
    {shape: 'arrow-table', data: arrow.tableFromArrays({value: [42]})},
    {avro: {schema}}
  );
  const table = (await parseAvro(encoded, {readerSchema, longType: 'bigint'})).data;
  expect(table.getChild('value')!.get(0)).toBe(42n);
  expect(table.getChild('added')!.get(0)).toBe(7n);
});

test('Avro retains row counts for records with no fields', async () => {
  const {createAvroTable} = await import('../../src/avro/lib/parsers/create-avro-table');
  expect(createAvroTable([{}, {}], {type: 'record', name: 'Empty', fields: []}).numRows).toBe(2);
});

test.each([
  'bytes',
  'fixed'
] as const)('Avro preserves nullable %s with object-form null branches', async kind => {
  const {createAvroTable} = await import('../../src/avro/lib/parsers/create-avro-table');
  const values =
    kind === 'bytes'
      ? [null, new Uint8Array([1, 2, 3]), new Uint8Array([9])]
      : [null, new Uint8Array([1, 2]), new Uint8Array([3, 4])];
  const binarySchema = kind === 'bytes' ? {type: 'bytes'} : {type: 'fixed', name: 'Pair', size: 2};
  const table = createAvroTable(
    values.map(payload => ({payload})),
    {
      type: 'record',
      name: 'Nullable',
      fields: [{name: 'payload', type: [{type: 'null'}, binarySchema]}]
    }
  );
  const column = table.getChild('payload')!;
  expect(column.type).toBeInstanceOf(kind === 'bytes' ? arrow.Binary : arrow.FixedSizeBinary);
  expect(Array.from(column, value => (value === null ? null : Array.from(value)))).toEqual(
    values.map(value => (value === null ? null : Array.from(value)))
  );
});
