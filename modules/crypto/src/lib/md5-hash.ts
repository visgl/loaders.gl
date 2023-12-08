// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Fork of https://github.com/briantbutton/md5-wasm under MIT license
import {Hash} from './hash';
import md5WASM from './algorithms/md5-wasm';
import {encodeHex} from './utils/digest-utils';

/**
 * A transform that calculates MD5 hashes, passing data through
 */
export class MD5Hash extends Hash {
  readonly name = 'md5';
  readonly options;

  constructor(options = {}) {
    super();
    this.options = options;
  }

  /**
   * Atomic hash calculation
   * @returns base64 encoded hash
   */
  async hash(input: ArrayBuffer, encoding: 'hex' | 'base64'): Promise<string> {
    const md5Promise = new Promise<string>((resolve, reject) =>
      // @ts-expect-error
      md5WASM(input).then(resolve).catch(reject)
    );
    const hex = await md5Promise;
    return encodeHex(hex, encoding);
  }
}
