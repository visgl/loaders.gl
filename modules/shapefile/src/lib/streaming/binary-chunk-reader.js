import {concatenateArrayBuffers} from '@loaders.gl/loader-utils';

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

  /**
   * Has enough bytes available in array buffers
   *
   * @param  {Number}  bytes Number of bytes
   * @return {Boolean}
   */
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

  /**
   * Find offsets of byte ranges within this.arrayBuffers
   *
   * @param  {Number} bytes Byte length to read
   * @return {any}       [description]
   */
  findBufferOffsets(bytes) {
    var offset = -this.offset;
    var selectedBuffers = [];

    for (var i = 0; i < this.arrayBuffers.length; i++) {
      var buf = this.arrayBuffers[i];

      // Current buffer isn't long enough to reach global offset
      if (offset + buf.byteLength <= 0) {
        // eslint-disable-next-line no-continue
        offset += buf.byteLength;
        continue;
      }

      // Find start/end offsets for this buffer
      // When offset < 0, need to skip over Math.abs(offset) bytes
      // When offset > 0, implies bytes in previous buffer, start at 0
      var start = offset <= 0 ? Math.abs(offset) : 0;
      var end;

      // Length of requested bytes is contained in current buffer
      if (start + bytes <= buf.byteLength) {
        end = start + bytes;
        selectedBuffers.push([i, [start, end]]);
        return selectedBuffers;
      }

      // Will need to look into next buffer
      end = buf.byteLength;
      selectedBuffers.push([i, [start, end]]);

      // Need to read fewer bytes in next iter
      bytes -= buf.byteLength - start;
      offset += buf.byteLength;
    }
  }

  /**
   * Get the required number of bytes from the iterator
   *
   * @param  {Number} bytes Number of bytes
   * @return {DataView?}    DataView with data
   */
  getDataView(bytes) {
    if (bytes && !this.hasAvailableBytes(bytes)) {
      throw new Error('binary data exhausted');
    }

    const bufferOffsets = this.findBufferOffsets(bytes);

    // If only one arrayBuffer needed, return DataView directly
    if (bufferOffsets.length === 1) {
      const [bufferIndex, [start, end]] = bufferOffsets[0];
      const arrayBuffer = this.arrayBuffers[bufferIndex];
      return new DataView(arrayBuffer, start, end - start);
    }

    // Concatenate portions of multiple ArrayBuffers
    return new DataView(this.combineArrayBuffers(bufferOffsets));
  }

  /**
   * Copy multiple ArrayBuffers into one contiguous ArrayBuffer
   *
   * In contrast to concatenateArrayBuffers, this only copies the necessary
   * portions of the source arrays, rather than first copying the entire arrays
   * then taking a part of them.
   *
   * @param  {any} bufferOffsets List of internal array offsets
   * @return {ArrayBuffer}       New contiguous ArrayBuffer
   */
  combineArrayBuffers(bufferOffsets) {
    let byteLength = 0;
    for (const bufferOffset of bufferOffsets) {
      const [start, end] = bufferOffset[1];
      byteLength += end - start;
    }

    const result = new Uint8Array(byteLength);

    // Copy the subarrays
    let resultOffset = 0;
    for (const bufferOffset of bufferOffsets) {
      const [bufferIndex, [start, end]] = bufferOffset;
      const sourceArray = new Uint8Array(this.arrayBuffers[bufferIndex]);
      result.set(sourceArray.subarray(start, end), resultOffset);
      resultOffset += end - start;
    }

    return result.buffer;
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
};
