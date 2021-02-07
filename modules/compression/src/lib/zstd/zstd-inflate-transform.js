// zstd-codec is a dev dependency due to big size
// eslint-disable-next-line import/no-extraneous-dependencies
import {ZstdCodec} from 'zstd-codec';
import {concatenateArrayBuffers} from '@loaders.gl/loader-utils';

export default class ZstdInflateTransform {
  static run(input, options) {
    const inputArray = new Uint8Array(input);

    return new Promise(resolve => {
      ZstdCodec.run(zstd => {
        const simple = new zstd.Simple();
        const output = simple.decompress(inputArray);
        resolve(output.buffer);
      });
    });
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
    return ZstdInflateTransform.run(arrayBuffer);
  }
}
