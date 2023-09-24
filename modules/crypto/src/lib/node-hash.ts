// This dependency is too big, application must provide it
import {Hash} from './hash';
import {createHash} from 'crypto'; // Node.js builtin

type CryptoHashOptions = {
  crypto: {
    algorithm: string;
    onEnd?: (result: {hash: string}) => any;
  };
};

/**
 * Calculates Cryptographic Hash using Node.js crypto library
 * @deprecated Warning, experimental class
 */
export class NodeHash extends Hash {
  readonly name = 'crypto-node';

  options: CryptoHashOptions;
  // @ts-ignore
  private _algorithm;
  // @ts-ignore
  private _hash;

  constructor(options: CryptoHashOptions) {
    super();
    this.options = options;
    if (!this.options?.crypto?.algorithm) {
      throw new Error(this.name);
    }
  }

  /**
   * Atomic hash calculation
   * @returns base64 encoded hash
   */
  async hash(input: ArrayBuffer, encoding: 'hex' | 'base64'): Promise<string> {
    await this.preload();
    const algorithm = this.options?.crypto?.algorithm?.toLowerCase();
    try {
      const hash = createHash(algorithm);
      const inputArray = new Uint8Array(input);
      return hash.update(inputArray).digest('base64');
    } catch (error) {
      throw Error(`${algorithm} hash not available. ${error}`);
    }
  }

  async *hashBatches(
    asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
    encoding: 'hex' | 'base64' = 'base64'
  ): AsyncIterable<ArrayBuffer> {
    await this.preload();
    const hash = createHash(this.options?.crypto?.algorithm?.toLowerCase());
    for await (const chunk of asyncIterator) {
      // https://stackoverflow.com/questions/25567468/how-to-decrypt-an-arraybuffer
      const inputArray = new Uint8Array(chunk);
      hash.update(inputArray);
      yield chunk;
    }
    // We can pass our encoding constant directly to Node.js digest as it already supports `hex` and `base64`
    const digest = hash.digest(encoding);
    this.options?.crypto?.onEnd?.({hash: digest});
  }
}
