/**
 * A transform that decompresses / inflates Zstd compressed input byte chunks
 */
export default class ZstdInflateTransform {
  /**
   * Atomic deflate convenience
   */
  static inflate(input: ArrayBuffer, options?: object): Promise<ArrayBuffer>;
}
