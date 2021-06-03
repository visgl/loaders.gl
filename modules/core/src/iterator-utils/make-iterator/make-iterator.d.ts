import fs from 'fs';

/**
 * Returns an iterator that breaks a big `ArrayBuffer` or string into chunks and yields them one-by-one.
 *
 * @param data
 * @param options
 * @param options.chunkSize
 * @returns iterator that yields chunks of specified size
 *
 * This function can e.g. be used to enable data sources that can only be read atomically
 * (such as `Blob` and `File` via `FileReader`) to still be parsed in batches.
 */
export function makeIterator(
  data: Blob | Response | ReadableStream | fs.ReadStream,
  options?: object
): AsyncIterable<ArrayBuffer>;
export function makeIterator(data: ArrayBuffer | string, options?: object): Iterable<ArrayBuffer>;
