import {concatenateArrayBuffers, sliceArrayBuffer} from '@loaders.gl/loader-utils';

export default class BinaryAsyncIteratorReader {
  constructor(asyncIterator) {
    if (asyncIterator[Symbol.asyncIterator]) {
      this.asyncIterator = asyncIterator[Symbol.asyncIterator]();
    } else {
      this.asyncIterator = asyncIterator;
    }

    /** current global (stream) offset */
    this.offset = 0;
    /** current buffer from iterator */
    this.buffer = null;
    /** current local offset - offset of loaded buffer */
    this.bufferOffset = 0;
  }

  // Get the required number of bytes from the iterator
  async getDataView(bytes) {
    const arrayBufferSegments = [];

    while (bytes > 0) {
      // Make sure we have a couple of bytes
      let available = this._bytesAvailableInCurrentChunk();
      while (available === 0) {
        if (!(await this._getNextArrayBuffer())) {
          return null;
        }
        available = this._bytesAvailableInCurrentChunk();
      }

      const usedBytes = Math.min(available, bytes);
      const arrayBufferSegment = sliceArrayBuffer(this.buffer, this.bufferOffset);
      arrayBufferSegments.push(arrayBufferSegment);

      this.offset += usedBytes;
      this.bufferOffset += usedBytes;
      bytes -= usedBytes;
    }

    const concatenatedBuffer = concatenateArrayBuffers(...arrayBufferSegments);
    const dataView = new DataView(concatenatedBuffer);
    return dataView;
  }

  _bytesAvailableInCurrentChunk() {
    const bufferOffset = this.offset - this.bufferOffset;
    return this.buffer ? this.buffer.byteLength - bufferOffset : 0;
  }

  async _getNextArrayBuffer() {
    const {done, value} = await this.asyncIterator.next();
    if (done) {
      this.asyncIterator.return();
      return null;
    }

    const arrayBuffer = value;

    if (this.buffer) {
      this.bufferOffset += this.buffer.byteLength;
    }

    this.buffer = arrayBuffer;
    this.bufferOffset = 0;
    return this.buffer;
  }
}
