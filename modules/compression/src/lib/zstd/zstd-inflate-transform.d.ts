import {IncrementalTransform} from '@loaders.gl/loader-utils';

/**
 * A transform that decompresses / inflates Zstd compressed input byte chunks
 */
export default class ZstdInflateTransform implements IncrementalTransform {
  /**
   * Atomic deflate convenience
   */
  static run(input: ArrayBuffer, options?: object): Promise<ArrayBuffer>;

  /**
   * Alternate interface for chunking & without exceptions
   * @param options
   */
  constructor(options: object);

  write(chunk: ArrayBuffer): ArrayBuffer | null;

  end(): ArrayBuffer | null;
}
