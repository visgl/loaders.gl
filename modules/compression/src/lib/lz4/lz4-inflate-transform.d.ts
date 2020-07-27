/**
 * A transform that decompresses / inflates LZ4 compressed input bytes
 */
export default class LZ4InflateTransform {
  /**
   * Atomic inflate
   */
  static inflate(input: ArrayBuffer, options?: object): Promise<ArrayBuffer>;
  static inflateSync(input: ArrayBuffer, options?: object): ArrayBuffer;
}
