import {resolvePath} from '@loaders.gl/core';
import type {RandomAccessReadFileSystem, Stat} from './filesystem';
import fs from 'fs';
import util from 'util';

/**
 * FileSystem pass-through for Node.js
 * - Provides promisified versions of Node `fs` API
 * - Type compatible with BrowserFileSystem.
 */
export default class NodeFileSystem implements RandomAccessReadFileSystem {
  private _fetch;

  /**
   * @param options
   */
  constructor(options: any = {}) {
    this._fetch = options.fetch || fetch;
    this.fetch = this.fetch.bind(this);
  }

  // implements IFileSystem

  // L1: fetch

  async fetch(path: string, options?: any): Promise<Response> {
    path = resolvePath(path);
    // Falls back to handle https:/http:/data: etc fetches
    const fallbackFetch = options?.fetch || this._fetch;
    return fallbackFetch(path, options);
  }

  // L2: stat

  async readdir(path: string = '.', options): Promise<string[]> {
    path = resolvePath(path);
    const readdir = util.promisify(fs.readdir);
    return await readdir(path, options);
  }
  async stat(path: string, options?: object): Promise<Stat> {
    path = resolvePath(path);
    const stat = util.promisify(fs.stat);
    const info = await stat(path, options);
    return {size: Number(info.size), isDirectory: () => false};
  }

  // implements IRandomAccessReadFileSystem

  // L3: Random access

  async open(path: string, flags, mode?): Promise<number> {
    path = resolvePath(path);
    const open = util.promisify(fs.open);
    return await open(path, flags);
  }

  async close(fd: number): Promise<void> {
    const close = util.promisify(fs.close);
    return await close(fd);
  }

  async fstat(fd: number): Promise<Stat> {
    const fstat = util.promisify(fs.fstat);
    const info = await fstat(fd);
    return info;
  }

  /**
   * Read a range into a buffer
   * @todo - handle position memory
   * @param buffer is the buffer that the data (read from the fd) will be written to.
   * @param offset is the offset in the buffer to start writing at.
   * @param length is an integer specifying the number of bytes to read.
   * @param position is an argument specifying where to begin reading from in the file. If position is null, data will be read from the current file position, and the file position will be updated. If position is an integer, the file position will remain unchanged.
   */
  async read(
    fd: any,
    buffer: ArrayBuffer,
    offset: number = 0,
    length: number = buffer.byteLength,
    position: number | null = null
  ): Promise<{bytesRead: number; buffer: ArrayBuffer}> {
    const fsRead = util.promisify(fs.read);
    let totalBytesRead = 0;
    // Read in loop until we get required number of bytes
    while (totalBytesRead < length) {
      const {bytesRead} = await fsRead(
        fd,
        new Uint8Array(buffer),
        offset + totalBytesRead,
        length - totalBytesRead,
        position
      );
      totalBytesRead += bytesRead;
    }
    return {bytesRead: totalBytesRead, buffer};
  }
}
