import { fetchFile } from '@loaders.gl/core';
import { KeyError } from 'zarr';
import type { AsyncStore } from 'zarr/types/storage/types';

/**
 * Preserves (double) slashes earlier in the path, so this works better
 * for URLs. From https://stackoverflow.com/a/46427607/4178400
 * @param args parts of a path or URL to join.
 */
function joinUrlParts(...args: string[]) {
  return args
    .map((part, i) => {
      if (i === 0) return part.trim().replace(/[/]*$/g, '');
      return part.trim().replace(/(^[/]*|[/]*$)/g, '');
    })
    .filter(x => x.length)
    .join('/');
}

export class FetchFileStore implements AsyncStore<ArrayBuffer> {
  constructor(public root: string) { }

  async getItem(key: string): Promise<ArrayBuffer> {
    const filepath = joinUrlParts(this.root, key);
    const response = await fetchFile(filepath);
    if (!response.ok) {
      // Zarr requires a special exception to be thrown in case of missing chunks
      throw new KeyError(key);
    }
    const value = await response.arrayBuffer();
    return value;
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