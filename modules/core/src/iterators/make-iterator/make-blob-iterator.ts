import type {IteratorOptions} from './make-iterator';

const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB — biggest value that keeps UI responsive

/**
 * Returns an iterator that breaks a big Blob into chunks and yields them one-by-one
 * @param blob Blob or File object
 * @param options
 * @param options.chunkSize
 */
export async function* makeBlobIterator(
  blob: Blob,
  options?: IteratorOptions
): AsyncIterable<ArrayBuffer> {
  const chunkSize = options?.chunkSize || DEFAULT_CHUNK_SIZE;

  let offset = 0;
  while (offset < blob.size) {
    const end = offset + chunkSize;

    const chunk = await blob.slice(offset, end).arrayBuffer();

    offset = end;
    yield chunk;
  }
}
