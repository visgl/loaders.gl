import {concatenateArrayBuffers} from '@loaders.gl/loader-utils';

// zstd-codec is a dev dependency due to big size
import {loadZstdLibrary} from './load-zstd-library';

export default class ZstdInflateTransform {
  static async run(input, options) {
    const inputArray = new Uint8Array(input);

    const ZstdCodec = await loadZstdLibrary(options);

    return await new Promise(resolve => {
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
