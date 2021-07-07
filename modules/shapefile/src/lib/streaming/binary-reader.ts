export default class BinaryReader {
  offset: number;
  arrayBuffer: ArrayBuffer;

  constructor(arrayBuffer: ArrayBuffer) {
    /** current global (stream) offset */
    this.offset = 0;
    /** current buffer from iterator */
    this.arrayBuffer = arrayBuffer;
  }
  /**
   * Checks if there are available bytes in data
   * 
   * @param bytes
   * @returns boolean
   */
  hasAvailableBytes(bytes: number): boolean {
    return this.arrayBuffer.byteLength - this.offset >= bytes;
  }

  /**
   * Get the required number of bytes from the iterator
   * 
   * @param bytes
   * @returns Dataview
   */
  getDataView(bytes: number): DataView {
    if (bytes && !this.hasAvailableBytes(bytes)) {
      throw new Error('binary data exhausted');
    }

    const dataView = bytes
      ? new DataView(this.arrayBuffer, this.offset, bytes)
      : new DataView(this.arrayBuffer, this.offset);
    this.offset += bytes;
    return dataView;
  }

  /**
   * Skipping
   * 
   * @param bytes
   */
  skip(bytes: number): void {
    this.offset += bytes;
  }

  /**
   * Rewinding
   * 
   * @param bytes
   */
  rewind(bytes: number): void {
    this.offset -= bytes;
  }
}
