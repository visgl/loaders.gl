/**
 * A transform that incrementally zlib compresses / deflates input byte chunks
 */
export default class ZlibDeflateTransform {
  /**
   * Deflate
   */
  static deflate(input: ArrayBuffer, options?: object): Promise<ArrayBuffer>;
  static deflateSync(input: ArrayBuffer, options?: object): ArrayBuffer;
}
