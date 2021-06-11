// CRC32
import {Hash} from './hash';
import CRC32 from './algorithms/crc32';
import {toHex, hexToBase64} from './utils/digest-utils';

/**
 * Calculates CRC32 Cryptographic Hash
 */
export class CRC32Hash extends Hash {
  readonly name = 'crc32';

  options;
  private _hash: CRC32;

  constructor(options = {}) {
    super();
    this.options = {crypto: {}, ...options};
    this._hash = new CRC32();
    this.hashBatches = this.hashBatches.bind(this);
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
    this.options.crypto?.onEnd({hash});
  }
}
