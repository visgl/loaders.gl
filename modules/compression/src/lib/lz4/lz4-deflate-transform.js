import lz4 from 'lz4js';
import {concatenateArrayBuffers} from '@loaders.gl/loader-utils';

export default class LZ4DeflateTransform {
  static async deflate(input, options) {
    return LZ4DeflateTransform.deflateSync(input, options);
  }

  static deflateSync(input, options) {
    const inputArray = new Uint8Array(input);
    const output = lz4.compress(inputArray);
    return output.buffer;
  }

  constructor() {
    this._chunks = [];
  }

  async write(chunk) {
    this._chunks.push(null);
    return null;
  }

  async end() {
    const arrayBuffer = concatenateArrayBuffers(...this._chunks);
    return LZ4DeflateTransform.deflateSync(arrayBuffer);
  }
}
