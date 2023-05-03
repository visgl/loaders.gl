/**
 * Class for handling local file header of zip file
 */
export default class LocalFileHeader {
  offsets = {
    COMPRESSED_SIZE_OFFSET: 18,
    FILE_NAME_LENGTH_OFFSET: 26,
    EXTRA_FIELD_LENGTH_OFFSET: 28,
    FILE_NAME_OFFSET: 30
  };

  headerOffset: number;
  buffer: DataView;
  constructor(headerOffset: number, buffer: DataView) {
    this.headerOffset = headerOffset;
    this.buffer = buffer;
  }

  get fileNameLength(): number {
    return this.buffer.getUint16(this.headerOffset + this.offsets.FILE_NAME_LENGTH_OFFSET, true);
  }

  get extraFieldLength(): number {
    return this.buffer.getUint16(this.headerOffset + this.offsets.EXTRA_FIELD_LENGTH_OFFSET, true);
  }

  get fileDataOffset(): number {
    return (
      this.headerOffset +
      this.offsets.FILE_NAME_OFFSET +
      this.fileNameLength +
      this.extraFieldLength
    );
  }

  get compressedSize(): number {
    return this.buffer.getUint32(this.headerOffset + this.offsets.COMPRESSED_SIZE_OFFSET, true);
  }
}
