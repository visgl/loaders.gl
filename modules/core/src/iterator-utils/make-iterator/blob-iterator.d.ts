/**
 * Returns an iterator that breaks a big Blob into chunks and yields them one-by-one
 * @param blob Blob or File object
 * @param options
 * @param options.chunkSize
 */
export function makeBlobIterator(
  blob: Blob,
  options?: {chunkSize?: number}
): AsyncIterable<ArrayBuffer>;

export function readFileSlice(file, offset, end): Promise<ArrayBuffer>;
