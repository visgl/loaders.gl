/**
 * A transform that decompresses / inflates Zstd compressed input byte chunks
 */
export default class ZstdInlateTransform {
  /**
   * Atomic deflate convenience
   */
  static inflate(input: ArrayBuffer, options?: object): Promise<ArrayBuffer>;
}
