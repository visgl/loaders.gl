/**
 * A transform that Zstd compresses / deflates input byte chunks
 */
export default class ZstdDeflateTransform {
  /**
   * Atomic deflate convenience
   */
  static deflate(input: ArrayBuffer, options?: object): Promise<ArrayBuffer>;
}
