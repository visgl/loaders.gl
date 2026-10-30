// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  BSONObjectId,
  createBSONValue,
  getBSONMaxDepth,
  type ParseBSONOptions
} from '../../bson-types';

/** Decodes exactly one validated BSON document. */
export function decodeBSON(bytes: Uint8Array, options: ParseBSONOptions): Record<string, unknown> {
  return new BSONReader(bytes, options).readDocument(bytes.length, 1, false) as Record<
    string,
    unknown
  >;
}

/** Bounds-checked reader whose limits are narrowed for every nested BSON container. */
class BSONReader {
  /** Current byte offset. */
  private offset = 0;
  /** View of the exact input range. */
  private readonly view: DataView;
  /** Strict UTF-8 decoder; BOM characters are data, not a transport marker. */
  private readonly decoder = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true});
  /** Maximum document nesting. */
  private readonly maxDepth: number;

  /** Creates a reader for one document. */
  constructor(
    private readonly bytes: Uint8Array,
    private readonly options: ParseBSONOptions
  ) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.maxDepth = getBSONMaxDepth(options.maxDepth);
  }

  /** Decodes a document or an array, respecting its parent's byte boundary. */
  readDocument(limit: number, depth: number, array: boolean): Record<string, unknown> | unknown[] {
    if (depth > this.maxDepth) throw new Error('BSON: maximum nesting depth exceeded');
    const start = this.offset;
    const length = this.readInt32(limit);
    if (length < 5 || length > limit - start) throw new Error('BSON: invalid document length');
    const end = start + length;
    const result: Record<string, unknown> | unknown[] = array ? [] : {};
    while (this.offset < end - 1) {
      const type = this.readByte(end - 1);
      const key = this.readCString(end - 1);
      if (array && key !== String((result as unknown[]).length))
        throw new Error('BSON: invalid array index');
      const value = this.readValue(type, end - 1, depth);
      Object.defineProperty(result, key, {
        value,
        enumerable: true,
        writable: true,
        configurable: true
      });
    }
    if (this.offset !== end - 1 || this.readByte(end) !== 0)
      throw new Error('BSON: missing document terminator');
    return result;
  }

  /** Reads an element payload without evaluating stored code or regular expressions. */
  private readValue(type: number, limit: number, depth: number): unknown {
    switch (type) {
      case 1: {
        this.ensure(8, limit);
        const value = this.view.getFloat64(this.offset, true);
        this.offset += 8;
        return this.options.preserveTypes ? createBSONValue({$bsonType: 'double', value}) : value;
      }
      case 2:
        return this.readString(limit);
      case 3:
        return this.readDocument(limit, depth + 1, false);
      case 4:
        return this.readDocument(limit, depth + 1, true);
      case 5: {
        const length = this.readInt32(limit);
        const subtype = this.readByte(limit);
        if (length < 0) throw new Error('BSON: invalid binary length');
        this.ensure(length, limit);
        if (subtype === 2) {
          if (length < 4 || this.readInt32(limit) !== length - 4)
            throw new Error('BSON: invalid legacy binary length');
          return createBSONValue({
            $bsonType: 'binary',
            subtype,
            data: this.readBytes(length - 4, limit)
          });
        }
        const data = this.readBytes(length, limit);
        return subtype === 0 ? data : createBSONValue({$bsonType: 'binary', subtype, data});
      }
      case 6:
        return createBSONValue({$bsonType: 'undefined'});
      case 7:
        return new BSONObjectId(this.readBytes(12, limit));
      case 8: {
        const value = this.readByte(limit);
        if (value > 1) throw new Error('BSON: invalid boolean');
        return Boolean(value);
      }
      case 9: {
        const value = this.readInteger(limit, false);
        return value >= -8640000000000000n && value <= 8640000000000000n
          ? new Date(Number(value))
          : createBSONValue({$bsonType: 'date', value});
      }
      case 10:
        return null;
      case 11: {
        const pattern = this.readCString(limit);
        const options = this.readCString(limit).split('').sort().join('');
        if (!/^(i?m?s?u?x?)$/.test(options))
          throw new Error('BSON: invalid regular expression options');
        return createBSONValue({$bsonType: 'regexp', pattern, options});
      }
      case 12:
        return createBSONValue({
          $bsonType: 'dbPointer',
          namespace: this.readString(limit),
          objectId: new BSONObjectId(this.readBytes(12, limit))
        });
      case 13:
        return createBSONValue({$bsonType: 'code', code: this.readString(limit)});
      case 14:
        return createBSONValue({$bsonType: 'symbol', value: this.readString(limit)});
      case 15: {
        const start = this.offset;
        const length = this.readInt32(limit);
        if (length < 14 || length > limit - start)
          throw new Error('BSON: invalid code-with-scope length');
        const end = start + length;
        const code = this.readString(end);
        const scope = this.readDocument(end, depth + 1, false) as Record<string, unknown>;
        if (this.offset !== end) throw new Error('BSON: invalid code-with-scope boundary');
        return createBSONValue({$bsonType: 'code', code, scope});
      }
      case 16: {
        const value = this.readInt32(limit);
        return this.options.preserveTypes ? createBSONValue({$bsonType: 'int32', value}) : value;
      }
      case 17:
        return createBSONValue({$bsonType: 'timestamp', value: this.readInteger(limit, true)});
      case 18: {
        const value = this.readInteger(limit, false);
        if (this.options.preserveTypes) return createBSONValue({$bsonType: 'int64', value});
        if (this.options.useBigInt64) return value;
        if (this.options.promoteLongs === false)
          return createBSONValue({$bsonType: 'int64', value});
        return value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)
          ? Number(value)
          : value;
      }
      case 19:
        return createBSONValue({$bsonType: 'decimal128', bytes: this.readBytes(16, limit)});
      case 127:
        return createBSONValue({$bsonType: 'maxKey'});
      case 255:
        return createBSONValue({$bsonType: 'minKey'});
      default:
        throw new Error(`BSON: unsupported element type ${type}`);
    }
  }

  /** Checks a read against the current container boundary. */
  private ensure(length: number, limit: number): void {
    if (length < 0 || this.offset + length > limit) throw new Error('BSON: truncated value');
  }

  /** Reads one byte. */
  private readByte(limit: number): number {
    this.ensure(1, limit);
    return this.bytes[this.offset++];
  }

  /** Reads a signed 32-bit length or value. */
  private readInt32(limit: number): number {
    this.ensure(4, limit);
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  /** Reads signed or unsigned 64-bit bits losslessly. */
  private readInteger(limit: number, unsigned: boolean): bigint {
    this.ensure(8, limit);
    const value = unsigned
      ? this.view.getBigUint64(this.offset, true)
      : this.view.getBigInt64(this.offset, true);
    this.offset += 8;
    return value;
  }

  /** Copies bytes so decoded values do not retain or mutate the input buffer. */
  private readBytes(length: number, limit: number): Uint8Array {
    this.ensure(length, limit);
    const result = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return result;
  }

  /** Reads a null-terminated UTF-8 field name or regex component. */
  private readCString(limit: number): string {
    const start = this.offset;
    while (this.offset < limit && this.bytes[this.offset] !== 0) this.offset++;
    if (this.offset === limit) throw new Error('BSON: missing string terminator');
    const value = this.decoder.decode(this.bytes.subarray(start, this.offset));
    this.offset++;
    return value;
  }

  /** Reads a length-prefixed UTF-8 string, including its required null terminator. */
  private readString(limit: number): string {
    const length = this.readInt32(limit);
    if (length < 1) throw new Error('BSON: invalid string length');
    this.ensure(length, limit);
    if (this.bytes[this.offset + length - 1] !== 0)
      throw new Error('BSON: missing string terminator');
    const value = this.decoder.decode(this.bytes.subarray(this.offset, this.offset + length - 1));
    this.offset += length;
    return value;
  }
}
