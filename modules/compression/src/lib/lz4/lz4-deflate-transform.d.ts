// import pako from 'pako';

/**
 * A transform that LZ4 compresses / deflates input bytes
 */
export default class LZ4DeflateTransform {
  /**
   * Atomic deflate
   */
  static deflate(input: ArrayBuffer, options?: object): Promise<ArrayBuffer>;
  static deflateSync(input: ArrayBuffer, options?: object): ArrayBuffer;
}
