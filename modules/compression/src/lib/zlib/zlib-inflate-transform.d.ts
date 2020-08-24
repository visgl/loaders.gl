/**
 * A transform that incrementally decompresses / inflates zlib compressed input
 */
export default class ZlibInflateTransform {
  /**
   * Inflate
   */
  static inflate(input: ArrayBuffer, options?: object): Promise<ArrayBuffer>;
  static inflateSync(input: ArrayBuffer, options?: object): ArrayBuffer;
}
