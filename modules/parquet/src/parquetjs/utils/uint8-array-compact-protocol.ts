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

/** Number-like replacement for node-int64 that does not allocate Buffer. */
class CompactInt64 {
  private readonly value: bigint;

  constructor(value: bigint) {
    this.value = value;
  }

  toNumber(): number {
    return Number(this.value);
  }

  valueOf(): number {
    return this.toNumber();
  }

  toString(radix?: number): string {
    return this.value.toString(radix);
  }
}

/** Read-only Thrift compact protocol backed by Uint8Array. */
export class Uint8ArrayCompactProtocol {
  private readonly transport: Uint8ArrayTransport;

  private lastFieldId = 0;

  private readonly lastFieldIds: number[] = [];

  private boolValue: boolean | null = null;

  constructor(transport: Uint8ArrayTransport) {
    this.transport = transport;
  }

  readStructBegin(): thrift.TStruct {
    this.lastFieldIds.push(this.lastFieldId);
    this.lastFieldId = 0;
    return {fname: ''};
  }

  readStructEnd(): void {
    this.lastFieldId = this.lastFieldIds.pop() || 0;
  }

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

  readSetBegin(): thrift.TSet {
    return this.readListBegin();
  }

  readSetEnd(): void {}

  readBool(): boolean {
    if (this.boolValue !== null) {
      const value = this.boolValue;
      this.boolValue = null;
      return value;
    }

    return this.transport.readByte() === COMPACT_TYPE_BOOLEAN_TRUE;
  }

  readByte(): number {
    return this.transport.readByte();
  }

  readI16(): number {
    return this.readI32();
  }

  readI32(): number {
    return this.decodeZigZag32(this.readVarint32());
  }

  readI64(): CompactInt64 {
    return new CompactInt64(this.decodeZigZag64(this.readVarint64()));
  }

  readDouble(): number {
    return readDoubleLE(this.transport.read(8), 0);
  }

  readBinary(): Uint8Array {
    const size = this.readVarint32();
    return size === 0 ? new Uint8Array(0) : this.transport.read(size);
  }

  readString(): string {
    const size = this.readVarint32();
    return size === 0 ? '' : this.transport.readString(size);
  }

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

  private readVarint32(): number {
    return Number(this.readVarint64());
  }

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

  private decodeZigZag32(value: number): number {
    return (value >>> 1) ^ -(value & 1);
  }

  private decodeZigZag64(value: bigint): bigint {
    return (value >> 1n) ^ -(value & 1n);
  }

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

  private skipMap(): void {
    const map = this.readMapBegin();
    for (let index = 0; index < map.size; index++) {
      this.skip(map.ktype);
      this.skip(map.vtype);
    }
    this.readMapEnd();
  }

  private skipList(): void {
    const list = this.readListBegin();
    for (let index = 0; index < list.size; index++) {
      this.skip(list.etype);
    }
    this.readListEnd();
  }
}
