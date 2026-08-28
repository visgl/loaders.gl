// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {BinaryReader} from '../../src/lib/utils/binary-reader';
import {BinaryWriter} from '../../src/lib/utils/binary-writer';

describe('BinaryReader', () => {
  test('reads primitive values with little-endian encoding', () => {
    const writer = new BinaryWriter(32);
    writer.writeUInt8(0xfe);
    writer.writeUInt16LE(0x1234);
    writer.writeUInt32LE(0x12345678);
    writer.writeInt8(-2);
    writer.writeInt16LE(-1234);
    writer.writeInt32LE(-12345678);
    writer.writeFloatLE(1.25);
    writer.writeDoubleLE(Math.PI);

    const reader = new BinaryReader(writer.getArrayBuffer());
    expect(reader.readUInt8()).toBe(0xfe);
    expect(reader.readUInt16()).toBe(0x1234);
    expect(reader.readUInt32()).toBe(0x12345678);
    expect(reader.readInt8()).toBe(-2);
    expect(reader.readInt16()).toBe(-1234);
    expect(reader.readInt32()).toBe(-12345678);
    expect(reader.readFloat()).toBeCloseTo(1.25);
    expect(reader.readDouble()).toBe(Math.PI);
    expect(reader.byteOffset).toBe(26);
  });

  test('reads big-endian values and variable-length integers', () => {
    const writer = new BinaryWriter(32);
    writer.writeUInt16BE(0x1234);
    writer.writeUInt32BE(0x12345678);
    writer.writeInt16BE(-1234);
    writer.writeInt32BE(-12345678);
    writer.writeFloatBE(1.25);
    writer.writeDoubleBE(Math.PI);

    const reader = new BinaryReader(writer.getArrayBuffer(), true);
    expect(reader.readUInt16()).toBe(0x1234);
    expect(reader.readUInt32()).toBe(0x12345678);
    expect(reader.readInt16()).toBe(-1234);
    expect(reader.readInt32()).toBe(-12345678);
    expect(reader.readFloat()).toBeCloseTo(1.25);
    expect(reader.readDouble()).toBe(Math.PI);

    const variableLengthReader = new BinaryReader(new Uint8Array([0xac, 0x02, 0x01]).buffer);
    expect(variableLengthReader.readVarInt()).toBe(300);
    expect(variableLengthReader.readVarInt()).toBe(1);
  });
});

describe('BinaryWriter', () => {
  test('writes typed arrays and buffers while returning only written bytes', () => {
    const writer = new BinaryWriter(32);
    writer.writeTypedArray(new Uint8Array([1, 2, 3]));
    writer.writeBuffer(new Uint8Array([4, 5]).buffer);

    expect(Array.from(new Uint8Array(writer.getArrayBuffer()))).toEqual([1, 2, 3, 4, 5]);
  });

  test('encodes variable-length integers and grows when enabled', () => {
    const writer = new BinaryWriter(1, true);
    expect(writer.writeVarInt(300)).toBe(2);
    expect(writer.writeVarInt(1)).toBe(1);
    expect(Array.from(new Uint8Array(writer.getArrayBuffer()))).toEqual([0xac, 0x02, 0x01]);
  });

  test('rejects overflow when resizing is disabled', () => {
    const writer = new BinaryWriter(1);
    writer.writeUInt8(1);
    expect(() => writer.writeUInt8(2)).toThrow('BinaryWriter overflow');
  });
});
