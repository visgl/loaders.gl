// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Fork of https://github.com/briantbutton/md5-wasm under MIT license
import {Hash} from './hash';
import md5WASM, {calculateMD5Sync} from './algorithms/md5-wasm';
import {encodeHex} from './utils/digest-utils';

/**
 * A transform that calculates MD5 hashes, passing data through
 */
export class MD5Hash extends Hash {
  /** Identifies the digest algorithm. */
  readonly name = 'md5';
  /** Hash configuration. */
  readonly options;

  /** Creates an MD5 hash calculator. */
  constructor(options = {}) {
    super();
    this.options = options;
  }

  /**
   * Atomic hash calculation
   * @returns Hash in the requested encoding
   */
  async hash(input: ArrayBuffer, encoding: 'hex' | 'base64'): Promise<string> {
    const hex = await md5WASM(input);
    return encodeHex(hex, encoding);
  }

  /** Calculates a digest synchronously without WebAssembly initialization. */
  hashSync(input: ArrayBuffer, encoding: 'hex' | 'base64'): string {
    return encodeHex(calculateMD5Sync(input), encoding);
  }
}
