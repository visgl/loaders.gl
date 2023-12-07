// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** A DataView that tracks byte offset when reading. */
export class BinaryReader {
  arrayBuffer: ArrayBuffer;
  dataView: DataView;
  byteOffset: number;
  littleEndian: boolean;

  constructor(arrayBuffer: ArrayBuffer, isBigEndian: boolean = false) {
    this.arrayBuffer = arrayBuffer;
    this.dataView = new DataView(arrayBuffer);
    this.byteOffset = 0;
    this.littleEndian = !isBigEndian;
  }

  readUInt8() {
    const value = this.dataView.getUint8(this.byteOffset);
    this.byteOffset += 1;
    return value;
  }
  readUInt16() {
    const value = this.dataView.getUint16(this.byteOffset, this.littleEndian);
    this.byteOffset += 2;
    return value;
  }
  readUInt32() {
    const value = this.dataView.getUint32(this.byteOffset, this.littleEndian);
    this.byteOffset += 4;
    return value;
  }
  readInt8() {
    const value = this.dataView.getInt8(this.byteOffset);
    this.byteOffset += 1;
    return value;
  }
  readInt16() {
    const value = this.dataView.getInt16(this.byteOffset, this.littleEndian);
    this.byteOffset += 2;
    return value;
  }
  readInt32() {
    const value = this.dataView.getInt32(this.byteOffset, this.littleEndian);
    this.byteOffset += 4;
    return value;
  }
  readFloat() {
    const value = this.dataView.getFloat32(this.byteOffset, this.littleEndian);
    this.byteOffset += 4;
    return value;
  }
  readDouble() {
    const value = this.dataView.getFloat64(this.byteOffset, this.littleEndian);
    this.byteOffset += 8;
    return value;
  }

  readVarInt() {
    let result = 0;
    let bytesRead = 0;

    let nextByte;
    do {
      // TODO - this needs to be accessed via data view?
      nextByte = this.dataView.getUint8(this.byteOffset + bytesRead);
      result += (nextByte & 0x7f) << (7 * bytesRead);
      bytesRead++;
    } while (nextByte >= 0x80);

    this.byteOffset += bytesRead;

    return result;
  }
}
