// loaders.gl, MIT license

import {isBrowser} from '../env-utils/globals';
import {ReadableFile, WritableFile, Stat} from './file';

const NOT_IMPLEMENTED = new Error('Not implemented');

/** This class is a facade that gets replaced with an actual NodeFile instance  */
export class NodeFileFacade implements ReadableFile, WritableFile {
  /** The underlying file handle (Blob, Node.js file descriptor etc) */
  handle: unknown;
  /** Length of file in bytes, if available */
  size: number = 0;

  constructor(options) {
    // Return the actual implementation instance
    if (globalThis.loaders?.NodeFile) {
      return new globalThis.loaders.NodeFile(options);
    }
    if (isBrowser) {
      throw new Error('Can\'t instantiate NodeFile in browser.');
    }
    throw new Error('Can\'t instantiate NodeFile. Make sure to import @loaders.gl/polyfills first.');
  }
  /** Read data */
  async read(start?: number, end?: number): Promise<ArrayBuffer> {
    throw NOT_IMPLEMENTED;
  }
  /** Write to file. The number of bytes written will be returned */
  async write(arrayBuffer: ArrayBuffer, offset?: number, length?: number): Promise<number> {
    throw NOT_IMPLEMENTED;
  }
  /** Get information about file */
  async stat(): Promise<Stat> {
    throw NOT_IMPLEMENTED;
  }
  /** Close the file */
  async close(): Promise<void> {}
}
