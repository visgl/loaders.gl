// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isBrowser} from '../env-utils/globals';
import {Stat} from '../files/file';
import {NodeFileFacade as NodeFile} from '../files/node-file-facade';
import {RandomAccessFileSystem} from './filesystem';

const NOT_IMPLEMENTED = new Error('Not implemented');

/**
 * FileSystem pass-through for Node.js
 * Compatible with BrowserFileSystem.
 * @note Dummy implementation, not used (constructor returns a real NodeFileSystem instance)
 * @param options
 */
export class NodeFileSystemFacade implements RandomAccessFileSystem {
  // implements FileSystem
  constructor(options: {[key: string]: any}) {
    if (globalThis.loaders?.NodeFileSystem) {
      return new globalThis.loaders.NodeFileSystem(options);
    }
    if (isBrowser) {
      throw new Error('Can\'t instantiate NodeFileSystem in browser.');
    }
    throw new Error(
      'Can\'t instantiate NodeFileSystem. Make sure to import @loaders.gl/polyfills first.'
    );
  }

  // DUMMY IMPLEMENTATION, not used (constructor returns a real NodeFileSystem instance)

  // implements RandomAccessReadFileSystem

  readonly readable = true;
  readonly writable = true;

  async openReadableFile(path: string, flags): Promise<NodeFile> {
    throw NOT_IMPLEMENTED;
  }

  // implements RandomAccessWriteFileSystem
  async openWritableFile(path: string, flags, mode): Promise<NodeFile> {
    throw NOT_IMPLEMENTED;
  }

  // Implements file system

  async readdir(dirname = '.', options?: {}): Promise<string[]> {
    throw NOT_IMPLEMENTED;
  }

  async stat(path: string, options?: {}): Promise<Stat> {
    throw NOT_IMPLEMENTED;
  }

  async unlink(path: string): Promise<void> {
    throw NOT_IMPLEMENTED;
  }

  async fetch(path: RequestInfo, options?: RequestInit): Promise<Response> {
    throw NOT_IMPLEMENTED;
  }
}
