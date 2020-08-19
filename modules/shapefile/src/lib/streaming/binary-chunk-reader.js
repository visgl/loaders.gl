import {concatenateArrayBuffers} from "@loaders.gl/loader-utils";

export default class BinaryChunkReader {
  constructor() {
    /** current global offset into current array buffer*/
    this.offset = 0;
    /** current buffer from iterator */
    this.arrayBuffers = [];
    this.ended = false;
  }

  write(arrayBuffer) {
    this.arrayBuffers.push(arrayBuffer);
  }

  end() {
    this.ended = true;
  }

  hasAvailableBytes(bytes) {
    let bytesAvailable = -this.offset;
    for (const arrayBuffer of this.arrayBuffers) {
      bytesAvailable += arrayBuffer.byteLength;
      if (bytesAvailable >= bytes) {
        return true;
      }
    }
    return false;
  }

  // Get the required number of bytes from the iterator
  getDataView(bytes) {
    if (bytes && !this.hasAvailableBytes(bytes)) {
      throw new Error('binary data exhausted');
    }

    const arrayBuffer = this.getArrayBuffer(bytes);
    const dataView = new DataView(arrayBuffer);
    return dataView;
  }

  getArrayBuffer(bytes) {
    const chunks = [];
    while (bytes > 0) {
      const chunk = this._getChunk(bytes);
      chunks.push(chunk);
      bytes -= chunk.byteLength;
    }
    return concatenateArrayBuffers(...chunks);
  }

  _getChunk(bytes) {
    const arrayBuffer = this.arrayBuffers[0];
    const remainingBytes = arrayBuffer.byteLength - this.offset;
    let chunk;
    if (bytes <= remainingBytes) {
      chunk = new Uint8Array(arrayBuffer, this.offset, bytes);
      this.offset += bytes;
    } else if (remainingBytes > 0) {
      chunk = new Uint8Array(arrayBuffer, this.offset, remainingBytes);
      this.arrayBuffers.shift();
      this.offset = 0;
    }
    return chunk;
  }

  skip(bytes) {
    this.offset += bytes;
  }

  rewind(bytes) {
    // TODO - only works if offset is already set
    this.offset -= bytes;
  }
}
