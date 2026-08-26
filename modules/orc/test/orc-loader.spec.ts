// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {deflateSync, zlibSync} from 'fflate';
import {SnappyCompression} from '@loaders.gl/compression/snappy-compression';
import {ORCLoaderWithParser} from '../src/orc-loader';
import {
  createORCSchema,
  getORCDataType,
  ORCSource,
  ORCSourceLoaderWithParser
} from '../src/orc-source-loader';
import {ORCTypeKind} from '../src/lib/parsers/parse-orc';
import {ORCWriter} from '../src/orc-writer';
import {decompressORCStream, preloadORCCompression} from '../src/lib/parsers/orc-compression';

test('ORCSource exposes footer metadata and shared projection/limit reads', async () => {
  const input = {
    shape: 'arrow-table' as const,
    data: arrow.tableFromArrays({name: ['a', 'b', 'a', 'b']})
  };
  const encoded = await ORCWriter.encode(input);
  const source = new ORCSource(new Blob([encoded]));

  const metadata = await source.getQueryMetadata();
  expect(metadata.sourceType).toBe('orc');
  expect(metadata.columns.map(column => column.name)).toEqual(['name']);
  expect(metadata.statistics?.rowCount).toBe(4);

  const result = await source.query({columns: ['name'], limit: 1});
  expect(result.data.schema.fields.map(field => field.name)).toEqual(['name']);
  expect(result.data.getChild('name')?.toArray()).toEqual(['a']);

  const defaultQuery = await source.query({limit: 2});
  expect(defaultQuery.data.numRows).toBe(2);
  const batches = source.read({limit: 1});
  const batch = await batches[Symbol.asyncIterator]().next();
  expect(batch.value?.length).toBe(1);
});

test('ORC source loader exposes explicit parser entry points', () => {
  expect(ORCSourceLoaderWithParser.testURL('https://example.com/file.orc')).toBe(true);
  expect(ORCSourceLoaderWithParser.testURL('https://example.com/file.txt')).toBe(false);
  expect(ORCSourceLoaderWithParser.createDataSource(new Blob())).toBeInstanceOf(ORCSource);
});

test('ORC metadata preserves nested map and struct types', () => {
  const types = [
    {kind: ORCTypeKind.STRUCT, fieldNames: ['properties', 'attributes'], subtypes: [1, 2]},
    {kind: ORCTypeKind.MAP, fieldNames: [], subtypes: [3, 4]},
    {kind: ORCTypeKind.STRUCT, fieldNames: ['x'], subtypes: [5]},
    {kind: ORCTypeKind.STRING, fieldNames: [], subtypes: []},
    {kind: ORCTypeKind.INT, fieldNames: [], subtypes: []},
    {kind: ORCTypeKind.DOUBLE, fieldNames: [], subtypes: []}
  ];
  const schema = createORCSchema(types[0], types);
  expect(schema.fields[0].type).toMatchObject({type: 'map'});
  expect(schema.fields[1].type).toMatchObject({type: 'struct'});
  expect(
    getORCDataType(ORCTypeKind.LIST, {kind: ORCTypeKind.LIST, fieldNames: [], subtypes: [5]}, types)
  ).toMatchObject({type: 'list'});
});

test('ORCSource rejects unsupported predicates before reading the source', async () => {
  const source = new ORCSource(new Blob([new Uint8Array([0])]));
  await expect(source.query({predicate: {type: 'literal', value: true} as never})).rejects.toThrow(
    'ORC predicates are not implemented yet'
  );
});

test('ORCSource validates query limits before decoding rows', async () => {
  const input = {
    shape: 'arrow-table' as const,
    data: arrow.tableFromArrays({name: ['a', 'b']})
  };
  const encoded = await ORCWriter.encode(input);
  const source = new ORCSource(new Blob([encoded]));
  await expect(source.query({limit: -1})).rejects.toThrow('non-negative safe integer');
});

test('ORCSource clears failed URL fetches so a retry can succeed', async () => {
  const input = {
    shape: 'arrow-table' as const,
    data: arrow.tableFromArrays({name: ['a']})
  };
  const encoded = await ORCWriter.encode(input);
  let attempts = 0;
  const source = new ORCSource('https://example.com/data.orc', {
    core: {
      loadOptions: {
        core: {
          fetch: async () => {
            attempts++;
            if (attempts === 1) throw new Error('temporary failure');
            return new Response(encoded);
          }
        }
      }
    }
  });
  await expect(source.getQueryMetadata()).rejects.toThrow('temporary failure');
  const metadata = await source.getQueryMetadata();
  expect(metadata.statistics?.rowCount).toBe(1);
  expect(attempts).toBe(2);
});

test('ORCLoader#parse decodes dictionary-encoded string columns', async () => {
  const indexes = Uint8Array.from([0xfd, 0x00, 0x01, 0x00]);
  const lengths = Uint8Array.from([0xfe, 0x01, 0x02]);
  const dictionary = new TextEncoder().encode('abb');
  const data = concatBytes(indexes, lengths, dictionary);
  const stripeFooter = encodeMessage([
    [
      1,
      encodeMessage([
        [1, 1],
        [2, 1],
        [3, indexes.length]
      ])
    ],
    [
      1,
      encodeMessage([
        [1, 2],
        [2, 1],
        [3, lengths.length]
      ])
    ],
    [
      1,
      encodeMessage([
        [1, 3],
        [2, 1],
        [3, dictionary.length]
      ])
    ],
    [2, encodeMessage([[1, 12]])],
    [
      2,
      encodeMessage([
        [1, 1],
        [2, 2]
      ])
    ]
  ]);
  const stripeInformation = encodeMessage([
    [1, 3],
    [2, 0],
    [3, data.length],
    [4, stripeFooter.length],
    [5, 3]
  ]);
  const rootType = encodeMessage([
    [1, 12],
    [2, 1],
    [3, 'name']
  ]);
  const stringType = encodeMessage([[1, 7]]);
  const footer = encodeMessage([
    [3, stripeInformation],
    [4, rootType],
    [4, stringType],
    [6, 3]
  ]);
  const postscript = encodeMessage([
    [1, footer.length],
    [2, 0],
    [3, 262_144],
    [4, 0],
    [4, 12]
  ]);
  const bytes = new Uint8Array(
    3 + data.length + stripeFooter.length + footer.length + postscript.length + 1
  );
  bytes.set([0x4f, 0x52, 0x43]);
  bytes.set(data, 3);
  bytes.set(stripeFooter, 3 + data.length);
  bytes.set(footer, 3 + data.length + stripeFooter.length);
  bytes.set(postscript, 3 + data.length + stripeFooter.length + footer.length);
  bytes[bytes.length - 1] = postscript.length;

  const result = await ORCLoaderWithParser.parse(bytes.buffer);
  expect(result.shape).toBe('arrow-table');
  if (result.shape === 'arrow-table')
    expect(result.data.getChild('name')?.toArray()).toEqual(['a', 'bb', 'a']);
});

test('ORC compression decodes framed ZLIB chunks', async () => {
  await preloadORCCompression();
  const input = new TextEncoder().encode('orc-zlib');
  const compressed = zlibSync(input);
  const header = compressed.length << 1;
  const framed = new Uint8Array(compressed.length + 3);
  framed[0] = header & 0xff;
  framed[1] = (header >> 8) & 0xff;
  framed[2] = (header >> 16) & 0xff;
  framed.set(compressed, 3);
  expect(Array.from(decompressORCStream(framed, 'ZLIB'))).toEqual(Array.from(input));
});

test('ORC compression decodes framed raw DEFLATE chunks', async () => {
  await preloadORCCompression();
  const input = new TextEncoder().encode('orc-raw-deflate');
  const compressed = deflateSync(input);
  const header = compressed.length << 1;
  const framed = new Uint8Array(compressed.length + 3);
  framed[0] = header & 0xff;
  framed[1] = (header >> 8) & 0xff;
  framed[2] = (header >> 16) & 0xff;
  framed.set(compressed, 3);
  expect(Array.from(decompressORCStream(framed, 'ZLIB'))).toEqual(Array.from(input));
});

test('ORC compression decodes framed Snappy chunks', async () => {
  await preloadORCCompression();
  const input = new TextEncoder().encode('orc-snappy');
  const compressed = new Uint8Array(new SnappyCompression().compressSync(input.buffer));
  const header = compressed.length << 1;
  const framed = new Uint8Array(compressed.length + 3);
  framed[0] = header & 0xff;
  framed[1] = (header >> 8) & 0xff;
  framed[2] = (header >> 16) & 0xff;
  framed.set(compressed, 3);
  expect(Array.from(decompressORCStream(framed, 'SNAPPY'))).toEqual(Array.from(input));
});

test('ORCWriter#encode writes dictionary-encoded repeated strings', async () => {
  const output = await ORCWriter.encode({
    shape: 'arrow-table',
    data: arrow.tableFromArrays({name: ['a', 'bb', 'a', 'bb']})
  });
  const result = await ORCLoaderWithParser.parse(output);
  expect(result.shape).toBe('arrow-table');
  if (result.shape === 'arrow-table')
    expect(result.data.getChild('name')?.toArray()).toEqual(['a', 'bb', 'a', 'bb']);
});

test('ORCWriter#encode writes dictionary-encoded repeated binary values', async () => {
  const output = await ORCWriter.encode({
    shape: 'arrow-table',
    data: arrow.tableFromArrays({
      payload: arrow.vectorFromArray(
        [new Uint8Array([1, 2]), new Uint8Array([1, 2])],
        new arrow.Binary()
      )
    })
  });
  const result = await ORCLoaderWithParser.parse(output);
  expect(result.shape).toBe('arrow-table');
  if (result.shape === 'arrow-table') {
    expect(
      result.data
        .getChild('payload')
        ?.toArray()
        .map(value => Array.from(value as Uint8Array))
    ).toEqual([
      [1, 2],
      [1, 2]
    ]);
  }
});

test('ORCLoader#parse decodes patched-base RLEv2 integers', async () => {
  const data = Uint8Array.from([0x82, 0x03, 0x07, 0x21, 0x64, 0x18, 0xf8, 0x40]);
  const stripeFooter = encodeMessage([
    [
      1,
      encodeMessage([
        [1, 1],
        [2, 1],
        [3, data.length]
      ])
    ],
    [2, encodeMessage([[1, 12]])],
    [2, encodeMessage([[1, 2]])]
  ]);
  const stripeInformation = encodeMessage([
    [1, 3],
    [2, 0],
    [3, data.length],
    [4, stripeFooter.length],
    [5, 4]
  ]);
  const rootType = encodeMessage([
    [1, 12],
    [2, 1],
    [3, 'id']
  ]);
  const integerType = encodeMessage([[1, 3]]);
  const footer = encodeMessage([
    [3, stripeInformation],
    [4, rootType],
    [4, integerType],
    [6, 4]
  ]);
  const postscript = encodeMessage([
    [1, footer.length],
    [2, 0],
    [3, 262_144],
    [4, 0],
    [4, 12]
  ]);
  const bytes = new Uint8Array(
    3 + data.length + stripeFooter.length + footer.length + postscript.length + 1
  );
  bytes.set([0x4f, 0x52, 0x43]);
  bytes.set(data, 3);
  bytes.set(stripeFooter, 3 + data.length);
  bytes.set(footer, 3 + data.length + stripeFooter.length);
  bytes.set(postscript, 3 + data.length + stripeFooter.length + footer.length);
  bytes[bytes.length - 1] = postscript.length;

  const result = await ORCLoaderWithParser.parse(bytes.buffer);
  expect(result.shape).toBe('arrow-table');
  if (result.shape === 'arrow-table') {
    const values = result.data.getChild('id')?.toArray();
    expect(Array.from(values || [])).toEqual([100, 101, 102, 1000]);
  }
});

test('ORCLoader#parse reconstructs LIST child streams', async () => {
  const lengths = Uint8Array.from([0xfd, 0x02, 0x00, 0x01]);
  const values = Uint8Array.from([0xfd, 0x14, 0x16, 0x18]);
  const data = concatBytes(lengths, values);
  const stripeFooter = encodeMessage([
    [
      1,
      encodeMessage([
        [1, 2],
        [2, 1],
        [3, lengths.length]
      ])
    ],
    [
      1,
      encodeMessage([
        [1, 1],
        [2, 2],
        [3, values.length]
      ])
    ],
    [2, encodeMessage([[1, 12]])],
    [2, encodeMessage([[1, 0]])],
    [2, encodeMessage([[1, 0]])]
  ]);
  const stripeInformation = encodeMessage([
    [1, 3],
    [2, 0],
    [3, data.length],
    [4, stripeFooter.length],
    [5, 3]
  ]);
  const rootType = encodeMessage([
    [1, 12],
    [2, 1],
    [3, 'items']
  ]);
  const listType = encodeMessage([
    [1, 10],
    [2, 2]
  ]);
  const integerType = encodeMessage([[1, 3]]);
  const footer = encodeMessage([
    [3, stripeInformation],
    [4, rootType],
    [4, listType],
    [4, integerType],
    [6, 3]
  ]);
  const postscript = encodeMessage([
    [1, footer.length],
    [2, 0],
    [3, 262_144],
    [4, 0],
    [4, 12]
  ]);
  const bytes = new Uint8Array(
    3 + data.length + stripeFooter.length + footer.length + postscript.length + 1
  );
  bytes.set([0x4f, 0x52, 0x43]);
  bytes.set(data, 3);
  bytes.set(stripeFooter, 3 + data.length);
  bytes.set(footer, 3 + data.length + stripeFooter.length);
  bytes.set(postscript, 3 + data.length + stripeFooter.length + footer.length);
  bytes[bytes.length - 1] = postscript.length;

  const result = await ORCLoaderWithParser.parse(bytes.buffer);
  expect(result.shape).toBe('arrow-table');
  if (result.shape === 'arrow-table') {
    const items = result.data.getChild('items');
    expect(items?.get(0)?.length).toBe(2);
    expect(items?.get(0)?.get(0)).toBe(10);
    expect(items?.get(0)?.get(1)).toBe(11);
    expect(items?.get(1)?.length).toBe(0);
    expect(items?.get(2)?.get(0)).toBe(12);
  }
});

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(arrays.reduce((length, array) => length + array.length, 0));
  let offset = 0;
  for (const array of arrays) {
    output.set(array, offset);
    offset += array.length;
  }
  return output;
}

function encodeMessage(fields: Array<[number, number | string | Uint8Array]>): Uint8Array {
  const output: number[] = [];
  for (const [fieldNumber, value] of fields) {
    if (typeof value === 'number') {
      writeVarint(output, fieldNumber * 8);
      writeVarint(output, value);
    } else {
      const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
      writeVarint(output, fieldNumber * 8 + 2);
      writeVarint(output, bytes.length);
      output.push(...bytes);
    }
  }
  return Uint8Array.from(output);
}

function writeVarint(output: number[], value: number): void {
  while (value > 0x7f) {
    output.push((value & 0x7f) | 0x80);
    value = Math.floor(value / 128);
  }
  output.push(value);
}
