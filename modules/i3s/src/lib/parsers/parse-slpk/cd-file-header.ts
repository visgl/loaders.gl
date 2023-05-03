/**
 * Class for handling central directory file header of zip file
 */
export default class CDFileHeader {
  offsets = {
    CD_COMPRESSED_SIZE_OFFSET: 20,
    CD_UNCOMPRESSED_SIZE_OFFSET: 24,
    CD_FILE_NAME_LENGTH_OFFSET: 28,
    CD_EXTRA_FIELD_LENGTH_OFFSET: 30,
    CD_LOCAL_HEADER_OFFSET_OFFSET: 42,
    CD_FILE_NAME_OFFSET: 46
  };

  headerOffset: number;
  buffer: DataView;
  constructor(headerOffset: number, buffer: DataView) {
    this.headerOffset = headerOffset;
    this.buffer = buffer;
  }

  get compressedSize(): number {
    return this.buffer.getUint32(this.headerOffset + this.offsets.CD_COMPRESSED_SIZE_OFFSET, true);
  }

  get uncompressedSize(): number {
    return this.buffer.getUint32(
      this.headerOffset + this.offsets.CD_UNCOMPRESSED_SIZE_OFFSET,
      true
    );
  }

  get fileNameLength(): number {
    return this.buffer.getUint16(this.headerOffset + this.offsets.CD_FILE_NAME_LENGTH_OFFSET, true);
  }

  get fileName(): ArrayBuffer {
    return this.buffer.buffer.slice(
      this.headerOffset + this.offsets.CD_FILE_NAME_OFFSET,
      this.headerOffset + this.offsets.CD_FILE_NAME_OFFSET + this.fileNameLength
    );
  }

  get extraOffset(): number {
    return this.headerOffset + this.offsets.CD_FILE_NAME_OFFSET + this.fileNameLength;
  }

  get oldFormatOffset(): number {
    return this.buffer.getUint32(
      this.headerOffset + this.offsets.CD_LOCAL_HEADER_OFFSET_OFFSET,
      true
    );
  }

  get localHeaderOffset(): number {
    let fileDataOffset = this.oldFormatOffset;
    if (fileDataOffset === 0xffffffff) {
      let offsetInZip64Data = 4;
      // looking for info that might be also be in zip64 extra field
      if (this.compressedSize === 0xffffffff) {
        offsetInZip64Data += 8;
      }
      if (this.uncompressedSize === 0xffffffff) {
        offsetInZip64Data += 8;
      }

      // getUint32 needs to be replaced with getBigUint64 for archieves bigger than 2gb
      fileDataOffset = this.buffer.getUint32(this.extraOffset + offsetInZip64Data, true); // setting it to the one from zip64
    }
    return fileDataOffset;
  }
}
