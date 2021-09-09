import * as fs from '../node/fs';
import {IFileSystem, IRandomAccessReadFileSystem} from '../../types';
// import {fetchFile} from "../fetch/fetch-file"
// import {selectLoader} from "../api/select-loader";

type Stat = {
  size: number;
  isDirectory: () => boolean;
  info?: fs.Stats;
};

type ReadOptions = {
  buffer?: Buffer;
  offset?: number;
  length?: number;
  position?: number;
};

/**
 * FileSystem pass-through for Node.js
 * Compatible with BrowserFileSystem.
 * @param options
 */
export default class NodeFileSystem implements IFileSystem, IRandomAccessReadFileSystem {
  // implements IFileSystem
  constructor(options: {[key: string]: any}) {
    this.fetch = options._fetch;
  }

  async readdir(dirname = '.', options?: {}): Promise<any[]> {
    return await fs.readdir(dirname, options);
  }

  async stat(path: string, options?: {}): Promise<Stat> {
    const info = await fs.stat(path, options);
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
    return await fs.open(path, flags);
  }

  async close(fd: number): Promise<void> {
    return await fs.close(fd);
  }

  async fstat(fd: number): Promise<Stat> {
    const info = await fs.fstat(fd);
    return info;
  }

  async read(
    fd: number,
    // @ts-ignore Possibly null
    {buffer = null, offset = 0, length = buffer.byteLength, position = null}: ReadOptions
  ): Promise<{bytesRead: number; buffer: Buffer}> {
    let totalBytesRead = 0;
    // Read in loop until we get required number of bytes
    while (totalBytesRead < length) {
      const {bytesRead} = await fs.read(
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
