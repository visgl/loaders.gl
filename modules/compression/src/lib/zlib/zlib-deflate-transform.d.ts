import {IncrementalTransform} from '@loaders.gl/loader-utils';

export type ZlibDeflateOptions = {
  format?: 'gzip' | 'deflate';
  level?: number;
};

/**
 * A transform that incrementally zlib compresses / deflates input bytes
 */
export default class ZlibDeflateTransform implements IncrementalTransform {
  /**
   * Deflate
   */
  static run(input: ArrayBuffer, options?: object): Promise<ArrayBuffer>;

  /**
   * Alternate interface for chunking & without exceptions
   * @param options
   */
  new(options?: object): IncrementalTransform;

  write(chunk: ArrayBuffer): ArrayBuffer | null;

  end(): ArrayBuffer | null;
}
