// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Hash} from './hash';

type NodeHashOptions = {
  crypto: {
    algorithm: string;
    onEnd?: (result: {hash: string}) => any;
  };
};

/**
 * A transform that calculates Cryptographic Hash using Node's Crypto library
 * @deprecated Only available in Node.js
 */
export class NodeHash extends Hash {
  readonly name;
  readonly options: NodeHashOptions;

  constructor(options: NodeHashOptions) {
    super();
    this.options = options;
    if (!globalThis.loaders.NodeHash) {
      throw new Error('install @loaders.gl/crypto on Node.js to use NodeHash');
    }
    return new globalThis.loaders.NodeHash(options);
  }

  /**
   * Atomic hash calculation
   * @returns base64 encoded hash
   */
  async hash(input: ArrayBuffer, encoding: 'hex' | 'base64'): Promise<string> {
    throw new Error('Not implemented');
  }
}
