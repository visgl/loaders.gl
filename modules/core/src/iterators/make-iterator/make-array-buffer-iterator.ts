import type {IteratorOptions} from './make-iterator';

const DEFAULT_CHUNK_SIZE = 256 * 1024;

/**
 * Returns an iterator that breaks a big ArrayBuffer into chunks and yields them one-by-one
 * @param blob ArrayBuffer to iterate over
 * @param options
 * @param options.chunkSize
 */
export function* makeArrayBufferIterator(
  arrayBuffer: ArrayBuffer,
  options: IteratorOptions = {}
): Iterable<ArrayBuffer> {
  const {chunkSize = DEFAULT_CHUNK_SIZE} = options;

  let byteOffset = 0;

  while (byteOffset < arrayBuffer.byteLength) {
    // Create a chunk of the right size
    const chunkByteLength = Math.min(arrayBuffer.byteLength - byteOffset, chunkSize);
    const chunk = new ArrayBuffer(chunkByteLength);

    // Copy data from the big chunk
    const sourceArray = new Uint8Array(arrayBuffer, byteOffset, chunkByteLength);
    const chunkArray = new Uint8Array(chunk);
    chunkArray.set(sourceArray);

    // yield the chunk
    byteOffset += chunkByteLength;
    yield chunk;
  }
}
