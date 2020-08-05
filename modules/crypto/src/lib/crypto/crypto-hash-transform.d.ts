import {IncrementalTransform} from "@loaders.gl/loader-utils";

/**
 * A transform that calculates Cryptographic Hash
 */
export default class CryptoHashTransform implements IncrementalTransform {
  /**
   * Atomic hash calculation
   * @returns base64 encoded hash
   */
  static hash(input: ArrayBuffer, options?: object): Promise<string>;
  static hashSync(input: ArrayBuffer, options?: object): string;

  constructor(options: object);

  write(chunk: ArrayBuffer): ArrayBuffer | null;

  end(): ArrayBuffer | null;
}
