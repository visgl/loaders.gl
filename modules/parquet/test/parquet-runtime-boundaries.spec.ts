// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {normalizeParquetOptions} from '../src/lib/utils/normalize-parquet-options';
import {
  CompactInt64,
  Uint8ArrayCompactProtocol
} from '../src/parquetjs/utils/uint8-array-compact-protocol';
import {Thrift} from '../src/parquetjs/utils/thrift-runtime';
import {Uint8ArrayTransport} from '../src/parquetjs/utils/uint8-array-transport';

/** Creates a compact protocol over exact bytes. */
function createProtocol(bytes: number[]): Uint8ArrayCompactProtocol {
  return new Uint8ArrayCompactProtocol(new Uint8ArrayTransport(Uint8Array.from(bytes)));
}

test('normalizeParquetOptions preserves bags and maps scan pushdown exactly', () => {
  expect(normalizeParquetOptions(undefined, {shape: 'arrow-table', limit: 10})).toEqual({
    parquet: {shape: 'arrow-table', limit: 10}
  });
  expect(
    normalizeParquetOptions(
      {
        parquet: {shape: 'object-row-table', limit: 7},
        _scan: {columns: ['name', 'value'] as const, limit: 0},
        marker: true
      },
      {shape: 'arrow-table', limit: 10}
    )
  ).toEqual({
    parquet: {shape: 'object-row-table', limit: 0, columns: ['name', 'value']},
    _scan: {columns: ['name', 'value'], limit: 0},
    marker: true
  });
  expect(
    normalizeParquetOptions({_scan: {columns: undefined, limit: undefined}}, {columns: ['all']})
  ).toEqual({
    parquet: {columns: ['all']},
    _scan: {columns: undefined, limit: undefined}
  });
  expect(() =>
    normalizeParquetOptions({_scan: {columns: [], unsupported: true} as any}, {})
  ).toThrow('Parquet _scan option "unsupported" is not supported');
});

test('CompactInt64 accepts every supported input shape', () => {
  const values = [
    new CompactInt64(42n),
    new CompactInt64(42),
    new CompactInt64('42'),
    new CompactInt64({toString: () => '42'})
  ];
  for (const value of values) {
    expect(value.toNumber()).toBe(42);
    expect(value.valueOf()).toBe(42);
    expect(value.toString()).toBe('42');
    expect(value.toString(16)).toBe('2a');
  }
});

test('Uint8ArrayTransport covers signed bytes, strings, borrowing, and underruns', () => {
  const transport = new Uint8ArrayTransport(Uint8Array.from([0xff, 0x41, 0x42, 0x43]));
  expect(transport.isOpen()).toBe(true);
  expect(transport.open()).toBe(true);
  transport.commitPosition();
  transport.rollbackPosition();
  transport.setCurrSeqId(3);
  expect(transport.readByte()).toBe(-1);
  expect(transport.readString(2)).toBe('AB');
  expect(transport.borrow()).toEqual({
    buf: Uint8Array.from([0xff, 0x41, 0x42, 0x43]),
    readIndex: 3,
    writeIndex: 4
  });
  transport.consume(1);
  expect(() => transport.read(1)).toThrow('Input buffer underrun');
  expect(() => transport.write()).toThrow('read-only');
  transport.flush();
  expect(transport.close()).toBe(true);
});

test('compact protocol expands every field type and field-id encoding', () => {
  const expectedTypes = [
    Thrift.Type.BOOL,
    Thrift.Type.BOOL,
    Thrift.Type.BYTE,
    Thrift.Type.I16,
    Thrift.Type.I32,
    Thrift.Type.I64,
    Thrift.Type.DOUBLE,
    Thrift.Type.STRING,
    Thrift.Type.LIST,
    Thrift.Type.SET,
    Thrift.Type.MAP,
    Thrift.Type.STRUCT
  ];
  for (let compactType = 1; compactType <= 12; compactType++) {
    const protocol = createProtocol([0x10 | compactType]);
    protocol.readStructBegin();
    expect(protocol.readFieldBegin()).toMatchObject({ftype: expectedTypes[compactType - 1], fid: 1});
    if (compactType === 1) expect(protocol.readBool()).toBe(true);
    if (compactType === 2) expect(protocol.readBool()).toBe(false);
    protocol.readFieldEnd();
    protocol.readStructEnd();
  }

  const explicitFieldId = createProtocol([0x05, 0x06]);
  expect(explicitFieldId.readFieldBegin()).toMatchObject({ftype: Thrift.Type.I32, fid: 3});
  expect(createProtocol([0]).readFieldBegin()).toMatchObject({ftype: Thrift.Type.STOP, fid: 0});
  expect(() => createProtocol([0x1d]).readFieldBegin()).toThrow('Unknown compact thrift type');
});

test('compact protocol reads collection, scalar, and empty encodings', () => {
  expect(createProtocol([0]).readMapBegin()).toEqual({
    ktype: Thrift.Type.STOP,
    vtype: Thrift.Type.STOP,
    size: 0
  });
  expect(createProtocol([1, 0x58]).readMapBegin()).toEqual({
    ktype: Thrift.Type.I32,
    vtype: Thrift.Type.STRING,
    size: 1
  });
  expect(createProtocol([0x35]).readListBegin()).toEqual({etype: Thrift.Type.I32, size: 3});
  expect(createProtocol([0xf5, 0x10]).readListBegin()).toEqual({etype: Thrift.Type.I32, size: 16});
  expect(createProtocol([0x2a]).readSetBegin()).toEqual({etype: Thrift.Type.SET, size: 2});

  expect(createProtocol([1]).readBool()).toBe(true);
  expect(createProtocol([2]).readBool()).toBe(false);
  expect(createProtocol([0xfe]).readByte()).toBe(-2);
  expect(createProtocol([1]).readI16()).toBe(-1);
  expect(createProtocol([2]).readI32()).toBe(1);
  expect(createProtocol([0xac, 0x02]).readI64().toString()).toBe('150');

  const doubleBytes = new Uint8Array(8);
  new DataView(doubleBytes.buffer).setFloat64(0, 12.5, true);
  expect(
    new Uint8ArrayCompactProtocol(new Uint8ArrayTransport(doubleBytes)).readDouble()
  ).toBe(12.5);
  expect(createProtocol([0]).readBinary()).toEqual(new Uint8Array());
  expect(createProtocol([3, 1, 2, 3]).readBinary()).toEqual(Uint8Array.from([1, 2, 3]));
  expect(createProtocol([0]).readString()).toBe('');
  expect(createProtocol([3, 102, 111, 111]).readString()).toBe('foo');
});

test('compact protocol skip consumes every thrift category', () => {
  const scalarCases: Array<[Thrift.Type, number[]]> = [
    [Thrift.Type.STOP, []],
    [Thrift.Type.BOOL, [1]],
    [Thrift.Type.BYTE, [7]],
    [Thrift.Type.I16, [2]],
    [Thrift.Type.I32, [2]],
    [Thrift.Type.I64, [2]],
    [Thrift.Type.DOUBLE, new Array(8).fill(0)],
    [Thrift.Type.STRING, [2, 1, 2]]
  ];
  for (const [type, bytes] of scalarCases) {
    expect(() => createProtocol(bytes).skip(type)).not.toThrow();
  }

  // One I32 field followed by STOP.
  expect(() => createProtocol([0x15, 2, 0]).skip(Thrift.Type.STRUCT)).not.toThrow();
  // One I32 -> BOOL map entry.
  expect(() => createProtocol([1, 0x51, 2, 1]).skip(Thrift.Type.MAP)).not.toThrow();
  // Two I32 values, encoded identically for list and set.
  expect(() => createProtocol([0x25, 2, 4]).skip(Thrift.Type.LIST)).not.toThrow();
  expect(() => createProtocol([0x25, 2, 4]).skip(Thrift.Type.SET)).not.toThrow();
  expect(() => createProtocol([]).skip(Thrift.Type.VOID)).toThrow('Unsupported thrift type');
});

