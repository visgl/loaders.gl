// CRC32c
import {Hash} from './hash';
import CRC32C from './algorithms/crc32c';
import {toHex, hexToBase64} from './utils/digest-utils';

/**
 * A transform that calculates CRC32c Hash
 */
export class CRC32CHash extends Hash {
  readonly name = 'crc32c';

  options;
  private _hash: CRC32C;

  /**
   * Atomic hash calculation
   * @returns base64 encoded hash
   */
  constructor(options = {}) {
    super();
    this.options = {crypto: {}, ...options};
    this._hash = new CRC32C(options);
  }

  /**
   * Atomic hash calculation
   * @returns base64 encoded hash
   */
  async hash(input: ArrayBuffer): Promise<string> {
    return this.hashSync(input);
  }

  hashSync(input: ArrayBuffer): string {
    this._hash.update(input);
    const hashValue = this._hash.finalize();
    const hex = toHex(hashValue);
    const hash = hexToBase64(hex);
    return hash;
  }

  // runInBatches inherited

  async *hashBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    for await (const chunk of asyncIterator) {
      this._hash.update(chunk);
      yield chunk;
    }
    const hashValue = this._hash.finalize();
    const hex = toHex(hashValue);
    const hash = hexToBase64(hex);
    this.options.crypto?.onEnd?.({hash});
  }
}
