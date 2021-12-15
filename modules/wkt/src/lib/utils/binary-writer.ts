// loaders.gl, MIT license
// Forked from https://github.com/cschwarz/wkx under MIT license, Copyright (c) 2013 Christian Schwarz

export default class BinaryWriter {
  arrayBuffer: ArrayBuffer;
  position: number = 0;
  allowResize: boolean = false;

  constructor(size: number, allowResize?: boolean) {
    this.arrayBuffer = new ArrayBuffer(size);
    this.position = 0;
    this.allowResize = allowResize || false;
  }

  writeUInt8() { 
      // _write(Buffer.prototype.writeUInt8, 1);
  }
  writeUInt16LE() { 
      // _write(Buffer.prototype.writeUInt16LE, 2);
  }
  writeUInt16BE() { 
      // _write(Buffer.prototype.writeUInt16BE, 2);
  }
  writeUInt32LE() { 
      // _write(Buffer.prototype.writeUInt32LE, 4);
  }
  writeUInt32BE() { 
      // _write(Buffer.prototype.writeUInt32BE, 4);
  }
  writeInt8() { 
      // _write(Buffer.prototype.writeInt8, 1);
  }
  writeInt16LE() { 
      // _write(Buffer.prototype.writeInt16LE, 2);
  }
  writeInt16BE() { 
      // _write(Buffer.prototype.writeInt16BE, 2);
  }
  writeInt32LE() { 
      // _write(Buffer.prototype.writeInt32LE, 4);
  }
  writeInt32BE() { 
      // _write(Buffer.prototype.writeInt32BE, 4);
  }
  writeFloatLE() { 
      // _write(Buffer.prototype.writeFloatLE, 4);
  }
  writeFloatBE() { 
      // _write(Buffer.prototype.writeFloatBE, 4);
  }
  writeDoubleLE() { 
      // _write(Buffer.prototype.writeDoubleLE, 8);
  }
  writeDoubleBE() { 
      // _write(Buffer.prototype.writeDoubleBE, 8);
  }

  writeBuffer(buffer) {
    this.ensureSize(buffer.length);
    buffer.copy(this.buffer, this.position, 0, buffer.length);
    this.position += buffer.length;
  }

  writeVarInt(value) {
    var length = 1;
    while ((value & 0xFFFFFF80) !== 0) {
        this.writeUInt8((value & 0x7F) | 0x80);
        value >>>= 7;
        length++;
    }
    this.writeUInt8(value & 0x7F);
    return length;
  }

  ensureSize(size) {
    if (this.buffer.length < this.position + size) {
      if (this.allowResize) {
        var tempBuffer = new Buffer(this.position + size);
        this.buffer.copy(tempBuffer, 0, 0, this.buffer.length);
        this.buffer = tempBuffer;
      }
      else {
        throw new RangeError('index out of range');
      }
    }
  }
}
