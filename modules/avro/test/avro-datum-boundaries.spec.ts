// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {decodeAvroBlockRows, type AvroOCFHeader} from '../src/lib/parsers/parse-avro';

/** Supplies a null-codec header for independent raw datum fixtures. */
function createHeader(schema: AvroOCFHeader['schema']): AvroOCFHeader {
  return {
    schema,
    codec: 'null',
    metadata: new Map(),
    syncMarker: new Uint8Array(16),
    dataOffset: 0
  };
}

/** Encodes signed Avro longs without using the production encoder. */
function encodeLong(value: bigint): number[] {
  let encoded = value >= 0n ? value * 2n : -value * 2n - 1n;
  const bytes: number[] = [];
  do {
    const byte = Number(encoded & 127n);
    encoded >>= 7n;
    bytes.push(byte | (encoded ? 128 : 0));
  } while (encoded);
  return bytes;
}

test('Avro decodes negative collection blocks followed by positive blocks', async () => {
  const schema = {
    type: 'record',
    name: 'Collections',
    fields: [
      {name: 'samples', type: {type: 'array', items: 'int'}},
      {name: 'labels', type: {type: 'map', values: 'long'}}
    ]
  };
  const bytes = Uint8Array.from([
    3,
    4,
    1,
    4,
    2,
    6,
    0, // array: negative block [-1, 2], positive block [3]
    1,
    10,
    6,
    107,
    101,
    121,
    14,
    0 // map: one sized block {key: 7}
  ]);
  expect(await decodeAvroBlockRows(bytes, 1, createHeader(schema))).toEqual([
    {samples: [-1, 2, 3], labels: new Map([['key', 7]])}
  ]);
  await expect(decodeAvroBlockRows(bytes.subarray(0, -1), 1, createHeader(schema))).rejects.toThrow(
    'Unexpected end of Avro file'
  );
});

test('Avro preserves large signed longs and bigint logical time values', async () => {
  const schema = {
    type: 'record',
    name: 'Times',
    fields: [
      {name: 'minimum', type: 'long'},
      {name: 'maximum', type: 'long'},
      {name: 'millis', type: {type: 'long', logicalType: 'timestamp-millis'}},
      {name: 'micros', type: {type: 'long', logicalType: 'timestamp-micros'}},
      {name: 'timeMillis', type: {type: 'long', logicalType: 'time-millis'}},
      {name: 'timeMicros', type: {type: 'long', logicalType: 'time-micros'}},
      {name: 'nanos', type: {type: 'long', logicalType: 'timestamp-nanos'}},
      {name: 'localNanos', type: {type: 'long', logicalType: 'local-timestamp-nanos'}}
    ]
  };
  const values = [
    -9223372036854775808n,
    9223372036854775807n,
    1234n,
    1234567n,
    42n,
    42000n,
    9007199254740993n,
    9007199254740995n
  ];
  expect(
    await decodeAvroBlockRows(
      Uint8Array.from(values.flatMap(encodeLong)),
      1,
      createHeader(schema),
      {longType: 'bigint'}
    )
  ).toEqual([
    {
      minimum: -9223372036854775808n,
      maximum: 9223372036854775807n,
      millis: new Date(1234),
      micros: new Date(1234),
      timeMillis: 42n,
      timeMicros: 42000n,
      nanos: 9007199254740993n,
      localNanos: 9007199254740995n
    }
  ]);
});

test('Avro decodes recursive named records through union references', async () => {
  const schema = {
    type: 'record',
    name: 'Node',
    fields: [
      {name: 'value', type: 'int'},
      {name: 'next', type: ['null', 'Node']}
    ]
  };
  expect(
    await decodeAvroBlockRows(new Uint8Array([14, 2, 16, 0]), 1, createHeader(schema))
  ).toEqual([{value: 7, next: {value: 8, next: null}}]);
});

test('Avro rejects a reader fixed value whose writer bytes have the wrong length', async () => {
  const header = createHeader({
    type: 'record',
    name: 'Bytes',
    fields: [{name: 'value', type: 'bytes'}]
  });
  await expect(
    decodeAvroBlockRows(new Uint8Array([2, 7]), 1, header, {
      readerSchema: {
        type: 'record',
        name: 'Bytes',
        fields: [{name: 'value', type: {type: 'fixed', name: 'Pair', size: 2}}]
      }
    })
  ).rejects.toThrow('Avro fixed value has an incompatible size');
});

test('Avro decodes a multi-byte negative decimal with declared scale', async () => {
  const schema = {
    type: 'record',
    name: 'Decimal',
    fields: [
      {
        name: 'value',
        type: {type: 'bytes', logicalType: 'decimal', precision: 4, scale: 2}
      }
    ]
  };
  expect(
    await decodeAvroBlockRows(new Uint8Array([4, 0xfb, 0x2e]), 1, createHeader(schema))
  ).toEqual([{value: -12.34}]);
});
