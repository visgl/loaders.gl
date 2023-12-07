// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ReadableFile, WritableFile} from '../files/file';

/**
 * A FileSystem interface can encapsulate various file sources,
 * a FileList, a Node.js filesystem, a ZipFile, a GoogleDrive etc.
 */
export interface FileSystem {
  /** Return a list of file names in a "directory" */
  readdir(dirname?: string, options?: {recursive?: boolean}): Promise<string[]>;

  /** Gets information from a local file from the filesystem */
  stat(filename: string, options?: object): Promise<{size: number}>;

  /** Removes a file from the file system */
  unlink?(path: string): Promise<void>;

  /** Fetches the full contents of a file from the filesystem (or a URL) */
  fetch(path: string, options?: RequestInit): Promise<Response>;
}

/**
 * A random access file system, open readable and/or writable files
 */
export interface RandomAccessFileSystem extends FileSystem {
  /** Can open readable files */
  readonly readable: boolean;

  /** Can open writable files */
  readonly writable: boolean;

  /** Open a readable file */
  openReadableFile(path: string, flags?: 'r'): Promise<ReadableFile>;

  /** Open a writable file */
  openWritableFile(path: string, flags?: 'w' | 'wx', mode?: number): Promise<WritableFile>;
}
