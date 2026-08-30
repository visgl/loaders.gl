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
  parseAvroInBatchesFromUrl,
  parseAvroOCF,
  parseAvroOCFHeader
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
  test('fingerprints every parsing-canonical schema form', () => {
    const schemas = [
      'string',
      ['null', 'long'],
      {type: ['null', 'double']},
      {type: {type: 'int'}},
      {type: 'enum', name: 'Kind', symbols: ['A', 'B']},
      {type: 'fixed', name: 'Token', size: 4},
      {type: 'array', items: {type: 'long'}},
      {type: 'map', values: ['null', 'string']},
      {
        type: 'record',
        name: 'Canonical',
        fields: [
          {name: 'kind', type: {type: 'enum', name: 'NestedKind', symbols: ['A']}},
          {name: 'values', type: {type: 'array', items: 'int'}}
        ]
      }
    ];
    const fingerprints = schemas.map(schema => getAvroSchemaFingerprint(schema));
    expect(new Set(fingerprints).size).toBe(schemas.length);
  });

  test.each([
    [
      'invalid enum index',
      {
        type: 'record',
        name: 'Value',
        fields: [{name: 'value', type: {type: 'enum', symbols: ['A']}}]
      },
      [2],
      'Invalid Avro enum index'
    ],
    [
      'unsupported primitive',
      {type: 'record', name: 'Value', fields: [{name: 'value', type: 'potato'}]},
      [],
      'Unsupported Avro schema type'
    ],
    [
      'decimal precision',
      {
        type: 'record',
        name: 'Value',
        fields: [
          {name: 'value', type: {type: 'bytes', logicalType: 'decimal', precision: 1, scale: 0}}
        ]
      },
      [2, 127],
      'decimal value exceeds'
    ],
    [
      'invalid UUID',
      {
        type: 'record',
        name: 'Value',
        fields: [{name: 'value', type: {type: 'string', logicalType: 'uuid'}}]
      },
      [2, 120],
      'Invalid Avro UUID'
    ],
    [
      'invalid duration',
      {
        type: 'record',
        name: 'Value',
        fields: [{name: 'value', type: {type: 'fixed', size: 1, logicalType: 'duration'}}]
      },
      [0],
      'duration must contain 12 bytes'
    ],
    [
      'truncated big decimal',
      {
        type: 'record',
        name: 'Value',
        fields: [{name: 'value', type: {type: 'bytes', logicalType: 'big-decimal'}}]
      },
      [4, 2, 1],
      'Truncated Avro big-decimal'
    ]
  ] as const)('rejects malformed raw logical data: %s', async (_name, schema, bytes, message) => {
    await expect(
      parseAvro(Uint8Array.from(bytes).buffer, {encoding: 'raw', schema: schema as any})
    ).rejects.toThrow(message);
  });

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

  test('round-trips every supported logical type and signed decimal shape', async () => {
    const schema = {
      type: 'record',
      name: 'LogicalValues',
      fields: [
        {
          name: 'negativeDecimal',
          type: {type: 'bytes', logicalType: 'decimal', precision: 8, scale: 2}
        },
        {
          name: 'fixedDecimal',
          type: {
            type: 'fixed',
            name: 'FixedDecimal',
            size: 4,
            logicalType: 'decimal',
            precision: 8,
            scale: 3
          }
        },
        {name: 'bigDecimal', type: {type: 'bytes', logicalType: 'big-decimal'}},
        {name: 'identifier', type: {type: 'string', logicalType: 'uuid'}},
        {
          name: 'duration',
          type: {type: 'fixed', name: 'Duration', size: 12, logicalType: 'duration'}
        },
        {name: 'date', type: {type: 'int', logicalType: 'date'}},
        {name: 'timeMillis', type: {type: 'int', logicalType: 'time-millis'}},
        {name: 'timeMicros', type: {type: 'long', logicalType: 'time-micros'}},
        {name: 'timestampMillis', type: {type: 'long', logicalType: 'timestamp-millis'}},
        {name: 'timestampMicros', type: {type: 'long', logicalType: 'timestamp-micros'}},
        {name: 'timestampNanos', type: {type: 'long', logicalType: 'timestamp-nanos'}},
        {name: 'localMillis', type: {type: 'long', logicalType: 'local-timestamp-millis'}},
        {name: 'localMicros', type: {type: 'long', logicalType: 'local-timestamp-micros'}},
        {name: 'localNanos', type: {type: 'long', logicalType: 'local-timestamp-nanos'}}
      ]
    };
    const instant = new Date('2025-02-03T04:05:06.007Z');
    const encoded = await encodeRaw(schema, {
      negativeDecimal: -123.45,
      fixedDecimal: 12.345,
      bigDecimal: {value: '-987.65', scale: 2},
      identifier: '123e4567-e89b-12d3-a456-426614174000',
      duration: {months: 2, days: 3, milliseconds: 4},
      date: instant,
      timeMillis: instant,
      timeMicros: instant,
      timestampMillis: instant,
      timestampMicros: instant,
      timestampNanos: instant,
      localMillis: instant,
      localMicros: instant,
      localNanos: instant
    });
    const decoded = (
      await parseAvro(encoded, {encoding: 'raw', schema, longType: 'bigint'})
    ).data.toArray()[0] as any;

    expect(decoded.negativeDecimal).toBeCloseTo(-123.45);
    expect(decoded.fixedDecimal).toBeCloseTo(12.345);
    expect(decoded.bigDecimal).toMatchObject({value: -987.65, scale: 2});
    expect(decoded.identifier).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(decoded.duration).toMatchObject({months: 2, days: 3, milliseconds: 4});
    expect(decoded.date).toBe(Date.UTC(2025, 1, 3));
    expect(decoded.timestampMillis).toBe(instant.getTime());
    expect(decoded.timestampMicros).toBe(instant.getTime());
    expect(decoded.timestampNanos).toBeTypeOf('bigint');
    expect(decoded.localNanos).toBeTypeOf('bigint');
  });

  test('validates reader records, defaults, unions, enums, fixed values, and promotions', async () => {
    const writerSchema = {
      type: 'record',
      name: 'WriterRecord',
      fields: [
        {name: 'integer', type: 'int'},
        {name: 'enumeration', type: {type: 'enum', name: 'WriterEnum', symbols: ['A', 'B']}},
        {name: 'fixed', type: {type: 'fixed', name: 'WriterFixed', size: 2}},
        {name: 'items', type: {type: 'array', items: 'int'}},
        {name: 'mapping', type: {type: 'map', values: 'int'}},
        {
          name: 'nested',
          type: {type: 'record', name: 'Nested', fields: [{name: 'value', type: 'int'}]}
        }
      ]
    };
    const encoded = await encodeRaw(writerSchema, {
      integer: 4,
      enumeration: 'B',
      fixed: new Uint8Array([1, 2]),
      items: [1, 2],
      mapping: {a: 3},
      nested: {value: 5}
    });
    const readerSchema = {
      type: 'record',
      name: 'ReaderRecord',
      aliases: ['WriterRecord'],
      fields: [
        {name: 'integer', type: {type: ['null', 'double']}},
        {name: 'enumeration', type: {type: 'enum', symbols: ['A', 'B', 'C']}},
        {name: 'fixed', type: {type: 'fixed', size: 2}},
        {name: 'items', type: {type: 'array', items: 'long'}},
        {name: 'mapping', type: {type: 'map', values: 'double'}},
        {
          name: 'nested',
          type: {type: 'record', name: 'Nested', fields: [{name: 'value', type: 'long'}]}
        },
        {name: 'nullDefault', type: ['null', 'string'], default: null},
        {name: 'booleanDefault', type: 'boolean', default: false},
        {name: 'stringDefault', type: 'string', default: 'default'},
        {name: 'bytesDefault', type: 'bytes', default: 'bytes'},
        {name: 'numberDefault', type: 'double', default: 2.5},
        {name: 'fixedDefault', type: {type: 'fixed', size: 1}, default: 'x'},
        {name: 'enumDefault', type: {type: 'enum', symbols: ['A']}, default: 'A'},
        {name: 'arrayDefault', type: {type: 'array', items: 'int'}, default: []},
        {name: 'mapDefault', type: {type: 'map', values: 'int'}, default: {}},
        {name: 'recordDefault', type: {type: 'record', fields: []}, default: {}}
      ]
    };
    const decoded = await parseAvro(encoded, {
      encoding: 'raw',
      schema: writerSchema,
      readerSchema
    });
    expect(decoded.data.numRows).toBe(1);

    await expect(
      parseAvro(encoded, {
        encoding: 'raw',
        schema: writerSchema,
        readerSchema: {...readerSchema, name: 'Unrelated', aliases: []}
      })
    ).rejects.toThrow('incompatible');
    await expect(
      parseAvro(encoded, {
        encoding: 'raw',
        schema: writerSchema,
        readerSchema: {
          type: 'record',
          aliases: ['WriterRecord'],
          fields: [{name: 'missing', type: 'int'}]
        }
      })
    ).rejects.toThrow('no writer value or default');
    await expect(
      parseAvro(encoded, {
        encoding: 'raw',
        schema: writerSchema,
        readerSchema: {
          type: 'record',
          aliases: ['WriterRecord'],
          fields: [{name: 'badDefault', type: ['string', 'null'], default: null}]
        }
      })
    ).rejects.toThrow('default');
    await expect(
      parseAvro(encoded, {
        encoding: 'raw',
        schema: writerSchema,
        readerSchema: {
          type: 'record',
          aliases: ['WriterRecord'],
          fields: [{name: 'integer', type: ['boolean', 'string']}]
        }
      })
    ).rejects.toThrow('no compatible branch');
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

  test('rejects malformed OCF framing, metadata, codecs, and raw logical payloads', async () => {
    const schema = {type: 'record', name: 'Empty', fields: []};
    const encoded = new Uint8Array(await encodeAvro(createStructuralTable([{}]), {avro: {schema}}));

    const invalidMagic = encoded.slice();
    invalidMagic[0] = 0;
    expect(() => parseAvroOCF(invalidMagic.buffer)).toThrow('Object Container File header');

    const missingSchema = encoded.slice();
    const schemaKeyOffset = findBytes(missingSchema, new TextEncoder().encode('avro.schema'));
    missingSchema[schemaKeyOffset] = 'x'.charCodeAt(0);
    expect(() => parseAvroOCFHeader(missingSchema.buffer)).toThrow('missing the avro.schema');

    const unsupportedCodec = encoded.slice();
    const codecValueOffset = findBytes(unsupportedCodec, new TextEncoder().encode('null'));
    unsupportedCodec.set(new TextEncoder().encode('xxxx'), codecValueOffset);
    await expect(parseAvro(unsupportedCodec.buffer)).rejects.toThrow('not supported');

    const container = parseAvroOCF(encoded.buffer);
    const invalidSync = encoded.slice();
    invalidSync[container.blocks[0].syncOffset] ^= 0xff;
    expect(() => parseAvroOCF(invalidSync.buffer)).toThrow('block sync marker');

    const negativeSize = encoded.slice();
    negativeSize[container.blocks[0].offset + 1] = 1;
    expect(() => parseAvroOCF(negativeSize.buffer)).toThrow('negative Avro block size');

    const zeroCount = encoded.slice();
    zeroCount[container.blocks[0].offset] = 0;
    expect(parseAvroOCF(zeroCount.buffer).blocks).toEqual([]);

    await expect(
      parseAvro(new Uint8Array([4]).buffer, {
        encoding: 'raw',
        schema: {type: 'record', fields: [{name: 'value', type: {type: 'enum', symbols: ['A']}}]}
      })
    ).rejects.toThrow('Invalid Avro enum index');
    await expect(
      parseAvro(new Uint8Array([1]).buffer, {
        encoding: 'raw',
        schema: {type: 'record', fields: [{name: 'value', type: 'bytes'}]}
      })
    ).rejects.toThrow('negative Avro byte array length');
    await expect(
      parseAvro(new Uint8Array([2, 0]).buffer, {
        encoding: 'raw',
        schema: {
          type: 'record',
          fields: [{name: 'value', type: {type: 'bytes', logicalType: 'big-decimal'}}]
        }
      })
    ).rejects.toThrow('Truncated Avro big-decimal payload');
    await expect(
      parseAvro(new Uint8Array([2, 0xff]).buffer, {
        encoding: 'raw',
        schema: {
          type: 'record',
          fields: [
            {name: 'value', type: {type: 'bytes', logicalType: 'decimal', precision: 1, scale: 0}}
          ]
        }
      })
    ).resolves.toMatchObject({shape: 'arrow-table'});
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

/** Finds one byte sequence in a test fixture. */
function findBytes(bytes: Uint8Array, sequence: Uint8Array): number {
  for (let start = 0; start <= bytes.length - sequence.length; start++) {
    if (sequence.every((byte, index) => bytes[start + index] === byte)) return start;
  }
  throw new Error('Byte sequence not found');
}
