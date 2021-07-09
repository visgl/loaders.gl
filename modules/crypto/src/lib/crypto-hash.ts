// This dependency is too big, application must provide it
import type * as CryptoJSNamespace from 'crypto-js';
import {Hash} from './hash';

type CryptoHashOptions = {
  modules: {[moduleName: string]: any};
  crypto: {
    algorithm: string;
    onEnd?: (result: {hash: string}) => any;
  };
};

let CryptoJS: typeof CryptoJSNamespace;

/**
 * A transform that calculates Cryptographic Hash using Crypto JS library
 * @deprecated Warning, experimental class
 */
export class CryptoHash extends Hash {
  readonly name;

  options: CryptoHashOptions;
  private _algorithm;
  private _hash;

  constructor(options: CryptoHashOptions) {
    super();
    this.options = options;
    this._algorithm = this.options?.crypto?.algorithm;
    if (!this._algorithm) {
      throw new Error(this.name);
    }
    this.name = this._algorithm.toLowerCase();
  }

  async preload(): Promise<void> {
    if (!CryptoJS) {
      CryptoJS = this.options?.modules?.CryptoJS;
      if (!CryptoJS) {
        throw new Error(this.name);
      }
    }
    if (!this._hash) {
      const algo = CryptoJS.algo[this._algorithm];
      this._hash = algo.create();
    }
    if (!this._hash) {
      throw new Error(this.name);
    }
  }

  /**
   * Atomic hash calculation
   * @returns base64 encoded hash
   */
  async hash(input: ArrayBuffer): Promise<string> {
    await this.preload();
    // arrayBuffer is accepted, even though types and docs say no
    // https://stackoverflow.com/questions/25567468/how-to-decrypt-an-arraybuffer
    // @ts-expect-error
    const typedWordArray = CryptoJS.lib.WordArray.create(input);
    return this._hash.update(typedWordArray).finalize().toString(CryptoJS.enc.Base64);
  }

  async *hashBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
  ): AsyncIterable<ArrayBuffer> {
    await this.preload();
    for await (const chunk of asyncIterator) {
      // arrayBuffer is accepted, even though types and docs say no
      // https://stackoverflow.com/questions/25567468/how-to-decrypt-an-arraybuffer
      // @ts-expect-error
      const typedWordArray = CryptoJS.lib.WordArray.create(chunk);
      this._hash.update(typedWordArray);
      yield chunk;
    }
    const hash = this._hash.finalize().toString(CryptoJS.enc.Base64);
    this.options?.crypto?.onEnd?.({hash});
  }
}
