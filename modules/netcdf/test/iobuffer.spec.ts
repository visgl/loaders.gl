// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {IOBuffer} from '../src/iobuffer/iobuffer';

test('IOBuffer writes and reads primitive values, text, and expanding storage', () => {
  const buffer = new IOBuffer(4);
  buffer.writeBoolean(true).writeBoolean(false).writeInt8(-8).writeUint8(8);
  buffer.writeInt16(-16).writeUint16(16).writeInt32(-32).writeUint32(32);
  buffer.writeFloat32(1.5).writeFloat64(2.5);
  buffer.writeChar('A').writeChars('BC').writeUtf8('é');
  expect(buffer.toArray().length).toBe(buffer.offset);

  buffer.rewind();
  expect(buffer.readBoolean()).toBe(true);
  expect(buffer.readBoolean()).toBe(false);
  expect(buffer.readInt8()).toBe(-8);
  expect(buffer.readUint8()).toBe(8);
  expect(buffer.readInt16()).toBe(-16);
  expect(buffer.readUint16()).toBe(16);
  expect(buffer.readInt32()).toBe(-32);
  expect(buffer.readUint32()).toBe(32);
  expect(buffer.readFloat32()).toBeCloseTo(1.5);
  expect(buffer.readFloat64()).toBe(2.5);
  expect(buffer.readChar()).toBe('A');
  expect(buffer.readChars(2)).toBe('BC');
  expect(buffer.readUtf8(2)).toBe('é');
});

test('IOBuffer supports endianness, seeking, marks, views, and byte aliases', () => {
  const buffer = new IOBuffer(16).setBigEndian();
  expect(buffer.isBigEndian()).toBe(true);
  buffer.writeUint16(0x1234).writeUint32(0x12345678).writeBytes([1, 2, 3]);
  expect(Array.from(buffer.toArray())).toEqual([0x12, 0x34, 0x12, 0x34, 0x56, 0x78, 1, 2, 3]);

  buffer.rewind().mark();
  expect(buffer.readUint16()).toBe(0x1234);
  buffer.reset();
  expect(buffer.readByte()).toBe(0x12);
  buffer.pushMark().skip(2).popMark();
  expect(buffer.offset).toBe(1);
  buffer.seek(6);
  expect(buffer.readBytes(3)).toEqual(new Uint8Array([1, 2, 3]));
  buffer.rewind().setLittleEndian();
  expect(buffer.isLittleEndian()).toBe(true);
  expect(buffer.available(1)).toBe(true);
  expect(() => buffer.popMark()).toThrow('Mark stack empty');

  const source = new Uint8Array([9, 8, 7, 6]);
  const view = new IOBuffer(source.subarray(1), {offset: 1});
  expect(view.byteOffset).toBe(source.byteOffset + 2);
  expect(view.readUint8()).toBe(7);
});

test('IOBuffer grows storage and handles UTF-8 and default byte reads', () => {
  const buffer = new IOBuffer(1);
  buffer.writeUtf8('東京');
  expect(buffer.toArray().length).toBeGreaterThan(1);
  buffer.rewind();
  expect(buffer.readUtf8(new TextEncoder().encode('東京').length)).toBe('東京');

  const bytes = new IOBuffer(new Uint8Array([1, 2, 3]));
  expect(bytes.readBytes()).toEqual(new Uint8Array([1]));
  expect(bytes.available(2)).toBe(true);
  expect(bytes.available(3)).toBe(false);
});
