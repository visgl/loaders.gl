import lz4 from 'lz4js';

export default class LZ4DeflateTransform {
  static async deflate(input, options) {
    return LZ4DeflateTransform.deflateSync(input, options);
  }

  static deflateSync(input, options) {
    const inputArray = new Uint8Array(input);
    const output = lz4.compress(inputArray);
    return output.buffer;
  }
}
