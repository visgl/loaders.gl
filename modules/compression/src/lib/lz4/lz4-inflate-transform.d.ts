import {IncrementalTransform} from "@loaders.gl/loader-utils";

/**
 * A transform that decompresses / inflates LZ4 compressed input bytes
 */
export default class LZ4InflateTransform implements IncrementalTransform {
  /**
   * Atomic inflate
   */
  static inflate(input: ArrayBuffer, options?: object): Promise<ArrayBuffer>;
  static inflateSync(input: ArrayBuffer, options?: object): ArrayBuffer;

  /**
   * Alternate interface for chunking & without exceptions
   * @param options
   */
  constructor(options: object);

  write(chunk: ArrayBuffer): ArrayBuffer | null;

  end(): ArrayBuffer | null;
}
