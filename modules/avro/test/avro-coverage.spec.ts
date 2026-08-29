// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable} from '@loaders.gl/schema';
import {expect, test} from 'vitest';
import {compressAvro, decompressAvro} from '../src/avro-compression';
import {AvroLoaderWithParser} from '../src/avro-loader';
import {parseAvroOCF} from '../src/avro-ocf';
import {encodeAvroInChunks} from '../src/avro-stream';
import {AvroWriter} from '../src/avro-writer';

test('Avro Snappy compression appends and validates the block checksum', async () => {
  const value = new TextEncoder().encode('snappy checksum coverage');
  const compressed = await compressAvro('snappy', value);

  expect(compressed.length).toBeGreaterThan(4);
  await expect(decompressAvro('snappy', compressed)).resolves.toEqual(value);

  const corrupted = compressed.slice();
  corrupted[corrupted.length - 1] ^= 1;
  await expect(decompressAvro('snappy', corrupted)).rejects.toThrow(/CRC32 check failed/);
});

test('AvroWriter encodes non-empty arrays and object and Map values', async () => {
  const schema = {
    type: 'record',
    name: 'Collections',
    fields: [
      {name: 'tags', type: {type: 'array', items: 'string'}},
      {name: 'objectAttributes', type: {type: 'map', values: 'int'}},
      {name: 'mapAttributes', type: {type: 'map', values: 'long'}}
    ]
  } as const;
  const output = await AvroWriter.encode(
    makeArrowTable({
      tags: ['one', 'two'],
      objectAttributes: {first: 1},
      mapAttributes: new Map([['second', 2]])
    }),
    {avro: {schema}}
  );
  const container = parseAvroOCF(output);
  expect(container.blocks).toHaveLength(1);
  expect(container.blocks[0].count).toBe(1);
});

test('AvroWriter selects primitive union branches and nested schema wrappers', async () => {
  const schema = {
    type: 'record',
    name: 'UnionValues',
    fields: [
      {name: 'enabled', type: ['string', 'boolean']},
      {name: 'payload', type: ['null', 'bytes']},
      {name: 'count', type: {type: ['null', 'int']}},
      {name: 'label', type: {type: {type: 'string'}}}
    ]
  } as const;
  const output = await AvroWriter.encode(
    makeArrowTable({
      enabled: true,
      payload: [1, 2, 3],
      count: 7,
      label: 'wrapped'
    }),
    {avro: {schema}}
  );

  await expect(AvroLoaderWithParser.parse(output)).resolves.toMatchObject({shape: 'arrow-table'});
});

test('AvroWriter derives primitive and logical schemas from Arrow field names', async () => {
  const output = await AvroWriter.encode(
    makeDerivedArrowTable({
      enabled: {type: 'Bool', value: false},
      payload: {type: 'Binary', value: new Uint8Array([1, 2])},
      day: {type: 'DateDay', value: 1},
      milliseconds: {type: 'TimestampMillisecond', value: 2},
      microseconds: {type: 'TimestampMicrosecond', value: 3},
      small: {type: 'Float32', value: 1.5},
      large: {type: 'Float64', value: 2.5}
    })
  );

  expect(parseAvroOCF(output).blocks).toHaveLength(1);
  await expect(
    AvroWriter.encode(makeDerivedArrowTable({value: {type: 'Unsupported', value: 1}}))
  ).rejects.toThrow(/cannot derive a schema/);
});

test('AvroWriter covers primitive fallback values and byte representations', async () => {
  const schema = {
    type: 'record',
    name: 'PrimitiveValues',
    fields: [
      {name: 'enabled', type: 'boolean'},
      {name: 'integer', type: 'int'},
      {name: 'longInteger', type: 'long'},
      {name: 'floatValue', type: 'float'},
      {name: 'doubleValue', type: 'double'},
      {name: 'payload', type: 'bytes'}
    ]
  } as const;
  const output = await AvroWriter.encode(
    makeArrowTable({
      enabled: false,
      integer: null,
      longInteger: -2n,
      floatValue: null,
      doubleValue: null,
      payload: new Uint8Array([4, 5]).buffer
    }),
    {avro: {schema}}
  );

  expect(parseAvroOCF(output).blocks).toHaveLength(1);
});

test('chunked Avro output rejects raw and single-object encodings', async () => {
  const schema = {type: 'record', name: 'Value', fields: []} as const;
  for (const encoding of ['raw', 'single-object'] as const) {
    await expect(
      collectChunks(encodeAvroInChunks(makeArrowTable({}), {avro: {schema, encoding}}))
    ).rejects.toThrow(/do not support chunked OCF output/);
  }
});

test('AvroWriter rejects invalid root schemas, unions, enums, fixed values, and options', async () => {
  const table = makeArrowTable({value: 'invalid'});
  await expect(AvroWriter.encode(table, {avro: {schema: 'string'}})).rejects.toThrow(
    /root record schema/
  );
  await expect(
    AvroWriter.encode(table, {
      avro: {
        schema: {
          type: 'record',
          name: 'UnionValue',
          fields: [{name: 'value', type: ['null', 'int']}]
        }
      }
    })
  ).rejects.toThrow(/union branch/);
  await expect(
    AvroWriter.encode(table, {
      avro: {
        schema: {
          type: 'record',
          name: 'EnumValue',
          fields: [{name: 'value', type: {type: 'enum', name: 'Kind', symbols: ['A']}}]
        }
      }
    })
  ).rejects.toThrow(/Unknown Avro enum symbol/);
  await expect(
    AvroWriter.encode(makeArrowTable({value: [1]}), {
      avro: {
        schema: {
          type: 'record',
          name: 'FixedValue',
          fields: [{name: 'value', type: {type: 'fixed', name: 'Value', size: 2}}]
        }
      }
    })
  ).rejects.toThrow(/fixed value must contain 2 bytes/);
  await expect(
    AvroWriter.encode(table, {
      avro: {schema: {type: 'record', name: 'Value', fields: []}, syncMarker: new Uint8Array(1)}
    })
  ).rejects.toThrow(/16 bytes/);
  await expect(
    AvroWriter.encode(table, {
      avro: {schema: {type: 'record', name: 'Value', fields: []}, blockSize: -1}
    })
  ).rejects.toThrow(/block size must be positive/);
});

/** Creates the minimal Arrow table surface required by the Avro writer. */
function makeArrowTable(record: Record<string, unknown>): ArrowTable {
  return {
    shape: 'arrow-table',
    data: {
      numRows: 1,
      getChild: (name: string) => ({get: () => record[name]})
    }
  } as unknown as ArrowTable;
}

/** Creates an Arrow-like table whose field type names exercise schema derivation. */
function makeDerivedArrowTable(
  columns: Record<string, {type: string; value: unknown}>
): ArrowTable {
  return {
    shape: 'arrow-table',
    data: {
      numRows: 1,
      schema: {
        fields: Object.entries(columns).map(([name, column]) => ({
          name,
          type: {toString: () => column.type}
        }))
      },
      getChild: (name: string) => ({get: () => columns[name].value})
    }
  } as unknown as ArrowTable;
}

/** Collects an async byte stream so generator validation errors become promise rejections. */
async function collectChunks(chunks: AsyncIterable<Uint8Array>): Promise<Uint8Array[]> {
  const result: Uint8Array[] = [];
  for await (const chunk of chunks) result.push(chunk);
  return result;
}
