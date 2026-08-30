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
import {encodeORC} from '../src/lib/encoders/encode-orc';
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
  expect(metadata.execution).toEqual({status: 'supported', method: 'read'});
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

test.each([
  [ORCTypeKind.BOOLEAN, 'bool'],
  [ORCTypeKind.BYTE, 'int8'],
  [ORCTypeKind.SHORT, 'int16'],
  [ORCTypeKind.INT, 'int32'],
  [ORCTypeKind.LONG, 'int64'],
  [ORCTypeKind.FLOAT, 'float32'],
  [ORCTypeKind.DOUBLE, 'float64'],
  [ORCTypeKind.BINARY, 'binary'],
  [ORCTypeKind.TIMESTAMP, 'timestamp-millisecond']
])('ORC schema maps primitive kind %s to %s', (typeId, expectedType) => {
  expect(getORCDataType(typeId)).toBe(expectedType);
});

test('ORCSource applies residual predicates with three-valued semantics', async () => {
  const input = {
    shape: 'arrow-table' as const,
    data: arrow.tableFromArrays({name: ['a', 'b', 'a', 'b']})
  };
  const encoded = await ORCWriter.encode(input);
  const source = new ORCSource(new Blob([encoded]));
  const result = await source.query({
    predicate: {op: '=', args: [{property: 'name'}, 'a']}
  });
  expect(result.data.getChild('name')?.toArray()).toEqual(['a', 'a']);
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

test('ORC writer round-trips primitive columns, nulls, and multiple stripes', async () => {
  const schema = {
    fields: [
      {name: 'enabled', type: 'bool'},
      {name: 'tiny', type: 'int8'},
      {name: 'small', type: 'int16'},
      {name: 'count', type: 'int32'},
      {name: 'large', type: 'int64'},
      {name: 'ratio', type: 'float32'},
      {name: 'score', type: 'float64'},
      {name: 'payload', type: 'binary'},
      {name: 'day', type: 'date-day'},
      {name: 'label', type: 'utf8'}
    ]
  };
  const table = {
    shape: 'object-row-table' as const,
    schema,
    data: [
      {
        enabled: true,
        tiny: -2,
        small: 300,
        count: -50_000,
        large: 123_456,
        ratio: 1.25,
        score: -2.5,
        payload: new Uint8Array([1, 2]),
        day: 20_000,
        label: 'repeat'
      },
      {
        enabled: false,
        tiny: 3,
        small: -400,
        count: 75_000,
        large: -654_321,
        ratio: -3.5,
        score: 4.75,
        payload: new Uint8Array([3]),
        day: 20_001,
        label: 'repeat'
      },
      {
        enabled: null,
        tiny: null,
        small: null,
        count: null,
        large: null,
        ratio: null,
        score: null,
        payload: null,
        day: null,
        label: null
      }
    ]
  } as any;

  const encoded = encodeORC(table, {orc: {stripeSize: 2}});
  const result = await ORCLoaderWithParser.parse(encoded);
  expect(result.shape).toBe('arrow-table');
  if (result.shape !== 'arrow-table') return;
  expect(result.data.numRows).toBe(3);
  expect(getColumnValues(result.data, 'enabled')).toEqual([true, false, null]);
  expect(getColumnValues(result.data, 'tiny')).toEqual([-2, 3, null]);
  expect(getColumnValues(result.data, 'small')).toEqual([300, -400, null]);
  expect(getColumnValues(result.data, 'count')).toEqual([-50_000, 75_000, null]);
  expect(getColumnValues(result.data, 'large')).toEqual([123_456, -654_321, null]);
  expect(getColumnValues(result.data, 'ratio')).toEqual([1.25, -3.5, null]);
  expect(getColumnValues(result.data, 'score')).toEqual([-2.5, 4.75, null]);
  expect(getColumnValues(result.data, 'day')).toEqual([20_000, 20_001, null]);
  expect(getColumnValues(result.data, 'label')).toEqual(['repeat', 'repeat', null]);
  expect(
    result.data
      .getChild('payload')
      ?.toArray()
      .slice(0, 2)
      .map(value => Array.from(value as Uint8Array))
  ).toEqual([[1, 2], [3]]);
});

test('ORC writer supports columnar and explicitly typed empty tables', async () => {
  const columnar = {
    shape: 'columnar-table' as const,
    schema: {fields: [{name: 'value', type: 'int32'}]},
    data: {value: [1, 2, 3]}
  } as any;
  const columnarResult = await ORCLoaderWithParser.parse(encodeORC(columnar));
  expect(columnarResult.shape).toBe('arrow-table');
  if (columnarResult.shape === 'arrow-table') {
    expect(Array.from(columnarResult.data.getChild('value')?.toArray() || [])).toEqual([1, 2, 3]);
  }

  const empty = encodeORC({shape: 'object-row-table', data: []} as any, {
    orc: {schema: [{name: 'name', type: 'string'}]}
  });
  const emptyResult = await ORCLoaderWithParser.parse(empty);
  expect(emptyResult.shape).toBe('arrow-table');
  if (emptyResult.shape === 'arrow-table') {
    expect(emptyResult.data.numRows).toBe(0);
    expect(emptyResult.data.schema.fields[0].name).toBe('name');
  }
});

test('ORC writer rejects invalid shapes, stripe sizes, and unsupported types', () => {
  expect(() =>
    encodeORC(
      {
        shape: 'object-row-table',
        schema: {fields: [{name: 'value', type: 'int32'}]},
        data: [{value: 1}]
      } as any,
      {orc: {stripeSize: 0}}
    )
  ).toThrow('positive integer');
  expect(() => encodeORC({shape: 'unknown-table'} as any)).toThrow('supports Arrow, columnar');
  expect(() =>
    encodeORC({
      shape: 'object-row-table',
      schema: {fields: [{name: 'value', type: 'duration'}]},
      data: [{value: 1}]
    } as any)
  ).toThrow('Unsupported ORC writer type');
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

test('ORCLoader#parse reconstructs nested STRUCT and MAP columns', async () => {
  const nestedStruct = buildORCFixture({
    rowCount: 1,
    streams: [{kind: 1, column: 2, bytes: Uint8Array.from([0xff, 84])}],
    types: [
      {kind: 12, subtypes: [1], fieldNames: ['nested']},
      {kind: 12, subtypes: [2], fieldNames: ['value']},
      {kind: 3}
    ]
  });
  const structResult = await ORCLoaderWithParser.parse(nestedStruct.buffer);
  expect(structResult.shape).toBe('arrow-table');
  if (structResult.shape === 'arrow-table') {
    expect(structResult.data.getChild('nested')?.get(0)?.toJSON()).toEqual({value: 42});
  }

  const map = buildORCFixture({
    rowCount: 1,
    streams: [
      {kind: 2, column: 1, bytes: Uint8Array.from([0xff, 2])},
      {kind: 1, column: 2, bytes: new TextEncoder().encode('ab')},
      {kind: 2, column: 2, bytes: Uint8Array.from([0xfe, 1, 1])},
      {kind: 1, column: 3, bytes: Uint8Array.from([0xfe, 32, 64])}
    ],
    types: [
      {kind: 12, subtypes: [1], fieldNames: ['mapping']},
      {kind: 11, subtypes: [2, 3]},
      {kind: 7},
      {kind: 3}
    ]
  });
  const mapResult = await ORCLoaderWithParser.parse(map.buffer);
  expect(mapResult.shape).toBe('arrow-table');
  if (mapResult.shape === 'arrow-table') {
    expect(mapResult.data.numRows).toBe(1);
    expect(mapResult.data.getChild('mapping')?.get(0)).toBeTruthy();
  }
});

test('ORCLoader#parse reconstructs boolean lists including empty lists', async () => {
  const fixture = buildORCFixture({
    rowCount: 3,
    streams: [
      {kind: 2, column: 1, bytes: Uint8Array.from([0xfd, 2, 0, 1])},
      {kind: 1, column: 2, bytes: Uint8Array.from([0xa0])}
    ],
    types: [{kind: 12, subtypes: [1], fieldNames: ['flags']}, {kind: 10, subtypes: [2]}, {kind: 0}]
  });
  const result = await ORCLoaderWithParser.parse(fixture.buffer);
  expect(result.shape).toBe('arrow-table');
  if (result.shape === 'arrow-table') {
    const flags = result.data.getChild('flags');
    expect(flags?.get(0)?.toArray()).toEqual([true, false]);
    expect(flags?.get(1)?.length).toBe(0);
    expect(flags?.get(2)?.toArray()).toEqual([true]);
  }

  const nullableFixture = buildORCFixture({
    rowCount: 3,
    streams: [
      {kind: 0, column: 1, bytes: Uint8Array.from([0xa0])},
      {kind: 1, column: 1, bytes: Uint8Array.from([0xc0])}
    ],
    types: [{kind: 12, subtypes: [1], fieldNames: ['enabled']}, {kind: 0}]
  });
  const nullableResult = await ORCLoaderWithParser.parse(nullableFixture.buffer);
  expect(nullableResult.shape).toBe('arrow-table');
  if (nullableResult.shape === 'arrow-table') {
    expect(getColumnValues(nullableResult.data, 'enabled')).toEqual([true, null, true]);
  }
});

test('ORCLoader#parse validates root, stream, and container structure', async () => {
  const emptyNonStruct = buildORCFixture({rowCount: 0, streams: [], types: [{kind: 3}]});
  const emptyResult = await ORCLoaderWithParser.parse(emptyNonStruct.buffer);
  expect(emptyResult.shape).toBe('arrow-table');
  if (emptyResult.shape === 'arrow-table') expect(emptyResult.data.numCols).toBe(0);

  await expect(
    ORCLoaderWithParser.parse(
      buildORCFixture({rowCount: 1, streams: [], types: [{kind: 3}]}).buffer
    )
  ).rejects.toThrow('root type is not a struct');
  await expect(
    ORCLoaderWithParser.parse(
      buildORCFixture({
        rowCount: 1,
        streams: [],
        types: [{kind: 12, subtypes: [2], fieldNames: ['missing']}, {kind: 3}]
      }).buffer
    )
  ).rejects.toThrow('ORC type 2 is missing');
  await expect(
    ORCLoaderWithParser.parse(
      buildORCFixture({
        rowCount: 1,
        streams: [],
        types: [{kind: 12, subtypes: [1], fieldNames: ['value']}, {kind: 3}]
      }).buffer
    )
  ).rejects.toThrow('data stream is missing');
  await expect(
    ORCLoaderWithParser.parse(
      buildORCFixture({
        rowCount: 1,
        streams: [],
        types: [
          {kind: 12, subtypes: [1], fieldNames: ['items']},
          {kind: 10, subtypes: [2]},
          {kind: 3}
        ]
      }).buffer
    )
  ).rejects.toThrow('length stream is missing');
  await expect(
    ORCLoaderWithParser.parse(
      buildORCFixture({
        rowCount: 1,
        streams: [{kind: 2, column: 1, bytes: Uint8Array.from([0xff, 2])}],
        types: [
          {kind: 12, subtypes: [1], fieldNames: ['items']},
          {kind: 10, subtypes: [9]}
        ]
      }).buffer
    )
  ).rejects.toThrow('container child type is missing');
  await expect(
    ORCLoaderWithParser.parse(
      buildORCFixture({
        rowCount: 1,
        streams: [{kind: 1, column: 1, bytes: Uint8Array.from([0])}],
        types: [{kind: 12, subtypes: [1], fieldNames: ['timestamp']}, {kind: 9}]
      }).buffer
    )
  ).rejects.toThrow('not supported yet');

  const allNull = await ORCLoaderWithParser.parse(
    buildORCFixture({
      rowCount: 3,
      streams: [{kind: 0, column: 1, bytes: Uint8Array.from([0])}],
      types: [{kind: 12, subtypes: [1], fieldNames: ['value']}, {kind: 3}]
    }).buffer
  );
  expect(allNull.shape).toBe('arrow-table');
  if (allNull.shape === 'arrow-table') {
    expect(getColumnValues(allNull.data, 'value')).toEqual([null, null, null]);
  }

  const missingNestedChild = await ORCLoaderWithParser.parse(
    buildORCFixture({
      rowCount: 1,
      streams: [],
      types: [
        {kind: 12, subtypes: [1], fieldNames: ['nested']},
        {kind: 12, subtypes: [9], fieldNames: ['missing']}
      ]
    }).buffer
  );
  expect(missingNestedChild.shape).toBe('arrow-table');
  if (missingNestedChild.shape === 'arrow-table') {
    expect(missingNestedChild.data.getChild('nested')?.get(0)?.toJSON()).toEqual({});
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

/** Builds a tiny uncompressed ORC file from explicit streams and type metadata. */
function buildORCFixture(options: {
  rowCount: number;
  streams: Array<{kind: number; column: number; bytes: Uint8Array}>;
  types: Array<{kind: number; subtypes?: number[]; fieldNames?: string[]}>;
}): Uint8Array {
  const data = concatBytes(...options.streams.map(stream => stream.bytes));
  const stripeFooter = encodeMessage([
    ...options.streams.map(
      stream =>
        [
          1,
          encodeMessage([
            [1, stream.kind],
            [2, stream.column],
            [3, stream.bytes.length]
          ])
        ] as [number, Uint8Array]
    ),
    ...options.types.map(
      (_type, column) =>
        [
          2,
          encodeMessage([
            [1, 0],
            [3, column]
          ])
        ] as [number, Uint8Array]
    )
  ]);
  const stripeInformation = encodeMessage([
    [1, 3],
    [2, 0],
    [3, data.length],
    [4, stripeFooter.length],
    [5, options.rowCount]
  ]);
  const typeMessages = options.types.map(type =>
    encodeMessage([
      [1, type.kind],
      ...(type.subtypes || []).map(subtype => [2, subtype] as [number, number]),
      ...(type.fieldNames || []).map(fieldName => [3, fieldName] as [number, string])
    ])
  );
  const footer = encodeMessage([
    [3, stripeInformation],
    ...typeMessages.map(type => [4, type] as [number, Uint8Array]),
    [6, options.rowCount]
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
  return bytes;
}

/** Materializes an Arrow column as row values while preserving null entries. */
function getColumnValues(table: arrow.Table, columnName: string): unknown[] {
  const vector = table.getChild(columnName);
  return Array.from({length: table.numRows}, (_value, index) => vector?.get(index));
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
