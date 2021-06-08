import {fetchFile} from '@loaders.gl/core';
import path from 'path';
import {KeyError} from 'zarr';
import type {AsyncStore} from 'zarr/types/storage/types';

// Node system error
interface SystemError extends Error {
  code: string;
}

function isSystemError(err: unknown): err is SystemError {
  return err instanceof Error && 'code' in err;
}

/*
 * Minimal store implementation to read zarr from file system in Node.
 */
export class FileSystemStore implements AsyncStore<ArrayBuffer> {
  constructor(public root: string) {}

  async getItem(key: string): Promise<ArrayBuffer> {
    const filepath = path.join(this.root, key);
    try {
      const response = await fetchFile(filepath);
      if (!response.ok) {
        throw new KeyError(key);
      }
      const value = await response.arrayBuffer();
      return value;
    } catch (err) {
      // Zarr requires a special exception to be thrown in case of missing chunks
      if (isSystemError(err) && err.code === 'ENOENT') {
        throw new KeyError(key);
      }
      throw err;
    }
  }

  containsItem(key: string): Promise<boolean> {
    return this.getItem(key)
      .then(() => true)
      .catch(() => false);
  }

  keys(): Promise<string[]> {
    return Promise.resolve([]);
  }

  setItem(): never {
    throw new Error('setItem not implemented.');
  }

  deleteItem(): never {
    throw new Error('deleteItem not implemented.');
  }
}
