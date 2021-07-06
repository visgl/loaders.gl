import fs from 'fs';
import util from 'util';
import {IFileSystem, IRandomAccessReadFileSystem} from '@loaders.gl/loader-utils';
// import {fetchFile} from "../fetch/fetch-file"
// import {selectLoader} from "../api/select-loader";

type Stat = {
  size: number;
  isDirectory: () => boolean;
  info?: fs.Stats;
};

type ReadOptions = {
  buffer?: DataView & Buffer;
  offset?: number;
  length?: number;
  position?: number;
};

/**
 * FileSystem pass-through for Node.js
 * - Provides promisified versions of Node `fs` API
 * - Type compatible with BrowserFileSystem.
 * @param options
 */
export default class NodeFileSystem implements IFileSystem, IRandomAccessReadFileSystem {
  // implements IFileSystem
  constructor(options: {[key: string]: any}) {
    this.fetch = options._fetch;
  }

  async readdir(dirname = '.', options?: {}): Promise<any[]> {
    const readdir = util.promisify(fs.readdir);
    return await readdir(dirname, options);
  }

  async stat(path: string, options?: {}): Promise<Stat> {
    const stat = util.promisify(fs.stat);
    const info = await stat(path, options);
    return {size: Number(info.size), isDirectory: () => false, info};
  }

  async fetch(path: string, options: {[key: string]: any}) {
    // Falls back to handle https:/http:/data: etc fetches
    // eslint-disable-next-line
    const fallbackFetch = options.fetch || this.fetch;
    return fallbackFetch(path, options);
  }

  // implements IRandomAccessFileSystem
  async open(path: string, flags: string | number, mode?: any): Promise<number> {
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

  async read(
    fd: number,
    // @ts-ignore Possibly null
    {buffer = null, offset = 0, length = buffer.byteLength, position = null}: ReadOptions
  ): Promise<{bytesRead: number; buffer: Buffer}> {
    const fsRead = util.promisify(fs.read);
    let totalBytesRead = 0;
    // Read in loop until we get required number of bytes
    while (totalBytesRead < length) {
      const {bytesRead} = await fsRead(
        fd,
        buffer,
        offset + totalBytesRead,
        length - totalBytesRead,
        position + totalBytesRead
      );
      totalBytesRead += bytesRead;
    }
    return {bytesRead: totalBytesRead, buffer};
  }
}
