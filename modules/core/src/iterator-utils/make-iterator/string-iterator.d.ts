/**
 * Returns an iterator that breaks a big string into chunks and yields them one-by-one as ArrayBuffers
 * @param blob string to iterate over
 * @param options
 * @param options.chunkSize
 */
export function makeStringIterator(
  blob: string,
  options?: {chunkSize?: number}
): Iterable<ArrayBuffer>;
