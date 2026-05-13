// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as thrift from 'thrift';
import {concatUint8Arrays, encodeUtf8, toUint8Array, writeDoubleLE} from './binary-utils';

const COMPACT_TYPE_STOP = 0x00;
const COMPACT_TYPE_BOOLEAN_TRUE = 0x01;
const COMPACT_TYPE_BOOLEAN_FALSE = 0x02;
const COMPACT_TYPE_BYTE = 0x03;
const COMPACT_TYPE_I16 = 0x04;
const COMPACT_TYPE_I32 = 0x05;
const COMPACT_TYPE_I64 = 0x06;
const COMPACT_TYPE_DOUBLE = 0x07;
const COMPACT_TYPE_BINARY = 0x08;
const COMPACT_TYPE_LIST = 0x09;
const COMPACT_TYPE_SET = 0x0a;
const COMPACT_TYPE_MAP = 0x0b;
const COMPACT_TYPE_STRUCT = 0x0c;

type Int64Like = number | bigint | {toString(radix?: number): string; valueOf?: () => number};

/** Write-only Thrift compact protocol that assembles exact Uint8Array output. */
export class Uint8ArrayCompactProtocolWriter {
  /** Serialized byte chunks accumulated by thrift write calls. */
  private readonly chunks: Uint8Array[] = [];

  /** Field id at the current nesting depth, used to emit compact field-id deltas. */
  private lastFieldId = 0;

  /** Parent struct field ids restored when nested structs end. */
  private readonly lastFieldIds: number[] = [];

  /** Boolean field header waiting for the following boolean payload. */
  private pendingBooleanField: {fid: number} | null = null;

  /** Enter a struct and reset the delta-encoded field id state. */
  writeStructBegin(_name: string): void {
    this.lastFieldIds.push(this.lastFieldId);
    this.lastFieldId = 0;
  }

  /** Exit a struct and restore the parent field id state. */
  writeStructEnd(): void {
    this.lastFieldId = this.lastFieldIds.pop() || 0;
  }

  /** Write a field header, deferring boolean fields until their value is known. */
  writeFieldBegin(_name: string, fieldType: thrift.Thrift.Type, fid: number): void {
    if (fieldType === thrift.Thrift.Type.BOOL) {
      this.pendingBooleanField = {fid};
      return;
    }

    this.writeFieldHeader(this.getCompactType(fieldType), fid);
  }

  /** Complete the current field; compact protocol has no field-end bytes. */
  writeFieldEnd(): void {}

  /** Write the stop marker that terminates a thrift struct. */
  writeFieldStop(): void {
    this.writeByteDirect(COMPACT_TYPE_STOP);
  }

  /** Write a map header with compact key/value element types. */
  writeMapBegin(keyType: thrift.Thrift.Type, valueType: thrift.Thrift.Type, size: number): void {
    if (size === 0) {
      this.writeByteDirect(0);
      return;
    }

    this.writeVarint32(size);
    this.writeByteDirect((this.getCompactType(keyType) << 4) | this.getCompactType(valueType));
  }

  /** Complete the current map; compact protocol has no map-end bytes. */
  writeMapEnd(): void {}

  /** Write a list header with compact element type and element count. */
  writeListBegin(elementType: thrift.Thrift.Type, size: number): void {
    this.writeCollectionBegin(elementType, size);
  }

  /** Complete the current list; compact protocol has no list-end bytes. */
  writeListEnd(): void {}

  /** Write a set header with compact element type and element count. */
  writeSetBegin(elementType: thrift.Thrift.Type, size: number): void {
    this.writeCollectionBegin(elementType, size);
  }

  /** Complete the current set; compact protocol has no set-end bytes. */
  writeSetEnd(): void {}

  /** Write a boolean, either inline in its field header or as a value byte. */
  writeBool(value: boolean): void {
    const compactType = value ? COMPACT_TYPE_BOOLEAN_TRUE : COMPACT_TYPE_BOOLEAN_FALSE;
    if (this.pendingBooleanField) {
      this.writeFieldHeader(compactType, this.pendingBooleanField.fid);
      this.pendingBooleanField = null;
      return;
    }

    this.writeByteDirect(compactType);
  }

  /** Write a signed byte. */
  writeByte(value: number): void {
    this.writeByteDirect(value);
  }

  /** Write a signed 16-bit integer as zig-zag varint. */
  writeI16(value: number): void {
    this.writeI32(value);
  }

  /** Write a signed 32-bit integer as zig-zag varint. */
  writeI32(value: number): void {
    this.writeVarint32(this.encodeZigZag32(value));
  }

  /** Write a signed 64-bit-like value as zig-zag varint. */
  writeI64(value: Int64Like): void {
    this.writeVarint64(this.encodeZigZag64(this.toBigInt(value)));
  }

  /** Write a little-endian 64-bit float. */
  writeDouble(value: number): void {
    const bytes = new Uint8Array(8);
    writeDoubleLE(bytes, value, 0);
    this.writeBytes(bytes);
  }

  /** Write a length-prefixed UTF-8 string. */
  writeString(value: string): void {
    this.writeBinary(encodeUtf8(value));
  }

  /** Write a length-prefixed binary payload from any typed-array view. */
  writeBinary(value: ArrayBuffer | ArrayBufferView): void {
    const bytes = toUint8Array(value);
    this.writeVarint32(bytes.length);
    this.writeBytes(bytes);
  }

  /** Return all serialized chunks as one contiguous byte array. */
  getBytes(): Uint8Array {
    return concatUint8Arrays(this.chunks);
  }

  /** Write a compact collection header for list or set values. */
  private writeCollectionBegin(elementType: thrift.Thrift.Type, size: number): void {
    const compactType = this.getCompactType(elementType);
    if (size <= 14) {
      this.writeByteDirect((size << 4) | compactType);
      return;
    }

    this.writeByteDirect(0xf0 | compactType);
    this.writeVarint32(size);
  }

  /** Write a compact field header using a field-id delta when possible. */
  private writeFieldHeader(compactType: number, fid: number): void {
    const fieldIdDelta = fid - this.lastFieldId;
    if (fieldIdDelta > 0 && fieldIdDelta <= 15) {
      this.writeByteDirect((fieldIdDelta << 4) | compactType);
    } else {
      this.writeByteDirect(compactType);
      this.writeI16(fid);
    }
    this.lastFieldId = fid;
  }

  /** Append an already serialized byte range without copying. */
  private writeBytes(bytes: Uint8Array): void {
    this.chunks.push(bytes);
  }

  /** Append one byte to the serialized output. */
  private writeByteDirect(value: number): void {
    this.chunks.push(new Uint8Array([value & 0xff]));
  }

  /** Write an unsigned 32-bit value as a compact varint. */
  private writeVarint32(value: number): void {
    this.writeVarint64(BigInt(value >>> 0));
  }

  /** Write an unsigned 64-bit value as a compact varint. */
  private writeVarint64(value: bigint): void {
    let nextValue = value;
    while (true) {
      if ((nextValue & ~0x7fn) === 0n) {
        this.writeByteDirect(Number(nextValue));
        return;
      }

      this.writeByteDirect(Number((nextValue & 0x7fn) | 0x80n));
      nextValue >>= 7n;
    }
  }

  /** Encode a signed 32-bit integer as an unsigned zig-zag value. */
  private encodeZigZag32(value: number): number {
    return ((value << 1) ^ (value >> 31)) >>> 0;
  }

  /** Encode a signed 64-bit integer as an unsigned zig-zag value. */
  private encodeZigZag64(value: bigint): bigint {
    return (value << 1n) ^ (value >> 63n);
  }

  /** Normalize thrift int64-like values to bigint before zig-zag encoding. */
  private toBigInt(value: Int64Like): bigint {
    return typeof value === 'bigint' || typeof value === 'number'
      ? BigInt(value)
      : BigInt(value.toString());
  }

  /** Convert a generated-thrift type to a compact protocol wire type. */
  private getCompactType(thriftType: thrift.Thrift.Type): number {
    switch (thriftType) {
      case thrift.Thrift.Type.STOP:
        return COMPACT_TYPE_STOP;
      case thrift.Thrift.Type.BOOL:
        return COMPACT_TYPE_BOOLEAN_TRUE;
      case thrift.Thrift.Type.BYTE:
        return COMPACT_TYPE_BYTE;
      case thrift.Thrift.Type.I16:
        return COMPACT_TYPE_I16;
      case thrift.Thrift.Type.I32:
        return COMPACT_TYPE_I32;
      case thrift.Thrift.Type.I64:
        return COMPACT_TYPE_I64;
      case thrift.Thrift.Type.DOUBLE:
        return COMPACT_TYPE_DOUBLE;
      case thrift.Thrift.Type.STRING:
        return COMPACT_TYPE_BINARY;
      case thrift.Thrift.Type.LIST:
        return COMPACT_TYPE_LIST;
      case thrift.Thrift.Type.SET:
        return COMPACT_TYPE_SET;
      case thrift.Thrift.Type.MAP:
        return COMPACT_TYPE_MAP;
      case thrift.Thrift.Type.STRUCT:
        return COMPACT_TYPE_STRUCT;
      default:
        throw new Error(`Unsupported thrift type: ${thriftType}`);
    }
  }
}
