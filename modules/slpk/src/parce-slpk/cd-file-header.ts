export default class CDFileHeader {
  cdCompressedSize = 20;
  cdUncompressedSize = 24;
  cdFileNameLength = 28;
  cdExtraFieldLength = 30;
  cdLocalHeaderOffset = 42;
  cdFileName = 46;

  headerOffset: number;
  buffer: DataView;
  constructor(headerOffset: number, buffer: DataView) {
    this.headerOffset = headerOffset;
    this.buffer = buffer;
  }

  getCompressedSize() {
    return this.buffer.getUint32(this.headerOffset + this.cdCompressedSize, true);
  }

  getUncompressedSize() {
    return this.buffer.getUint32(this.headerOffset + this.cdUncompressedSize, true);
  }

  getFileNameLength() {
    return this.buffer.getUint16(this.headerOffset + this.cdFileNameLength, true);
  }

  getFileName() {
    return this.buffer.buffer.slice(
      this.headerOffset + this.cdFileName,
      this.headerOffset + this.cdFileName + this.getFileNameLength()
    );
  }

  getExtraOffset() {
    return this.headerOffset + this.cdFileName + this.getFileNameLength();
  }

  getOldFormatOffset() {
    return this.buffer.getUint32(this.headerOffset + this.cdLocalHeaderOffset, true);
  }

  getLocalHeaderOffset() {
    let fileDataOffset = this.getOldFormatOffset();
    if (fileDataOffset === 0xffffffff) {
      let offsetInZip64Data = 4;
      if (this.getCompressedSize() === 0xffffffff) {
        // looking for info that might be also be in zip64 extra field
        offsetInZip64Data += 8;
      }
      if (this.getUncompressedSize() === 0xffffffff) {
        offsetInZip64Data += 8;
      }

      fileDataOffset = this.buffer.getUint32(this.getExtraOffset() + offsetInZip64Data, true); // setting it to the one from zip64
      // getUint32 needs to be replaced with getBigUint64 for archieves bigger than 2gb
    }
    return fileDataOffset;
  }
}
