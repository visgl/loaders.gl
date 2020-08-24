import pako from 'pako';

export default class ZlibInflateTransform {
  static async inflate(input, options) {
    return ZlibInflateTransform.inflateSync(input, options);
  }

  static inflateSync(input, options) {
    const compressed = new Uint8Array(input);
    const output = pako.inflate(compressed, options);
    // @ts-ignore
    return output.buffer;
  }
}
