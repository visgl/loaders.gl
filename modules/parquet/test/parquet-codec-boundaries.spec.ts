// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {PARQUET_CODECS} from '../src/parquetjs/codecs';
import {isDeltaEncodingType} from '../src/parquetjs/codecs/delta';
import {
  decodeDataPages,
  decodeSchema,
  decodeUncompressedDataPages
} from '../src/parquetjs/parser/decoders';
import {
  FieldRepetitionType,
  LogicalType,
  SchemaElement,
  TimeType,
  TimeUnit,
  TimestampType,
  Type
} from '../src/parquetjs/parquet-thrift';
import type {ParquetReaderContext, PrimitiveType} from '../src/parquetjs/schema/declare';

/** Creates a byte vector for compact malformed-codec fixtures. */
function bytes(values: number[]): Uint8Array {
  return Uint8Array.from(values);
}

/** Decodes one envelope-free RLE dictionary run. */
function decodeDictionaryRun(values: number[], bitWidth: number, dictionaryLength = 1 << bitWidth) {
  const dictionary = Array.from({length: dictionaryLength}, (_, index) => `dictionary-${index}`);
  const encoded = PARQUET_CODECS.RLE.encodeValues('INT32', values, {
    bitWidth,
    disableEnvelope: true
  });
  return PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    {buffer: encoded, offset: 0},
    values.length,
    {bitWidth, disableEnvelope: true, dictionary}
  );
}

test('RLE resolves every specialized dictionary width and tail layout', () => {
  for (const bitWidth of [1, 2, 3, 4, 5, 8, 10, 12]) {
    const maximumValue = 2 ** bitWidth - 1;
    const values = [0, 1, maximumValue, 0, 1, maximumValue, 0, 1, maximumValue];
    expect(decodeDictionaryRun(values, bitWidth)).toEqual(
      values.map(value => `dictionary-${value}`)
    );
  }

  expect(decodeDictionaryRun(new Array(17).fill(1), 1)).toEqual(
    new Array(17).fill('dictionary-1')
  );
  expect(decodeDictionaryRun([0, 1, 2, 3, 0, 1, 2, 3, 1], 2)).toEqual([
    'dictionary-0',
    'dictionary-1',
    'dictionary-2',
    'dictionary-3',
    'dictionary-0',
    'dictionary-1',
    'dictionary-2',
    'dictionary-3',
    'dictionary-1'
  ]);
});

test('RLE dictionary fast paths reject out-of-range indices', () => {
  const cases: Array<[number, Uint8Array]> = [
    [1, bytes([0x03, 0x01])],
    [2, bytes([0x03, 0x04, 0x00])],
    [3, bytes([0x03, 0x08, 0x00, 0x00])],
    [4, bytes([0x03, 0x10, 0x00, 0x00, 0x00])],
    [5, bytes([0x03, 0x20, 0x00, 0x00, 0x00, 0x00])],
    [8, bytes([0x03, 0x01, 0, 0, 0, 0, 0, 0, 0])],
    [10, bytes([0x03, 0x01, 0, 0, 0, 0, 0, 0, 0, 0, 0])],
    [12, bytes([0x03, 0x01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])]
  ];
  for (const [bitWidth, encoded] of cases) {
    expect(() =>
      PARQUET_CODECS.RLE.decodeValues('INT32', {buffer: encoded, offset: 0}, 8, {
        bitWidth,
        disableEnvelope: true,
        dictionary: ['only-zero']
      })
    ).toThrow('Invalid Parquet dictionary index');
  }
});

test('RLE and BIT_PACKED cover zero-width, output offsets, and envelope boundaries', () => {
  expect(
    PARQUET_CODECS.RLE.decodeValues('INT32', {buffer: bytes([0x10]), offset: 0}, 8, {
      bitWidth: 0,
      disableEnvelope: true
    })
  ).toEqual(new Array(8).fill(0));

  const output = new Int32Array(12).fill(-1);
  const encoded = PARQUET_CODECS.RLE.encodeValues('INT32', [3, 3, 3, 3, 3, 3, 3, 3], {
    bitWidth: 2,
    disableEnvelope: true
  });
  expect(
    PARQUET_CODECS.RLE.decodeValues('INT32', {buffer: encoded, offset: 0}, 8, {
      bitWidth: 2,
      disableEnvelope: true,
      output,
      outputOffset: 2
    })
  ).toBe(output);
  expect(Array.from(output)).toEqual([-1, -1, 3, 3, 3, 3, 3, 3, 3, 3, -1, -1]);

  expect(() =>
    PARQUET_CODECS.BIT_PACKED.decodeValues(
      'INT32',
      {buffer: bytes([0, 0, 0, 0, 1]), offset: 0},
      8,
      {bitWidth: 1}
    )
  ).toThrow('invalid BIT_PACKED length');
  expect(() =>
    PARQUET_CODECS.RLE.decodeValues(
      'INT32',
      {buffer: bytes([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f]), offset: 0},
      1,
      {bitWidth: 1, disableEnvelope: true}
    )
  ).toThrow(/safe integer range|unexpected end/);
});

test('delta encoding compatibility covers every physical-type decision', () => {
  expect(isDeltaEncodingType('DELTA_BINARY_PACKED', 'INT32')).toBe(true);
  expect(isDeltaEncodingType('DELTA_BINARY_PACKED', 'INT64')).toBe(true);
  expect(isDeltaEncodingType('DELTA_BINARY_PACKED', 'BYTE_ARRAY')).toBe(false);
  expect(isDeltaEncodingType('DELTA_LENGTH_BYTE_ARRAY', 'BYTE_ARRAY')).toBe(true);
  expect(isDeltaEncodingType('DELTA_LENGTH_BYTE_ARRAY', 'INT32')).toBe(false);
  expect(isDeltaEncodingType('DELTA_BYTE_ARRAY', 'BYTE_ARRAY')).toBe(true);
  expect(isDeltaEncodingType('DELTA_BYTE_ARRAY', 'FIXED_LEN_BYTE_ARRAY')).toBe(true);
  expect(isDeltaEncodingType('DELTA_BYTE_ARRAY', 'INT64')).toBe(false);
  expect(isDeltaEncodingType('PLAIN', 'INT32')).toBe(false);
});

test('delta encoders cover empty values, coercion errors, and integer bounds', () => {
  expect(PARQUET_CODECS.DELTA_BINARY_PACKED.encodeValues('INT32', [], {})).toEqual(bytes([]));
  expect(PARQUET_CODECS.DELTA_LENGTH_BYTE_ARRAY.encodeValues('BYTE_ARRAY', [], {})).toEqual(
    bytes([])
  );
  expect(PARQUET_CODECS.DELTA_BYTE_ARRAY.encodeValues('BYTE_ARRAY', [], {})).toEqual(bytes([]));

  expect(() =>
    PARQUET_CODECS.DELTA_BINARY_PACKED.encodeValues('INT32', [{}], {})
  ).toThrow('Invalid INT32 value');
  expect(() =>
    PARQUET_CODECS.DELTA_BINARY_PACKED.encodeValues('INT32', [2n ** 31n], {})
  ).toThrow('INT32 value');
  expect(() =>
    PARQUET_CODECS.DELTA_BINARY_PACKED.encodeValues('INT64', [2n ** 63n], {})
  ).toThrow('INT64 value');
});

test('delta byte arrays write directly into growable contiguous destinations', () => {
  const values = [
    new TextEncoder().encode('a'.repeat(20)),
    new TextEncoder().encode(`${'a'.repeat(18)}bcdefghijklmnopqrstuvwxyz`),
    new TextEncoder().encode(`${'a'.repeat(18)}bcdefghijklmnopqrstuvwxyz!`)
  ];
  for (const codec of [
    PARQUET_CODECS.DELTA_LENGTH_BYTE_ARRAY,
    PARQUET_CODECS.DELTA_BYTE_ARRAY
  ]) {
    const encoded = codec.encodeValues('BYTE_ARRAY', values, {});
    const byteArrayOutput = {
      data: new Uint8Array(1),
      valueOffsets: new Int32Array(values.length + 3),
      byteLength: 1
    };
    byteArrayOutput.data[0] = 64;
    const output: unknown[] = ['sentinel'];
    expect(
      codec.decodeValues('BYTE_ARRAY', {buffer: encoded, offset: 0}, values.length, {
        byteArrayOutput,
        output,
        outputOffset: 2
      })
    ).toBe(output);
    expect(Array.from(byteArrayOutput.data.subarray(0, 1))).toEqual([64]);
    expect(Array.from(byteArrayOutput.valueOffsets.subarray(2, 6))).toEqual([
      1,
      1 + values[0].length,
      1 + values[0].length + values[1].length,
      1 + values[0].length + values[1].length + values[2].length
    ]);
    expect(byteArrayOutput.byteLength).toBe(
      1 + values.reduce((byteLength, value) => byteLength + value.length, 0)
    );
  }
});

test('delta decoders reject malformed headers, counts, and byte-array payloads', () => {
  const decodeBinary = (encoded: number[], count = 1) =>
    PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues(
      'INT32',
      {buffer: bytes(encoded), offset: 0},
      count,
      {}
    );

  expect(() => decodeBinary([0, 1, 1, 0])).toThrow('block header');
  expect(() => decodeBinary([8, 3, 1, 0])).toThrow('block header');
  expect(() => decodeBinary([8, 1, 0, 0])).toThrow('contains 0 values');
  expect(() => decodeBinary([10, 1, 1, 0])).toThrow('mini-block size');
  expect(() => decodeBinary([0x80, 0x01, 4, 1, 0x80, 0x80, 0x80, 0x80, 0x10])).toThrow(
    'exceeds 32 bits'
  );
  expect(() =>
    PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues(
      'INT32',
      {buffer: bytes(new Array(10).fill(0xff)), offset: 0},
      1,
      {}
    )
  ).toThrow(/variable-length integer/);

  const validLengths = PARQUET_CODECS.DELTA_BINARY_PACKED.encodeValues('INT32', [4], {});
  expect(() =>
    PARQUET_CODECS.DELTA_LENGTH_BYTE_ARRAY.decodeValues(
      'BYTE_ARRAY',
      {buffer: validLengths, offset: 0},
      1,
      {}
    )
  ).toThrow('Unexpected end');
  expect(() =>
    PARQUET_CODECS.DELTA_BYTE_ARRAY.decodeValues(
      'BYTE_ARRAY',
      {
        buffer: bytes([
          ...PARQUET_CODECS.DELTA_BINARY_PACKED.encodeValues('INT32', [1], {}),
          ...PARQUET_CODECS.DELTA_BINARY_PACKED.encodeValues('INT32', [0], {})
        ]),
        offset: 0
      },
      1,
      {}
    )
  ).toThrow('prefix length');
  expect(() =>
    PARQUET_CODECS.DELTA_BYTE_ARRAY.decodeValues('INT32', {buffer: bytes([]), offset: 0}, 0, {})
  ).toThrow('does not support Parquet type INT32');
});

test('page decoders allocate and trim every typed physical destination', async () => {
  const expectedConstructors = new Map<PrimitiveType, unknown>([
    ['BOOLEAN', Uint8Array],
    ['INT32', Int32Array],
    ['INT64', BigInt64Array],
    ['DOUBLE', Float64Array],
    ['FLOAT', Float32Array]
  ]);
  for (const [primitiveType, ExpectedConstructor] of expectedConstructors) {
    const context = createEmptyPageContext(primitiveType, {
      numValues: 4,
      useTypedLevelBuffers: true,
      useTypedValueBuffers: true
    });
    const asynchronous = await decodeDataPages(new Uint8Array(), context);
    const synchronous = decodeUncompressedDataPages(new Uint8Array(), context);
    expect(asynchronous.values).toBeInstanceOf(ExpectedConstructor as any);
    expect(synchronous.values).toBeInstanceOf(ExpectedConstructor as any);
    expect(asynchronous.values).toHaveLength(0);
    expect(synchronous.values).toHaveLength(0);
    expect(asynchronous.rlevels).toBeInstanceOf(Uint8Array);
    expect(asynchronous.dlevels).toBeInstanceOf(Uint8Array);
  }

  for (const int96AsTimestamp of [true, false]) {
    const result = decodeUncompressedDataPages(
      new Uint8Array(),
      createEmptyPageContext('INT96', {
        numValues: 2,
        useTypedValueBuffers: true,
        int96AsTimestamp
      })
    );
    expect(result.values).toBeInstanceOf(int96AsTimestamp ? BigInt64Array : Float64Array);
  }

  const fallback = decodeUncompressedDataPages(
    new Uint8Array(),
    createEmptyPageContext('BYTE_ARRAY', {numValues: 3, useTypedValueBuffers: true})
  );
  expect(fallback.values).toEqual([]);
});

test('page decoders reject non-integral metadata and skip optional byte-array fast paths', async () => {
  for (const numValues of [Number.NaN, Number.POSITIVE_INFINITY, 1.5]) {
    await expect(
      decodeDataPages(new Uint8Array(), createEmptyPageContext('INT32', {numValues}))
    ).rejects.toThrow('Invalid Parquet column value count');
    expect(() =>
      decodeUncompressedDataPages(
        new Uint8Array(),
        createEmptyPageContext('INT32', {numValues})
      )
    ).toThrow('Invalid Parquet column value count');
  }

  for (const primitiveType of ['BYTE_ARRAY', 'FIXED_LEN_BYTE_ARRAY'] as const) {
    const result = decodeUncompressedDataPages(
      new Uint8Array(),
      createEmptyPageContext(primitiveType, {
        numValues: 3,
        useArrowByteArrayBuffers: true,
        hasOnlyArrowByteArrayDataPages: true,
        column: {logicalType: {type: 'DECIMAL', precision: 2, scale: 0}}
      })
    );
    expect(result.byteArrayData).toBeUndefined();
  }
});

test('schema decoding rejects unknown repetition enums and missing logical time units', () => {
  expect(() =>
    decodeSchema(
      [
        new SchemaElement({name: 'schema', num_children: 1}),
        new SchemaElement({
          name: 'value',
          type: Type.INT32,
          repetition_type: 99 as FieldRepetitionType
        })
      ],
      1,
      1
    )
  ).toThrow('Invalid ENUM value');

  for (const logicalType of [
    LogicalType.fromTIME(new TimeType({isAdjustedToUTC: false, unit: new TimeUnit()})),
    LogicalType.fromTIMESTAMP(new TimestampType({isAdjustedToUTC: true, unit: new TimeUnit()}))
  ]) {
    expect(() =>
      decodeSchema(
        [
          new SchemaElement({name: 'schema', num_children: 1}),
          new SchemaElement({
            name: 'value',
            type: Type.INT64,
            repetition_type: FieldRepetitionType.REQUIRED,
            logicalType
          })
        ],
        1,
        1
      )
    ).toThrow('missing its unit');
  }
});

/** Construct a minimal empty column context that still exercises allocation policy. */
function createEmptyPageContext(
  primitiveType: PrimitiveType,
  overrides: Partial<ParquetReaderContext> & {column?: Record<string, unknown>} = {}
): ParquetReaderContext {
  return {
    type: primitiveType,
    rLevelMax: 0,
    dLevelMax: 0,
    compression: 'UNCOMPRESSED',
    ...overrides,
    column: {
      name: 'value',
      path: ['value'],
      key: 'value',
      primitiveType,
      repetitionType: 'REQUIRED',
      rLevelMax: 0,
      dLevelMax: 0,
      ...overrides.column
    }
  } as ParquetReaderContext;
}
