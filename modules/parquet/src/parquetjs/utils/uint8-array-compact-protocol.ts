// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as thrift from 'thrift';
import {readDoubleLE} from './binary-utils';
import {Uint8ArrayTransport} from './uint8-array-transport';

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

/** Number-like replacement for node-int64 used by the compact protocol. */
export class CompactInt64 {
  /** Signed integer payload represented without precision loss. */
  private readonly value: bigint;

  /** Create a compact-protocol int64 wrapper from a bigint. */
  constructor(value: bigint) {
    this.value = value;
  }

  /** Return the payload as a JavaScript number. */
  toNumber(): number {
    return Number(this.value);
  }

  /** Return the payload as a JavaScript number for generated thrift arithmetic. */
  valueOf(): number {
    return this.toNumber();
  }

  /** Format the payload as a string. */
  toString(radix?: number): string {
    return this.value.toString(radix);
  }
}

/** Read-only Thrift compact protocol backed by Uint8Array. */
export class Uint8ArrayCompactProtocol {
  /** Byte transport that provides thrift-compatible read, borrow, and consume methods. */
  private readonly transport: Uint8ArrayTransport;

  /** Field id at the current nesting depth, used for compact field-id deltas. */
  private lastFieldId = 0;

  /** Parent struct field ids restored when nested structs end. */
  private readonly lastFieldIds: number[] = [];

  /** Boolean payload encoded in a compact field header. */
  private boolValue: boolean | null = null;

  /** Create a compact protocol reader over a Uint8Array-backed transport. */
  constructor(transport: Uint8ArrayTransport) {
    this.transport = transport;
  }

  /** Enter a struct and reset the delta-encoded field id state. */
  readStructBegin(): thrift.TStruct {
    this.lastFieldIds.push(this.lastFieldId);
    this.lastFieldId = 0;
    return {fname: ''};
  }

  readStructEnd(): void {
    this.lastFieldId = this.lastFieldIds.pop() || 0;
  }

  /** Read a compact field header and expand it to a thrift field descriptor. */
  readFieldBegin(): thrift.TField {
    const fieldHeader = this.transport.readByte();
    const compactType = fieldHeader & 0x0f;

    if (compactType === COMPACT_TYPE_STOP) {
      return {fname: null!, ftype: thrift.Thrift.Type.STOP, fid: 0};
    }

    const fieldIdDelta = (fieldHeader & 0xf0) >>> 4;
    const fieldId = fieldIdDelta === 0 ? this.readI16() : this.lastFieldId + fieldIdDelta;
    const fieldType = this.getThriftType(compactType);

    if (compactType === COMPACT_TYPE_BOOLEAN_TRUE || compactType === COMPACT_TYPE_BOOLEAN_FALSE) {
      this.boolValue = compactType === COMPACT_TYPE_BOOLEAN_TRUE;
    }

    this.lastFieldId = fieldId;
    return {fname: null!, ftype: fieldType, fid: fieldId};
  }

  readFieldEnd(): void {}

  /** Read a map header, including element compact types when the map is non-empty. */
  readMapBegin(): thrift.TMap {
    const size = this.readVarint32();
    const keyAndValueType = size === 0 ? 0 : this.transport.readByte();
    return {
      ktype: this.getThriftType((keyAndValueType & 0xf0) >>> 4),
      vtype: this.getThriftType(keyAndValueType & 0x0f),
      size
    };
  }

  readMapEnd(): void {}

  /** Read a list header and expand the inline or varint element count. */
  readListBegin(): thrift.TList {
    const sizeAndType = this.transport.readByte();
    let size = (sizeAndType >>> 4) & 0x0f;
    if (size === 15) {
      size = this.readVarint32();
    }

    return {
      etype: this.getThriftType(sizeAndType & 0x0f),
      size
    };
  }

  readListEnd(): void {}

  /** Read a set header; compact protocol encodes sets and lists the same way. */
  readSetBegin(): thrift.TSet {
    return this.readListBegin();
  }

  readSetEnd(): void {}

  /** Read a boolean from the field header or from the next compact boolean byte. */
  readBool(): boolean {
    if (this.boolValue !== null) {
      const value = this.boolValue;
      this.boolValue = null;
      return value;
    }

    return this.transport.readByte() === COMPACT_TYPE_BOOLEAN_TRUE;
  }

  /** Read a signed byte from the transport. */
  readByte(): number {
    return this.transport.readByte();
  }

  /** Read a signed 16-bit integer encoded as zig-zag varint. */
  readI16(): number {
    return this.readI32();
  }

  /** Read a signed 32-bit integer encoded as zig-zag varint. */
  readI32(): number {
    return this.decodeZigZag32(this.readVarint32());
  }

  /** Read a signed 64-bit integer encoded as zig-zag varint. */
  readI64(): CompactInt64 {
    return new CompactInt64(this.decodeZigZag64(this.readVarint64()));
  }

  /** Read a little-endian 64-bit float. */
  readDouble(): number {
    return readDoubleLE(this.transport.read(8), 0);
  }

  /** Read a length-prefixed binary payload as an exact Uint8Array. */
  readBinary(): Uint8Array {
    const size = this.readVarint32();
    return size === 0 ? new Uint8Array(0) : this.transport.read(size);
  }

  /** Read a length-prefixed UTF-8 string. */
  readString(): string {
    const size = this.readVarint32();
    return size === 0 ? '' : this.transport.readString(size);
  }

  /** Consume and discard a value with the supplied thrift type. */
  skip(type: thrift.Thrift.Type): void {
    switch (type) {
      case thrift.Thrift.Type.STOP:
        return;
      case thrift.Thrift.Type.BOOL:
        this.readBool();
        return;
      case thrift.Thrift.Type.BYTE:
        this.readByte();
        return;
      case thrift.Thrift.Type.I16:
        this.readI16();
        return;
      case thrift.Thrift.Type.I32:
        this.readI32();
        return;
      case thrift.Thrift.Type.I64:
        this.readI64();
        return;
      case thrift.Thrift.Type.DOUBLE:
        this.readDouble();
        return;
      case thrift.Thrift.Type.STRING:
        this.readBinary();
        return;
      case thrift.Thrift.Type.STRUCT:
        this.skipStruct();
        return;
      case thrift.Thrift.Type.MAP:
        this.skipMap();
        return;
      case thrift.Thrift.Type.SET:
      case thrift.Thrift.Type.LIST:
        this.skipList();
        return;
      default:
        throw new Error(`Unsupported thrift type: ${type}`);
    }
  }

  /** Read an unsigned 32-bit compact varint. */
  private readVarint32(): number {
    return Number(this.readVarint64());
  }

  /** Read an unsigned 64-bit compact varint. */
  private readVarint64(): bigint {
    let value = 0n;
    let shift = 0n;

    while (true) {
      const byte = BigInt(this.transport.readByte() & 0xff);
      value |= (byte & 0x7fn) << shift;
      if ((byte & 0x80n) === 0n) {
        return value;
      }
      shift += 7n;
    }
  }

  /** Decode a zig-zag 32-bit integer to a signed integer. */
  private decodeZigZag32(value: number): number {
    return (value >>> 1) ^ -(value & 1);
  }

  /** Decode a zig-zag 64-bit integer to a signed integer. */
  private decodeZigZag64(value: bigint): bigint {
    return (value >> 1n) ^ -(value & 1n);
  }

  /** Convert a compact wire type to a generated-thrift type. */
  private getThriftType(compactType: number): thrift.Thrift.Type {
    switch (compactType) {
      case COMPACT_TYPE_STOP:
        return thrift.Thrift.Type.STOP;
      case COMPACT_TYPE_BOOLEAN_TRUE:
      case COMPACT_TYPE_BOOLEAN_FALSE:
        return thrift.Thrift.Type.BOOL;
      case COMPACT_TYPE_BYTE:
        return thrift.Thrift.Type.BYTE;
      case COMPACT_TYPE_I16:
        return thrift.Thrift.Type.I16;
      case COMPACT_TYPE_I32:
        return thrift.Thrift.Type.I32;
      case COMPACT_TYPE_I64:
        return thrift.Thrift.Type.I64;
      case COMPACT_TYPE_DOUBLE:
        return thrift.Thrift.Type.DOUBLE;
      case COMPACT_TYPE_BINARY:
        return thrift.Thrift.Type.STRING;
      case COMPACT_TYPE_LIST:
        return thrift.Thrift.Type.LIST;
      case COMPACT_TYPE_SET:
        return thrift.Thrift.Type.SET;
      case COMPACT_TYPE_MAP:
        return thrift.Thrift.Type.MAP;
      case COMPACT_TYPE_STRUCT:
        return thrift.Thrift.Type.STRUCT;
      default:
        throw new Error(`Unknown compact thrift type: ${compactType}`);
    }
  }

  /** Skip every field in the current struct. */
  private skipStruct(): void {
    this.readStructBegin();
    while (true) {
      const field = this.readFieldBegin();
      if (field.ftype === thrift.Thrift.Type.STOP) {
        break;
      }
      this.skip(field.ftype);
      this.readFieldEnd();
    }
    this.readStructEnd();
  }

  /** Skip every key and value in the current map. */
  private skipMap(): void {
    const map = this.readMapBegin();
    for (let index = 0; index < map.size; index++) {
      this.skip(map.ktype);
      this.skip(map.vtype);
    }
    this.readMapEnd();
  }

  /** Skip every element in the current list or set. */
  private skipList(): void {
    const list = this.readListBegin();
    for (let index = 0; index < list.size; index++) {
      this.skip(list.etype);
    }
    this.readListEnd();
  }
}
