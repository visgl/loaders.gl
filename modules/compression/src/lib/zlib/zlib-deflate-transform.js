import pako from 'pako';

export default class ZlibDeflateTransform {
  static async deflate(input, options) {
    return ZlibDeflateTransform.deflateSync(input, options);
  }

  static deflateSync(input, options) {
    const uint8Array = new Uint8Array(input);
    const output = pako.deflate(uint8Array, options);
    // @ts-ignore
    return output.buffer;
  }
}
