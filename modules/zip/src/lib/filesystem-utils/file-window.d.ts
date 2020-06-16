import {IRandomAccessReadFileSystem} from '@loaders.gl/loader-utils';

/**
 * Holds a buffer of loaded bytes representing a "window" onto a larger file.
 * Used to parse large files without fully loading them into memory.
 *
 * Example: when a data format can not be parsed by sequentially scanning a file.
 */
export default class FileWindowBuffer {
  /**
   * Create a FileWindow
   * @param fd
   * @param fs
   */
  constructor(fd: any, fs?: IRandomAccessReadFileSystem);

  /** Read an initial window into the buffer */
	read(position: number, length: number, callback?): Promise<{bytesRead: Number; arrayBuffer: ArrayBuffer}>

  /** Expand the window to the left so that more bytes come into view */
	expandLeft(length: number): Promise<{bytesRead: Number; arrayBuffer: ArrayBuffer}>

  /** Expand the window to the right so that more bytes come into view */
	expandRight(length: number): Promise<{bytesRead: Number; arrayBuffer: ArrayBuffer}>

  /** Move the window to the right so that different bytes come into view */
	moveRight(length, shift): Promise<{bytesRead: Number; arrayBuffer: ArrayBuffer}>
}
