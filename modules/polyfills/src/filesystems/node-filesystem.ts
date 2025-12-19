// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Stat, RandomAccessFileSystem} from '@loaders.gl/loader-utils';
// @ts-expect-error
import fsPromise from 'fs/promises';
import {NodeFile} from './node-file';
import {fetchNode} from './fetch-node';

// import {fetchFile} from "../fetch/fetch-file"
// import {selectLoader} from "../api/select-loader";

/**
 * FileSystem pass-through for Node.js
 * Compatible with BrowserFileSystem.
 * @param options
 */
export class NodeFileSystem implements RandomAccessFileSystem {
  readable: boolean = true;
  writable: boolean = true;

  // implements FileSystem
  constructor() {}

  async readdir(dirname = '.', options?: {}): Promise<any[]> {
    return await fsPromise.readdir(dirname, options);
  }

  async stat(path: string): Promise<Stat> {
    const info = await fsPromise.stat(path, {bigint: true});
    return {
      size: Number(info.size),
      bigsize: info.size,
      isDirectory: info.isDirectory()
    };
  }

  async unlink(path: string): Promise<void> {
    return await fsPromise.unlink(path);
  }

  async fetch(path: string, options: RequestInit): Promise<Response> {
    return await fetchNode(path, options);
  }

  // implements IRandomAccessFileSystem
  async openReadableFile(path: string, flags: 'r' = 'r'): Promise<NodeFile> {
    return new NodeFile(path, flags);
  }

  async openWritableFile(path: string, flags: 'w' | 'wx' = 'w', mode?: any): Promise<NodeFile> {
    return new NodeFile(path, flags, mode);
  }
}
