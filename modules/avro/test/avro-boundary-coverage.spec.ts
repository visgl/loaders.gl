// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {afterEach, describe, expect, test, vi} from 'vitest';
import {encodeAvro, encodeAvroInChunks} from '../src/lib/encoders/encode-avro';
import {
  getAvroSchemaFingerprint,
  parseAvro,
  parseAvroFromUrl,
  parseAvroInBatches,
  parseAvroInBatchesFromUrl
} from '../src/lib/parsers/parse-avro';

afterEach(() => vi.unstubAllGlobals());

/** Creates the minimal Arrow-table contract needed by the Avro encoder. */
function createStructuralTable(rows: Record<string, unknown>[]) {
  const fields = Object.keys(rows[0] || {}).map(name => ({name, type: {toString: () => 'Utf8'}}));
  return {
    shape: 'arrow-table',
    data: {
      numRows: rows.length,
      schema: {fields},
      getChild(name: string) {
        return {get: (index: number) => rows[index][name]};
      }
    }
  } as any;
}

/** Encodes one structural row using raw Avro encoding. */
async function encodeRaw(schema: any, row: Record<string, unknown>): Promise<ArrayBuffer> {
  return await encodeAvro(createStructuralTable([row]), {avro: {schema, encoding: 'raw'}});
}

/** Collects all batches from one async Avro iterator. */
async function collectBatches(iterator: AsyncIterable<any>): Promise<any[]> {
  const batches: any[] = [];
  for await (const batch of iterator) batches.push(batch);
  return batches;
}

describe('Avro boundary coverage', () => {
  test('round-trips primitive, container, enum, fixed, and nested schema forms', async () => {
    const schema = {
      type: 'record',
      name: 'Everything',
      fields: [
        {name: 'nothing', type: 'null'},
        {name: 'enabled', type: 'boolean'},
        {name: 'small', type: 'int'},
        {name: 'large', type: 'long'},
        {name: 'ratio', type: 'float'},
        {name: 'score', type: 'double'},
        {name: 'payload', type: 'bytes'},
        {name: 'label', type: 'string'},
        {name: 'choice', type: {type: 'enum', name: 'Choice', symbols: ['A', 'B']}},
        {name: 'token', type: {type: 'fixed', name: 'Token', size: 2}},
        {name: 'values', type: {type: 'array', items: 'int'}},
        {name: 'properties', type: {type: 'map', values: 'long'}},
        {name: 'optional', type: {type: ['null', 'string']}},
        {name: 'wrapped', type: {type: {type: 'int'}}}
      ]
    };
    const row = {
      nothing: null,
      enabled: true,
      small: -5,
      large: 9007199254740993n,
      ratio: 1.25,
      score: -2.5,
      payload: [1, 2, 3],
      label: 'hello',
      choice: 'B',
      token: new Uint8Array([4, 5]),
      values: [1, 2],
      properties: new Map([
        ['a', 1],
        ['b', 2]
      ]),
      optional: 'present',
      wrapped: 7
    };
    const encoded = await encodeRaw(schema, row);
    const result = await parseAvro(encoded, {encoding: 'raw', schema, longType: 'bigint'});
    const decoded = result.data.toArray()[0] as any;

    expect(decoded).toMatchObject({enabled: true, small: -5, choice: 'B', label: 'hello'});
    expect(decoded.large).toBe(9007199254740993n);
    expect(Array.from(decoded.values)).toEqual([1, 2]);
  });

  test('derives common Avro schemas from Arrow field types', async () => {
    const table = {
      shape: 'arrow-table' as const,
      data: arrow.tableFromArrays({
        enabled: arrow.vectorFromArray([true], new arrow.Bool()),
        payload: arrow.vectorFromArray([new Uint8Array([1])], new arrow.Binary()),
        small: new Int16Array([2]),
        large: arrow.vectorFromArray([3n], new arrow.Int64()),
        ratio: new Float32Array([1.5]),
        score: new Float64Array([2.5])
      })
    };
    const result = await parseAvro(await encodeAvro(table));
    expect(result.data.numRows).toBe(1);
  });

  test('projects reader aliases, defaults, unions, and numeric promotions', async () => {
    const writerSchema = {
      type: 'record',
      name: 'OldRecord',
      fields: [
        {name: 'oldName', type: 'string'},
        {name: 'count', type: 'int'},
        {name: 'items', type: {type: 'array', items: 'int'}},
        {name: 'labels', type: {type: 'map', values: 'string'}}
      ]
    };
    const readerSchema = {
      type: 'record',
      name: 'NewRecord',
      aliases: ['OldRecord'],
      fields: [
        {name: 'name', aliases: ['oldName'], type: 'string'},
        {name: 'count', type: ['null', 'double']},
        {name: 'items', type: {type: 'array', items: 'long'}},
        {name: 'labels', type: {type: 'map', values: 'string'}},
        {name: 'added', type: 'boolean', default: true}
      ]
    };
    const encoded = await encodeRaw(writerSchema, {
      oldName: 'renamed',
      count: 4,
      items: [1, 2],
      labels: new Map([['x', 'y']])
    });
    const result = await parseAvro(encoded, {
      encoding: 'raw',
      schema: writerSchema,
      readerSchema
    });
    expect(result.data.toArray()[0]).toMatchObject({name: 'renamed', count: 4, added: true});
  });

  test('supports automatic single-object detection and optional fingerprint validation', async () => {
    const schema = {
      type: 'record',
      name: 'Single',
      fields: [{name: 'id', type: 'int'}]
    };
    const encoded = await encodeAvro(createStructuralTable([{id: 9}]), {
      avro: {schema, encoding: 'single-object'}
    });
    const bytes = new Uint8Array(encoded);
    const detected = await parseAvro(encoded, {schema, encoding: 'auto'});
    expect(detected.data.getChild('id')?.get(0)).toBe(9);

    bytes[2] ^= 0xff;
    await expect(parseAvro(bytes.buffer, {schema, encoding: 'single-object'})).rejects.toThrow(
      'fingerprint does not match'
    );
    await expect(
      parseAvro(bytes.buffer, {schema, encoding: 'single-object', validateFingerprint: false})
    ).resolves.toMatchObject({shape: 'arrow-table'});
  });

  test('validates raw and single-object envelopes', async () => {
    const recordSchema = {type: 'record', name: 'Value', fields: [{name: 'id', type: 'int'}]};
    await expect(parseAvro(new ArrayBuffer(0), {encoding: 'raw'})).rejects.toThrow(
      'require avro.schema'
    );
    await expect(
      parseAvro(new Uint8Array([1, 2]).buffer, {encoding: 'single-object', schema: recordSchema})
    ).rejects.toThrow('Invalid Avro single-object encoding marker');
    await expect(
      parseAvro(new Uint8Array([0xc3, 0x01]).buffer, {
        encoding: 'single-object',
        schema: recordSchema
      })
    ).rejects.toThrow('Truncated Avro single-object encoding');
    await expect(
      parseAvro(new Uint8Array([0]).buffer, {encoding: 'raw', schema: 'int'})
    ).rejects.toThrow('root schema must be a record');
  });

  test('validates writer framing and root schema options', async () => {
    const table = createStructuralTable([{id: 1}]);
    await expect(encodeAvro(table, {avro: {schema: 'int' as any}})).rejects.toThrow(
      'root record schema'
    );
    await expect(
      encodeAvro(table, {
        avro: {schema: {type: 'record', fields: []}, syncMarker: new Uint8Array(3)}
      })
    ).rejects.toThrow('exactly 16 bytes');
    await expect(
      encodeAvro(table, {avro: {schema: {type: 'record', fields: []}, blockSize: -1}})
    ).rejects.toThrow('block size must be positive');
    await expect(
      collectBatches(encodeAvroInChunks(table, {avro: {encoding: 'raw'}}))
    ).rejects.toThrow('do not support chunked');
  });

  test.each([
    [{type: ['null', 'string']}, 1, 'union branch'],
    [{type: 'enum', symbols: ['A']}, 'B', 'Unknown Avro enum'],
    [{type: 'fixed', size: 2}, new Uint8Array([1]), 'must contain 2 bytes'],
    ['bytes', 'not-bytes', 'must be Uint8Array'],
    ['unsupported', 1, 'Unsupported Avro schema type'],
    ['int', Number.MAX_SAFE_INTEGER + 1, 'outside the safe range']
  ])('rejects invalid value %#', async (fieldType, value, message) => {
    const schema = {type: 'record', fields: [{name: 'value', type: fieldType}]};
    await expect(encodeRaw(schema, {value})).rejects.toThrow(message);
  });

  test.each([
    [{type: 'string', logicalType: 'uuid'}, 'invalid', 'Invalid Avro UUID'],
    [{type: 'bytes', logicalType: 'decimal', scale: 1}, 1.23, 'too many fractional digits'],
    [{type: 'fixed', logicalType: 'decimal', scale: 0, size: 1}, 128, 'does not fit'],
    [{type: 'bytes', logicalType: 'big-decimal'}, null, 'requires a value and scale'],
    [
      {type: 'bytes', logicalType: 'big-decimal'},
      {value: 1, scale: -1},
      'scale must be non-negative'
    ],
    [
      {type: 'bytes', logicalType: 'big-decimal'},
      {value: '1.23', scale: 1},
      'too many fractional digits'
    ]
  ])('validates logical value %#', async (fieldType, value, message) => {
    const schema = {type: 'record', fields: [{name: 'value', type: fieldType}]};
    await expect(encodeRaw(schema, {value})).rejects.toThrow(message);
  });

  test('validates batch sizing and indexed OCF blocks', async () => {
    const schema = {type: 'record', name: 'Value', fields: [{name: 'id', type: 'int'}]};
    const encoded = await encodeAvro(createStructuralTable([{id: 1}]), {avro: {schema}});
    await expect(collectBatches(parseAvroInBatches(encoded, 0))).rejects.toThrow(
      'batchSize must be positive'
    );
    await expect(parseAvro(encoded, {blockIndices: [2]})).rejects.toThrow('out of range');
    expect(getAvroSchemaFingerprint({type: schema})).toBeTypeOf('bigint');
    expect(getAvroSchemaFingerprint({type: 'array', items: 'int'})).toBeTypeOf('bigint');
    expect(getAvroSchemaFingerprint({type: 'map', values: 'string'})).toBeTypeOf('bigint');
    expect(getAvroSchemaFingerprint({type: 'enum', name: 'E', symbols: ['A']})).toBeTypeOf(
      'bigint'
    );
    expect(getAvroSchemaFingerprint({type: 'fixed', name: 'F', size: 2})).toBeTypeOf('bigint');
  });

  test('reads a URL-backed OCF with bounded range requests', async () => {
    const schema = {type: 'record', name: 'Value', fields: [{name: 'label', type: 'string'}]};
    const rows = Array.from({length: 80}, (_, index) => ({label: `${index}-${'x'.repeat(40)}`}));
    const encoded = new Uint8Array(
      await encodeAvro(createStructuralTable(rows), {avro: {schema, blockSize: 700}})
    );
    const requests: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, requestInit?: RequestInit) => {
        const range = new Headers(requestInit?.headers).get('Range') || '';
        requests.push(range);
        const match = range.match(/bytes=(\d+)-(\d+)/);
        const start = Number(match?.[1]);
        const end = Math.min(Number(match?.[2]), encoded.length - 1);
        if (start >= encoded.length) return new Response(null, {status: 416});
        return new Response(encoded.slice(start, end + 1), {status: 206});
      })
    );

    const result = await parseAvroFromUrl('https://example.test/data.avro', {
      rangeChunkSize: 1024,
      batchSize: 13,
      blockIndices: [0, 2],
      headers: {'X-Test': 'yes'}
    });
    expect(result.data.numRows).toBeGreaterThan(0);
    expect(result.data.numRows).toBeLessThan(rows.length);
    expect(requests[0]).toBe('bytes=0-1023');
    expect(requests.some(range => !range.startsWith('bytes=0-'))).toBe(true);
  });

  test('falls back when a URL server returns the complete file', async () => {
    const schema = {type: 'record', name: 'Value', fields: [{name: 'id', type: 'int'}]};
    const encoded = await encodeAvro(createStructuralTable([{id: 1}, {id: 2}]), {avro: {schema}});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(encoded, {status: 200}))
    );

    const batches = await collectBatches(
      parseAvroInBatchesFromUrl('https://example.test/data.avro', {batchSize: 1})
    );
    expect(batches.map(batch => batch.length)).toEqual([1, 1]);
  });

  test('validates URL options and range responses', async () => {
    await expect(
      collectBatches(parseAvroInBatchesFromUrl('https://example.test/data.avro', {encoding: 'raw'}))
    ).rejects.toThrow('supports OCF input only');
    await expect(
      collectBatches(parseAvroInBatchesFromUrl('https://example.test/data.avro', {batchSize: 0}))
    ).rejects.toThrow('batchSize must be positive');
    await expect(
      collectBatches(
        parseAvroInBatchesFromUrl('https://example.test/data.avro', {rangeChunkSize: 100})
      )
    ).rejects.toThrow('rangeChunkSize must be at least 1024 bytes');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, {status: 416}))
    );
    await expect(parseAvroFromUrl('https://example.test/missing.avro')).rejects.toThrow(
      'returned no data'
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, {status: 503}))
    );
    await expect(parseAvroFromUrl('https://example.test/error.avro')).rejects.toThrow('HTTP 503');
  });
});
