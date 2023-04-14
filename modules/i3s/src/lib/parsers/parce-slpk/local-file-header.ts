export default class LocalFileHeader {
  compressedSize = 18;
  fileNameLength = 26;
  extraFieldLength = 28;
  fileName = 30;

  headerOffset: number;
  buffer: DataView;
  constructor(headerOffset: number, buffer: DataView) {
    this.headerOffset = headerOffset;
    this.buffer = buffer;
  }

  getFileNameLength() {
    return this.buffer.getUint16(this.headerOffset + this.fileNameLength, true);
  }

  getExtraFieldLength() {
    return this.buffer.getUint16(this.headerOffset + this.extraFieldLength, true);
  }

  getFileDataOffset() {
    return (
      this.headerOffset + this.fileName + this.getFileNameLength() + this.getExtraFieldLength()
    );
  }

  getCompressedSize() {
    return this.buffer.getUint32(this.headerOffset + this.compressedSize, true);
  }
}
