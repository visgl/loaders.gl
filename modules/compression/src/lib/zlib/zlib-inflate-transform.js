import pako from 'pako';

export default class ZlibInflateTransform {
  /**
   * Inflate (simple wrapper can throw exception on broken stream)
   */
  static async run(input, options) {
    const compressed = new Uint8Array(input);
    const output = pako.inflate(compressed, options);
    // @ts-ignore @types/pako say strings are always returned
    return output.buffer;
  }

  //
  // Alternate interface for chunking & without exceptions
  //
  constructor(options) {
    this._inflator = new pako.Inflate();
    this._inflator.onData = this._onData.bind(this);
    this._inflator.onEnd = this._onEnd.bind(this);
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
      // TODO - can this hapen? contatenate the chunks?
      throw new Error('ZlibInflateTransform: too many chunks');
    }
    return chunks[0];
  }

  write(chunk) {
    const uint8Array = new Uint8Array(chunk);
    const ok = this._inflator.push(uint8Array, false); // false -> not last chunk
    if (!ok) {
      throw new Error('ZlibInflateTransform: inflate failed');
    }
    return this._getChunks();
  }

  end() {
    const emptyChunk = new Uint8Array(0);
    this._inflator.push(emptyChunk, true); // true -> last chunk
    if (this._inflator.err) {
      throw new Error(this._inflator.msg);
    }

    return this._getChunks();
  }
}
