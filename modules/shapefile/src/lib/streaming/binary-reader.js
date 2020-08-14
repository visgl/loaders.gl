export default class BinaryReader {
  constructor(arrayBuffer) {
    /** current global (stream) offset */
    this.offset = 0;
    /** current buffer from iterator */
    this.arrayBuffer = arrayBuffer;
  }

  hasAvailableBytes(bytes) {
    return this.arrayBuffer.byteLength - this.offset >= bytes;
  }

  // Get the required number of bytes from the iterator
  getDataView(bytes) {
    if (!this.hasAvailableBytes(bytes)) {
      throw new Error('binary data exhausted');
    }

    const dataView = new DataView(this.arrayBuffer, this.offset, bytes);
    this.offset += bytes;
    return dataView;
  }

  rewind(bytes) {
    this.offset -= bytes;
  }
}
