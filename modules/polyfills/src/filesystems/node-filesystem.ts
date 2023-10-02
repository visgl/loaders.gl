import {FileSystem, RandomAccessReadFileSystem} from '@loaders.gl/loader-utils';
import fs from 'fs';
import fsPromise from 'fs/promises';

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
export class NodeFileSystem implements FileSystem, RandomAccessReadFileSystem {
  // implements FileSystem
  constructor(options: {[key: string]: any}) {
    this.fetch = options._fetch;
  }

  async readdir(dirname = '.', options?: {}): Promise<any[]> {
    return await fsPromise.readdir(dirname, options);
  }

  async stat(path: string, options?: {}): Promise<Stat> {
    const info = await fsPromise.stat(path, options);
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
    return (await fsPromise.open(path, flags)) as unknown as number;
  }

  async close(fd: number): Promise<void> {
    fs.close(fd);
  }

  async fstat(fd: number): Promise<Stat> {
    return await new Promise((resolve, reject) =>
      fs.fstat(fd, (err, info) => (err ? reject(err) : resolve(info)))
    );
  }

  async read(
    fd: number,
    // @ts-ignore Possibly null
    {buffer = null, offset = 0, length = buffer.byteLength, position = null}: ReadOptions
  ): Promise<{bytesRead: number; buffer: Uint8Array}> {
    let totalBytesRead = 0;
    // Read in loop until we get required number of bytes
    while (totalBytesRead < length) {
      const {bytesRead} = await new Promise<{bytesRead: number; buffer: Buffer}>(
        // eslint-disable-next-line no-loop-func
        (resolve, reject) =>
          fs.read(
            fd,
            buffer,
            offset + totalBytesRead,
            length - totalBytesRead,
            position + totalBytesRead,
            (err, bytesRead, buffer) => (err ? reject(err) : resolve({bytesRead, buffer}))
          )
      );
      totalBytesRead += bytesRead;
    }
    return {bytesRead: totalBytesRead, buffer};
  }
}
