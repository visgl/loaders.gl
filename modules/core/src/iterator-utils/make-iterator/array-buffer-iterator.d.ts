/**
 * Returns an iterator that breaks a big ArrayBuffer into chunks and yields them one-by-one
 * @param blob ArrayBuffer to iterate over
 * @param options
 * @param options.chunkSize
 */
export function makeArrayBufferIterator(
  blob: ArrayBuffer,
  options?: {chunkSize?: number}
): Iterable<ArrayBuffer>;
