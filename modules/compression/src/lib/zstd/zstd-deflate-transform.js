import {ZstdCodec} from 'zstd-codec';

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
}
