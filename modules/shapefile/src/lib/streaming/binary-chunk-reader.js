export default class BinaryChunkReader {
  constructor(options) {
    const {maxRewindBytes = 0} = options || {};

    /** current global offset into current array buffer*/
    this.offset = 0;
    /** current buffer from iterator */
    this.arrayBuffers = [];
    this.ended = false;

    /** bytes behind offset to hold on to */
    this.maxRewindBytes = maxRewindBytes;
  }

  write(arrayBuffer) {
    this.arrayBuffers.push(arrayBuffer);
  }

  end() {
    this.arrayBuffers = [];
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
   * @return {any} Arrays with byte ranges pointing to this.arrayBuffers
   */
  findBufferOffsets(bytes) {
    let offset = -this.offset;
    const selectedBuffers = [];

    for (let i = 0; i < this.arrayBuffers.length; i++) {
      const buf = this.arrayBuffers[i];

      // Current buffer isn't long enough to reach global offset
      if (offset + buf.byteLength <= 0) {
        offset += buf.byteLength;
        // eslint-disable-next-line no-continue
        continue;
      }

      // Find start/end offsets for this buffer
      // When offset < 0, need to skip over Math.abs(offset) bytes
      // When offset > 0, implies bytes in previous buffer, start at 0
      const start = offset <= 0 ? Math.abs(offset) : 0;
      let end;

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

    // Should only finish loop if exhausted all arrays
    return null;
  }

  /**
   * Get the required number of bytes from the iterator
   *
   * @param  {Number} bytes Number of bytes
   * @return {DataView}     DataView with data
   */
  getDataView(bytes) {
    const bufferOffsets = this.findBufferOffsets(bytes);
    if (!bufferOffsets) {
      throw new Error('binary data exhausted');
    }

    // If only one arrayBuffer needed, return DataView directly
    if (bufferOffsets.length === 1) {
      const [bufferIndex, [start, end]] = bufferOffsets[0];
      const arrayBuffer = this.arrayBuffers[bufferIndex];
      const view = new DataView(arrayBuffer, start, end - start);

      this.offset += bytes;
      this.disposeBuffers();
      return view;
    }

    // Concatenate portions of multiple ArrayBuffers
    const view = new DataView(this._combineArrayBuffers(bufferOffsets));
    this.offset += bytes;
    this.disposeBuffers();
    return view;
  }

  /**
   * Dispose of old array buffers
   */
  disposeBuffers() {
    while (
      this.arrayBuffers.length > 0 &&
      this.offset - this.maxRewindBytes >= this.arrayBuffers[0].byteLength
    ) {
      this.offset -= this.arrayBuffers[0].byteLength;
      this.arrayBuffers.shift();
    }
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
  _combineArrayBuffers(bufferOffsets) {
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

  skip(bytes) {
    this.offset += bytes;
  }

  rewind(bytes) {
    // TODO - only works if offset is already set
    this.offset -= bytes;
  }
}
