// CRC32
import {Hash} from './hash';
import CRC32 from './algorithms/crc32';
import {encodeNumber} from './utils/digest-utils';

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
  async hash(input: ArrayBuffer, encoding: 'hex' | 'base64'): Promise<string> {
    return this.hashSync(input, encoding);
  }

  hashSync(input: ArrayBuffer, encoding: 'hex' | 'base64'): string {
    this._hash.update(input);
    const digest = this._hash.finalize();
    return encodeNumber(digest, encoding);
  }

  async *hashBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
    encoding: 'hex' | 'base64' = 'base64'
  ): AsyncIterable<ArrayBuffer> {
    for await (const chunk of asyncIterator) {
      this._hash.update(chunk);
      yield chunk;
    }
    const digest = this._hash.finalize();
    const hash = encodeNumber(digest, encoding);
    this.options.crypto?.onEnd?.({hash});
  }
}
