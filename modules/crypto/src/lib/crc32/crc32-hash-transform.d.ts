import {IncrementalTransform} from "@loaders.gl/loader-utils";

/**
 * A transform that calculates Cryptographic Hash
 */
export default class CRC32HashTransform implements IncrementalTransform {
  /**
   * Atomic hash calculation
   * @returns base64 encoded hash
   */
  static run(input: ArrayBuffer, options?: object): Promise<string>;

  constructor(options?: object);

  write(chunk: ArrayBuffer): ArrayBuffer | null;

  end(): ArrayBuffer | null;
}
