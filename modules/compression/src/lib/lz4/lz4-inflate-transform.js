import lz4 from 'lz4js';

export default class LZ4InflateTransform {
  static async inflate(input, options) {
    return LZ4InflateTransform.inflateSync(input, options);
  }

  static inflateSync(input, options) {
    const inputArray = new Uint8Array(input);
    const output = lz4.decompress(inputArray);
    return output.buffer;
  }
}
