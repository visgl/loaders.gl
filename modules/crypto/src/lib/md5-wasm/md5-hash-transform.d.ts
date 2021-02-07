/**
 * A transform that calculates MD5 hashes
 */
export default class MD5HashTransform {
  /**
   * Atomic hash calculation
   * @returns base64 encoded hash
   */
  static run(input: ArrayBuffer, options?: object): Promise<string>;
}
