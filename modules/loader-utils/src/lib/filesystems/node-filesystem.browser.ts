import * as fs from '../node/fs';
import {FileSystem, RandomAccessReadFileSystem} from './filesystem';
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
    throw new Error('Can\'t instantiate NodeFileSystem in browser');
  }

  async readdir(dirname = '.', options?: {}): Promise<any[]> {
    return [];
  }

  async stat(path: string, options?: {}): Promise<Stat> {
    return {size: 0, isDirectory: () => false};
  }

  async fetch(path: string, options: {[key: string]: any}) {
    return globalThis.fetch(path, options);
  }

  // implements IRandomAccessFileSystem
  async open(path: string, flags: string | number, mode?: any): Promise<number> {
    return 0;
  }

  async close(fd: number): Promise<void> {
  }

  async fstat(fd: number): Promise<Stat> {
    return {size: 0, isDirectory: () => false};
  }

  async read(
    fd: number,
    // @ts-ignore Possibly null
    {buffer = null, offset = 0, length = buffer.byteLength, position = null}: ReadOptions
  ): Promise<{bytesRead: number; buffer: Uint8Array}> {
    return {bytesRead: 0, buffer: new Uint8Array(0)};
  }
}
