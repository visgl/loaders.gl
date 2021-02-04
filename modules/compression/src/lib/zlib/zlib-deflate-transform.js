import pako from 'pako';

export default class ZlibDeflateTransform {
  static async run(input, options) {
    const uint8Array = new Uint8Array(input);
    const output = pako.deflate(uint8Array, options);
    // @ts-ignore @types/pako say strings are always returned
    return output.buffer;
  }

  /**
   * Alternate interface for chunking & without exceptions
   */
  constructor(options) {
    this._deflator = new pako.Deflate();
    this._deflator.onData = this._onData.bind(this);
    this._deflator.onEnd = this._onEnd.bind(this);
    this.chunks = [];
  }

  _onData(chunk) {
    this.chunks.push(chunk);
  }

  _onEnd(status) {
    if (status !== 0) {
      throw new Error();
    }
  }

  _getChunks() {
    const chunks = this.chunks;
    this.chunks = [];
    if (chunks.length > 1) {
      throw new Error('too many chunks');
    }
    return chunks[0];
  }

  write(chunk) {
    const uint8Array = new Uint8Array(chunk);
    const ok = this._deflator.push(uint8Array, false); // false -> not last chunk
    if (!ok) {
      throw new Error('deflate failed');
    }
    return this._getChunks();
  }

  end() {
    const emptyChunk = new Uint8Array(0);
    this._deflator.push(emptyChunk, true); // true -> last chunk
    if (this._deflator.err) {
      throw new Error(this._deflator.msg);
    }

    return this._getChunks();
    // const output = this._deflator.result;
    // return output;
  }
}
