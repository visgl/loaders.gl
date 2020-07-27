import {ZstdCodec} from 'zstd-codec';

export default class ZstdInflateTransform {
  static inflate(input, options) {
    const inputArray = new Uint8Array(input);

    return new Promise(resolve => {
      ZstdCodec.run(zstd => {
        const simple = new zstd.Simple();
        const output = simple.decompress(inputArray);
        resolve(output.buffer);
      });
    });
  }
}
