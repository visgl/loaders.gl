// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Hash} from './hash';
import CRC32 from './algorithms/crc32';
import {encodeNumber} from './utils/digest-utils';

/**
 * Calculates CRC32 Cryptographic Hash
 */
export class CRC32Hash extends Hash {
  readonly name = 'crc32';

  options;

  constructor(options = {}) {
    super();
    this.options = {crypto: {}, ...options};
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
    const hash = new CRC32();
    hash.update(input);
    const digest = hash.finalize();
    return encodeNumber(digest, encoding);
  }

  async *hashBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
    encoding: 'hex' | 'base64' = 'base64'
  ): AsyncIterable<ArrayBuffer> {
    const hash = new CRC32();
    for await (const chunk of asyncIterator) {
      hash.update(chunk);
      yield chunk;
    }
    const digest = hash.finalize();
    this.options.crypto?.onEnd?.({hash: encodeNumber(digest, encoding)});
  }
}
