
export default class BinaryAsyncIteratorReader {
  constructor(asyncIterator) {
    this.asyncIterator = asyncIterator;
    this.currentBuffer = null;
    this.currentBufferStartOffset = 0;
    this.currentOffset = 0;
    this.rewindBuffer = 0;
  }

  // Get the required number of bytes from the iterator
  async getDataView(bytes) {
    // Reuse array buffers
    const arrayBuffer = this._getArrayBuffer(bytes);

    let offset = 0;
    while (bytes > 0) {
      const count = this._getBytesFromBuffer(bytes, arrayBuffer, offset);
      offset += count;
      bytes -= count;
      if (bytes > 0) {
        const isDone = await this._getNextChunkFromIterator();
        if (isDone) {
          return null;
        }
      }
    }

    return new DataView(arrayBuffer, 0, bytes);
  }

  _getBytesFromBuffer(bytes, arrayBuffer, offset) {
    const bufferOffset = this.currentOffset - this.currentBufferStartOffset;
    const available = this.currentBuffer.byteLength - bufferOffset;
    copyMemory(arrayBuffer, );
    copyMemory(arrayBuffer, );
    return new DataView(arrayBuffer);
  }

  async _getNextChunkFromIterator() {
    const {done, value} = await this.asyncIterator.next();
    if (done) {
      this.asyncIterator.return();
      return null;
    }
    if (this.currentBuffer) {
      this.currentBufferStartOffset += this.currentBuffer.byteLength;
    }
    this.prevBuffer = this.currentBuffer;
    this.currentBuffer = value;
    return this.currentBuffer;
  }

  _getArrayBuffer(bytes) {
    if (!this._arrayBuffer || this._arrayBuffer.byteLength < bytes) {
      this._arrayBuffer = new ArrayBuffer(bytes);
    }
    return this._arrayBuffer;
  }
}
