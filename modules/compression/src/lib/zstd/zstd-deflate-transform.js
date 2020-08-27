import {ZstdCodec} from 'zstd-codec';
import {concatenateArrayBuffers} from '@loaders.gl/loader-utils';

export default class ZstdDeflateTransform {
  static deflate(input, options) {
    const inputArray = new Uint8Array(input);

    return new Promise(resolve => {
      ZstdCodec.run(zstd => {
        const simple = new zstd.Simple();
        const output = simple.compress(inputArray);
        // var ddict = new zstd.Dict.Decompression(dictData);
        // var jsonBytes = simple.decompressUsingDict(jsonZstData, ddict);
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
    return ZstdDeflateTransform.deflate(arrayBuffer);
  }
}
