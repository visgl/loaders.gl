// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {load} from '@loaders.gl/core';
import test from 'test/utils/vitest-tape';
import {AvroLoaderWithParser} from '../src/avro-loader';
import {AvroLoader} from '../src/avro-loader-types';
import {AvroWriter} from '../src/avro-writer';
import {encodeAvroInChunks} from '../src/avro-stream';
import {getAvroSchemaFingerprint} from '../src/lib/parsers/parse-avro';
import {parseAvroOCF} from '../src/avro-ocf';

test('AvroWriter#encode round-trips an Arrow table', async t => {
  const input = {
    shape: 'arrow-table' as const,
    data: arrow.tableFromArrays({id: [1, 2], name: ['one', 'two']})
  };
  const output = await AvroWriter.encode(input);
  const result = await AvroLoaderWithParser.parse(output);
  t.equal(result.shape, 'arrow-table');
  if (result.shape === 'arrow-table') {
    t.equal(result.data.numRows, 2);
    t.equal(JSON.stringify(Array.from(result.data.getChild('id')?.toArray() || [])), '[1,2]');
    t.equal(
      JSON.stringify(Array.from(result.data.getChild('name')?.toArray() || [])),
      '["one","two"]'
    );
  }
  t.end();
});

test('AvroWriter#encode supports an explicit nullable schema', async t => {
  const input = {
    shape: 'arrow-table' as const,
    data: arrow.tableFromArrays({value: [1, null]})
  };
  const output = await AvroWriter.encode(input, {
    avro: {
      schema: {
        type: 'record',
        name: 'Values',
        fields: [{name: 'value', type: ['null', 'int']}]
      }
    }
  });
  const result = await AvroLoaderWithParser.parse(output);
  t.equal(result.shape, 'arrow-table');
  if (result.shape === 'arrow-table')
    t.deepEqual(result.data.toArray(), [{value: 1}, {value: null}]);
  t.end();
});

test('AvroWriter#encode writes a single-object datum', async t => {
  const schema = {
    type: 'record',
    name: 'SingleValue',
    fields: [{name: 'id', type: 'int'}]
  } as const;
  const output = await AvroWriter.encode(
    {shape: 'arrow-table', data: arrow.tableFromArrays({id: [42]})},
    {avro: {schema, encoding: 'single-object'}}
  );
  const result = await AvroLoaderWithParser.parse(output, {avro: {schema}});
  if (result.shape === 'arrow-table') t.deepEqual(result.data.toArray(), [{id: 42}]);
  await t.rejects(
    () =>
      AvroWriter.encode(
        {shape: 'arrow-table', data: arrow.tableFromArrays({id: [1, 2]})},
        {avro: {schema, encoding: 'single-object'}}
      ),
    /exactly one table row/
  );
  t.end();
});

test('AvroWriter#encode writes raw Avro records', async t => {
  const schema = {
    type: 'record',
    name: 'RawValue',
    fields: [{name: 'id', type: 'int'}]
  } as const;
  const output = await AvroWriter.encode(
    {shape: 'arrow-table', data: arrow.tableFromArrays({id: [7]})},
    {avro: {schema, encoding: 'raw'}}
  );
  const result = await AvroLoaderWithParser.parse(output, {avro: {schema, encoding: 'raw'}});
  if (result.shape === 'arrow-table') t.deepEqual(result.data.toArray(), [{id: 7}]);
  t.end();
});

test('AvroWriter#encode supports named records and logical timestamps', async t => {
  const input = {
    shape: 'arrow-table' as const,
    data: arrow.tableFromArrays({
      user: [{id: 7, name: 'Ada'}],
      created: [new Date(1_700_000_000_000)]
    })
  };
  const output = await AvroWriter.encode(input, {
    avro: {
      schema: {
        type: 'record',
        name: 'Event',
        fields: [
          {
            name: 'user',
            type: {
              type: 'record',
              name: 'User',
              fields: [
                {name: 'id', type: 'int'},
                {name: 'name', type: 'string'}
              ]
            }
          },
          {name: 'created', type: {type: 'long', logicalType: 'timestamp-millis'}}
        ]
      }
    }
  });
  const result = await AvroLoaderWithParser.parse(output);
  t.equal(result.shape, 'arrow-table');
  if (result.shape === 'arrow-table') {
    t.equal(result.data.getChild('user')?.get(0)?.id, 7);
    t.equal(result.data.getChild('user')?.get(0)?.name, 'Ada');
    t.equal(result.data.getChild('created')?.get(0), 1_700_000_000_000);
  }
  t.end();
});

test('AvroWriter#encode supports Avro time and local timestamp logical types', async t => {
  const output = await AvroWriter.encode(
    {shape: 'arrow-table', data: arrow.tableFromArrays({time: [11_045_678_000], local: [1234]})},
    {
      avro: {
        schema: {
          type: 'record',
          name: 'Times',
          fields: [
            {name: 'time', type: {type: 'long', logicalType: 'time-micros'}},
            {name: 'local', type: {type: 'long', logicalType: 'local-timestamp-micros'}}
          ]
        }
      }
    }
  );
  const result = await AvroLoaderWithParser.parse(output);
  if (result.shape === 'arrow-table') {
    t.equal(result.data.getChild('time')?.get(0), 11_045_678_000);
    t.equal(result.data.getChild('local')?.get(0), 1234);
  }
  t.end();
});

test('AvroWriter#encode round-trips decimal bytes logical types', async t => {
  const input = {
    shape: 'arrow-table' as const,
    data: arrow.tableFromArrays({amount: [12.34, -5.67]})
  };
  const output = await AvroWriter.encode(input, {
    avro: {
      schema: {
        type: 'record',
        name: 'Amounts',
        fields: [
          {name: 'amount', type: {type: 'bytes', logicalType: 'decimal', precision: 9, scale: 2}}
        ]
      }
    }
  });
  const result = await AvroLoaderWithParser.parse(output);
  if (result.shape === 'arrow-table')
    t.deepEqual(result.data.toArray(), [{amount: 12.34}, {amount: -5.67}]);
  t.end();
});

test('AvroWriter#encode round-trips scalable big-decimal values', async t => {
  const schema = {
    type: 'record',
    name: 'BigAmounts',
    fields: [{name: 'amount', type: {type: 'bytes', logicalType: 'big-decimal'}}]
  } as const;
  const output = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromArrays({amount: [{value: '12345678901234567890.12', scale: 2}]})
    },
    {avro: {schema}}
  );
  const result = await AvroLoaderWithParser.parse(output);
  if (result.shape === 'arrow-table')
    t.deepEqual(result.data.toArray(), [{amount: {value: 12345678901234567000, scale: 2}}]);
  t.end();
});

test('AvroWriter#encode round-trips UUID and duration logical types', async t => {
  const input = {
    shape: 'arrow-table' as const,
    data: arrow.tableFromArrays({
      identifier: ['550e8400-e29b-41d4-a716-446655440000'],
      elapsed: [{months: 2, days: 3, milliseconds: 4000}]
    })
  };
  const output = await AvroWriter.encode(input, {
    avro: {
      schema: {
        type: 'record',
        name: 'LogicalValues',
        fields: [
          {name: 'identifier', type: {type: 'string', logicalType: 'uuid'}},
          {name: 'elapsed', type: {type: 'fixed', name: 'Duration', size: 12, logicalType: 'duration'}}
        ]
      }
    }
  });
  const result = await AvroLoaderWithParser.parse(output);
  if (result.shape === 'arrow-table')
    t.deepEqual(result.data.toArray(), [
      {
        identifier: '550e8400-e29b-41d4-a716-446655440000',
        elapsed: {months: 2, days: 3, milliseconds: 4000}
      }
    ]);
  t.end();
});

test('AvroWriter#encode supports recursive named schemas', async t => {
  const nodeSchema = {
    type: 'record',
    name: 'Node',
    fields: [
      {name: 'value', type: 'int'},
      {name: 'next', type: ['null', 'Node']}
    ]
  };
  const output = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromArrays({
        node: [{value: 1, next: {value: 2, next: null}}]
      })
    },
    {avro: {schema: {type: 'record', name: 'Envelope', fields: [{name: 'node', type: nodeSchema}]}}}
  );
  const result = await AvroLoaderWithParser.parse(output);
  if (result.shape === 'arrow-table')
    t.deepEqual(result.data.toArray(), [
      {node: {value: 1, next: {value: 2, next: null}}}
    ]);
  t.end();
});

test('AvroWriter#encode writes compressed multi-block files', async t => {
  const input = {
    shape: 'arrow-table' as const,
    data: arrow.tableFromArrays({id: [1, 2, 3], name: ['alpha', 'beta', 'gamma']})
  };
  const output = await AvroWriter.encode(input, {avro: {codec: 'deflate', blockSize: 1}});
  const result = await AvroLoaderWithParser.parse(output);
  t.equal(result.shape, 'arrow-table');
  if (result.shape === 'arrow-table') {
    t.equal(result.data.numRows, 3);
    t.equal(result.data.getChild('id')?.get(2), 3);
    t.equal(result.data.getChild('name')?.get(1), 'beta');
  }
  t.end();
});

test('Avro OCF inspection exposes block offsets without decoding records', async t => {
  const output = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromArrays({id: [1, 2, 3]})
    },
    {avro: {blockSize: 1}}
  );
  const ocf = parseAvroOCF(output);
  t.equal(ocf.codec, 'null');
  t.equal(ocf.blocks.length, 3);
  t.equal(ocf.blocks[0].count, 1);
  t.equal(ocf.blocks[0].dataOffset < ocf.blocks[0].syncOffset, true);
  t.equal(ocf.blocks[1].offset > ocf.blocks[0].offset, true);
  t.end();
});

test('AvroWriter#encode writes custom OCF metadata', async t => {
  const output = await AvroWriter.encode(
    {shape: 'arrow-table', data: arrow.tableFromArrays({id: [1]})},
    {avro: {metadata: {application: 'loaders.gl', binaryTag: new Uint8Array([1, 2, 3])}}}
  );
  const ocf = parseAvroOCF(output);
  t.equal(new TextDecoder().decode(ocf.metadata.get('application')), 'loaders.gl');
  t.deepEqual(ocf.metadata.get('binaryTag'), new Uint8Array([1, 2, 3]));
  await t.rejects(
    () => AvroWriter.encode({shape: 'arrow-table', data: arrow.tableFromArrays({id: [1]})}, {avro: {metadata: {'avro.codec': 'null'}}}),
    /reserved/
  );
  t.end();
});

test('AvroLoader#parse selects indexed OCF blocks', async t => {
  const output = await AvroWriter.encode(
    {
      shape: 'arrow-table',
      data: arrow.tableFromArrays({id: new Int32Array([1, 2, 3])})
    },
    {avro: {blockSize: 1}}
  );
  const result = await AvroLoaderWithParser.parse(output, {avro: {blockIndices: [1]}});
  if (result.shape === 'arrow-table') {
    t.equal(result.data.numRows, 1);
    t.equal(result.data.getChild('id')?.get(0), 2);
  }
  t.end();
});

test('AvroLoader#parseInBatchesFromUrl uses HTTP byte ranges', async t => {
  const output = new Uint8Array(
    await AvroWriter.encode(
      {shape: 'arrow-table', data: arrow.tableFromArrays({id: [1, 2, 3]})},
      {avro: {blockSize: 1}}
    )
  );
  const originalFetch = globalThis.fetch;
  const ranges: string[] = [];
  globalThis.fetch = async (_input, init) => {
    const range = new Headers(init?.headers).get('Range') || '';
    ranges.push(range);
    const match = /^bytes=(\d+)-(\d+)$/.exec(range);
    if (!match) return new Response(output);
    const start = Number(match[1]);
    const end = Math.min(Number(match[2]), output.length - 1);
    if (start >= output.length) return new Response(null, {status: 416});
    return new Response(output.slice(start, end + 1), {
      status: 206,
      headers: {'Content-Range': `bytes ${start}-${end}/${output.length}`}
    });
  };
  try {
    const batches = [];
    for await (const batch of AvroLoaderWithParser.parseInBatchesFromUrl('https://example.test/data.avro', {
      avro: {batchSize: 2}
    })) batches.push(batch);
    t.deepEqual(batches.map(batch => batch.length), [2, 1]);
    t.equal(ranges.length > 2, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
  t.end();
});

test('core load routes URL-backed Avro files through random-access parsing', async t => {
  const output = new Uint8Array(
    await AvroWriter.encode({shape: 'arrow-table', data: arrow.tableFromArrays({id: [9]})})
  );
  const originalFetch = globalThis.fetch;
  const ranges: string[] = [];
  const fetchFunction = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const range = new Headers(init?.headers).get('Range') || '';
    ranges.push(range);
    const match = /^bytes=(\d+)-(\d+)$/.exec(range);
    if (!match) return new Response(output);
    const start = Number(match[1]);
    const end = Math.min(Number(match[2]), output.length - 1);
    return new Response(output.slice(start, end + 1), {
      status: 206,
      headers: {'Content-Range': `bytes ${start}-${end}/${output.length}`}
    });
  };
  globalThis.fetch = fetchFunction;
  try {
    const result = await load('https://example.test/data.avro', AvroLoader, {
      fetch: fetchFunction
    });
    if (result.shape === 'arrow-table') t.equal(result.data.getChild('id')?.get(0), 9);
    t.equal(ranges.length > 0, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
  t.end();
});

test('encodeAvroInChunks emits a parseable OCF incrementally', async t => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of encodeAvroInChunks(
    {shape: 'arrow-table', data: arrow.tableFromArrays({id: [1, 2, 3]})},
    {avro: {blockSize: 1}}
  ))
    chunks.push(chunk);
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  const result = await AvroLoaderWithParser.parse(bytes.buffer);
  if (result.shape === 'arrow-table') t.deepEqual(result.data.toArray(), [{id: 1}, {id: 2}, {id: 3}]);
  t.equal(chunks.length, 4);
  t.end();
});

test('AvroLoader#parseInBatches yields Arrow batches', async t => {
  const input = {
    shape: 'arrow-table' as const,
    data: arrow.tableFromArrays({id: [1, 2, 3], name: ['alpha', 'beta', 'gamma']})
  };
  const output = await AvroWriter.encode(input);
  const batches = [];
  for await (const batch of AvroLoaderWithParser.parseInBatches([output], {avro: {batchSize: 2}})) {
    batches.push(batch);
  }
  t.equal(batches.length, 2);
  t.equal(batches[0].length, 2);
  t.equal(batches[1].length, 1);
  t.equal(batches[1].data.getChild('id')?.get(0), 3);
  t.end();
});

test('AvroLoader#parse applies reader-schema projection, aliases, and defaults', async t => {
  const input = {
    shape: 'arrow-table' as const,
    data: arrow.tableFromArrays({id: new Int32Array([7]), name: ['Ada'], ignored: ['drop me']})
  };
  const output = await AvroWriter.encode(input);
  const result = await AvroLoaderWithParser.parse(output, {
    avro: {
      readerSchema: {
        type: 'record',
        name: 'ReaderEvent',
        aliases: ['ArrowRecord'],
        fields: [
          {name: 'id', type: 'long'},
          {name: 'label', aliases: ['name'], type: 'string'},
          {name: 'extra', type: ['string', 'null'], default: 'new'}
        ]
      }
    }
  });
  t.equal(result.shape, 'arrow-table');
  if (result.shape === 'arrow-table') {
    t.equal(result.data.getChild('id')?.get(0), 7);
    t.equal(result.data.getChild('label')?.get(0), 'Ada');
    t.equal(result.data.getChild('extra')?.get(0), 'new');
    t.equal(result.data.getChild('ignored'), null);
  }
  t.end();
});

test('AvroLoader#parse applies numeric promotions and rejects incompatible types', async t => {
  const output = await AvroWriter.encode({
    shape: 'arrow-table',
    data: arrow.tableFromArrays({id: new Int32Array([7])})
  });
  const promoted = await AvroLoaderWithParser.parse(output, {
    avro: {readerSchema: {type: 'record', name: 'Promoted', aliases: ['ArrowRecord'], fields: [{name: 'id', type: 'double'}]}}
  });
  if (promoted.shape === 'arrow-table') t.equal(promoted.data.getChild('id')?.get(0), 7);
  const union = await AvroLoaderWithParser.parse(output, {
    avro: {
      readerSchema: {
        type: 'record',
        name: 'UnionReader',
        aliases: ['ArrowRecord'],
        fields: [{name: 'id', type: ['null', 'double', 'string']}]
      }
    }
  });
  if (union.shape === 'arrow-table') t.equal(union.data.getChild('id')?.get(0), 7);
  await t.rejects(
    () =>
      AvroLoaderWithParser.parse(output, {
        avro: {readerSchema: {type: 'record', name: 'Invalid', aliases: ['ArrowRecord'], fields: [{name: 'id', type: 'string'}]}}
      }),
    /cannot promote int to string/
  );
  t.end();
});

test('AvroLoader#parse validates record, enum, and fixed compatibility', async t => {
  const recordOutput = await AvroWriter.encode({
    shape: 'arrow-table',
    data: arrow.tableFromArrays({id: new Int32Array([1])})
  });
  await t.rejects(
    () =>
      AvroLoaderWithParser.parse(recordOutput, {
        avro: {readerSchema: {type: 'record', name: 'OtherRecord', fields: [{name: 'id', type: 'int'}]}}
      }),
    /record names/
  );

  const enumSchema = {
    type: 'record',
    name: 'EnumRecord',
    fields: [{name: 'kind', type: {type: 'enum', name: 'Kind', symbols: ['A']}}]
  };
  const enumOutput = await AvroWriter.encode(
    {shape: 'arrow-table', data: arrow.tableFromArrays({kind: ['A']})},
    {avro: {schema: enumSchema}}
  );
  await t.rejects(
    () =>
      AvroLoaderWithParser.parse(enumOutput, {
        avro: {
          readerSchema: {
            type: 'record',
            name: 'EnumRecord',
            fields: [{name: 'kind', type: {type: 'enum', name: 'Kind', symbols: ['B']}}]
          }
        }
      }),
    /enum symbol/
  );

  const fixedSchema = {
    type: 'record',
    name: 'FixedRecord',
    fields: [
      {
        name: 'value',
        type: {type: 'fixed', name: 'Value', size: 2, logicalType: 'decimal', precision: 4, scale: 2}
      }
    ]
  };
  const fixedOutput = await AvroWriter.encode(
    {shape: 'arrow-table', data: arrow.tableFromArrays({value: [1.23]})},
    {avro: {schema: fixedSchema}}
  );
  await t.rejects(
    () =>
      AvroLoaderWithParser.parse(fixedOutput, {
        avro: {
          readerSchema: {
            type: 'record',
            name: 'FixedRecord',
            fields: [
              {
                name: 'value',
                type: {type: 'fixed', name: 'Value', size: 3, logicalType: 'decimal', precision: 6, scale: 2}
              }
            ]
          }
        }
      }),
    /fixed schemas/
  );
  t.end();
});

test('Avro long values support exact bigint round trips', async t => {
  const input = {
    shape: 'arrow-table' as const,
    data: arrow.tableFromArrays({id: [9007199254740993n]})
  };
  const output = await AvroWriter.encode(input);
  const result = await AvroLoaderWithParser.parse(output, {avro: {longType: 'bigint'}});
  t.equal(result.shape, 'arrow-table');
  if (result.shape === 'arrow-table') t.equal(result.data.getChild('id')?.get(0), 9007199254740993n);
  t.end();
});

test('AvroLoader#parse supports raw and single-object encodings', async t => {
  const schema = {
    type: 'record',
    name: 'Person',
    fields: [
      {name: 'id', type: 'int'},
      {name: 'name', type: 'string'}
    ]
  };
  const raw = Uint8Array.from([14, 6, 65, 100, 97]);
  const fingerprint = new Uint8Array(8);
  new DataView(fingerprint.buffer).setBigUint64(0, getAvroSchemaFingerprint(schema), true);
  const singleObject = Uint8Array.from([0xc3, 0x01, ...fingerprint, ...raw]);
  for (const bytes of [raw, singleObject]) {
    const result = await AvroLoaderWithParser.parse(bytes.buffer, {
      avro: {schema}
    });
    t.equal(result.shape, 'arrow-table');
    if (result.shape === 'arrow-table') {
      t.equal(result.data.getChild('id')?.get(0), 7);
      t.equal(result.data.getChild('name')?.get(0), 'Ada');
    }
  }
  t.end();
});
