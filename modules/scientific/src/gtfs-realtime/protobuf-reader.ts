// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** A bounded reader for the protobuf wire types used by GTFS Realtime. */
export class ProtobufReader {
  /** Cursor relative to the start of this message. */
  private offset = 0;
  /** Little-endian view bounded by the current message. */
  private readonly view: DataView;

  /** Opens a message without copying its payload. */
  constructor(private readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  /** Whether the complete message has been read. */
  get done(): boolean {
    return this.offset === this.bytes.length;
  }

  /** Reads and validates the next field tag. */
  readTag(): number {
    const tag = this.readVarint();
    if (tag < 8n || tag > 0xffffffffn) {
      throw new Error('Invalid GTFS Realtime protobuf tag');
    }
    return Number(tag);
  }

  /** Reads an unsigned protobuf varint with up to 64 bits. */
  readVarint(): bigint {
    let value = 0n;
    for (let shift = 0n; shift <= 63n; shift += 7n) {
      const byte = this.bytes[this.advance(1)];
      if (shift === 63n && byte > 1) break;
      value |= BigInt(byte & 0x7f) << shift;
      if (byte < 0x80) return value;
    }
    throw new Error('Invalid GTFS Realtime protobuf varint');
  }

  /** Reads a length-prefixed payload within the current message. */
  readBytes(): Uint8Array {
    const length = Number(this.readVarint());
    const start = this.advance(length);
    return this.bytes.subarray(start, this.offset);
  }

  /** Reads an IEEE 754 single-precision value. */
  readFloat(): number {
    return this.view.getFloat32(this.advance(4), true);
  }

  /** Reads an IEEE 754 double-precision value. */
  readDouble(): number {
    return this.view.getFloat64(this.advance(8), true);
  }

  /** Skips unknown fields, including nested legacy groups used by proto2 extensions. */
  skipField(tag: number): void {
    const groups: number[] = [];
    do {
      const field = tag >>> 3;
      switch (tag & 7) {
        case 0:
          this.readVarint();
          break;
        case 1:
          this.advance(8);
          break;
        case 2:
          this.readBytes();
          break;
        case 3:
          groups.push(field);
          break;
        case 4:
          if (groups.pop() !== field) throw new Error('Unmatched GTFS Realtime protobuf group');
          break;
        case 5:
          this.advance(4);
          break;
        default:
          throw new Error('Invalid GTFS Realtime protobuf wire type');
      }
      if (groups.length) tag = this.readTag();
    } while (groups.length);
  }

  /** Reserves bytes within the message and returns their starting offset. */
  private advance(length: number): number {
    const start = this.offset;
    if (length > this.bytes.length - start) {
      throw new Error('Truncated GTFS Realtime protobuf field');
    }
    this.offset += length;
    return start;
  }
}
