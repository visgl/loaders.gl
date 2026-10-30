// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  BSONObjectId,
  isBSONValue,
  isBSONObjectId,
  getBSONMaxDepth,
  type EncodeBSONOptions,
  type BSONTaggedValue
} from '../../bson-types';
export type {EncodeBSONOptions} from '../../bson-types';

/** Encodes a BSON document synchronously, including lossless tagged BSON values. */
export function encodeBSONSync(
  value: Record<string, unknown>,
  options: EncodeBSONOptions = {}
): ArrayBuffer {
  return new BSONWriter(options).encode(value);
}

/** Growable, little-endian BSON writer with cycle and nesting checks. */
class BSONWriter {
  /** Output storage. */
  private bytes = new Uint8Array(256);
  /** View refreshed whenever storage grows. */
  private view = new DataView(this.bytes.buffer);
  /** Next output offset. */
  private offset = 0;
  /** Objects on the current recursion path. */
  private readonly ancestors = new Set<object>();
  /** UTF-8 encoder. */
  private readonly encoder = new TextEncoder();
  /** Maximum nesting depth. */
  private readonly maxDepth: number;

  /** Creates a writer with explicit native BSON options. */
  constructor(private readonly options: EncodeBSONOptions) {
    this.maxDepth = getBSONMaxDepth(options.maxDepth);
  }

  /** Encodes the root object into an exact-sized ArrayBuffer. */
  encode(value: Record<string, unknown>): ArrayBuffer {
    if (!value || Array.isArray(value) || !this.isDocument(value))
      throw new Error('BSON: root must be a document');
    this.writeDocument(value, 1);
    return this.bytes.slice(0, this.offset).buffer;
  }

  /** Encodes an object or array and patches its inclusive byte length. */
  private writeDocument(value: Record<string, unknown> | unknown[], depth: number): void {
    if (depth > this.maxDepth) throw new Error('BSON: maximum nesting depth exceeded');
    if (this.ancestors.has(value)) throw new Error('BSON: cyclic document');
    this.ancestors.add(value);
    const start = this.offset;
    this.writeInt32(0);
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index++)
        this.writeElement(String(index), value[index] ?? null, depth);
    } else {
      for (const key of Object.keys(value)) {
        const element = value[key];
        if (element === undefined && this.options.ignoreUndefined !== false) continue;
        this.writeElement(key, element ?? null, depth);
      }
    }
    this.writeByte(0);
    const length = this.offset - start;
    if (length > 0x7fffffff) throw new Error('BSON: document exceeds signed 32-bit length');
    this.view.setInt32(start, length, true);
    this.ancestors.delete(value);
  }

  /** Writes an element tag, field name and payload. */
  private writeElement(key: string, value: unknown, depth: number): void {
    const type = this.getType(value);
    this.writeByte(type);
    this.writeCString(key);
    switch (type) {
      case 1:
        if (typeof value !== 'number' && typeof (value as {value: unknown}).value !== 'number')
          throw new Error('BSON: invalid double');
        this.reserve(8);
        this.view.setFloat64(
          this.offset,
          typeof value === 'number' ? value : (value as {value: number}).value,
          true
        );
        this.offset += 8;
        break;
      case 2:
        this.writeString(value as string);
        break;
      case 3:
      case 4:
        this.writeDocument(value as Record<string, unknown>, depth + 1);
        break;
      case 5: {
        const binary =
          value instanceof Uint8Array
            ? {subtype: 0, data: value}
            : (value as Extract<BSONTaggedValue, {$bsonType: 'binary'}>);
        if (
          !Number.isInteger(binary.subtype) ||
          binary.subtype < 0 ||
          binary.subtype > 255 ||
          !(binary.data instanceof Uint8Array)
        )
          throw new Error('BSON: invalid binary value');
        this.writeInt32(binary.data.length + (binary.subtype === 2 ? 4 : 0));
        this.writeByte(binary.subtype);
        if (binary.subtype === 2) this.writeInt32(binary.data.length);
        this.writeBytes(binary.data);
        break;
      }
      case 7:
        this.writeObjectId(value as BSONObjectId);
        break;
      case 8:
        this.writeByte(value ? 1 : 0);
        break;
      case 9:
        this.writeInteger(
          value instanceof Date ? BigInt(value.getTime()) : (value as {value: bigint}).value,
          false
        );
        break;
      case 11: {
        const regularExpression =
          value instanceof RegExp
            ? {pattern: value.source, options: value.flags}
            : (value as {pattern: string; options: string});
        if (!/^i?l?m?s?u?x?$/.test(regularExpression.options))
          throw new Error('BSON: unsupported regular expression flags');
        this.writeCString(regularExpression.pattern);
        this.writeCString(regularExpression.options);
        break;
      }
      case 12: {
        const pointer = value as Extract<BSONTaggedValue, {$bsonType: 'dbPointer'}>;
        this.writeString(pointer.namespace);
        this.writeObjectId(pointer.objectId);
        break;
      }
      case 13:
        this.writeString((value as {code: string}).code);
        break;
      case 14:
        this.writeString((value as {value: string}).value);
        break;
      case 15: {
        const code = value as Extract<BSONTaggedValue, {$bsonType: 'code'}>;
        const start = this.offset;
        this.writeInt32(0);
        this.writeString(code.code);
        if (!code.scope || !this.isDocument(code.scope))
          throw new Error('BSON: code scope must be a document');
        this.writeDocument(code.scope, depth + 1);
        this.view.setInt32(start, this.offset - start, true);
        break;
      }
      case 16:
        this.writeInt32(typeof value === 'number' ? value : (value as {value: number}).value);
        break;
      case 17:
        this.writeInteger((value as {value: bigint}).value, true);
        break;
      case 18:
        this.writeInteger(
          typeof value === 'bigint' ? value : (value as {value: bigint}).value,
          false
        );
        break;
      case 19: {
        const bytes = (value as {bytes: Uint8Array}).bytes;
        if (!(bytes instanceof Uint8Array) || bytes.length !== 16)
          throw new Error('BSON: Decimal128 requires 16 bytes');
        this.writeBytes(bytes);
        break;
      }
      // Null, deprecated undefined, and min/max keys have no payload.
      case 6:
      case 10:
      case 127:
      case 255:
        break;
      default:
        throw new Error('BSON: unsupported value');
    }
  }

  /** Selects a wire type without silently coercing unsupported values. */
  private getType(value: unknown): number {
    if (value === null) return 10;
    if (typeof value === 'string') return 2;
    if (typeof value === 'boolean') return 8;
    if (typeof value === 'bigint') return 18;
    if (typeof value === 'number')
      return Number.isInteger(value) &&
        !Object.is(value, -0) &&
        value >= -2147483648 &&
        value <= 2147483647
        ? 16
        : 1;
    if (isBSONObjectId(value)) return 7;
    if (value instanceof Date) {
      if (!Number.isFinite(value.getTime())) throw new Error('BSON: invalid date');
      return 9;
    }
    if (value instanceof RegExp) return 11;
    if (value instanceof Uint8Array) return 5;
    if (Array.isArray(value)) return 4;
    if (value && typeof value === 'object' && this.isDocument(value)) {
      const tagged = value as BSONTaggedValue;
      if (isBSONValue(value)) {
        switch (tagged.$bsonType) {
          case 'double':
            return 1;
          case 'int32':
            return 16;
          case 'binary':
            return 5;
          case 'undefined':
            return 6;
          case 'date':
            return 9;
          case 'regexp':
            return 11;
          case 'dbPointer':
            return 12;
          case 'code':
            return tagged.scope === undefined ? 13 : 15;
          case 'symbol':
            return 14;
          case 'timestamp':
            return 17;
          case 'int64':
            return 18;
          case 'decimal128':
            return 19;
          case 'maxKey':
            return 127;
          case 'minKey':
            return 255;
          default:
            throw new Error('BSON: unknown $bsonType tag');
        }
      }
      return 3;
    }
    throw new Error('BSON: unsupported JavaScript value');
  }

  /** Accepts plain document objects, including null-prototype dictionaries. */
  private isDocument(value: object): boolean {
    return (
      Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null
    );
  }

  /** Ensures capacity before any write. */
  private reserve(length: number): void {
    if (this.offset + length > 0x7fffffff)
      throw new Error('BSON: document exceeds signed 32-bit length');
    if (this.offset + length <= this.bytes.length) return;
    const bytes = new Uint8Array(Math.max(this.offset + length, this.bytes.length * 2));
    bytes.set(this.bytes);
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer);
  }

  /** Writes raw payload bytes. */
  private writeBytes(bytes: Uint8Array): void {
    this.reserve(bytes.length);
    this.bytes.set(bytes, this.offset);
    this.offset += bytes.length;
  }

  /** Writes a byte. */
  private writeByte(value: number): void {
    this.reserve(1);
    this.bytes[this.offset++] = value;
  }

  /** Writes a signed 32-bit integer. */
  private writeInt32(value: number): void {
    if (!Number.isInteger(value) || value < -2147483648 || value > 2147483647)
      throw new Error('BSON: invalid int32');
    this.reserve(4);
    this.view.setInt32(this.offset, value, true);
    this.offset += 4;
  }

  /** Writes an integer only when it fits its signed or unsigned 64-bit domain. */
  private writeInteger(value: bigint, unsigned: boolean): void {
    const minimum = unsigned ? 0n : -(1n << 63n);
    const maximum = unsigned ? (1n << 64n) - 1n : (1n << 63n) - 1n;
    if (typeof value !== 'bigint' || value < minimum || value > maximum)
      throw new Error('BSON: integer outside 64-bit range');
    this.reserve(8);
    if (unsigned) this.view.setBigUint64(this.offset, value, true);
    else this.view.setBigInt64(this.offset, value, true);
    this.offset += 8;
  }

  /** Writes a checked ObjectId. */
  private writeObjectId(value: BSONObjectId): void {
    if (
      !isBSONObjectId(value) ||
      typeof value.hex !== 'string' ||
      !/^[0-9a-f]{24}$/i.test(value.hex)
    )
      throw new Error('BSON: expected BSONObjectId');
    this.writeBytes(Uint8Array.from(value.hex.match(/../g)!, byte => Number.parseInt(byte, 16)));
  }

  /** Writes UTF-8 text with a null terminator and no embedded null bytes. */
  private writeCString(value: string): void {
    if (typeof value !== 'string' || value.includes('\0')) throw new Error('BSON: invalid cstring');
    this.writeBytes(this.encoder.encode(value));
    this.writeByte(0);
  }

  /** Writes length-prefixed UTF-8 text, allowing embedded nulls. */
  private writeString(value: string): void {
    if (typeof value !== 'string') throw new Error('BSON: expected string');
    const bytes = this.encoder.encode(value);
    this.writeInt32(bytes.length + 1);
    this.writeBytes(bytes);
    this.writeByte(0);
  }
}
