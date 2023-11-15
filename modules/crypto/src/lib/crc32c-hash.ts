// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import {Hash} from './hash';
import CRC32C from './algorithms/crc32c';
import {encodeNumber} from './utils/digest-utils';

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
  async hash(input: ArrayBuffer, encoding: 'hex' | 'base64'): Promise<string> {
    return this.hashSync(input, encoding);
  }

  hashSync(input: ArrayBuffer, encoding: 'hex' | 'base64'): string {
    this._hash.update(input);
    const digest = this._hash.finalize();
    return encodeNumber(digest, encoding);
  }

  // runInBatches inherited

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
