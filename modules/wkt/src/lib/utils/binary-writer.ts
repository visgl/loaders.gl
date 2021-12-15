// loaders.gl, MIT license
// Forked from https://github.com/cschwarz/wkx under MIT license, Copyright (c) 2013 Christian Schwarz

const LE = true;
const BE = false;

export default class BinaryWriter {
  arrayBuffer: ArrayBuffer;
  dataView: DataView;
  byteOffset: number = 0;
  allowResize: boolean = false;

  constructor(size: number, allowResize?: boolean) {
    this.arrayBuffer = new ArrayBuffer(size);
    this.dataView = new DataView(this.arrayBuffer);
    this.byteOffset = 0;
    this.allowResize = allowResize || false;
  }

  writeUInt8(value: number): void {
    this._ensureSize(1);
    this.dataView.setUint8(this.byteOffset, value);
    this.byteOffset += 1;
  }
  writeUInt16LE(value: number): void {
    this._ensureSize(2);
    this.dataView.setUint16(this.byteOffset, value, LE);
    this.byteOffset += 2;
  }
  writeUInt16BE(value: number): void {
    this._ensureSize(2);
    this.dataView.setUint16(this.byteOffset, value, BE);
    this.byteOffset += 2;
  }
  writeUInt32LE(value: number): void {
    this._ensureSize(4);
    this.dataView.setUint32(this.byteOffset, value, LE);
    this.byteOffset += 4;
  }
  writeUInt32BE(value: number): void {
    this._ensureSize(4);
    this.dataView.setUint32(this.byteOffset, value, BE);
    this.byteOffset += 4;
  }
  writeInt8(value: number): void {
    this._ensureSize(1);
    this.dataView.setInt8(this.byteOffset, value);
    this.byteOffset += 1;
  }
  writeInt16LE(value: number): void {
    this._ensureSize(2);
    this.dataView.setInt16(this.byteOffset, value, LE);
    this.byteOffset += 2;
  }
  writeInt16BE(value: number): void {
    this._ensureSize(2);
    this.dataView.setInt16(this.byteOffset, value, BE);
    this.byteOffset += 2;
  }
  writeInt32LE(value: number): void {
    this._ensureSize(4);
    this.dataView.setInt32(this.byteOffset, value, LE);
    this.byteOffset += 4;
  }
  writeInt32BE(value: number): void {
    this._ensureSize(4);
    this.dataView.setInt32(this.byteOffset, value, BE);
    this.byteOffset += 4;
  }
  writeFloatLE(value: number): void {
    this._ensureSize(4);
    this.dataView.setFloat32(this.byteOffset, value, LE);
    this.byteOffset += 4;
  }
  writeFloatBE(value: number): void {
    this._ensureSize(4);
    this.dataView.setFloat32(this.byteOffset, value, BE);
    this.byteOffset += 4;
  }
  writeDoubleLE(value: number): void {
    this._ensureSize(8);
    this.dataView.setFloat64(this.byteOffset, value, LE);
    this.byteOffset += 8;
  }
  writeDoubleBE(value: number): void {
    this._ensureSize(8);
    this.dataView.setFloat64(this.byteOffset, value, BE);
    this.byteOffset += 8;
  }

  /** A varint uses a variable number of bytes */
  writeVarInt(value: number): number {
    // TODO - ensure size?
    let length = 1;
    while ((value & 0xffffff80) !== 0) {
      this.writeUInt8((value & 0x7f) | 0x80);
      value >>>= 7;
      length++;
    }
    this.writeUInt8(value & 0x7f);
    return length;
  }

  /** Append another ArrayBuffer to this ArrayBuffer */
  writeBuffer(arrayBuffer: ArrayBuffer): void {
    this._ensureSize(arrayBuffer.byteLength);
    const tempArray = new Uint8Array(this.arrayBuffer);
    tempArray.set(new Uint8Array(arrayBuffer), this.byteOffset);
    this.byteOffset += arrayBuffer.byteLength;
  }

  /** Resizes this.arrayBuffer if not enough space */
  _ensureSize(size: number) {
    if (this.arrayBuffer.byteLength < this.byteOffset + size) {
      if (this.allowResize) {
        const newArrayBuffer = new ArrayBuffer(this.byteOffset + size);
        const tempArray = new Uint8Array(newArrayBuffer);
        tempArray.set(new Uint8Array(this.arrayBuffer));
        this.arrayBuffer = newArrayBuffer;
      } else {
        throw new Error('BinaryWriter overflow');
      }
    }
  }
}
